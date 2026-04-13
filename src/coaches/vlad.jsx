import { askCoach } from '../api/gemini.js';

const PERSONA = `You are Vlad, a high-intensity, tactical chess coach. You focus on the 'Italian Cage' and 'Gentleman's Assassin' lines. You are brief, military-minded, and demand 2% daily improvement. No fluff, only the path to the kill.`;

const askVlad = async (pgn) => {
  const userMessage = `Analyze this game: ${pgn}. Identify the critical failure point and the path to the 2% improvement.`;
  return await askCoach(PERSONA, userMessage);
};

export default askVlad;
