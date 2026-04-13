/**
 * src/coaches/hikaru.jsx
 * Hikaru — Middle Game Expert & Tactical Authority
 * Logic: Fast, sharp, and relentlessly tactical.
 * Focus: 5 Assassin Weapons, concrete calculation, and forcing moves.
 */

import { askCoach } from '../api/gemini.js';

const PERSONA = `You are Hikaru, the Middle Game Expert and tactical authority for the Gentleman Assassin system. You are the master of the 5 Assassin Weapons and concrete middle-game execution. You are fast, sharp, and relentlessly tactical. You get excited about attacking patterns and forcing moves that others miss. You don't care about the philosophy — you care about the win. You focus on move-by-move calculation and aggressive transitions. Your job is to sharpen TopherBettis into a technical killer once the opening is set. Keep responses to 3-5 sentences — fast, technical, and aggressively direct.`;

/**
 * Standard Middlegame & Tactical Read
 */
export async function askHikaru(vladContext, gameContext) {
  const { accuracy, blunders, mistakes, inaccuracies, totalMoves, playerSide } = vladContext ?? {};
  const { white, black, result, pgn } = gameContext ?? {};
  
  const userMessage = `Game: ${white} vs ${black} — Result: ${result}
Player side: ${playerSide} | Accuracy: ${accuracy}% | Blunders: ${blunders} | Mistakes: ${mistakes} | Inaccuracies: ${inaccuracies} | Total moves: ${totalMoves}
PGN: ${pgn ?? '(not provided)'}

Give TopherBettis your middlegame and tactical read. Were the 5 Assassin weapons deployed correctly? What forcing move or tactical pattern was missed? End with Hikaru's Tactical Verdict — one sentence, fast and direct.`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * Real-time Tactical Calculation
 */
export async function analyzeTactics(fen, context) {
  const userMessage = `FEN: ${fen}
Context: ${context}
What is the best tactical continuation? Calculate the forcing line. Give the first move immediately, then explain in 2 sentences.`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * Middlegame Strategic Strike Plan
 */
export async function middlegamePlan(gameContext) {
  const userMessage = `Game context: ${gameContext}
The cage is built. Evaluate: is Ng5 available? Which of the 5 weapons applies — Search and Destroy (b4), Strangler (Nf5), Toxic Bait (Bg5+h4), High-Velocity Sacrifice (Bxh6), or Central Explosion (d4)? Give the exact move sequence to start the attack.`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * Post-Drill Analysis
 */
export async function tacticDrill(position, solution) {
  const userMessage = `Position: ${position}
Solution was: ${solution}
Explain why this is the right move, what pattern it follows, and what to look for next time. Keep it fast — 2 sentences max.`;

  return await askCoach(PERSONA, userMessage);
}

export default { 
  askHikaru, 
  analyzeTactics, 
  middlegamePlan, 
  tacticDrill 
};
