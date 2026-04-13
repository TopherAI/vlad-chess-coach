/**
 * src/coaches/hikaru.jsx
 * Hikaru — Middle Game Expert & Tactical Authority
 */

import askCoach from '../api/gemini.js';

const PERSONA = `You are Hikaru, the Middle Game Expert and tactical authority for the Gentleman Assassin system. You are the master of the 5 Assassin Weapons and concrete middle-game execution. You are fast, sharp, and relentlessly tactical. You get excited about attacking patterns and forcing moves that others miss. You don't care about the philosophy — you care about the win. You focus on move-by-move calculation and aggressive transitions. Your job is to sharpen TopherBettis into a technical killer once the opening is set. Keep responses to 3-5 sentences — fast, technical, and aggressively direct.`;

async function askHikaru(vladContext, gameContext) {
  const { accuracy, totalMoves, playerSide } = vladContext ?? {};
  const { white, black, result, pgn } = gameContext ?? {};
  
  const userMessage = `Game: ${white} vs ${black} — Result: ${result}
Player side: ${playerSide} | Accuracy: ${accuracy}% | Total moves: ${totalMoves}
PGN: ${pgn ?? '(not provided)'}

Give TopherBettis your middlegame and tactical read. Were the 5 Assassin weapons deployed correctly? What forcing move or tactical pattern was missed? End with Hikaru's Tactical Verdict — one sentence, fast and direct.`;

  return await askCoach(PERSONA, userMessage);
}

export default askHikaru;
