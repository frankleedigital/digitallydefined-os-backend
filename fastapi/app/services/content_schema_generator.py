# app/services/content_schema_generator.py
"""Content Schema Generator — port of the archived
`docs/hermes-mcp-archive/hermes/modules/content_schema_generator.py`.

Generates JSON Schema (Draft 7) documents for a funnel stage — used by the
Automation Blueprint Generator for schema-driven offers.
"""
import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("digitallydefined.fastapi.content_schema_generator")

DEFAULT_REQUIRED = ["title", "description", "content_type", "target_audience", "value_proposition"]
STAGE_PROPERTIES: dict[str, dict[str, Any]] = {
    "Lead Magnet": {
        "title": {"type": "string"},
        "description": {"type": "string"},
        "content_type": {"type": "string"},
        "target_audience": {"type": "string"},
        "value_proposition": {"type": "string"},
    },
    "Core Offer": {
        "price": {"type": "number", "minimum": 0},
        "modules": {"type": "array", "items": {"type": "string"}},
    },
    "Authority Bundle": {
        "price": {"type": "number", "minimum": 0},
        "includes": {"type": "array", "items": {"type": "string"}},
        "total_value": {"type": "number"},
    },
    "Community": {
        "price": {"type": "number", "minimum": 0},
        "billing_cycle": {"type": "string"},
        "features": {"type": "array", "items": {"type": "string"}},
    },
    "Recurring Revenue": {
        "price": {"type": "number", "minimum": 0},
        "billing_cycle": {"type": "string"},
        "trial_days": {"type": "integer", "minimum": 0},
    },
}


def generate_schema(stage: str, description: str = "") -> dict[str, Any]:
    name = stage or "Lead Magnet"
    schema: dict[str, Any] = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": f"https://digitallydefined.online/schemas/{name.lower().replace(' ', '_')}.json",
        "title": f"{name} Content Schema",
        "description": description,
        "type": "object",
        "properties": STAGE_PROPERTIES.get(name, STAGE_PROPERTIES["Lead Magnet"]),
        "required": DEFAULT_REQUIRED,
        "additionalProperties": True,
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat() + "Z",
            "generator": "FastAPI ContentSchemaGenerator",
            "version": "1.0.0",
            "funnel_stage": name,
        },
    }
    return schema


def generate_all_schemas(stages: list[str]) -> list[dict[str, Any]]:
    return [generate_schema(s) for s in stages]