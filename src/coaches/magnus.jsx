/**
 * src/coaches/magnus.jsx
 * Magnus — Endgame & Intuition Specialist
 * Logic: Understated, clinical, Danish sensibility with dry wit.
 * Focus: Conversion, pattern recognition, and the "reality check."
 */

import { askCoach } from '../api/gemini.js';

const PERSONA = `You are Magnus, the Endgame and Intuition Specialist for the Gentleman Assassin system. You provide the clinical finish and the pattern-recognition reality check. You focus on the transition to the endgame and the intuitive "feel" of a winning position. You are direct, confident, and occasionally let a dry, wry sarcasm slip through—never cruel, just understated. You see the board with bored confidence. Your player is TopherBettis, 609 ELO targeting 2000. Keep responses to 3-5 sentences — understated, intuitive, and focused on the conversion.`;

/**
 * Standard Endgame & Intuition Assessment
 */
export async function askMagnus(vladContext, gameContext) {
  const { accuracy, blunders, mistakes, inaccuracies, totalMoves, playerSide } = vladContext ?? {};
  const { white, black, result, pgn } = gameContext ?? {};
  
  const userMessage = `Game: ${white} vs ${black} — Result: ${result}
Player side: ${playerSide} | Accuracy: ${accuracy}% | Blunders: ${blunders} | Mistakes: ${mistakes} | Inaccuracies: ${inaccuracies} | Total moves: ${totalMoves}
PGN: ${pgn ?? '(not provided)'}

Give TopherBettis your endgame and intuition read. Did he convert what he should have? What pattern did he miss? End with Magnus's Reality Check — one sentence, deadpan, true.`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * Technical Endgame Debrief
 */
export async function debriefEndgame(pgn, result) {
  const userMessage = `RESULT: ${result}
PGN: ${pgn}
Endgame verdict: converted or squandered? Conversion report with grade. Two critical endgame moments with correct technique. One drill to run 20 times. Magnus's Reality Check — one sentence.`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * Live Endgame Evaluation
 */
export async function evaluateEndgame(fen, material) {
  const userMessage = `FEN: ${fen} | Material: ${material}
Won, drawn, or lost? The plan in 5 steps max. The specific technique that applies. The single best move right now.`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * Intuition Training & Pattern Mapping
 */
export async function buildIntuitionPattern(position, context) {
  const userMessage = `Position type: ${context} | FEN: ${position}
Core pattern to recognize instantly. Visual trigger. When you see X, play Y. Three similar positions where this pattern applies.`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * The Honest Reality Check
 */
export async function realityCheck(pgn, result, accuracy) {
  const userMessage = `Result: ${result} | Accuracy: ${accuracy}
PGN: ${pgn}
What actually happened — one honest paragraph. The one thing to fix. Magnus's Verdict — one sentence.`;

  return await askCoach(PERSONA, userMessage);
}

export default { 
  askMagnus, 
  debriefEndgame, 
  evaluateEndgame, 
  buildIntuitionPattern, 
  realityCheck 
};
