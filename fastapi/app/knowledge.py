"""Google Cloud Intelligence Layer — Firestore knowledge base operations.

Collections managed:
  products        — Digital product definitions and metadata
  leadmagnets     — Lead magnet definitions and content
  services        — Service offerings
  prompts         — Curated AI prompts for agents
  sops            — Standard operating procedures
  brand_assets    — Brand guidelines and assets
  agents          — Agent definitions and configurations
  content_templates — Reusable content templates
  affiliate_resources — Affiliate program data

Schema: Each document has a consistent shape.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from .config.google import get_firestore_client

logger = logging.getLogger("digitallydefined.fastapi.knowledge")

# ---------------------------------------------------------------------------
# Collection names (constants so callers never typo)
# ---------------------------------------------------------------------------

# NOTE: Firestore collection paths must have an ODD number of elements.
# A two-segment path like "knowledge/products" is interpreted as a DOCUMENT
# path, not a collection, and fails with:
#   "A collection must have an odd number of path elements"
# So each collection is a single top-level segment.
COLLECTIONS = {
    "products": "products",
    "leadmagnets": "leadmagnets",
    "services": "services",
    "prompts": "prompts",
    "sops": "sops",
    "brand_assets": "brand_assets",
    "agents": "agents",
    "content_templates": "content_templates",
    "affiliate_resources": "affiliate_resources",
}


def _client():
    return get_firestore_client()


# ---------------------------------------------------------------------------
# CRUD helpers
# ---------------------------------------------------------------------------


async def create_document(collection: str, doc_id: str, data: dict[str, Any]) -> Optional[str]:
    """Create a document. Returns the document ID or None on failure."""
    client = _client()
    if not client:
        logger.warning("Firestore not available, skipping create")
        return None
    try:
        doc_ref = client.collection(collection).document(doc_id)
        await doc_ref.set({
            **data,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Created %s/%s", collection, doc_id)
        return doc_id
    except Exception as e:
        logger.error("Firestore create failed %s/%s: %s", collection, doc_id, e)
        return None


async def get_document(collection: str, doc_id: str) -> Optional[dict]:
    """Read a document. Returns None if missing or on error."""
    client = _client()
    if not client:
        return None
    try:
        doc = await client.collection(collection).document(doc_id).get()
        return doc.to_dict() if doc.exists else None
    except Exception as e:
        logger.error("Firestore read failed %s/%s: %s", collection, doc_id, e)
        return None


async def update_document(collection: str, doc_id: str, data: dict[str, Any]) -> bool:
    """Update an existing document. Returns True on success."""
    client = _client()
    if not client:
        return False
    try:
        await client.collection(collection).document(doc_id).update({
            **data,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        return True
    except Exception as e:
        logger.error("Firestore update failed %s/%s: %s", collection, doc_id, e)
        return False


async def delete_document(collection: str, doc_id: str) -> bool:
    """Delete a document."""
    client = _client()
    if not client:
        return False
    try:
        await client.collection(collection).document(doc_id).delete()
        return True
    except Exception as e:
        logger.error("Firestore delete failed %s/%s: %s", collection, doc_id, e)
        return False


async def list_documents(collection: str, limit: int = 50) -> list[dict]:
    """List documents in a collection."""
    client = _client()
    if not client:
        return []
    try:
        docs = await client.collection(collection).limit(limit).get()
        return [{"id": d.id, **d.to_dict()} for d in docs if d.exists]
    except Exception as e:
        logger.error("Firestore list failed %s: %s", collection, e)
        return []


async def query_documents(
    collection: str,
    field: str,
    operator: str,
    value: Any,
    limit: int = 50,
) -> list[dict]:
    """Query documents with a where clause."""
    from google.cloud.firestore import FieldFilter  # type: ignore

    client = _client()
    if not client:
        return []
    try:
        docs = (
            await client.collection(collection)
            .where(filter=FieldFilter(field, operator, value))
            .limit(limit)
            .get()
        )
        return [{"id": d.id, **d.to_dict()} for d in docs if d.exists]
    except Exception as e:
        logger.error("Firestore query failed %s: %s", collection, e)
        return []


# ---------------------------------------------------------------------------
# Document schemas (as Python dict templates)
# ---------------------------------------------------------------------------

DOCUMENT_SCHEMAS: dict[str, dict] = {
    "products": {
        "id": "",           # str: unique slug
        "name": "",          # str: display name
        "description": "",   # str: markdown description
        "price": 0.0,        # float: price in USD
        "category": "",      # str: entry | core | premium
        "gumroad_url": "",   # str: checkout link
        "features": [],      # list[str]: feature list
        "tags": [],          # list[str]: search tags
        "status": "draft",   # str: draft | live | archived
    },
    "leadmagnets": {
        "id": "",
        "name": "",
        "description": "",
        "content_type": "",  # str: ebook | checklist | template | guide
        "delivery_method": "",  # str: email | download | web
        "funnel_stage": "",  # str: top | middle | bottom
        "tags": [],
        "status": "draft",
    },
    "prompts": {
        "id": "",
        "name": "",
        "purpose": "",       # str: what this prompt is for
        "system_prompt": "",
        "user_prompt": "",
        "model": "",         # str: recommended model
        "temperature": 0.7,  # float
        "tags": [],
        "version": 1,
    },
    "sops": {
        "id": "",
        "title": "",
        "category": "",      # str: operations | marketing | product | technical
        "steps": [],         # list[dict]: { order, title, description }
        "tools_required": [],
        "tags": [],
        "version": 1,
    },
    "brand_assets": {
        "id": "",
        "name": "",
        "asset_type": "",    # str: logo | color | font | guideline | template
        "url": "",           # str: storage URL
        "description": "",
        "tags": [],
    },
    "agents": {
        "id": "",
        "name": "",
        "description": "",
        "capabilities": [],  # list[str]
        "prompt_id": "",     # str: reference to prompts collection
        "config": {},        # dict: model, temperature, etc.
        "status": "active",
    },
    "content_templates": {
        "id": "",
        "name": "",
        "content_type": "",  # str: email | post | page | ad
        "platform": "",      # str: email | facebook | instagram | web
        "template": "",      # str: template with {{variables}}
        "variables": [],     # list[str]: expected variable names
        "tags": [],
    },
    "affiliate_resources": {
        "id": "",
        "name": "",
        "program": "",       # str: affiliate program name
        "url": "",           # str: affiliate link
        "commission": "",    # str: e.g. "30% recurring"
        "description": "",
        "tags": [],
        "status": "active",
    },
}