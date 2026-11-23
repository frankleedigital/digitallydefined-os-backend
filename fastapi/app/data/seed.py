"""Seed script — populate Firestore with the digital product catalog.

Run standalone:
    python -m app.data.seed

Or call from the FastAPI startup to auto-seed on first deploy.
"""

import asyncio
import logging
import sys

logger = logging.getLogger("digitallydefined.fastapi.data.seed")

# ---------------------------------------------------------------------------
# Constants for Firestore collection paths
# ---------------------------------------------------------------------------
# Single-segment collection IDs: Firestore requires an odd number of path elements.
PRODUCTS_COLLECTION = "products"
PROMPTS_COLLECTION = "prompts"

# ---------------------------------------------------------------------------
# Data sources
# ---------------------------------------------------------------------------
from .products import PRODUCTS


async def seed_products(client=None) -> int:
    """Insert all products into Firestore. Returns count of products seeded.

    Falls back to Supabase or local JSON if Firestore client is not available.
    """
    from ..knowledge import create_document, get_document

    seeded = 0
    for product in PRODUCTS:
        doc_id = product["id"]

        # Skip if already exists (idempotent)
        existing = await get_document(PRODUCTS_COLLECTION, doc_id)
        if existing:
            logger.debug("Skipping existing product %s", doc_id)
            continue

        result = await create_document(PRODUCTS_COLLECTION, doc_id, product)
        if result:
            seeded += 1
            logger.info("Seeded product %s: %s", doc_id, product["name"])

    return seeded


async def seed_all() -> dict:
    """Seed all data collections. Returns counts per collection."""
    results = {}

    count = await seed_products()
    results["products"] = count

    return results


def print_results(results: dict):
    """Pretty-print seeding results."""
    total = sum(results.values())
    print(f"\n{'='*50}")
    print(f"  Seeding Complete")
    print(f"{'='*50}")
    for collection, count in results.items():
        print(f"  {collection:20s}: {count} documents")
    print(f"{'='*50}")
    print(f"  Total: {total} documents")
    print(f"{'='*50}\n")


async def main():
    """Run when called as script."""
    logging.basicConfig(level=logging.INFO)

    print("DigitallyDefined Product Catalog — Firestore Seeder")
    print("=" * 50)

    # Try Firestore first
    try:
        from ..config.google import get_firestore_client

        client = get_firestore_client()
        if client:
            print("✓ Firestore client available")
        else:
            print("⚠ Firestore not configured — seeding to local fallback")
    except Exception:
        print("⚠ Firestore not available — seeding to local fallback")

    results = await seed_all()
    print_results(results)

    # Write a local JSON backup regardless
    import json
    from pathlib import Path

    output_dir = Path(__file__).parent.parent.parent / "output" / "seed"
    output_dir.mkdir(parents=True, exist_ok=True)
    backup_path = output_dir / "products.json"
    with open(backup_path, "w", encoding="utf-8") as f:
        json.dump(PRODUCTS, f, indent=2)
    print(f"✓ Backup written to {backup_path}")


if __name__ == "__main__":
    asyncio.run(main())