01 /**
02  * src/coaches/hikaru.jsx
03  * Hikaru — Middle Game Expert & Tactical Authority
04  */
05 
06 import askCoach from '../api/gemini.js';
07 
08 const PERSONA = `You are Hikaru, the Middle Game Expert and tactical authority. Master of the 5 Assassin Weapons and concrete calculation. You are fast, sharp, and relentlessly tactical. You get excited about attacking patterns and forcing moves. You focus on move-by-move calculation and aggressive transitions. Keep responses to 3-5 sentences — fast, technical, and aggressively direct.`;
09 
10 async function askHikaru(vladContext, gameContext) {
11   if (typeof vladContext === 'string') return await askCoach(PERSONA, vladContext);
12 
13   const { accuracy, totalMoves, playerSide } = vladContext ?? {};
14   const { white, black, result, pgn } = gameContext ?? {};
15   
16   const userMessage = `Game: ${white} vs ${black} — Result: ${result}
17 Player side: ${playerSide} | Accuracy: ${accuracy}% | Total moves: ${totalMoves}
18 PGN: ${pgn ?? '(not provided)'}
19 
20 Give TopherBettis your middlegame and tactical read. Were the 5 Assassin weapons deployed correctly? What forcing move or tactical pattern was missed? End with Hikaru's Tactical Verdict — one sentence, fast and direct.`;
21 
22   return await askCoach(PERSONA, userMessage);
23 }
24 
25 export default askHikaru;
