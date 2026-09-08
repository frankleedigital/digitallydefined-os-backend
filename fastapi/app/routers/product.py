"""Digital Product Generator router — POST /product-generator/generate."""
from fastapi import APIRouter

from ..models import ProductRequest, ProductResponse
from ..services.product_generator import generate_product

router = APIRouter(prefix="/product-generator", tags=["product"])


@router.post("/generate", response_model=ProductResponse)
async def generate(req: ProductRequest) -> ProductResponse:
    return await generate_product(req)