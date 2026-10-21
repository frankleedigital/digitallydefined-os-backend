"""Products API — serve the digital product catalog from Firestore.

Fallback chain: Firestore → in-memory Python data → empty list.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from ..data.products import PRODUCTS, PRODUCTS_BY_ID, PRODUCTS_BY_TIER, PRODUCTS_BY_STATUS

logger = logging.getLogger("digitallydefined.fastapi.routers.products")
router = APIRouter(prefix="/products", tags=["products"])


async def _get_product_source():
    """Try Firestore first, fall back to in-memory data."""
    try:
        from ..config import get_firestore_client
        from ..knowledge import list_documents, get_document

        client = get_firestore_client()
        if client:
            return "firestore", client
    except Exception:
        pass
    return "memory", None


@router.get("")
async def list_products(
    tier: Optional[str] = Query(None, description="Filter by tier: entry, core, premium, backend"),
    status: Optional[str] = Query(None, description="Filter by status: live, backend, placeholder"),
    limit: int = Query(50, ge=1, le=200),
):
    """List all digital products, with optional tier/status filters."""
    source, client = await _get_product_source()

    if source == "firestore":
        from ..knowledge import list_documents, query_documents

        products = await list_documents("products", limit=limit)
    else:
        # In-memory fallback
        products = PRODUCTS.copy()

    # Apply filters
    if tier:
        products = [p for p in products if p.get("tier") == tier]
    if status:
        products = [p for p in products if p.get("status") == status]

    return {
        "source": source,
        "count": len(products),
        "products": products,
    }


@router.get("/{product_id}")
async def get_product(product_id: str):
    """Get a single product by its ID."""
    source, client = await _get_product_source()

    if source == "firestore":
        from ..knowledge import get_document

        product = await get_document("products", product_id)
    else:
        product = PRODUCTS_BY_ID.get(product_id)

    if not product:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")

    return {"source": source, "product": product}


@router.get("/tiers")
async def list_tiers():
    """List all product tiers with counts."""
    return {
        "tiers": {tier: len(products) for tier, products in PRODUCTS_BY_TIER.items()},
    }


@router.get("/tier/{tier}")
async def products_by_tier(tier: str):
    """Get all products in a tier."""
    products = PRODUCTS_BY_TIER.get(tier, [])
    return {
        "tier": tier,
        "count": len(products),
        "products": products,
    }