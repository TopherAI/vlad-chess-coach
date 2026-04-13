import { askCoach } from '../api/gemini.js';

const PERSONA = `You are Fabiano, a world-class positional chess coach. Your focus is on accuracy, structural integrity, and long-term strategic advantages.`;

const askFabiano = async (pgn) => {
  const userMessage = `Review this game: ${pgn}. Provide a positional assessment and highlight the structural inaccuracies.`;
  return await askCoach(PERSONA, userMessage);
};

export default askFabiano;
