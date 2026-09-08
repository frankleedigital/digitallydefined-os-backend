# app/storage.py
"""Storage layer — Supabase REST (same contract as archived `tools/store_trend.py`
and the live `lib/supabaseClient.js`) with a local-JSON fallback for local dev,
plus an optional Puter workspace bridge (stubbed).
"""
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx

from .config import settings

logger = logging.getLogger("digitallydefined.fastapi.storage")


class StorageClient:
    """Persist generated artifacts. Prefers Supabase; falls back to local JSONL."""

    def __init__(self) -> None:
        self.url = settings.supabase_url.rstrip("/")
        self.key = settings.supabase_service_key
        self.local_dir = settings.output_dir / "storage"
        self.local_dir.mkdir(parents=True, exist_ok=True)

    @property
    def _use_supabase(self) -> bool:
        return bool(self.key)

    def _local_path(self, table: str) -> Path:
        return self.local_dir / f"{table}.jsonl"

    async def insert(self, table: str, payload: dict[str, Any]) -> dict[str, Any]:
        if self._use_supabase:
            return await self._insert_supabase(table, payload)
        return self._insert_local(table, payload)

    async def _insert_supabase(self, table: str, payload: dict[str, Any]) -> dict[str, Any]:
        record = {**payload, "created_at": datetime.now(timezone.utc).isoformat()}
        url = f"{self.url}/rest/v1/{table}"
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, headers=headers, json=record)
            resp.raise_for_status()
            return resp.json()

    def _insert_local(self, table: str, payload: dict[str, Any]) -> dict[str, Any]:
        record = {**payload, "created_at": datetime.now(timezone.utc).isoformat()}
        path = self._local_path(table)
        with path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record) + "\n")
        logger.info("Stored %s locally at %s (fallback)", table, path)
        return record


storage = StorageClient()