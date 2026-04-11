// src/coaches/fabiano.jsx
// Fabiano — Positional analysis, Italian upbeat logical persona

import { askFabiano as geminiAskFabiano } from '../api/gemini.js';

export async function askFabiano(vladContext, gameContext) {
  const { accuracy, blunders, mistakes, inaccuracies, totalMoves, playerSide } = vladContext ?? {};
  const { white, black, result, pgn } = gameContext ?? {};
  const userMessage = `Game: ${white} vs ${black} — Result: ${result}
Player side: ${playerSide} | Accuracy: ${accuracy}% | Blunders: ${blunders} | Mistakes: ${mistakes} | Inaccuracies: ${inaccuracies} | Total moves: ${totalMoves}
PGN: ${pgn ?? '(not provided)'}
Give TopherBettis your positional and opening analysis. Was the Italian Cage executed correctly? Grade the pawn structure. Name the one move that cost the most positionally. End with one specific line to drill before the next game.`;
  return await geminiAskFabiano(userMessage);
}

export async function analyzeOpening(pgn, result) {
  return await geminiAskFabiano(`RESULT: ${result}\nPGN: ${pgn}\nOpening report: was the Italian Cage/Coiled Spring followed correctly? Where did prep end? What to drill next?`);
}

export async function evaluatePosition(fen, moveNumber) {
  return await geminiAskFabiano(`FEN: ${fen} — Move ${moveNumber}\nStatic eval: pawn structure, piece coordination, king safety. Top 2 candidate moves with justification. One Caruana Principle — one sentence.`);
}

export async function buildRepertoireResponse(opponentSetup) {
  return await geminiAskFabiano(`TopherBettis plays Italian Cage as White. Opponent played: ${opponentSetup}\nAssess the threat, give the correct response in the Coiled Spring structure, and give the exact 5-10 move prep line to drill.`);
}

export async function benchmarkVs2000(pgn, result) {
  return await geminiAskFabiano(`TopherBettis (609 ELO, target 2000) played this game (${result}).\nPGN: ${pgn}\nList the 5 most instructive deviations from 2000-level play. Format: Move N: played X, a 2000 plays Y — one sentence reason. No filler.`);
}
