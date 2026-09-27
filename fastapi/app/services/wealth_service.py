# app/services/wealth_service.py
"""Digital Wealth Calculator — revenue projection service.

Applies deterministic conversion-math to user-supplied inputs and
optionally enriches the narrative with OmniRoute when available.
"""
import logging

from ..llm import build_llm
from ..models import WealthRequest, RevenueProjection, WealthResponse

logger = logging.getLogger("digitallydefined.fastapi.wealth_service")

# Rule-of-thumb conversion rates by product type (click-through to purchase).
_CONVERSION_RATE = {
    "template": 0.025,
    "course": 0.018,
    "bundle": 0.015,
    "saas": 0.012,
    "digital": 0.020,
}
_DEFAULT_CONVERSION = 0.020  # fallback when product type is unknown


async def wealth_calculation(req: WealthRequest) -> WealthResponse:
    conversion = _CONVERSION_RATE.get(req.product_type, _DEFAULT_CONVERSION)
    monthly_sales = int(req.audience_size * conversion)
    monthly_revenue = monthly_sales * req.pricing
    year1 = monthly_revenue * 12
    year2 = year1 * 1.3  # 30% organic growth assumption
    year3 = year2 * 1.25  # 25% growth slows as audience saturates

    revenue_projection = RevenueProjection(
        year1=round(year1, 2),
        year2=round(year2, 2),
        year3=round(year3, 2),
        breakout_note=(
            f"At {conversion * 100:.1f}% conversion and ${req.pricing:.2f} price you project "
            f"${year1:,.0f} in year 1 from {req.audience_size:,} people. "
            "These are directional estimates — validate with real traffic data."
        ),
    )

    growth_model = "Exponential growth with compounding — each asset compounds audience reach."
    recommended_pricing = [
        f"Test ${req.pricing:.2f} against ${req.pricing * 0.5:.2f} and ${req.pricing * 2:.2f} to find elasticity",
        "Offer a low-ticket tripwire ($7–19) before the core offer",
        "Add a premium tier once you have 10+ paying customers",
    ]

    # LLM enrichment (non-authoritative — math is deterministic above).
    llm = build_llm()
    if llm.available:
        try:
            data = await llm.call_json(
                "You are the DigitallyDefined Wealth Calculator narrator. Explain the user's "
                "revenue projection plainly. Identify the biggest leverage point. No hype. "
                "Return only JSON: "
                '{"growthModel":"...","recommendedPricing":["..."]}',
                f"Niche: {req.niche}\nAudience: {req.audience_size:,}\n"
                f"Product type: {req.product_type}\nPrice: ${req.pricing:.2f}\n"
                f"Projected Year 1: ${year1:,.2f}",
            )
            if data.get("growthModel"):
                growth_model = data["growthModel"]
            if data.get("recommendedPricing"):
                recommended_pricing = data["recommendedPricing"]
        except Exception as exc:  # noqa: BLE001
            logger.warning("LLM enrichment failed for wealth: %s", exc)

    return WealthResponse(
        niche=req.niche,
        revenue_projection=revenue_projection,
        growth_model=growth_model,
        recommended_pricing=recommended_pricing,
    )