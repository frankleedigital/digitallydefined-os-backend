"""Router registry for the DigitallyDefined FastAPI microservice layer."""
from .affiliate import router as affiliate_router
from .blueprint import router as blueprint_router
from .domain import router as domain_router
from .niche import router as niche_router
from .product import router as product_router
from .rankrent import router as rankrent_router
from .roadmap import router as roadmap_router
from .trends import router as trends_router

__all__ = [
    "product_router",
    "niche_router",
    "domain_router",
    "affiliate_router",
    "rankrent_router",
    "blueprint_router",
    "roadmap_router",
    "trends_router",
]