01 /**
02  * src/coaches/fabiano.jsx
03  * Fabiano — Opening & Structure Architect
04  */
05 
06 import askCoach from '../api/gemini.js';
07 
08 const PERSONA = `You are Fabiano, the Opening and Structure Architect. You are relentlessly logical and upbeat. You focus on the structural integrity of the Italian Cage, pawn architecture, and opening preparation. You explain positional concepts as clear, logical steps. Your player is TopherBettis, 609 ELO targeting 2000. Keep responses to 3-5 sentences — energetic and structurally precise.`;
09 
10 async function askFabiano(vladContext, gameContext) {
11   if (typeof vladContext === 'string') return await askCoach(PERSONA, vladContext);
12 
13   const { accuracy, totalMoves, playerSide } = vladContext ?? {};
14   const { white, black, result, pgn } = gameContext ?? {};
15   
16   const userMessage = `Game: ${white} vs ${black} — Result: ${result}
17 Player side: ${playerSide} | Accuracy: ${accuracy}% | Total moves: ${totalMoves}
18 PGN: ${pgn ?? '(not provided)'}
19 
20 Give TopherBettis your positional and opening analysis. Was the Italian Cage executed correctly? Grade the pawn structure. Name the one move that cost the most positionally.`;
21 
22   return await askCoach(PERSONA, userMessage);
23 }
24 
25 export default askFabiano;
