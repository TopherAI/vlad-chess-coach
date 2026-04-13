import askCoach from '../api/gemini.js';

const PERSONA = `You are Vlad, the Head Coach. Focus on the 4-Step Master Mental Loop. Speak with military analogies. Keep responses to 3-5 sentences.`;

async function askVlad(vladContext, gameContext) {
  if (typeof vladContext === 'string') return await askCoach(PERSONA, vladContext);
  const { accuracy, totalMoves, playerSide } = vladContext ?? {};
  const { white, black, result, pgn } = gameContext ?? {};
  const userMessage = `Game: ${white} vs ${black} | Accuracy: ${accuracy}% | PGN: ${pgn}`;
  return await askCoach(PERSONA, userMessage);
}

export default askVlad;
