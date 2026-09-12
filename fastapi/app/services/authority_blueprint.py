# app/services/authority_blueprint.py
"""Automation / Authority Blueprint Generator — port of the archived
`docs/hermes-mcp-archive/hermes/agents/authority_blueprint_agent.py`.

Produces the DigitallyDefined authority blueprint (pillars + components) with
optional schema + package enrichment.

Notion Architect (Phase 4 restoration): the generated blueprint is mirrored
into the Content Blocks DB through `notion_architect.upsert_notion_record`
(normalized + deduped + gated by NOTION_LIVE_MODE).
"""
import logging

from ..models import BlueprintRequest, BlueprintResponse
from ..storage import storage
from ..notion_architect import upsert_notion_record

logger = logging.getLogger("digitallydefined.fastapi.authority_blueprint")

BRAND = "DigitallyDefined - faceless, warm, premium, structured, Gen-X female aligned."

PILLARS = [
    {"pillar": "Identity", "status": "planned"},
    {"pillar": "Authority", "status": "planned"},
    {"pillar": "Assets", "status": "planned"},
    {"pillar": "Audience", "status": "planned"},
    {"pillar": "Automation", "status": "planned"},
]
COMPONENTS = [
    {"type": "lead_magnet", "status": "planned"},
    {"type": "core_offer", "status": "planned"},
    {"type": "authority_bundle", "status": "planned"},
    {"type": "community", "status": "planned"},
    {"type": "recurring_revenue", "status": "planned"},
]


async def generate_blueprint(req: BlueprintRequest) -> BlueprintResponse:
    resp = BlueprintResponse(
        keyword=req.keyword,
        blueprint_type="authority",
        pillars=PILLARS,
        components=COMPONENTS,
        trend_narrative=f"Blueprint generated for '{req.keyword}'. Validate demand before building each stage.",
    )

    try:
        resp.persistence = await storage.insert(
            "authority_blueprints",
            {"keyword": req.keyword, "blueprint_type": resp.blueprint_type},
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Blueprint persist failed: %s", exc)

    # Architect: mirror the blueprint into the Notion OS Content Blocks DB.
    try:
        sync_result = await upsert_notion_record("content", {
            "name": f"{req.keyword} — Authority Blueprint",
            "status": "Draft",
            "contentType": "Guide",
            "niche": req.keyword,
            "source": "fastapi.authority_blueprint",
        })
        if not getattr(sync_result, "get", None) or sync_result.get("dryRun"):
            logger.info("Blueprint Notion sync (dry-run): %s", sync_result)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Blueprint Notion sync failed (non-fatal): %s", exc)

    return resp