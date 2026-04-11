// src/coaches/vlad.jsx
// Vlad — Head Coach, Russian philosophical, big-picture, encouraging

import { askVlad as geminiAskVlad } from '../api/gemini.js';

export const WEAKNESS_KEYS = {
  SPEED_TRAP:     'move9SpeedTrap',
  PANIC_SIMP:     'panicSimplification',
  PAWN_PUSH:      'pawnPushingVsQueenSorties',
  MISSED_FORCING: 'missingForcingMoves',
};

export async function askVlad(vladContext, gameContext) {
  const { accuracy, blunders, mistakes, inaccuracies, totalMoves, playerSide } = vladContext ?? {};
  const { white, black, result, pgn } = gameContext ?? {};
  const userMessage = `Game: ${white} vs ${black} — Result: ${result}
Player side: ${playerSide} | Accuracy: ${accuracy}% | Blunders: ${blunders} | Mistakes: ${mistakes} | Inaccuracies: ${inaccuracies} | Total moves: ${totalMoves}
PGN: ${pgn ?? '(not provided)'}
Give TopherBettis your post-game debrief. Big picture first — what did this game reveal about the journey from 609 to 2000? Name the one critical moment. End with Vlad's Principle of the Day — one sentence, unforgettable.`;
  return await geminiAskVlad(userMessage);
}

export async function debriefGame(pgn, result, accuracy, flaggedWeaknesses = []) {
  const userMessage = `RESULT: ${result} | ACCURACY: ${accuracy}
FLAGGED WEAKNESSES: ${flaggedWeaknesses.join(', ') || 'None'}
PGN: ${pgn}
Debrief this game. Game summary, critical moments, weakness report, what was done well, drill prescription, Vlad's Principle of the Day.`;
  return await geminiAskVlad(userMessage);
}

export async function quickCheck(fen, moveContext) {
  const userMessage = `Move ${moveContext.moveNumber} — ${moveContext.color} to move.
FEN: ${fen} | Last move: ${moveContext.lastMove}
Run the 4-Step Master Mental Loop: opponent intent, CCT, lazy piece, pre-move verify.`;
  return await geminiAskVlad(userMessage);
}

export async function buildWeeklyPlan(memoryData) {
  const userMessage = `WEAKNESS DATA: ${JSON.stringify(memoryData, null, 2)}
Build a 7-day training plan. Morning tactics, midday study, evening game+debrief. Name the primary target weakness and success metrics.`;
  return await geminiAskVlad(userMessage);
}

export async function detectWeaknesses(pgn, result) {
  const userMessage = `Analyze this PGN for TopherBettis (${result}) and identify which weaknesses appeared.
Return ONLY a JSON array with any of these keys that apply:
["move9SpeedTrap", "panicSimplification", "pawnPushingVsQueenSorties", "missingForcingMoves"]
No explanation. JSON array only.
PGN: ${pgn}`;
  const response = await geminiAskVlad(userMessage);
  try {
    return JSON.parse(response.replace(/```json|```/g, '').trim());
  } catch {
    return [];
  }
}
