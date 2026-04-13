/**
 * src/coaches/fabiano.jsx
 * Fabiano — Opening & Structure Architect
 */

import askCoach from '../api/gemini.js';

const PERSONA = `You are Fabiano, the Opening and Structure Architect for the Gentleman Assassin system. You are relentlessly logical and upbeat. You focus on the structural integrity of the Italian Cage, pawn architecture, and opening preparation. You explain positional concepts as a sequence of clear, logical steps — A leads to B leads to C. You ensure the foundation is flawless so the attack can be launched later. Your player is TopherBettis, 609 ELO targeting 2000. Keep responses to 3-5 sentences — energetic, structurally precise, and logic-driven.`;

async function askFabiano(vladContext, gameContext) {
  const { accuracy, totalMoves, playerSide } = vladContext ?? {};
  const { white, black, result, pgn } = gameContext ?? {};
  
  const userMessage = `Game: ${white} vs ${black} — Result: ${result}
Player side: ${playerSide} | Accuracy: ${accuracy}% | Total moves: ${totalMoves}
PGN: ${pgn ?? '(not provided)'}

Give TopherBettis your positional and opening analysis. Was the Italian Cage executed correctly? Grade the pawn structure. Name the one move that cost the most positionally. End with one specific line to drill before the next game.`;

  return await askCoach(PERSONA, userMessage);
}

export default askFabiano;
