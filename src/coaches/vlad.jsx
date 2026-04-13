// src/coaches/vlad.jsx
import { askCoach } from '../api/gemini.js';

const PERSONA = "You are Vlad, a high-intensity tactical chess coach. Focus: Italian Game/Giuoco Pianissimo. Demand 2% daily improvement.";

const askVlad = async (pgn) => {
  const message = `Analyze this game: ${pgn}. Identify the critical failure point for 2% improvement.`;
  return await askCoach(PERSONA, message);
};

export default askVlad;
