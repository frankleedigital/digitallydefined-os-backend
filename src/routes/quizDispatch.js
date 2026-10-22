// src/routes/quizDispatch.js
// ============================================================================
// Quiz actions handled by the dispatcher: quiz / quiz.complete / agent.quiz
// ============================================================================
// The public website quiz is deterministic and client-side; the canonical
// result lives in localStorage (`dd-quiz-results`) under the shape defined in
// §2.1 of the Unified System Fix Blueprint.
//
// This handler gives the dispatcher a real implementation:
//   - persists a submitted quiz result server-side (best-effort, Supabase),
//   - returns the canonical intelligence-style quiz payload the dashboard
//     IntelligencePage expects.
// It never blocks on persistence failures.
// ===========================================================================

import { checkDashboardApiKey } from '../middleware/auth.js';
import { respond, respondError } from '../utils/respond.js';
import { isSupabaseRestConfigured, upsert, select } from '../services/supabaseRest.js';
import { processQuiz } from '../agents/quiz.js';
import { sendQuizRoadmapEmail, upsertContact } from '../services/brevo.js';
import logger from '../utils/logger.js';

const QUIZ_TABLE = 'quiz_roadmaps';

/**
 * Persist a quiz result to Supabase (best-effort, never throws).
 *
 * The `quiz_roadmaps` table columns are: id, email, name, superpower,
 * answers, roadmap, source, created_at. Each submission is a new row
 * (a customer may re-take the quiz), so the row id is generated rather than
 * upserted on a shared key.
 *
 * @param {object} quizResult
 * @param {object} opts
 */
async function persistQuizResult(quizResult, { userId = 'anonymous' } = {}) {
  if (!isSupabaseRestConfigured()) return { persisted: false, reason: 'Supabase REST not configured' };
  try {
    const row = {
      id: crypto.randomUUID(),
      email: quizResult.email || '',
      name: quizResult.name || '',
      superpower: quizResult.superpower || quizResult.personaKey || '',
      answers: quizResult.answers || {},
      roadmap: quizResult.roadmap || null,
      source: quizResult.source || 'digital-superpower-quiz',
      created_at: new Date().toISOString(),
    };
    await upsert(QUIZ_TABLE, row, 'id');
    return { persisted: true };
  } catch (err) {
    logger.warn('Quiz persistence failed', { error: err.message });
    return { persisted: false, reason: err.message };
  }
}

/**
 * Handle a quiz *submission / completion* request.
 * POST /api/quiz/submit (also reached via dispatch action: quiz / quiz.complete)
 */
export async function handleQuiz(req, res) {
  if (!checkDashboardApiKey(req)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const body = req.body || {};
    const answers = body.answers || body.inputData?.answers || {};
    const userId = body.userId || body.user_id || 'anonymous';
    const email = body.email || '';

    let personaResult = null;
    try {
      personaResult = await processQuiz({
        answers,
        mode: body.mode || 'freeMode',
        // The browser scored the persona — prefer it over the server heuristic
        // so the email matches the result page the customer just saw.
        persona: body.persona || body.superpower || '',
      });
    } catch (err) {
      logger.warn('Quiz agent failed; using answers only', { error: err.message });
    }

    const payload = {
      ...(personaResult || {}),
      answers,
      superpower: personaResult?.superpower || body.persona || body.superpower || '',
      userId,
      email,
      name: body.name || '',
      source: body.source || 'digital-superpower-quiz',
    };

    // Roadmap in the shape the `quiz_roadmaps.roadmap` column stores, with
    // CTAs that point at live destinations (digitallydefined.store is down).
    const steps = Array.isArray(personaResult?.roadmapSteps) ? personaResult.roadmapSteps : [];
    const roadmap = {
      title: `${personaResult?.superpowerName || 'Your'} Roadmap`,
      overview: personaResult?.superpowerDescription || '',
      steps,
      estimatedTime: personaResult?.estimatedTime || '30-60 days',
      nextAction: personaResult?.nextAction || '',
      cta: {
        startHere: 'https://dashboard.digitallydefined.agency/dashboard',
        scorecard: 'https://dashboard.digitallydefined.agency/dashboard',
        community: 'https://www.facebook.com/groups/digitallydefind',
        calculator: 'https://dashboard.digitallydefined.agency/thank-you-calculator',
      },
    };
    payload.roadmap = roadmap;

    const persistence = await persistQuizResult(payload, { userId });

    // List capture. Without this the quiz taker receives one email and
    // vanishes — there is no list to nurture and no way to sell to them again.
    // The persona becomes a Brevo attribute so the nurture sequence can fork
    // per pathway (see SUPERPOWER_QUIZ_MASTER_FUNNEL.md).
    let listResult = null;
    if (email) {
      listResult = await upsertContact({
        email,
        name: body.name || '',
        attributes: {
          PERSONA: payload.superpower || '',
          PERSONA_NAME: payload.superpowerName || '',
          SOURCE: body.source || 'superpower-quiz',
          QUIZ_CONFIDENCE: payload.confidenceScore ?? '',
          QUIZ_NICHE: payload.niche || '',
          HAS_ROADMAP: payload.roadmapSteps?.length ? 'yes' : 'no',
        },
      });
      logger.info('Quiz contact captured', { email, ok: listResult?.ok, persona: payload.superpower });
    }

    let emailResult = null;
    if (email && payload.roadmap) {
      emailResult = await sendQuizRoadmapEmail({
        email,
        superpower: payload.superpower,
        superpowerName: payload.superpowerName,
        superpowerDescription: payload.superpowerDescription,
        roadmapSteps: payload.roadmap.steps || [],
        estimatedTime: payload.roadmap.estimatedTime,
      });
      logger.info('Quiz roadmap email sent', { email, ok: emailResult?.ok });
    }

    return respond(res, {
      quizResult: payload,
      superpower: payload.superpower,
      superpowerName: payload.superpowerName || '',
      superpowerDescription: payload.superpowerDescription || '',
      persona: payload.persona || '',
      roadmap: payload.roadmap,
      persisted: persistence.persisted,
      listCaptured: listResult?.ok || false,
      emailSent: emailResult?.ok || false,
    }, { provider: personaResult?.provider || null, model: personaResult?.model || null });
  } catch (err) {
    logger.error('Quiz dispatch failed', { error: err.message });
    return respondError(res, err);
  }
}

/**
 * GET /api/quiz/roadmap?email=xxx — retrieve a previously saved quiz result.
 * Used by the website + dashboard to hydrate a saved roadmap.
 */
export async function handleQuizRoadmap(req, res) {
  if (!checkDashboardApiKey(req)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const email = String(req.query.email || req.body?.email || '').trim().toLowerCase();
    if (!email) return respondError(res, new Error('email is required'), { status: 400 });

    if (!isSupabaseRestConfigured()) {
      return respond(res, { found: false, reason: 'Supabase REST not configured', email });
    }

    const rows = await select(QUIZ_TABLE, `email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1`);
    const row = rows[0];
    if (!row) return respond(res, { found: false, email });

    return respond(res, { found: true, email, result: row.result, persona_key: row.persona_key });
  } catch (err) {
    logger.error('Quiz roadmap lookup failed', { error: err.message });
    return respondError(res, err);
  }
}

export default { handleQuiz, handleQuizRoadmap };