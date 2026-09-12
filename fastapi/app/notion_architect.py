# app/notion_architect.py
# NOTION ARCHITECT (Python mirror of supabase/functions/_shared/notion-architect.ts)
#
# Single contract for every FastAPI microservice write into the 8 core Notion OS
# databases. Keep the schema map in sync with the Deno module.
#
# Dry-run safe: pure normalization/validation/dedup helpers plus a gated
# `upsert_notion_record` write helper (NOTION_LIVE_MODE).
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

STATUS_SYNONYMS = {
    "live": "Published",
    "published": "Published",
    "on": "Published",
    "active": "Published",
    "draft": "Draft",
    "wip": "Draft",
    "idea": "Draft",
    "pending": "Draft",
    "paused": "Paused",
    "scheduled": "Scheduled",
    "archived": "Archived",
    "done": "Done",
    "complete": "Done",
    "completed": "Done",
    "failed": "Failed",
    "error": "Failed",
}

DATE_SYNONYMS = {
    "month": "Month",
    "period": "Period",
    "created": "Created",
    "createdat": "Created",
    "created_at": "Created",
    "publishedat": "Created",
}


def _spec(key: str, label: str, env_var: str, dedup: List[str], properties: List[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "key": key,
        "label": label,
        "envVar": env_var,
        "dedupKeys": dedup,
        "properties": properties,
    }


def _prop(name: str, ptype: str, required: bool = False, options: Optional[List[str]] = None,
          synonyms: Optional[Dict[str, str]] = None, max_chars: int = 2000) -> Dict[str, Any]:
    return {"name": name, "type": ptype, "required": required, "options": options or [],
            "synonyms": synonyms or {}, "maxChars": max_chars}


# The 8 core Notion OS databases (mirror of the Deno map)
NOTION_OS_DBS: Dict[str, Dict[str, Any]] = {
    "assets": _spec("assets", "Digital Assets DB", "NOTION_ASSETS_DB_ID", ["Name", "URL"], [
        _prop("Name", "title", True),
        _prop("URL", "url"),
        _prop("Status", "select", options=["Draft", "Published", "Paused", "Scheduled", "Archived"], synonyms=STATUS_SYNONYMS),
        _prop("Niche", "rich_text", max_chars=500),
        _prop("AssetValue", "number"),
        _prop("Created", "date", synonyms=DATE_SYNONYMS),
    ]),
    "ideas": _spec("ideas", "Ideas & Intake DB", "NOTION_IDEAS_DB_ID", ["Name", "Created"], [
        _prop("Name", "title", True),
        _prop("Status", "select", options=["Draft", "Published", "Archived"], synonyms=STATUS_SYNONYMS),
        _prop("Source", "rich_text", max_chars=200),
        _prop("Niche", "rich_text", max_chars=500),
        _prop("Created", "date", synonyms=DATE_SYNONYMS),
    ]),
    "money": _spec("money", "Money Snapshot DB", "NOTION_MONEY_DB_ID", ["Name", "Created"], [
        _prop("Name", "title", True),
        _prop("Month", "date", synonyms=DATE_SYNONYMS),
        _prop("Revenue", "number"),
        _prop("Expenses", "number"),
        _prop("Net", "number"),
        _prop("Created", "date", synonyms=DATE_SYNONYMS),
    ]),
    "monthly": _spec("monthly", "Monthly Review DB", "NOTION_MONTHLY_DB_ID", ["Name", "Created"], [
        _prop("Name", "title", True),
        _prop("Period", "date", synonyms=DATE_SYNONYMS),
        _prop("Wins", "rich_text"),
        _prop("Risks", "rich_text"),
        _prop("NextActions", "rich_text"),
        _prop("Created", "date", synonyms=DATE_SYNONYMS),
    ]),
    "reputation": _spec("reputation", "Reputation Signals DB", "NOTION_REPUTATION_DB_ID", ["Name", "URL"], [
        _prop("Name", "title", True),
        _prop("URL", "url"),
        _prop("Signal", "select", options=["Positive", "Neutral", "Negative"]),
        _prop("Score", "number"),
        _prop("Created", "date", synonyms=DATE_SYNONYMS),
    ]),
    "content": _spec("content", "Content Blocks DB", "NOTION_CONTENT_DB_ID", ["Name", "URL"], [
        _prop("Name", "title", True),
        _prop("Status", "select", options=["Draft", "Published", "Scheduled", "Archived"], synonyms=STATUS_SYNONYMS),
        _prop("ContentType", "select", options=["Blog", "Newsletter", "Social", "Video", "Guide", "Template"]),
        _prop("Niche", "rich_text", max_chars=500),
        _prop("URL", "url"),
        _prop("Created", "date", synonyms=DATE_SYNONYMS),
    ]),
    "automations": _spec("automations", "Automations Log DB", "NOTION_AUTOMATIONS_DB_ID", ["Name", "Created"], [
        _prop("Name", "title", True),
        _prop("Status", "select", options=["Draft", "Published", "Done", "Failed"], synonyms=STATUS_SYNONYMS),
        _prop("Source", "rich_text", max_chars=200),
        _prop("Email", "email"),
        _prop("Superpower", "rich_text", max_chars=100),
        _prop("Created", "date", synonyms=DATE_SYNONYMS),
    ]),
    "templates": _spec("templates", "Templates Library DB", "NOTION_TEMPLATES_DB_ID", ["Name", "URL"], [
        _prop("Name", "title", True),
        _prop("Status", "select", options=["Draft", "Published", "Archived"], synonyms=STATUS_SYNONYMS),
        _prop("Format", "select", options=["PDF", "Notion", "Spreadsheet", "Checklist", "Playbook"]),
        _prop("URL", "url"),
        _prop("Niche", "rich_text", max_chars=500),
        _prop("Created", "date", synonyms=DATE_SYNONYMS),
    ]),
}


def get_notion_db_id(key: str) -> Optional[str]:
    spec = NOTION_OS_DBS.get(key)
    if not spec:
        return None
    return (os.getenv(spec["envVar"]) or "").strip() or None


def get_notion_schema_map() -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for key, spec in NOTION_OS_DBS.items():
        out[key] = {
            "key": spec["key"],
            "label": spec["label"],
            "envVar": spec["envVar"],
            "dbId": get_notion_db_id(key),
            "dedupKeys": spec["dedupKeys"],
            "syncSafeKeys": [p["name"] for p in spec["properties"]],
            "properties": spec["properties"],
        }
    return out


def _normalize_text(value: Any, max_chars: int) -> str:
    text = "" if value is None else str(value).strip()
    return text[:max_chars]


def _canonical_key(name: str) -> str:
    return re.sub(r"[\s_]", "", name).lower()


def normalize_notion_record(db_key: str, record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Normalize arbitrary fields into the DB's sync-safe names (mirror of TS)."""
    spec = NOTION_OS_DBS.get(db_key)
    if not spec:
        return None

    out: Dict[str, Any] = {}
    for prop in spec["properties"]:
        found = next((k for k in record if _canonical_key(k) == _canonical_key(prop["name"])), None)
        raw = record.get(found) if found is not None else None
        if raw is None or (isinstance(raw, str) and not raw.strip()):
            continue

        ptype = prop["type"]
        if ptype in ("title", "rich_text"):
            out[prop["name"]] = _normalize_text(raw, prop["maxChars"])
        elif ptype == "email":
            out[prop["name"]] = _normalize_text(raw, 320).lower()
        elif ptype == "url":
            out[prop["name"]] = _normalize_text(raw, 2000)
        elif ptype == "select":
            text = _normalize_text(raw, 100)
            out[prop["name"]] = prop["synonyms"].get(_canonical_key(text), text)
        elif ptype == "multi_select":
            items = raw if isinstance(raw, list) else str(raw).split(",")
            out[prop["name"]] = [_normalize_text(v, 100) for v in items if _normalize_text(v, 100)][:50]
        elif ptype == "number":
            try:
                out[prop["name"]] = float(raw)
            except (TypeError, ValueError):
                continue
        elif ptype == "date":
            synonym = prop["synonyms"].get(_canonical_key(_normalize_text(raw, 40)))
            out[prop["name"]] = synonym if synonym else _normalize_text(raw, 60)

    if not out.get("Name"):
        fallback = record.get("email") or record.get("url") or record.get("source") or record.get("id")
        if fallback:
            out["Name"] = _normalize_text(fallback, 2000)
    return out


def validate_notion_record(db_key: str, record: Dict[str, Any]) -> Dict[str, Any]:
    spec = NOTION_OS_DBS.get(db_key)
    if not spec:
        return {"valid": False, "error": f"Unknown architect DB key: {db_key}", "missing": []}
    missing = [
        p["name"] for p in spec["properties"]
        if p["required"] and not (record.get(p["name"]) or "").strip()
    ]
    if missing:
        return {"valid": False, "error": f"{spec['label']}: missing required {', '.join(missing)}", "missing": missing}
    return {"valid": True, "error": None, "missing": []}


def get_notion_dedup_tuple(db_key: str, record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    spec = NOTION_OS_DBS.get(db_key)
    if not spec:
        return None
    return {k: record[k] for k in spec["dedupKeys"] if k in record}


def get_notion_prop_type(db_key: str, prop_name: str) -> Optional[str]:
    spec = NOTION_OS_DBS.get(db_key)
    for prop in spec["properties"] if spec else []:
        if prop["name"] == prop_name:
            return prop["type"]
    return None


def build_notion_properties(db_key: str, record: Dict[str, Any]) -> Dict[str, Any]:
    """Pure: turn a normalized record into a Notion `properties` payload."""
    spec = NOTION_OS_DBS.get(db_key)
    props: Dict[str, Any] = {}
    if not spec:
        return props
    for prop in spec["properties"]:
        value = record.get(prop["name"])
        if value is None or value == "":
            continue
        ptype = prop["type"]
        if ptype == "title":
            props[prop["name"]] = {"title": [{"text": {"content": str(value)[: prop["maxChars"]]}}]}
        elif ptype == "rich_text":
            props[prop["name"]] = {"rich_text": [{"text": {"content": str(value)[: prop["maxChars"]]}}]}
        elif ptype == "email":
            props[prop["name"]] = {"email": str(value)}
        elif ptype == "url":
            props[prop["name"]] = {"url": str(value)}
        elif ptype == "number":
            props[prop["name"]] = {"number": value}
        elif ptype == "date":
            props[prop["name"]] = {"date": {"start": str(value)}}
        elif ptype == "select":
            props[prop["name"]] = {"select": {"name": str(value)}}
        elif ptype == "multi_select":
            props[prop["name"]] = {"multi_select": [{"name": str(n)} for n in value]}
    return props


def is_live_mode() -> bool:
    return (os.getenv("NOTION_LIVE_MODE") or "false").strip().lower() == "true"


def _dedup_filter(db_key: str, record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    tup = get_notion_dedup_tuple(db_key, record)
    if not tup:
        return None
    key = list(tup.keys())[0]
    ptype = get_notion_prop_type(db_key, key) or "rich_text"
    return {"property": key, ptype: {"equals": str(record[key])}}


async def upsert_notion_record(db_key: str, record: Dict[str, Any]) -> Dict[str, Any]:
    """Architect-gated Notion record write (dedup + NOTION_LIVE_MODE gate)."""
    import httpx

    normalized = normalize_notion_record(db_key, record)
    if not normalized:
        return {"ok": False, "dryRun": True, "created": False, "skipped": True, "reason": f"Unknown DB key: {db_key}"}

    validation = validate_notion_record(db_key, normalized)
    if not validation["valid"]:
        return {"ok": False, "dryRun": True, "created": False, "skipped": True, "reason": validation["error"]}

    db_id = get_notion_db_id(db_key)
    if not db_id:
        return {"ok": False, "dryRun": True, "created": False, "skipped": True, "reason": f"{db_key} DB id not configured"}

    token = (os.getenv("NOTION_SECRET") or os.getenv("NOTION_API_KEY") or "").strip()
    if not is_live_mode() or not token:
        return {
            "ok": True,
            "dryRun": True,
            "created": False,
            "skipped": False,
            "reason": "dry-run (NOTION_LIVE_MODE off or token unset)",
        }

    headers = {
        "Authorization": f"Bearer {token}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    }

    dedup = _dedup_filter(db_key, normalized)
    if dedup:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"https://api.notion.com/v1/databases/{db_id}/query",
                headers=headers,
                json={"page_size": 1, "filter": dedup},
            )
        if r.status_code < 400 and r.json().get("results"):
            return {"ok": True, "dryRun": False, "created": False, "skipped": True, "reason": "dedup match"}

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            "https://api.notion.com/v1/pages",
            headers=headers,
            json={
                "parent": {"type": "database_id", "database_id": db_id},
                "properties": build_notion_properties(db_key, normalized),
            },
        )
    if r.status_code >= 400:
        raise RuntimeError(f"Notion upsert failed ({r.status_code}): {r.text[:200]}")
    return {"ok": True, "dryRun": False, "created": True, "skipped": False}