// src/agents/notionArchitect.js — Notion OS Architect Agent
// Purpose: Acts as a Notion Product Architect for DigitallyDefined.
// Designs, builds, audits, optimizes, documents, and maintains premium Notion-based
// digital products and workspaces aligned with the ecosystem's mission and brand standards.

import { parseJsonReply } from '../services/ai.js';
import { aiRouter } from '../services/aiRouter.js';

/**
 * System prompt embodying the complete Notion OS Architect framework.
 */
export const ARCHITECT_SYSTEM_PROMPT = `You are the lead architect for the DigitallyDefined Notion OS Architect.

Your job is NOT to build random Notion databases.
Your job is to act as a Notion Product Architect that can design, build, audit, optimize, document, and maintain complete Notion-based digital products for the DigitallyDefined ecosystem.

## Mission
The Notion OS Architect exists to help create, improve, and maintain premium Notion products that are sold, distributed, or used within the DigitallyDefined ecosystem.
Examples include: Digital Legacy Command Center, Unfiltered Balance Sheet, Reputation OS, Wealth Center, Affiliate Flipper, Future Notion-based products.

You should think like: Senior Notion Consultant, UX Designer, Digital Product Strategist, Information Architect, Automation Engineer, Product Manager — NOT just a database builder.

## Primary Responsibilities
1. AUDIT EXISTING NOTION WORKSPACES — Analyze pages, databases, relations, rollups, automations, navigation, user flows. Identify duplicate databases, unused properties, broken relations, overly complex workflows, missing onboarding, missing documentation. Deliver recommendations.
2. DESIGN NEW NOTION PRODUCTS — Given a product idea, target audience, and business goal: design dashboard structure, database architecture, navigation, user journey, views, automations, templates. Do this BEFORE creating anything.
3. CREATE NOTION TEMPLATES — Generate homepage, start-here page, dashboard navigation, databases, views, templates, documentation. Templates should feel valuable, simple, and beginner-friendly.
4. OPTIMIZE EXISTING TEMPLATES — Determine what can be removed, simplified, what users will struggle with, what improves perceived value, what improves completion rates. Prioritize clarity over complexity.
5. GENERATE PRODUCT DOCUMENTATION — Start Here sections, Quick Start Guides, What's Inside sections, user instructions, database explanations, FAQ sections.
6. BUILD 90-DAY SUCCESS FRAMEWORKS — Onboarding path, activation path, user milestones, completion checkpoints, progress tracking. The objective is user success, not database quantity.

## Design Philosophy (every recommendation must follow)
1. Simplicity first. 2. Beginner friendly. 3. Clear onboarding. 4. Clear navigation. 5. High perceived value. 6. Action-oriented. 7. Minimize clicks. 8. Remove unnecessary databases. 9. Optimize for completion. 10. Optimize for customer outcomes.
Never recommend adding databases simply because they can be added.

## DigitallyDefined Standards
Target audience: Gen X women, entrepreneurs, creators, business owners, beginners to intermediate tech users.
Brand promise: Turn experience into digital real estate, increase autonomy, build assets, protect assets, leverage AI, close the retirement gap.
All recommendations must align with these goals.

## Workflow (always follow for any request)
STEP 1: Audit current state. STEP 2: Identify problems. STEP 3: Propose improvements. STEP 4: Present blueprint. STEP 5: Await approval if structural changes are significant. STEP 6: Build. STEP 7: Verify. STEP 8: Document.

## Special Instruction
If asked to create a dashboard: do NOT start by creating databases. Start by defining user outcome, user journey, dashboard architecture, navigation structure, required databases, and required automations. Then build only what is necessary.
Success is measured by user adoption, clarity, simplicity, completion rate, and business value.

## Output format
Return ONLY a JSON object with these keys:
{
  "workflowSteps": ["Audit current state", "Identify problems", "Propose improvements", "Present blueprint", "Build", "Verify", "Document"],
  "auditFindings": ["..."],
  "problems": ["..."],
  "blueprint": {
    "userOutcome": "...",
    "userJourney": ["..."],
    "dashboardArchitecture": "...",
    "navigationStructure": ["..."],
    "requiredDatabases": [ { "name": "...", "purpose": "...", "keyProperties": ["..."] } ],
    "automations": ["..."],
    "templates": ["..."],
    "onboardingPath": ["..."],
    "ninetyDayMilestones": [ { "day": "30", "milestone": "...", "completionCheckpoint": "..." } ]
  },
  "documentation": { "startHere": "...", "quickStart": ["..."], "faq": ["..."] },
  "awaitingApproval": false,
  "notes": "..."
}`;

/**
 * Generates a Notion OS Architect response based on the provided request.
 * 
 * @param {object} params - The input parameters.
 * @param {string} [params.goal] - A high-level goal (e.g., "Build a Wealth Center").
 * @param {string} [params.action] - Specific action: 'audit', 'design', 'create', 'optimize', 'document'.
 * @param {string} [params.currentWorkspace] - Optional context about existing structure.
 * @returns {Promise<object>} Structured output of the architectural work.
 */
export async function notionArchitect(params = {}) {
  const goal = String(params.goal || '').trim();
  const action = String(params.action || 'design').trim().toLowerCase();
  const currentContext = String(params.currentWorkspace || '').trim();

  let taskPrompt = '';

  switch (action) {
    case 'audit':
      taskPrompt = `AUDIT TASK: Analyze the following workspace structure and provide recommendations for optimization.\n\nCurrent Context:\n${currentContext || goal}\n\nIdentify: duplicate databases, unused properties, broken relations, overly complex workflows, missing onboarding, missing documentation. Follow the 8-step workflow.`;
      break;
    case 'optimize':
      taskPrompt = `OPTIMIZE TASK: Goal "${goal}". Review and suggest simplifications. Focus on: what can be removed, what can be simplified, where users will struggle, what improves perceived value, what improves completion rates. Prioritize clarity over complexity.`;
      break;
    case 'document':
      taskPrompt = `DOCUMENTATION TASK: For the product/workspace described as "${goal}", generate Start Here sections, Quick Start Guides, What's Inside sections, database explanations, and FAQ sections.`;
      break;
    case 'success-framework':
      taskPrompt = `90-DAY SUCCESS FRAMEWORK: For "${goal}", create the onboarding path, activation path, user milestones, completion checkpoints, and progress tracking. The objective is user success, not database quantity.`;
      break;
    case 'design':
    default:
      taskPrompt = `DESIGN TASK: Design a new Notion product/workspace based on this goal: "${goal}"${currentContext ? `\n\nExisting context:\n${currentContext}` : ''}\n\nDefine: user outcome, user journey, dashboard architecture, navigation structure, required databases, required automations, templates, onboarding path, and 90-day milestones. Then build only what is necessary.`;
  }

  try {
    const result = await aiRouter.generate(null, taskPrompt, {
      mode: 'freeMode',
      systemPrompt: ARCHITECT_SYSTEM_PROMPT,
      jsonMode: true,
    });

    const rawReply = typeof result.reply === 'string' ? result.reply : (result.reply ? JSON.stringify(result.reply) : '');

    // Honest success flag: only true when the AI actually produced content.
    // When the provider chain is exhausted, fall back to the deterministic
    // architect blueprint so the dashboard never dead-ends.
    if (!rawReply || rawReply.trim().length < 20) {
      return {
        success: false,
        goal,
        action,
        provider: result.provider || null,
        model: result.model || null,
        error: 'AI provider unavailable — returning deterministic blueprint fallback.',
        output: buildFallbackBlueprint(goal, action),
        timestamp: Date.now(),
      };
    }

    let parsedOutput = null;
    try {
      parsedOutput = parseJsonReply(rawReply);
    } catch (e) {
      parsedOutput = { rawResponse: rawReply };
    }

    return {
      success: true,
      goal,
      action,
      provider: result.provider || null,
      model: result.model || null,
      output: parsedOutput,
      timestamp: Date.now(),
    };
  } catch (error) {
    // Deterministic fallback so the dashboard never dead-ends
    return {
      success: false,
      goal,
      action,
      error: error.message,
      output: buildFallbackBlueprint(goal, action),
      timestamp: Date.now(),
    };
  }
}

/** Deterministic architect outline used when no AI provider is reachable. */
function buildFallbackBlueprint(goal, action) {
  return {
    awaitingApproval: true,
    notes: `AI provider unavailable (action: ${action}). Blueprint outline only — the architect principles still apply: define user outcome → journey → architecture → databases → automations.`,
    workflowSteps: ['Audit current state', 'Identify problems', 'Propose improvements', 'Present blueprint', 'Await approval', 'Build', 'Verify', 'Document'],
    blueprint: {
      userOutcome: goal || 'Unspecified',
      userJourney: ['Onboard via Start Here', 'Activate core workflow', 'Complete first milestone', 'Track 90-day progress'],
      dashboardArchitecture: 'Single hub page with clear navigation; one database per user job-to-be-done',
      navigationStructure: ['Start Here', 'Dashboard', 'Databases', 'Resources'],
      requiredDatabases: [],
      automations: [],
      templates: ['Start Here page', 'Quick Start guide'],
      onboardingPath: ['Welcome + what this product does', 'First meaningful action in under 5 minutes', 'Checkpoint at day 7'],
      ninetyDayMilestones: [
        { day: '30', milestone: 'Core workflow completed once', completionCheckpoint: 'First entry created' },
        { day: '60', milestone: 'Habit formed, weekly check-in', completionCheckpoint: '5+ sessions logged' },
        { day: '90', milestone: 'User can run the system independently', completionCheckpoint: 'Self-sufficiency review' },
      ],
    },
  };
}

export default { notionArchitect, ARCHITECT_SYSTEM_PROMPT };
