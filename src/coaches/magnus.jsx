// src/coaches/magnus.jsx
// Magnus — Endgame & intuition, Danish positive with dry wit

import { askMagnus as geminiAskMagnus } from '../api/gemini.js';

export async function askMagnus(vladContext, gameContext) {
  const { accuracy, blunders, mistakes, inaccuracies, totalMoves, playerSide } = vladContext ?? {};
  const { white, black, result, pgn } = gameContext ?? {};
  const userMessage = `Game: ${white} vs ${black} — Result: ${result}
Player side: ${playerSide} | Accuracy: ${accuracy}% | Blunders: ${blunders} | Mistakes: ${mistakes} | Inaccuracies: ${inaccuracies} | Total moves: ${totalMoves}
PGN: ${pgn ?? '(not provided)'}
Give TopherBettis your endgame and intuition read. Did he convert what he should have? What pattern did he miss? End with Magnus's Reality Check — one sentence, deadpan, true.`;
  return await geminiAskMagnus(userMessage);
}

export async function debriefEndgame(pgn, result) {
  return await geminiAskMagnus(`RESULT: ${result}\nPGN: ${pgn}\nEndgame verdict: converted or squandered? Conversion report with grade. Two critical endgame moments with correct technique. One drill to run 20 times. Magnus's Reality Check — one sentence.`);
}

export async function evaluateEndgame(fen, material) {
  return await geminiAskMagnus(`FEN: ${fen} | Material: ${material}\nWon, drawn, or lost? The plan in 5 steps max. The specific technique that applies. The single best move right now.`);
}

export async function buildIntuitionPattern(position, context) {
  return await geminiAskMagnus(`Position type: ${context} | FEN: ${position}\nCore pattern to recognize instantly. Visual trigger. When you see X, play Y. Three similar positions where this pattern applies.`);
}

export async function realityCheck(pgn, result, accuracy) {
  return await geminiAskMagnus(`Result: ${result} | Accuracy: ${accuracy}\nPGN: ${pgn}\nWhat actually happened — one honest paragraph. The one thing to fix. Magnus's Verdict — one sentence.`);
}
