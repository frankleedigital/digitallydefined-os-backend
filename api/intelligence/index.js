import { runIntelligencePipeline } from "../../lib/agentOrchestrator.js";
import { supabase } from "../../lib/supabaseClient.js";

// Allowed origins for the dashboard & local development.
const ALLOWED_ORIGINS = [
  "https://dashboard.digitallydefined.agency",
  "https://digitallydefined.online",
  "https://www.digitallydefined.online",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
];

function resolveCorsOrigin(req) {
  const origin = req.headers && req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  return "https://dashboard.digitallydefined.agency";
}

export default async function handler(req, res) {
  const corsOrigin = resolveCorsOrigin(req);
  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key, apikey, x-user-id"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Body is already parsed by Vercel when Content-Type is application/json.
  const { answers, userId } = req.body || {};

  if (!answers) {
    return res.status(400).json({
      success: false,
      error: "Missing quiz answers",
    });
  }

  try {
    // Run full intelligence pipeline
    const intelligence = await runIntelligencePipeline(answers);

    // Guarded inserts: a missing table never aborts the response.
    const guardInsert = async (table, payload) => {
      try {
        await supabase.from(table).insert(payload);
      } catch (e) {
        console.warn(
          `[intelligence] Skipped store to "${table}":`,
          e?.message || e
        );
      }
    };

    // Store superpower profile
    await guardInsert("superpower_profiles", {
      user_id: userId,
      superpower_name: intelligence.superpowerName,
      persona: intelligence.persona,
      strengths: intelligence.strengths,
      blindspots: intelligence.blindspots,
      business_model: intelligence.businessModel,
      recommended_pathways: intelligence.recommendedPathways,
      confidence_score: intelligence.confidenceScore,
      data: intelligence,
    });

    // Store quiz results (legacy shape)
    await guardInsert("quiz_results", {
      user_id: userId,
      answers,
      superpower: intelligence.superpower,
      persona: intelligence.persona,
      strengths: intelligence.strengths,
      blindspots: intelligence.blindspots,
      business_model: intelligence.businessModel,
    });

    // Store roadmap
    await guardInsert("quiz_roadmaps", {
      user_id: userId,
      roadmap: intelligence.roadmap,
    });

    // Store intelligence aggregate
    await guardInsert("intelligence_results", {
      user_id: userId,
      data: intelligence,
    });

    // Store niche scoring
    if (intelligence.profitabilityScore != null) {
      await guardInsert("niche_scores", {
        user_id: userId,
        profitability_score: intelligence.profitabilityScore,
        competition_level: intelligence.competitionLevel,
        trend_strength: intelligence.trendStrength,
        niche_viability: intelligence.nicheViability,
        data: intelligence,
      });
    }

    // Store trends
    await guardInsert("trends", {
      user_id: userId,
      data: intelligence.trends,
    });

    // Store competition
    await guardInsert("competition", {
      user_id: userId,
      data: intelligence.competition,
    });

    // Store opportunities
    await guardInsert("opportunities", {
      user_id: userId,
      data: intelligence.opportunities,
    });

    // Store audience insights
    await guardInsert("audience_insights", {
      user_id: userId,
      data: intelligence.audience,
    });

    res.status(200).json({
      success: true,
      data: intelligence,
    });
  } catch (err) {
    console.error("Intelligence API Error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to generate intelligence package",
    });
  }
}
