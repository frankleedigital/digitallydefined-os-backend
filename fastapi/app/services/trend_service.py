# app/services/trend_service.py
"""Google Trends service — port of the orphaned
`digitallydefined-os-backend/scripts/trends_api.py` and archived
`docs/hermes-mcp-archive/hermes/tools/trends.py`.

Returns empty payloads gracefully when pytrends is unavailable so the route
never fails.
"""
import logging
import time

from ..models import TrendRequest, TrendResponse

logger = logging.getLogger("digitallydefined.fastapi.trend_service")

DEFAULT_GEO = "US"
DEFAULT_TIMEFRAME = "today 5-y"


async def fetch_trends(req: TrendRequest) -> TrendResponse:
    """Fetch Google Trends data for a keyword. Provider = 'pytrends' when live."""
    interest_ot: dict = {}
    region: dict = {}
    queries: list = []
    topics: list = []

    try:
        from pytrends.request import TrendReq
    except Exception as exc:  # noqa: BLE001
        logger.warning("pytrends not installed; returning empty trend payload: %s", exc)
        return TrendResponse(keyword=req.keyword, geo=req.geo, timeframe=req.timeframe)

    try:
        pytrend = TrendReq(
            hl="en-US",
            tz=360,
            retries=3,
            backoff_factor=0.1,
            requests_args={"headers": {"User-Agent": "Mozilla/5.0"}},
        )
        for _ in range(3):
            try:
                pytrend.build_payload([req.keyword], geo=req.geo, timeframe=req.timeframe)
                break
            except Exception:  # noqa: BLE001
                time.sleep(2)

        try:
            df = pytrend.interest_over_time()
            interest_ot = df.to_dict() if df is not None else {}
        except Exception as exc:  # noqa: BLE001
            logger.warning("interest_over_time failed: %s", exc)

        try:
            df = pytrend.interest_by_region()
            region = df.to_dict() if df is not None else {}
        except Exception as exc:  # noqa: BLE001
            logger.warning("interest_by_region failed: %s", exc)

        try:
            rq_data = pytrend.related_queries()
            related = rq_data.get(req.keyword, {}).get("top", [])
            if hasattr(related, "to_dict"):
                topics = related.to_dict("records")
        except Exception as exc:  # noqa: BLE001
            logger.warning("related_queries failed: %s", exc)
    except Exception as exc:  # noqa: BLE001
        logger.warning("pytrends request failed: %s", exc)

    return TrendResponse(
        keyword=req.keyword,
        geo=req.geo,
        timeframe=req.timeframe,
        interest_over_time=interest_ot,
        interest_by_region=region,
        related_queries=queries,
        related_topics=topics,
        provider="pytrends",
    )