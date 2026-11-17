from .utils import fetch_trends, save_trend


class AuthorityBlueprintAgent:
    """Authority Blueprint Agent with DigitallyDefined brand tone + trend-awareness."""

    def __init__(self):
        pass

    def generate_blueprint(self, keyword: str, **kwargs):
        """
        Generate authority blueprint with:
        - trend insights
        - niche insights
        - emotional signals
        - DigitallyDefined brand structure
        """

        # Fetch trend data
        trends_data = fetch_trends(keyword)

        # Store trend data automatically (safe)
        storage_result = save_trend(trends_data)

        # Analyze trends
        trend_insights = self._analyze_trends(trends_data)

        # Build base blueprint
        blueprint = self._create_base_blueprint(keyword, **kwargs)

        # Add trend narrative
        blueprint["trend_insights"] = trend_insights
        blueprint["trend_narrative"] = self._build_trend_narrative(trend_insights, keyword)

        # Add storage status
        blueprint["trend_storage_status"] = storage_result

        return blueprint

    # ---------------------------------------------------------------------
    # Trend Analysis
    # ---------------------------------------------------------------------
    def _analyze_trends(self, trends_data):
        """Extract structured insights from trend data."""
        if isinstance(trends_data, dict) and "error" in trends_data:
            return {"error": trends_data["error"]}

        return {
            "interest_over_time": trends_data.get("interest_over_time", []),
            "interest_by_region": trends_data.get("interest_by_region", []),
            "related_queries": trends_data.get("related_queries", {}),
            "related_topics": trends_data.get("related_topics", {}),
        }

    def _build_trend_narrative(self, insights, keyword):
        """Turn raw trend data into a narrative the user can act on."""
        if "error" in insights:
            return f"No trend data available for '{keyword}'. Blueprint generated without trend insights."

        narrative = []

        # Interest over time
        if insights["interest_over_time"]:
            narrative.append(
                f"Search interest for '{keyword}' shows consistent activity over time, indicating stable demand."
            )

        # Regions
        if insights["interest_by_region"]:
            top_regions = insights["interest_by_region"][:3]
            regions_list = ", ".join([r.get("region", "") for r in top_regions])
            narrative.append(
                f"Top regions showing interest include: {regions_list}. Consider geo-targeted content or offers."
            )

        # Related queries
        if insights["related_queries"]:
            rq = insights["related_queries"]
            top_queries = rq.get("top", [])[:3]
            if top_queries:
                q_list = ", ".join([q.get("query", "") for q in top_queries])
                narrative.append(
                    f"Related queries suggest strong interest in: {q_list}. These can become content pillars."
                )

        # Related topics
        if insights["related_topics"]:
            rt = insights["related_topics"]
            top_topics = rt.get("top", [])[:3]
            if top_topics:
                t_list = ", ".join([t.get("topic", "") for t in top_topics])
                narrative.append(
                    f"Related topics indicate emerging angles such as: {t_list}. These can shape authority positioning."
                )

        return " ".join(narrative) if narrative else f"No strong trend signals detected for '{keyword}'."

    # ---------------------------------------------------------------------
    # Blueprint Structure
    # ---------------------------------------------------------------------
    def _create_base_blueprint(self, keyword: str, **kwargs):
        """DigitallyDefined authority blueprint structure."""
        return {
            "keyword": keyword,
            "blueprint_type": "authority",
            "pillars": [
                {"pillar": "Identity", "status": "planned"},
                {"pillar": "Authority", "status": "planned"},
                {"pillar": "Assets", "status": "planned"},
                {"pillar": "Audience", "status": "planned"},
                {"pillar": "Automation", "status": "planned"},
            ],
            "components": [
                {"type": "lead_magnet", "status": "planned"},
                {"type": "core_offer", "status": "planned"},
                {"type": "authority_bundle", "status": "planned"},
                {"type": "community", "status": "planned"},
                {"type": "recurring_revenue", "status": "planned"},
            ],
            "brand_tone": "DigitallyDefined — faceless, warm, premium, structured, Gen‑X female aligned.",
            **kwargs,
        }
