from .utils import fetch_trends, save_trend


class ProductGeneratorAgent:
    """DigitallyDefined Product Generator Agent with trend-awareness + brand tone."""

    def __init__(self):
        pass

    def generate_product(self, keyword: str, **kwargs):
        """
        Generate a product concept with:
        - trend insights
        - niche insights
        - emotional signals
        - DigitallyDefined brand structure
        """

        # Fetch trend data
        trends_data = fetch_trends(keyword)

        # Store trend data automatically
        storage_result = save_trend(trends_data)

        # Analyze trends
        trend_insights = self._analyze_trends(trends_data)

        # Build base product
        product = self._create_base_product(keyword, **kwargs)

        # Add trend narrative
        product["trend_insights"] = trend_insights
        product["trend_narrative"] = self._build_trend_narrative(trend_insights, keyword)

        # Add storage status
        product["trend_storage_status"] = storage_result

        return product

    # ---------------------------------------------------------------------
    # Trend Analysis
    # ---------------------------------------------------------------------
    def _analyze_trends(self, trends_data):
        """Extract structured insights for product generation."""
        if isinstance(trends_data, dict) and "error" in trends_data:
            return {"error": trends_data["error"]}

        insights = {
            "search_volume_trend": "stable",
            "peak_periods": [],
            "regional_interest": [],
            "related_keywords": [],
        }

        if isinstance(trends_data, dict):
            # Interest over time
            interest_over_time = trends_data.get("interest_over_time", [])
            if interest_over_time:
                insights["search_volume_trend"] = self._determine_trend_direction(interest_over_time)
                insights["peak_periods"] = self._find_peak_periods(interest_over_time)

            # Regions
            interest_by_region = trends_data.get("interest_by_region", [])
            if interest_by_region:
                insights["regional_interest"] = interest_by_region[:5]

            # Related queries
            related_queries = trends_data.get("related_queries", {})
            if isinstance(related_queries, dict):
                top_queries = related_queries.get("top", [])
                if isinstance(top_queries, list):
                    insights["related_keywords"] = [q.get("query", "") for q in top_queries[:5]]

        return insights

    def _determine_trend_direction(self, interest_data):
        """Determine if search volume is increasing, decreasing, or stable."""
        if not interest_data or len(interest_data) < 2:
            return "stable"

        values = [point.get("value", 0) for point in interest_data]
        start_val, end_val = values[0], values[-1]

        if end_val > start_val * 1.2:
            return "increasing"
        elif end_val < start_val * 0.8:
            return "decreasing"
        return "stable"

    def _find_peak_periods(self, interest_data):
        """Find periods with highest search interest."""
        if not interest_data:
            return []
        return sorted(interest_data, key=lambda x: x.get("value", 0), reverse=True)[:3]

    def _build_trend_narrative(self, insights, keyword):
        """Turn raw trend data into a narrative the user can act on."""
        if "error" in insights:
            return f"No trend data available for '{keyword}'. Product generated without trend insights."

        narrative = []

        # Trend direction
        trend_dir = insights.get("search_volume_trend", "stable")
        narrative.append(f"Search volume for '{keyword}' is currently {trend_dir}.")

        # Peak periods
        peaks = insights.get("peak_periods", [])
        if peaks:
            narrative.append("Peak interest periods indicate strong seasonal or event-driven demand.")

        # Regions
        regions = insights.get("regional_interest", [])
        if regions:
            top_regions = ", ".join([r.get("region", "") for r in regions])
            narrative.append(f"Top regions showing interest: {top_regions}.")

        # Related keywords
        related = insights.get("related_keywords", [])
        if related:
            narrative.append(f"Related keywords suggest strong adjacent demand: {', '.join(related)}.")

        return " ".join(narrative)

    # ---------------------------------------------------------------------
    # Product Structure
    # ---------------------------------------------------------------------
    def _create_base_product(self, keyword: str, **kwargs):
        """DigitallyDefined product structure."""
        return {
            "keyword": keyword,
            "product_type": "digital",
            "status": "concept",
            "brand_tone": "DigitallyDefined — faceless, warm, premium, structured, Gen‑X female aligned.",
            "archetypes": [
                "calculator",
                "template",
                "micro-saas",
                "faceless landing page",
                "authority bundle",
                "digital kit",
                "dashboard module",
            ],
            "market_fit": "high",
            "features": [],
            **kwargs,
        }
