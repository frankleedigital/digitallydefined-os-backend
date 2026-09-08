"""Automation Blueprint Generator router — POST /blueprint/generate + /validate.

`/validate` returns JSON-Schema validation results for a keyword's blueprint.
"""
from fastapi import APIRouter

from ..models import BlueprintRequest, BlueprintResponse
from ..services.authority_blueprint import generate_blueprint

router = APIRouter(prefix="/blueprint", tags=["blueprint"])


@router.post("/generate", response_model=BlueprintResponse)
async def generate(req: BlueprintRequest) -> BlueprintResponse:
    return await generate_blueprint(req)


@router.post("/validate", response_model=dict)
async def validate(req: BlueprintRequest) -> dict:
    from ..services.schema_validator import validate_schema

    schema = {
        "title": f"{req.keyword} Blueprint",
        "type": "object",
        "properties": {
            "pillars": {"type": "array"},
            "components": {"type": "array"},
        },
        "required": ["pillars", "components"],
    }
    errors = validate_schema(schema)
    return {"valid": len(errors) == 0, "errors": errors}