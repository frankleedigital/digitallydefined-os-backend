# app/llm.py
"""OmniRoute client — hardened for 24/7 Hermes use.

Ports the streaming/retry behaviour of the live TS clients
(`supabase/functions/_shared/omniroute.ts` and `lib/llmClient.js`) so this
FastAPI layer stays up through rate limits and streaming responses:

- Retries with exponential backoff on transient 429 / 5xx / network / timeout.
- Handles BOTH plain JSON and SSE (`text/event-stream`) responses — this
  OmniRoute instance may stream even when `stream` is false.
- Reuses one AsyncClient (connection pooling) for fast repeated calls.
- `call_json` tolerates markdown code fences and returns a validated object.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import random
import re
import time as _time
from typing import Any

import httpx

from .config import settings

logger = logging.getLogger("digitallydefined.fastapi.llm")

_RETRYABLE_STATUS = {429, 500, 502, 503, 504}
_MAX_RETRIES = 3
_BASE_BACKOFF_MS = 750
_MAX_BACKOFF_MS = 3000

# --------------------------------------------------------------------------- #
# Response cache
# --------------------------------------------------------------------------- #
# Measured gateway latency on ai.digitallydefined.online:
#     auto/best-fast 22.2s | auto/best-chat 19.7s | auto/chat 10.8s | auto/cheap 8.7s
#
# These tools are deterministic for a given (system, user) pair — a niche score
# or wealth projection does not change minute to minute — so re-asking the
# gateway for an identical prompt is pure latency. A short TTL removes the wait
# for repeat traffic (page reloads, retries, several users on the same niche)
# while still picking up model changes quickly.
_CACHE_TTL_SECONDS = 300
_CACHE_MAX_ENTRIES = 256
_cache: dict[str, tuple[float, str]] = {}
_cache_lock = asyncio.Lock()


def _cache_key(messages: list[dict[str, str]], model: str) -> str:
    """Stable key for a prompt+model pair."""
    raw = json.dumps(
        {"m": messages, "model": model}, sort_keys=True, separators=(",", ":")
    )
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


async def _cache_get(key: str) -> str | None:
    async with _cache_lock:
        entry = _cache.get(key)
        if entry is None:
            return None
        stored_at, value = entry
        if (_time.monotonic() - stored_at) > _CACHE_TTL_SECONDS:
            _cache.pop(key, None)
            return None
        return value


async def _cache_put(key: str, value: str) -> None:
    async with _cache_lock:
        if len(_cache) >= _CACHE_MAX_ENTRIES:
            # Drop the oldest entries rather than growing without bound.
            oldest = sorted(_cache.items(), key=lambda kv: kv[1][0])[: _CACHE_MAX_ENTRIES // 4]
            for stale_key, _ in oldest:
                _cache.pop(stale_key, None)
        _cache[key] = (_time.monotonic(), value)


def clear_cache() -> None:
    _cache.clear()


def _clean_chain(values: list[str] | None) -> list[str]:
    """Deduplicate and drop empty model names from a chain."""
    chain: list[str] = []
    for value in values or []:
        v = (value or "").strip()
        if v and v not in chain:
            chain.append(v)
    return chain


class OmniRouteError(RuntimeError):
    """Raised when OmniRoute cannot service a request after retries."""


class OmniRouteClient:
    """Resilient, connection-pooled client for OmniRoute's chat-completions."""

    def __init__(self) -> None:
        self.base_url = self.normalize_base(settings.omniroute_base_url)
        self.api_key = settings.omniroute_api_key
        self.model = settings.omniroute_model
        self.fallback_models = _clean_chain(settings.omniroute_fallback_models)
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(90.0, connect=10.0),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
        )

    @staticmethod
    def normalize_base(raw: str) -> str:
        """Accept a base with/without trailing `/v1`; resolve to <origin>/v1/chat/completions."""
        base = raw.strip().rstrip("/").replace("/v1", "")
        return f"{base}/v1/chat/completions"

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    # ------------------------------------------------------------------ #
    # Low-level POST with retry/backoff
    # ------------------------------------------------------------------ #
    async def _post(self, body: dict[str, Any], *, retries: int = _MAX_RETRIES) -> httpx.Response:
        if not self.available:
            raise OmniRouteError("OMNIROUTE_API_KEY not set")

        attempt = 0
        while True:
            attempt += 1
            try:
                resp = await self._client.post(self.base_url, json=body)

                # Retryable HTTP status (rate limit / transient server error).
                if resp.status_code in _RETRYABLE_STATUS and attempt <= retries:
                    await self._backoff(attempt)
                    continue

                resp.raise_for_status()  # any remaining 4xx/5xx -> raise below
                return resp

            except httpx.HTTPStatusError as exc:
                raise OmniRouteError(
                    f"OmniRoute HTTP {exc.response.status_code}: {exc.response.text[:300]}"
                ) from exc
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                if attempt <= retries:
                    logger.warning("OmniRoute attempt %s failed (%s); retrying", attempt, exc)
                    await self._backoff(attempt)
                    continue
                raise OmniRouteError(
                    f"OmniRoute request failed after {attempt} attempts: {exc}"
                ) from exc

    @staticmethod
    async def _backoff(attempt: int) -> None:
        """Exponential backoff with jitter (750ms -> 1.5s -> 3s ceiling)."""
        delay_ms = min(_MAX_BACKOFF_MS, _BASE_BACKOFF_MS * 2 ** (attempt - 1))
        await asyncio.sleep((delay_ms + random.uniform(0, 500)) / 1000.0)

    # ------------------------------------------------------------------ #
    # Response decoding (JSON or SSE)
    # ------------------------------------------------------------------ #
    @staticmethod
    def _extract_content(resp: httpx.Response) -> str:
        content_type = resp.headers.get("content-type", "")
        text = resp.text

        is_sse = "text/event-stream" in content_type.lower() or text.lstrip().startswith("data:")
        if not is_sse:
            data = json.loads(text)
            return data.get("choices", [{}])[0].get("message", {}).get("content", "")

        reply: list[str] = []
        for line in text.splitlines():
            line = line.strip()
            if not line.startswith("data:"):
                continue
            payload = line[5:].strip()
            if not payload or payload == "[DONE]":
                continue
            try:
                parsed = json.loads(payload)
                choice = (parsed.get("choices") or [{}])[0]
                content = (
                    choice.get("delta", {}).get("content")
                    or choice.get("message", {}).get("content")
                    or ""
                )
                if content:
                    reply.append(content)
            except json.JSONDecodeError:
                continue
        return "".join(reply)

    # ------------------------------------------------------------------ #
    # Public helpers
    # ------------------------------------------------------------------ #
    def _model_chain(self, primary: str | None) -> list[str]:
        chain: list[str] = []
        for m in [primary, self.model, *self.fallback_models]:
            m = (m or "").strip()
            if m and m not in chain:
                chain.append(m)
        return chain

    async def _run(
        self,
        messages: list[dict[str, str]],
        *,
        json_mode: bool = False,
        model: str | None = None,
    ) -> str:
        """Try each model in the chain until one returns a reply."""
        if not self.available:
            raise OmniRouteError("OMNIROUTE_API_KEY not set")

        last_err: OmniRouteError | None = None

        # Checked per-model so a cached reply from one model is never served
        # for a different one.
        for m in self._model_chain(model):
            key = _cache_key(messages, m)
            cached = await _cache_get(key)
            if cached is not None:
                logger.info("OmniRoute cache hit for model '%s'", m)
                return cached
            try:
                body: dict[str, Any] = {"model": m, "messages": messages}
                if json_mode:
                    body["response_format"] = {"type": "json_object"}
                resp = await self._post(body)
                content = self._extract_content(resp).strip()
                await _cache_put(key, content)
                return content
            except OmniRouteError as exc:
                last_err = exc
                logger.warning("OmniRoute model '%s' failed: %s; trying next", m, exc)
        raise OmniRouteError(f"All OmniRoute models failed. Last error: {last_err}")

    async def chat(
        self, messages: list[dict[str, str]], *, model: str | None = None
    ) -> str:
        return await self._run(messages, json_mode=False, model=model)

    async def call_json(
        self, system: str, user: str, *, model: str | None = None
    ) -> dict[str, Any]:
        """Request a JSON object back (raises OmniRouteError after failover)."""
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        content = await self._run(messages, json_mode=True, model=model)
        return extract_json_object(content)

    async def aclose(self) -> None:
        await self._client.aclose()


def extract_json_object(content: str) -> dict[str, Any]:
    """Parse a model reply that may be wrapped in markdown fences."""
    cleaned = re.sub(r"^```(?:json)?\s*", "", content.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned).strip()
    try:
        parsed: Any = json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not match:
            raise OmniRouteError(f"LLM output was not valid JSON: {content[:200]}")
        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise OmniRouteError(f"LLM output contained invalid JSON: {content[:200]}") from exc
    if not isinstance(parsed, dict):
        raise OmniRouteError(f"LLM output must be a JSON object, got {type(parsed).__name__}")
    return parsed


# --- Singleton ---
_llm: OmniRouteClient | None = None


def build_llm() -> OmniRouteClient:
    global _llm
    if _llm is None:
        llm = OmniRouteClient()
        logger.info("OmniRoute client ready -> %s (model=%s)", llm.base_url, llm.model)
        _llm = llm
    return _llm


async def close_llm() -> None:
    """Graceful shutdown of the pooled client."""
    global _llm
    if _llm is not None:
        await _llm.aclose()
        logger.info("OmniRoute pooled client closed")
        _llm = None