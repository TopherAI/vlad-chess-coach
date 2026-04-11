// src/coaches/hikaru.jsx
// Hikaru — Middlegame & Tactics, American competitive fast tactical genius

import { askHikaru as geminiAskHikaru } from '../api/gemini.js';

export async function askHikaru(vladContext, gameContext) {
  const { accuracy, blunders, mistakes, inaccuracies, totalMoves, playerSide } = vladContext ?? {};
  const { white, black, result, pgn } = gameContext ?? {};
  const userMessage = `Game: ${white} vs ${black} — Result: ${result}
Player side: ${playerSide} | Accuracy: ${accuracy}% | Blunders: ${blunders} | Mistakes: ${mistakes} | Inaccuracies: ${inaccuracies} | Total moves: ${totalMoves}
PGN: ${pgn ?? '(not provided)'}
Give TopherBettis your middlegame and tactical read. Were the 5 Assassin weapons deployed correctly? What forcing move or tactical pattern was missed? End with Hikaru's Tactical Verdict — one sentence, fast and direct.`;
  return await geminiAskHikaru(userMessage);
}

export async function analyzeTactics(fen, context) {
  return await geminiAskHikaru(`FEN: ${fen}\nContext: ${context}\nWhat is the best tactical continuation? Calculate the forcing line. Give the first move immediately, then explain in 2 sentences.`);
}

export async function middlegamePlan(gameContext) {
  return await geminiAskHikaru(`Game context: ${gameContext}\nThe cage is built. Evaluate: is Ng5 available? Which of the 5 weapons applies — Search and Destroy (b4), Strangler (Nf5), Toxic Bait (Bg5+h4), High-Velocity Sacrifice (Bxh6), or Central Explosion (d4)? Give the exact move sequence to start the attack.`);
}

export async function tacticDrill(position, solution) {
  return await geminiAskHikaru(`Position: ${position}\nSolution was: ${solution}\nIn Hikaru's voice: explain why this is the right move, what pattern it follows, and what to look for next time. Keep it fast — 2 sentences max.`);
}
