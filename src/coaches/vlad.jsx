// src/coaches/vlad.js
// Vlad — Post-game debrief engine based on Vladimir Chuchelov
// Imports callCoach from gemini.js and runs structured analysis

import { askVlad } from '../api/gemini.js';

const WEAKNESS_KEYS = {
  SPEED_TRAP: 'move9SpeedTrap',
  PANIC_SIMP: 'panicSimplification',
  PAWN_PUSH:  'pawnPushingVsQueenSorties',
  MISSED_FORCING: 'missingForcingMoves',
};

const DEBRIEF_PROMPT = (pgn, result, accuracy, flaggedWeaknesses) => `
Debrief this game for TopherBettis.
RESULT: ${result}
ACCURACY: ${accuracy}
FLAGGED WEAKNESSES THIS GAME: ${flaggedWeaknesses.join(', ') || 'None flagged'}
PGN:
${pgn}

Structure your debrief exactly like this:

## GAME SUMMARY
One paragraph. What happened? Who had the advantage and when did it shift?

## CRITICAL MOMENTS
List the 2-3 most important moments. For each: move number, what happened, what should have happened.

## WEAKNESS REPORT
Which of the 4 known weaknesses showed up today?
- Move 9 Speed Trap
- Panic Simplification
- Pawn-Pushing vs Queen Sorties
- Missing Forcing Moves When Winning

## WHAT YOU DID WELL
Be specific. Praise only what deserves praise.

## DRILL PRESCRIPTION
Exactly 3 drills for tomorrow based on what you saw today.

## VLAD'S PRINCIPLE OF THE DAY
One sentence. Unforgettable. Burn it into memory.

## GAME RATING
X/10 — one sentence explanation.
`;

const QUICK_CHECK_PROMPT = (fen, moveContext) => `
TopherBettis is at move ${moveContext.moveNumber} in a live game.
Position FEN: ${fen}
It is ${moveContext.color}'s turn.
Last move played: ${moveContext.lastMove}

Run the 4-Step Master Mental Loop:
1. OPPONENT'S INTENT — What does the opponent want? Is the queen safe?
2. CCT CHECK — What are the best Checks, Captures, and Threats available?
3. LAZY PIECE UPGRADE — What is the worst piece and can it be improved?
4. PRE-MOVE VERIFY — After the best move, can they take anything for free?

Be fast and direct. This is mid-game coaching, not a lecture.
`;

const WEEKLY_PLAN_PROMPT = (memoryData) => `
Based on this week's weakness fingerprint data, build TopherBettis's training plan for the next 7 days.

WEAKNESS DATA:
${JSON.stringify(memoryData, null, 2)}

Structure the plan:

## 7-DAY TRAINING PLAN

For each day include:
- Morning: Tactics block (30 min) — specific puzzle type
- Midday: Study block (30 min) — what to study
- Evening: Game + debrief (90 min) — focus area

## THIS WEEK'S PRIMARY TARGET
The one weakness to crush this week. Why this one. How to kill it.

## SUCCESS METRICS
How do we measure improvement by end of week?
`;

export async function debriefGame(pgn, result, accuracy, flaggedWeaknesses = []) {
  const prompt = DEBRIEF_PROMPT(pgn, result, accuracy, flaggedWeaknesses);
  return await askVlad(prompt, { pgn, result, accuracy });
}

export async function quickCheck(fen, moveContext) {
  const prompt = QUICK_CHECK_PROMPT(fen, moveContext);
  return await askVlad(prompt, {});
}

export async function buildWeeklyPlan(memoryData) {
  const prompt = WEEKLY_PLAN_PROMPT(memoryData);
  return await askVlad(prompt, {});
}

export async function detectWeaknesses(pgn, result) {
  const prompt = `
Analyze this PGN for TopherBettis (${result}) and identify which weaknesses appeared.
Return ONLY a JSON array with any of these keys that apply:
["move9SpeedTrap", "panicSimplification", "pawnPushingVsQueenSorties", "missingForcingMoves"]
No explanation. JSON array only.
PGN:
${pgn}
  `;
  const response = await askVlad(prompt, { pgn, result });
  try {
    const clean = response.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
}

export { WEAKNESS_KEYS };
export { askVlad } from '../api/gemini.js';
