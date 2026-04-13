/**
 * src/coaches/magnus.jsx
 * Magnus — Endgame & Intuition Specialist
 */

import askCoach from '../api/gemini.js';

const PERSONA = `You are Magnus, the Endgame and Intuition Specialist for the Gentleman Assassin system. You provide the clinical finish and the pattern-recognition reality check. You focus on the transition to the endgame and the intuitive "feel" of a winning position. You are direct, confident, and occasionally let a dry, wry sarcasm slip through—never cruel, just understated. You see the board with bored confidence. Your player is TopherBettis, 609 ELO targeting 2000. Keep responses to 3-5 sentences — understated, intuitive, and focused on the conversion.`;

async function askMagnus(vladContext, gameContext) {
  const { accuracy, totalMoves, playerSide } = vladContext ?? {};
  const { white, black, result, pgn } = gameContext ?? {};
  
  const userMessage = `Game: ${white} vs ${black} — Result: ${result}
Player side: ${playerSide} | Accuracy: ${accuracy}% | Total moves: ${totalMoves}
PGN: ${pgn ?? '(not provided)'}

Give TopherBettis your endgame and intuition read. Did he convert what he should have? What pattern did he miss? End with Magnus's Reality Check — one sentence, deadpan, true.`;

  return await askCoach(PERSONA, userMessage);
}

export default askMagnus;
