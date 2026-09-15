// src/lib/quiz/scoring.js — pure scoring logic (mirrored server-side in the edge function)
import { QUESTIONS, PERSONA_VALUES } from './questions.js';

/** Validate that every question has an answer within the persona set. */
export function isQuizComplete(answers = {}) {
  return QUESTIONS.every((q) => PERSONA_VALUES.includes(answers[q.key]));
}

/**
 * Score answers by persona frequency.
 * @returns {{ persona: string, confidence: number, counts: Record<string,number> }}
 */
export function scoreQuiz(answers = {}) {
  const counts = {};
  for (const value of Object.values(answers)) {
    if (!value) continue;
    counts[value] = (counts[value] || 0) + 1;
  }

  let persona = 'builder';
  let topCount = 0;
  for (const [key, count] of Object.entries(counts)) {
    if (count > topCount) { topCount = count; persona = key; }
  }

  const answered = QUESTIONS.filter((q) => answers[q.key]).length;
  const confidence = answered > 0 ? Math.round((topCount / answered) * 100) / 100 : 0.5;
  return { persona, confidence, counts };
}
