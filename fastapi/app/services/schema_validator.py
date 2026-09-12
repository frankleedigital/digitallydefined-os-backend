# app/services/schema_validator.py
"""Schema Validator — port of the archived
`docs/hermes-mcp-archive/hermes/modules/schema_validator.py`.

Validates generated JSON Schema (Draft 7) and data instances.
"""
import logging
from typing import Any

logger = logging.getLogger("digitallydefined.fastapi.schema_validator")

_JSONSCHEMA_UNAVAILABLE = False
try:
    import jsonschema
except Exception:  # noqa: BLE001
    _JSONSCHEMA_UNAVAILABLE = True

_REQUIRED_STANDARD_KEYS = ("title", "description", "type", "properties")


def validate_schema(schema: dict[str, Any]) -> list[str]:
    """Return a list of validation errors (empty when the schema is valid)."""
    errors: list[str] = []
    if not isinstance(schema, dict):
        return ["schema must be an object"]

    for key in _REQUIRED_STANDARD_KEYS:
        if key not in schema:
            errors.append(f"missing standard key: {key}")

    props = schema.get("properties") or {}
    if not isinstance(props, dict):
        errors.append("properties must be an object")
        props = {}

    for field in schema.get("required", []):
        if field not in props:
            errors.append(f"required field not defined in properties: {field}")

    return errors


# --- Notion Architect bridge (Phase 4 restoration) ----------------------
# Architect-based normalization / validation / dedup for callers that persist
# generated records into the Notion OS.
from ..notion_architect import (  # noqa: E402
    build_notion_properties,
    get_notion_dedup_tuple,
    get_notion_schema_map,
    normalize_notion_record,
    upsert_notion_record,
    validate_notion_record,
)


def validate_notion_os_record(db_key: str, record: dict[str, Any]) -> dict[str, Any]:
    """Normalize + validate a record against the architect schema for `db_key`."""
    normalized = normalize_notion_record(db_key, record)
    if not normalized:
        return {"valid": False, "error": f"Unknown architect DB key: {db_key}", "normalized": None, "missing": []}
    result = validate_notion_record(db_key, normalized)
    return {
        "valid": result["valid"],
        "error": result["error"],
        "normalized": normalized,
        "missing": result["missing"],
        "dedupKeys": get_notion_schema_map()[db_key]["dedupKeys"] if db_key in get_notion_schema_map() else [],
    }


def validate_instance(instance: dict[str, Any], schema: dict[str, Any]) -> tuple[bool, list[str]]:
    if _JSONSCHEMA_UNAVAILABLE:
        return True, []
    try:
        jsonschema.validate(instance=instance, schema=schema)
        return True, []
    except jsonschema.ValidationError as exc:
        return False, [exc.message]
    except Exception as exc:  # noqa: BLE001
        return False, [str(exc)]