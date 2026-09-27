"""Pydantic models for the DigitallyDefined FastAPI microservice layer."""
from .affiliate import AffiliateFlipRequest, AffiliateFlipResponse
from .assetplan import AssetPlanRequest, AssetPlanResponse
from .blueprint import BlueprintRequest, BlueprintResponse
from .common import ApiError, HealthResponse
from .domain import DomainAnalyzeRequest, DomainAnalyzeResponse
from .niche import NicheScoreRequest, NicheScoreResponse
from .offerarchitect import OfferArchitectRequest, OfferArchitectResponse
from .product import ProductRequest, ProductResponse
from .rankrent import RankRentRequest, RankRentResponse
from .roadmap import RoadmapRequest, RoadmapResponse
from .trend import TrendRequest, TrendResponse
from .wealth import RevenueProjection, WealthRequest, WealthResponse

__all__ = [
    "ApiError",
    "HealthResponse",
    "ProductRequest",
    "ProductResponse",
    "NicheScoreRequest",
    "NicheScoreResponse",
    "DomainAnalyzeRequest",
    "DomainAnalyzeResponse",
    "AffiliateFlipRequest",
    "AffiliateFlipResponse",
    "RankRentRequest",
    "RankRentResponse",
    "BlueprintRequest",
    "BlueprintResponse",
    "RoadmapRequest",
    "RoadmapResponse",
    "TrendRequest",
    "TrendResponse",
    "AssetPlanRequest",
    "AssetPlanResponse",
    "OfferArchitectRequest",
    "OfferArchitectResponse",
    "WealthRequest",
    "WealthResponse",
    "RevenueProjection",
]