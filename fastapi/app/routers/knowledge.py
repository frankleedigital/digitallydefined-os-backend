"""Knowledge Base API — CRUD endpoints for Firestore collections.

Allows agents (Hermes, Cline, Claude) and the dashboard to read/write
structured knowledge from the Google Cloud Firestore Intelligence Layer.
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, HTTPException

from ..knowledge import (
    COLLECTIONS,
    DOCUMENT_SCHEMAS,
    create_document,
    delete_document,
    get_document,
    list_documents,
    query_documents,
    update_document,
)

logger = logging.getLogger("digitallydefined.fastapi.routers.knowledge")
router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("/collections")
async def get_collections():
    """List all knowledge base collections and their schemas."""
    return {
        "collections": list(COLLECTIONS.keys()),
        "schemas": {k: list(v.keys()) for k, v in DOCUMENT_SCHEMAS.items()},
    }


@router.get("/{collection}")
async def list_collection(collection: str, limit: int = 50):
    """List documents in a collection."""
    if collection not in COLLECTIONS:
        raise HTTPException(status_code=404, detail=f"Unknown collection: {collection}")
    docs = await list_documents(COLLECTIONS[collection], limit=limit)
    return {"collection": collection, "count": len(docs), "documents": docs}


@router.get("/{collection}/{doc_id}")
async def read_document(collection: str, doc_id: str):
    """Read a single document by ID."""
    if collection not in COLLECTIONS:
        raise HTTPException(status_code=404, detail=f"Unknown collection: {collection}")
    doc = await get_document(COLLECTIONS[collection], doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
    return {"collection": collection, "id": doc_id, "document": doc}


@router.post("/{collection}/{doc_id}")
async def write_document(collection: str, doc_id: str, data: dict[str, Any]):
    """Create or overwrite a document."""
    if collection not in COLLECTIONS:
        raise HTTPException(status_code=404, detail=f"Unknown collection: {collection}")
    result = await create_document(COLLECTIONS[collection], doc_id, data)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create document")
    return {"collection": collection, "id": doc_id, "status": "created"}


@router.patch("/{collection}/{doc_id}")
async def patch_document(collection: str, doc_id: str, data: dict[str, Any]):
    """Update specific fields of a document."""
    if collection not in COLLECTIONS:
        raise HTTPException(status_code=404, detail=f"Unknown collection: {collection}")
    ok = await update_document(COLLECTIONS[collection], doc_id, data)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update document")
    return {"collection": collection, "id": doc_id, "status": "updated"}


@router.delete("/{collection}/{doc_id}")
async def remove_document(collection: str, doc_id: str):
    """Delete a document."""
    if collection not in COLLECTIONS:
        raise HTTPException(status_code=404, detail=f"Unknown collection: {collection}")
    ok = await delete_document(COLLECTIONS[collection], doc_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to delete document")
    return {"collection": collection, "id": doc_id, "status": "deleted"}


@router.get("/{collection}/query")
async def search_documents(
    collection: str,
    field: str,
    operator: str = "==",
    value: str = "",
    limit: int = 50,
):
    """Query documents by field value."""
    if collection not in COLLECTIONS:
        raise HTTPException(status_code=404, detail=f"Unknown collection: {collection}")
    docs = await query_documents(COLLECTIONS[collection], field, operator, value, limit=limit)
    return {"collection": collection, "count": len(docs), "documents": docs}