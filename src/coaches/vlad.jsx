/**
 * src/coaches/vlad.jsx
 * Vlad — Head Coach & Principle Authority
 * * Logic: Philosophical, big-picture, military/combat sports analogies.
 * Focus: Foundational principles and the 4-Step Master Mental Loop.
 */

import { askCoach } from '../api/gemini.js';

const PERSONA = `You are Vlad, the Head Coach of the Gentleman Assassin system. You are the Commander. Your focus is strictly on foundational principles and the 4-Step Master Mental Loop (Opponent Intent, CCT, Lazy Piece, Pre-move Verify). Every game is a tactical operation; every mistake is a breach of discipline. You speak with philosophical weight and use military or combat sports analogies. You are deeply encouraging but demand total adherence to the "Cage" philosophy. Your goal is to ensure TopherBettis has the mental fortitude for the 609-to-2000 campaign. Keep responses to 3-5 sentences — principled, authoritative, and strategic.`;

export const WEAKNESS_KEYS = {
  SPEED_TRAP:     'move9SpeedTrap',
  PANIC_SIMP:     'panicSimplification',
  PAWN_PUSH:      'pawnPushingVsQueenSorties',
  MISSED_FORCING: 'missingForcingMoves',
};

/**
 * Standard Post-Game Debrief
 * High-level assessment of the 609-to-2000 campaign.
 */
export async function askVlad(vladContext, gameContext) {
  const { accuracy, blunders, mistakes, inaccuracies, totalMoves, playerSide } = vladContext ?? {};
  const { white, black, result, pgn } = gameContext ?? {};
  
  const userMessage = `Game: ${white} vs ${black} — Result: ${result}
Player side: ${playerSide} | Accuracy: ${accuracy}% | Blunders: ${blunders} | Mistakes: ${mistakes} | Inaccuracies: ${inaccuracies} | Total moves: ${totalMoves}
PGN: ${pgn ?? '(not provided)'}

Give TopherBettis your post-game debrief. Big picture first — what did this game reveal about the journey from 609 to 2000? Name the one critical moment where discipline failed. End with Vlad's Principle of the Day — one sentence, unforgettable.`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * Deep Analysis & Prescription
 * Detailed breakdown of weaknesses and training path.
 */
export async function debriefGame(pgn, result, accuracy, flaggedWeaknesses = []) {
  const userMessage = `RESULT: ${result} | ACCURACY: ${accuracy}
FLAGGED WEAKNESSES: ${flaggedWeaknesses.join(', ') || 'None'}
PGN: ${pgn}

Debrief this game as the Commander. Focus on the weakness report and the mental errors. Provide a drill prescription and Vlad's Principle of the Day.`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * Live Protocol Check
 * Validates the 4-Step Loop during active drills or analysis.
 */
export async function quickCheck(fen, moveContext) {
  const userMessage = `Move ${moveContext.moveNumber} — ${moveContext.color} to move.
FEN: ${fen} | Last move: ${moveContext.lastMove}

Run the 4-Step Master Mental Loop immediately: opponent intent, CCT, lazy piece, pre-move verify. Ensure no breaches of protocol.`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * Strategic Training Roadmap
 * Generates a 7-day plan based on performance data.
 */
export async function buildWeeklyPlan(memoryData) {
  const userMessage = `WEAKNESS DATA: ${JSON.stringify(memoryData, null, 2)}

Build a 7-day strategic training plan. Morning tactics, midday study, evening game+debrief. Name the primary target weakness for this operation and the success metrics.`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * Automated Weakness Detection
 * JSON pipeline for system-level logic.
 */
export async function detectWeaknesses(pgn, result) {
  const userMessage = `Analyze this PGN for TopherBettis (${result}) and identify which tactical breaches appeared.
Return ONLY a JSON array with any of these keys that apply:
["move9SpeedTrap", "panicSimplification", "pawnPushingVsQueenSorties", "missingForcingMoves"]
No explanation. JSON array only.
PGN: ${pgn}`;

  const response = await askCoach(PERSONA, userMessage);
  try {
    // Sanitize response in case the model includes markdown
    return JSON.parse(response.replace(/```json|```/g, '').trim());
  } catch {
    return [];
  }
}
