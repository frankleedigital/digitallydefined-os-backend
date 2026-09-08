# app/services/affiliate_service.py
"""Affiliate Market Flipper — NEW microservice (previously missing).

Deterministic rule-of-thumb analysis of affiliate product viability.
Replace the fixed conversion-rate map with real offer-database data later.
"""
import logging

from ..models import AffiliateFlipRequest, AffiliateFlipResponse

logger = logging.getLogger("digitallydefined.fastapi.affiliate_service")

# Rule-of-thumb conversion rates by perceived offer strength (0.2%-2% typical for click-through).
_CONVERSION_MAP = {
    "high": 0.020,
    "medium": 0.012,
    "low": 0.006,
}
_TARGET_MARGIN = 500.0  # baseline profit target used to derive breakeven list size


async def flip_analysis(req: AffiliateFlipRequest) -> AffiliateFlipResponse:
    commission = (req.commission_percent / 100.0) * req.product_price
    conversion = _CONVERSION_MAP["medium"]
    breakeven = int(_TARGET_MARGIN / max(commission * conversion, 1e-9)) if commission else 0
    risk = "low" if commission * conversion > 10 else ("medium" if commission * conversion > 3 else "high")

    strategy = (
        f"Promote '{req.product}' (${req.product_price:,.2f}) at {req.commission_percent:.1f}% → "
        f"${commission:,.2f} per sale. At an assumed ~{conversion * 100:.1f}% click conversion you'd "
        f"need ~{breakeven} targeted visits for a ${_TARGET_MARGIN:,.0f} target. "
        "Validate CTR and offer quality against real network data before scaling."
    )

    return AffiliateFlipResponse(
        product=req.product,
        niche=req.niche,
        commission_per_sale=round(commission, 2),
        expected_conversion_rate=round(conversion, 4),
        breakeven_list_size=breakeven,
        risk_label=risk,
        strategy=strategy,
    )