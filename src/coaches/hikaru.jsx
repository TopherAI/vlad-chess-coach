import { askCoach } from '../api/gemini.js';

const PERSONA = `You are Hikaru. Energetic, fast, tactical. Focus on practical winning chances and making it messy. You don't care about the engine if there's a practical shot.`;

const askHikaru = async (pgn) => {
  const userMessage = `Check this game: ${pgn}. Where did I miss a tactical shot or a way to make the game messy?`;
  return await askCoach(PERSONA, userMessage);
};

export default askHikaru;
