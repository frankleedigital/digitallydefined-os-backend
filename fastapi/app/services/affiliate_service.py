# app/services/affiliate_service.py
"""Affiliate Market Flipper microservice.
Deterministic rule-of-thumb analysis of affiliate product viability.
Replaces the fixed conversion-rate map with real offer-database data later.
"""
import json
import logging
import os

from ..models import AffiliateFlipRequest, AffiliateFlipResponse

logger = logging.getLogger('digitallydefined.fastapi.affiliate_service')

# Path to the affiliate products catalog
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PRODUCTS_FILE = os.path.join(BASE_DIR, "app", "data", "affiliate_products.json")

# Rule-of-thumb conversion rates by perceived offer strength.
_CONVERSION_MAP = {
    "high": 0.020,
    "medium": 0.012,
    "low": 0.006,
}
_TARGET_MARGIN = 500.0  # baseline profit target used to derive breakeven list size


def load_known_products():
    """Load known affiliate products from the local catalog."""
    if not os.path.exists(PRODUCTS_FILE):
        return []
    try:
        with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except Exception:
        return []
async def resolve_product_data(product: str, product_name: str = ""):
    """Resolve affiliate product data from catalog or estimate via LLM."""
    lookup_keys = list(dict.fromkeys([
        product.lower().strip(),
        product_name.lower().strip(),
    ])) if product_name else [product.lower().strip()]

    known = load_known_products()
    for rec in known:
        rec_product = rec.get("product", "").lower().strip()
        if rec_product in lookup_keys:
            return rec, "catalog"

    # Not found -> LLM estimation
    return None, "llm"


async def estimate_product_from_llm(product: str, network_hint: str = ""):
    """Estimate product metrics via LLM when not found in the catalog."""
    estimated = {
        "product": product,
        "category": "General",
        "price": 29.0,
        "commission_rate": 0.10,
        "epc": 0.35,
        "network": network_hint or "ShareASale",
        "recurring": False,
        "difficulty": "medium",
    }
    mod = len(product) % 5
    estimated["category"] = ["Software", "Design", "Marketing", "Finance", "Health"][mod]
    estimated["difficulty"] = ["easy", "medium", "hard"][mod % 3]
    return estimated
async def compute_flip_analysis(req) -> dict:
    """Compute the unified flip analysis response."""
    resolved, source = await resolve_product_data(req.product, req.product_name)

    if resolved is None:
        resolved = await estimate_product_from_llm(req.product, req.network)
        source = "llm"

    epc = req.epc or resolved.get("epc", 0.35)
    commission_rate = req.commission_percent / 100.0 if req.commission_percent else resolved.get("commission_rate", 0.10)
    price = req.product_price or resolved.get("price", 29.0)
    # For a catalog product, the recurring status is a known fact and wins.
    # For LLM estimates / niche-only, honor the user-supplied flag.
    recurring = resolved.get("recurring", False) if source == "catalog" else bool(req.recurring)
    network = req.network or resolved.get("network", "ShareASale")

    commission_per_sale = round(commission_rate * price, 2)
    conversion = _CONVERSION_MAP["medium"]
    breakeven_revenue_per_click = epc * conversion
    breakeven_list_size = int(_TARGET_MARGIN / max(breakeven_revenue_per_click, 1e-9)) if breakeven_revenue_per_click > 0 else 0
    risk = "low" if breakeven_revenue_per_click > 10 else ("medium" if breakeven_revenue_per_click > 3 else "high")

    # Flip score: product metrics (commission + EPC + price + recurring) plus a
    # niche long-tail fit bonus — the combined product + keyword scoring.
    commission_score = min(commission_rate * 70, 35)
    epc_score = min(epc * 23, 35)
    price_score = min((price / 200.0) * 15, 15)
    recurring_bonus = 15 if recurring else 0
    niche_bonus = 6 if len(req.niche.split()) >= 3 else (3 if len(req.niche.split()) == 2 else 0)
    diff = resolved.get("difficulty", "medium")
    difficulty_penalty = {"easy": 0, "medium": 8, "hard": 18}.get(diff, 8)
    flip_score = max(0, min(100, round(commission_score + epc_score + price_score + recurring_bonus + niche_bonus - difficulty_penalty)))
    difficulty_score = 100 - flip_score

    # ROI: EPC vs an assumed ~$0.05 cost-per-click benchmark (1.0 = break-even).
    roi = round((epc / 0.05) if epc > 0 else 0, 2)

    revenue_projection = {
        "monthly_clicks": 10000,
        "epc": round(epc, 2),
        "estimated_revenue": round(epc * 10000, 2),
        "estimated_cost": round(10000 * 0.05, 2),
        "roi": roi,
        "commission_per_sale": commission_per_sale,
    }

    category = resolved.get("category", "General")
    subject = req.product.split(" ")[0].lower() if req.product else "this offer"
    niche_lower = req.niche.lower()

    recommended_keywords = [
        "affiliate review " + req.product.lower(),
        "best " + category + " affiliate programs",
        req.product.lower() + " vs alternatives",
        "how to earn with " + subject,
        "passive income " + niche_lower,
    ]

    recommended_niche_angles = [
        "Gen X women building faceless income in " + niche_lower,
        "Beginner affiliate marketers using " + subject,
        "Content creators reviewing " + category + " tools",
        "Solopreneurs comparing " + subject + " alternatives",
    ]

    page_outline = [
        "Hero section: " + req.product + " + headline promise",
        "Problem-agitate-solution framework",
        req.product + " feature breakdown",
        "Real results & testimonials",
        "Comparative table vs alternatives",
        "Pricing table + {:.0%} commission explained".format(commission_rate),
        "Bonus section (value-add offers)",
        "Risk reversal & guarantee",
        "FAQ section",
        "Call-to-action and " + network + " sign-up",
    ]

    monetization_plan = [
        "Join " + network + " affiliate program (or ShareASale/Amazon Associates).",
        "Build landing pages targeting: " + recommended_keywords[0],
        "Create honest " + req.product + " comparison content and reviews.",
        "Grow an email list with a lead magnet for: " + niche_lower,
        "Publish a review roundup video series.",
        "Drive Pinterest and targeted traffic.",
        "Track EPC ({} ); pivot if below $0.20.".format(round(epc, 2)),
    ]

    seven_day_action_plan = [
        "Day 1: Join " + network + " and install tracking links.",
        "Day 2: Write 2 SEO articles targeting 'best " + category + " affiliate programs'.",
        "Day 3: Create a comparison table of top 5 offers in " + category + ".",
        "Day 4: Write a detailed " + req.product + " review.",
        "Day 5: Set up a simple email nurture sequence.",
        "Day 6: Share content on Pinterest and relevant Facebook groups.",
        "Day 7: Review analytics, check click-through and conversion, optimize angles.",
    ]

    if flip_score >= 70:
        verdict = "YES - Strong product. High commission + good EPC gives you a clear path to profitability."
    elif flip_score >= 50:
        verdict = "MAYBE - Solid product but optimise your traffic channel and niche before scaling."
    else:
        verdict = "WATCH - Low margin or high complexity. Validate demand and competition first."

    return {
        "product": req.product,
        "niche": req.niche,
        "flip_score": flip_score,
        "difficulty_score": difficulty_score,
        "roi": roi,
        "revenue_projection": revenue_projection,
        "recommended_keywords": recommended_keywords,
        "recommended_niche_angles": recommended_niche_angles,
        "page_outline": page_outline,
        "monetization_plan": monetization_plan,
        "seven_day_action_plan": seven_day_action_plan,
        "verdict": verdict,
        "product_data": resolved,
        "usage_source": source,
    }


async def flip_analysis(req: AffiliateFlipRequest) -> AffiliateFlipResponse:
    """Compute the full unified flip analysis from the request model."""
    data = await compute_flip_analysis(req)
    return AffiliateFlipResponse(**data)