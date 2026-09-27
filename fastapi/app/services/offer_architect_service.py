# app/services/offer_architect_service.py
"""Offer Architect — schema-driven funnel-stage offer generator.

Gathers niche, audience, price and transformation details, selects the
matching funnel-stage schema (from content_schema_generator), validates the
structured offer, and returns a checklist + next action.
"""
import logging

from .content_schema_generator import generate_schema
from ..llm import build_llm
from ..models import OfferArchitectRequest, OfferArchitectResponse

logger = logging.getLogger("digitallydefined.fastapi.offer_architect_service")

_STAGE_DESCRIPTIONS = {
    "lead_magnet": "A free high-value asset that captures emails (checklist, template, mini-guide).",
    "core_offer": "The primary paid product that solves the core problem (course, toolkit, or done-for-you).",
    "authority_bundle": "A premium package bundling multiple assets at a higher price point.",
    "community": "A paid membership or cohort community for ongoing support and accountability.",
    "recurring_revenue": "A subscription, newsletter, or SaaS product delivering recurring value.",
}


async def offer_architect(req: OfferArchitectRequest) -> OfferArchitectResponse:
    schema = generate_schema(req.funnel_stage, _STAGE_DESCRIPTIONS.get(req.funnel_stage, ""))

    stage_props = schema.get("properties", {})
    offer: dict = {}

    # Seed offer with deterministic defaults from the schema properties.
    for key, prop in stage_props.items():
        if key == "title":
            offer[key] = f"{req.niche} {req.funnel_stage.replace('_', ' ').title()}"
        elif key == "description":
            offer[key] = req.description or f"A {req.funnel_stage} for {req.niche} creators."
        elif key == "target_audience":
            offer[key] = req.audience or f"Gen X women building faceless digital assets in {req.niche}"
        elif key == "value_proposition":
            offer[key] = f"Help {req.audience or 'creators'} achieve transformation in {req.niche} without showing their face."
        elif key == "price":
            offer[key] = req.price
        elif prop.get("type") == "array":
            offer[key] = []
        elif prop.get("type") == "string":
            offer[key] = ""

    # LLM enrichment — improve the offer copy if model is available.
    if req.price and req.price > 0:
        llm = build_llm()
        if llm.available:
            try:
                data = await llm.call_json(
                    f"You are the DigitallyDefined Offer Architect. You shape a {req.funnel_stage} "
                    f"for the niche '{req.niche}'. Return a polished offer object plus a validation "
                    f"checklist and one next action. No hype. Return only JSON:\n"
                    '{"offer":{{"title":"...","description":"...","price":0,"value_proposition":"..."}},'
                    '"validationChecklist":["..."],"nextAction":"..."}',
                    f"Niche: {req.niche}\nAudience: {req.audience or 'unspecified'}\n"
                    f"Price: ${req.price:.2f}\nDescription: {req.description or 'none provided'}",
                )
                if "offer" in data:
                    offer.update(data["offer"])
                if data.get("validationChecklist"):
                    validation_checklist = data["validationChecklist"]
                else:
                    validation_checklist = _default_checklist(req.funnel_stage)
                if data.get("nextAction"):
                    next_action = data["nextAction"]
                else:
                    next_action = f"Validate the {req.funnel_stage.replace('_', ' ')} with 3 potential buyers before building."
                return OfferArchitectResponse(
                    funnel_stage=req.funnel_stage,
                    offer=offer,
                    validation_checklist=validation_checklist,
                    next_action=next_action,
                )
            except Exception as exc:  # noqa: BLE001
                logger.warning("LLM enrichment failed for offer-architect: %s", exc)

    validation_checklist = _default_checklist(req.funnel_stage)
    next_action = f"Validate the {req.funnel_stage.replace('_', ' ')} with 3 potential buyers before building."
    return OfferArchitectResponse(
        funnel_stage=req.funnel_stage,
        offer=offer,
        validation_checklist=validation_checklist,
        next_action=next_action,
    )


def _default_checklist(stage: str) -> list[str]:
    return [
        f"Is the {stage.replace('_', ' ')} clearly stated in the title?",
        "Is the price justified by the transformation promised?",
        "Is the target audience specific enough to write copy for?",
        f"Does the {stage.replace('_', ' ')} solve one concrete problem?",
        "Is there a clear call-to-action and delivery mechanism?",
    ]