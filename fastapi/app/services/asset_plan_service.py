# app/services/asset_plan_service.py
"""Asset Plan (Freedom Number / 10x ROI) service.

Deterministic financial math for a faceless digital-asset portfolio.
AI explains assumptions and gives sequencing guidance when OmniRoute is
available, but never changes the underlying calculator values.
"""
import logging

from ..llm import build_llm
from ..models import AssetPlanRequest, AssetPlanResponse

logger = logging.getLogger("digitallydefined.fastapi.asset_plan_service")

_FREEDOM_MULTIPLIER = 25  # rule-of-thumb: 25 × annual expenses = freedom number


async def asset_plan(req: AssetPlanRequest) -> AssetPlanResponse:
    # ---- deterministic math (authoritative) ----
    annual_expenses = req.monthly_expenses * 12
    freedom_number = annual_expenses * _FREEDOM_MULTIPLIER
    years_to_retire = max(req.retire_age - req.current_age, 1)
    # Assume a blended passive return of 7% compounded annual growth.
    months_needed = int(freedom_number / (req.monthly_expenses * req.months_to_live)) if req.monthly_expenses else 0
    months_needed = min(months_needed, years_to_retire * 12)  # cap at retirement horizon
    expected_from_niche = req.audience_size * 0.02 * req.pricing * 4  # 2% conversion × 4 products/yr

    portfolio_summary = (
        f"To cover ${req.monthly_expenses:,.0f}/mo for {req.months_to_live} months you need "
        f"a freedom number of ${freedom_number:,.0f}. At ${expected_from_niche:,.0f}/yr from the "
        f"'{req.niche}' audience you are looking at roughly {months_needed} months to hit that "
        f"target assuming steady conversion — validate with real traffic before counting on it."
    )

    assumptions = [
        f"Audience reachable: {req.audience_size:,}",
        f"Average price: ${req.pricing:.2f}",
        "2% conversion rate (industry baseline for faceless assets)",
        "4 product launches per year",
        f"7% blended annual return on reinvested profit",
        f"Freedom multiplier: {_FREEDOM_MULTIPLIER}× annual expenses",
    ]

    concentration_risks = []
    if req.audience_size < 5000:
        concentration_risks.append("Audience too small — diversify before relying on this niche alone")
    if req.pricing < 10:
        concentration_risks.append("Price point is very low; volume will need to be extreme")
    if years_to_retire < 10:
        concentration_risks.append("Short time-to-retirement horizon increases sequence-of-returns risk")

    build_order = [
        f"Validate demand for '{req.niche}' with the niche scorecard",
        "Build one lead magnet and grow an email list",
        "Launch a low-ticket template or checklist ($9–29)",
        "Scale with a core course or bundle ($97–297)",
        "Add community or subscription for recurring revenue",
    ]

    next_action = "Run the niche scorecard for your target keyword before investing time in assets."

    # ---- LLM enrichment (non-authoritative, best-effort) ----
    llm = build_llm()
    if llm.available:
        try:
            data = await llm.call_json(
                "You are the DigitallyDefined Freedom Number & 10x ROI interpreter. Explain the "
                "user's calculator inputs and results plainly. Identify assumptions and the single "
                "most important next action. No hype. Return only JSON:\n"
                '{"portfolioSummary":"...","assumptions":["..."],"concentrationRisks":["..."],'
                '"buildOrder":["..."],"nextAction":"...","disclaimer":"..."}',
                f"Niche: {req.niche}\nAudience: {req.audience_size:,}\nProduct type: {req.product_type}\n"
                f"Price: ${req.pricing:.2f}\nMonthly expenses: ${req.monthly_expenses:,.2f}\n"
                f"Current age: {req.current_age}, retire age: {req.retire_age}\n"
                f"Freedom number: ${freedom_number:,.2f}\nExpected annual from niche: ${expected_from_niche:,.2f}",
            )
            portfolio_summary = data.get("portfolioSummary", portfolio_summary)
            if data.get("assumptions"):
                assumptions = data["assumptions"]
            if data.get("concentrationRisks"):
                concentration_risks = data["concentrationRisks"]
            if data.get("buildOrder"):
                build_order = data["buildOrder"]
            if data.get("nextAction"):
                next_action = data["nextAction"]
        except Exception as exc:  # noqa: BLE001
            logger.warning("LLM enrichment failed for asset-plan: %s", exc)

    return AssetPlanResponse(
        niche=req.niche,
        portfolio_summary=portfolio_summary,
        assumptions=assumptions,
        concentration_risks=concentration_risks,
        build_order=build_order,
        next_action=next_action,
        disclaimer=(
            "Calculations use rule-of-thumb assumptions, not guarantees. "
            "Results are directional — validate with real market data before making financial decisions."
        ),
    )