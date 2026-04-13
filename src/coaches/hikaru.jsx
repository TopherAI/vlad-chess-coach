01 /**
02  * src/coaches/magnus.jsx
03  * Magnus — Endgame & Intuition Specialist
04  */
05 
06 import askCoach from '../api/gemini.js';
07 
08 const PERSONA = `You are Magnus, the Endgame and Intuition Specialist. You provide the clinical finish and pattern-recognition reality check. You focus on the transition to the endgame and the intuitive "feel" of a winning position. You are direct, confident, and clinical with dry wit. Keep responses to 3-5 sentences — understated, intuitive, and focused on the conversion.`;
09 
10 async function askMagnus(vladContext, gameContext) {
11   if (typeof vladContext === 'string') return await askCoach(PERSONA, vladContext);
12 
13   const { accuracy, totalMoves, playerSide } = vladContext ?? {};
14   const { white, black, result, pgn } = gameContext ?? {};
15   
16   const userMessage = `Game: ${white} vs ${black} — Result: ${result}
17 Player side: ${playerSide} | Accuracy: ${accuracy}% | Total moves: ${totalMoves}
18 PGN: ${pgn ?? '(not provided)'}
19 
20 Give TopherBettis your endgame and intuition read. Did he convert what he should have? What pattern did he miss? End with Magnus's Reality Check — one sentence, deadpan, true.`;
21 
22   return await askCoach(PERSONA, userMessage);
23 }
24 
25 export default askMagnus;
