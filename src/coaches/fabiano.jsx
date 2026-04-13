/**
 * src/coaches/fabiano.jsx
 * Fabiano — Opening & Structure Architect
 * Logic: Relentlessly logical, upbeat, energetic.
 * Focus: Italian Cage structural integrity, pawn architecture, 2000-level benchmarking.
 */

import { askCoach } from '../api/gemini.js';

const PERSONA = `You are Fabiano, the Opening and Structure Architect for the Gentleman Assassin system. You are relentlessly logical and upbeat. You focus on the structural integrity of the Italian Cage, pawn architecture, and opening preparation. You explain positional concepts as a sequence of clear, logical steps — A leads to B leads to C. You ensure the foundation is flawless so the attack can be launched later. Your player is TopherBettis, 609 ELO targeting 2000. Keep responses to 3-5 sentences — energetic, structurally precise, and logic-driven.`;

/**
 * Standard Positional & Opening Assessment
 */
export async function askFabiano(vladContext, gameContext) {
  const { accuracy, blunders, mistakes, inaccuracies, totalMoves, playerSide } = vladContext ?? {};
  const { white, black, result, pgn } = gameContext ?? {};
  
  const userMessage = `Game: ${white} vs ${black} — Result: ${result}
Player side: ${playerSide} | Accuracy: ${accuracy}% | Blunders: ${blunders} | Mistakes: ${mistakes} | Inaccuracies: ${inaccuracies} | Total moves: ${totalMoves}
PGN: ${pgn ?? '(not provided)'}

Give TopherBettis your positional and opening analysis. Was the Italian Cage executed correctly? Grade the pawn structure. Name the one move that cost the most positionally. End with one specific line to drill before the next game.`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * Opening Phase Deep Dive
 */
export async function analyzeOpening(pgn, result) {
  const userMessage = `RESULT: ${result}
PGN: ${pgn}
Opening report: was the Italian Cage/Coiled Spring followed correctly? Where did prep end? What to drill next?`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * Static Mid-Game Evaluation
 */
export async function evaluatePosition(fen, moveNumber) {
  const userMessage = `FEN: ${fen} — Move ${moveNumber}
Static eval: pawn structure, piece coordination, king safety. Top 2 candidate moves with justification. One Caruana Principle — one sentence.`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * Repertoire Counter-Intelligence
 */
export async function buildRepertoireResponse(opponentSetup) {
  const userMessage = `TopherBettis plays Italian Cage as White. Opponent played: ${opponentSetup}
Assess the threat, give the correct response in the Coiled Spring structure, and give the exact 5-10 move prep line to drill.`;

  return await askCoach(PERSONA, userMessage);
}

/**
 * 2000-ELO Benchmark Analysis
 */
export async function benchmarkVs2000(pgn, result) {
  const userMessage = `TopherBettis (609 ELO, target 2000) played this game (${result}).
PGN: ${pgn}
List the 5 most instructive deviations from 2000-level play. Format: Move N: played X, a 2000 plays Y — one sentence reason. No filler.`;

  return await askCoach(PERSONA, userMessage);
}

export default { 
  askFabiano, 
  analyzeOpening, 
  evaluatePosition, 
  buildRepertoireResponse, 
  benchmarkVs2000 
};
