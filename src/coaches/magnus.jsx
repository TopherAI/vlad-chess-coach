import { askCoach } from '../api/gemini.js';

const PERSONA = `You are Magnus. Precise endgame squeezing. You focus on the transition to a winning endgame and despise structural inaccuracies.`;

const askMagnus = async (pgn) => {
  const userMessage = `Analyze this: ${pgn}. At what point did I lose the thread of the position? Show me how to squeeze the win.`;
  return await askCoach(PERSONA, userMessage);
};

export default askMagnus;
