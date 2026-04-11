// src/coaches/vlad.jsx
// Vlad — Head Coach persona based on Vladimir Chuchelov
// Russian, philosophical, big-picture, encouraging — fluent English

import { callCoach } from '../api/gemini.js';

const VLAD_SYSTEM_PROMPT = `You are Vlad, a Russian chess coach fluent in English. Your coaching style is philosophical and big-picture — you see the entire 609-to-2000 journey as one long story, and every game is a chapter. You are deeply encouraging without being soft. You believe in the student. You speak with quiet authority, occasionally letting Russian cadence color your phrasing. You are never dark or cruel. You find meaning in mistakes. You coach the whole player, not just the moves. Keep responses to 3-5 sentences — sharp, memorable, philosophical.`;

const WEAKNESS_KEYS = {
  SPEED_TRAP:      'move9SpeedTrap',
  PANIC_SIMP:      'panicSimplification',
  PAWN_PUSH:       'pawnPushingVsQueenSorties',
  MISSED_FORCING:  'missingForcingMoves',
};

// ---------------------------------------------------------------------------
// Core coach call
// ---------------------------------------------------------------------------

export async function askVlad(vladContext, gameContext) {
  const { accuracy, blunders, mistakes, inaccuracies, totalMoves, playerSide } = vladContext ?? {};
  const { white, black, result, pgn } = gameContext ?? {};

  const userMessage = `
Game: ${white} vs ${black} — Result: ${result}
Player side: ${playerSide} | Accuracy: ${accuracy}% | Blunders: ${blunders} | Mistakes: ${mistakes} | Inaccuracies: ${inaccuracies} | Total moves: ${totalMoves}

PGN:
${pgn ?? '(not provided)'}

Give TopherBettis your post-game debrief as Vlad. Big picture first. What did this game reveal about the journey from 609 to 2000? Name the one critical moment. End with Vlad's Principle of the Day — one sentence, unforgettable.
`.trim();

  return await callCoach('vlad', VLAD_SYSTEM_PROMPT, userMessage);
}

// ---------------------------------------------------------------------------
// Extended coach functions (used by other modules)
// ---------------------------------------------------------------------------

export async function debriefGame(pgn, result, accuracy, flaggedWeaknesses = []) {
  const userMessage = `
RESULT: ${result} | ACCURACY: ${accuracy}
FLAGGED WEAKNESSES: ${flaggedWeaknesses.join(', ') || 'None'}
PGN: ${pgn}

Debrief this game. Game summary, critical moments, weakness report, what was done well, drill prescription, and Vlad's Principle of the Day.
`.trim();
  return await callCoach('vlad', VLAD_SYSTEM_PROMPT, userMessage);
}

export async function quickCheck(fen, moveContext) {
  const userMessage = `
Move ${moveContext.moveNumber} — ${moveContext.color} to move.
FEN: ${fen}
Last move: ${moveContext.lastMove}

Run the 4-Step Master Mental Loop fast: opponent intent, CCT, lazy piece, pre-move verify.
`.trim();
  return await callCoach('vlad', VLAD_SYSTEM_PROMPT, userMessage);
}

export async function buildWeeklyPlan(memoryData) {
  const userMessage = `
WEAKNESS DATA:
${JSON.stringify(memoryData, null, 2)}

Build a 7-day training plan. Morning tactics, midday study, evening game+debrief. Name the primary target weakness and success metrics.
`.trim();
  return await callCoach('vlad', VLAD_SYSTEM_PROMPT, userMessage);
}

export async function detectWeaknesses(pgn, result) {
  const userMessage = `
Analyze this PGN for TopherBettis (${result}) and identify which weaknesses appeared.
Return ONLY a JSON array with any of these keys that apply:
["move9SpeedTrap", "panicSimplification", "pawnPushingVsQueenSorties", "missingForcingMoves"]
No explanation. JSON array only.
PGN: ${pgn}
`.trim();
  const response = await callCoach('vlad', VLAD_SYSTEM_PROMPT, userMessage);
  try {
    const clean = response.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
}

export { WEAKNESS_KEYS };
