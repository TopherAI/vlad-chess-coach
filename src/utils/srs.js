/**
 * src/utils/srs.js
 * CHESSai — Spaced Repetition Scheduler for the Opening Blueprint trainer
 *
 * Leitner-style level scheduler (levels 0-8). Level 0 = never drilled.
 * A correct drill advances one level and schedules the matching interval;
 * an incorrect drill drops back to level 1. State is per-repertoire-line,
 * persisted to localStorage under `chessai_srs_${lineId}`, additive to the
 * app's own attempts/perfectSessions/belt progress system.
 */

const MS = {
  HOUR:  60 * 60 * 1000,
  DAY:   24 * 60 * 60 * 1000,
  WEEK:  7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
};

const INTERVALS_MS = {
  1: 4 * MS.HOUR,
  2: 1 * MS.DAY,
  3: 3 * MS.DAY,
  4: 1 * MS.WEEK,
  5: 2 * MS.WEEK,
  6: 1 * MS.MONTH,
  7: 3 * MS.MONTH,
  8: 6 * MS.MONTH,
};

const MAX_LEVEL = 8;
const FAIL_LEVEL = 1;

/**
 * Compute the next SRS state after a drill attempt.
 * @param {number} currentLevel  - 0-8, 0 = never drilled
 * @param {boolean} isCorrect
 * @param {number} [now] - epoch ms, injectable for tests
 * @returns {{ level: number, nextReview: string }} nextReview is an ISO timestamp
 */
export function calculateNextReview(currentLevel, isCorrect, now = Date.now()) {
  if (!isCorrect) {
    return { level: FAIL_LEVEL, nextReview: new Date(now + INTERVALS_MS[FAIL_LEVEL]).toISOString() };
  }
  const nextLevel = Math.min((currentLevel || 0) + 1, MAX_LEVEL);
  return { level: nextLevel, nextReview: new Date(now + INTERVALS_MS[nextLevel]).toISOString() };
}

/**
 * Whether a line is due for review right now.
 * Fails open to "due" on missing/corrupt timestamps — a line that can't be
 * scheduled correctly should surface for review, not silently disappear.
 * @param {string|null} nextReviewISO
 * @param {number} [now]
 * @returns {boolean}
 */
export function isDue(nextReviewISO, now = Date.now()) {
  if (!nextReviewISO) return true;
  const t = Date.parse(nextReviewISO);
  if (Number.isNaN(t)) return true;
  return t <= now;
}

const lsKey = (lineId) => `chessai_srs_${lineId}`;

/**
 * Read SRS state for a line from localStorage.
 * @param {string} lineId
 * @returns {{ level: number, nextReview: string|null }}
 */
export function getSrsState(lineId) {
  try {
    const raw = localStorage.getItem(lsKey(lineId));
    if (!raw) return { level: 0, nextReview: null };
    const parsed = JSON.parse(raw);
    if (typeof parsed.level !== "number" || Number.isNaN(parsed.level)) {
      return { level: 0, nextReview: null };
    }
    return { level: parsed.level, nextReview: parsed.nextReview ?? null };
  } catch {
    return { level: 0, nextReview: null };
  }
}

/**
 * Persist SRS state for a line to localStorage.
 * @param {string} lineId
 * @param {{ level: number, nextReview: string }} state
 * @returns {boolean} true if the write succeeded (false on quota/private-mode failure)
 */
export function setSrsState(lineId, state) {
  try {
    localStorage.setItem(lsKey(lineId), JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/**
 * Score a drill attempt and persist the resulting SRS state in one call.
 * @param {string} lineId
 * @param {boolean} isCorrect
 * @param {number} [now]
 * @returns {{ level: number, nextReview: string }}
 */
export function recordDrillResult(lineId, isCorrect, now = Date.now()) {
  const current = getSrsState(lineId);
  const next = calculateNextReview(current.level, isCorrect, now);
  setSrsState(lineId, next);
  return next;
}

export default {
  calculateNextReview,
  isDue,
  getSrsState,
  setSrsState,
  recordDrillResult,
};
