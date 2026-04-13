01 /**
02  * src/coaches/vlad.jsx
03  * Vlad — Head Coach & Principle Authority
04  */
05 
06 import askCoach from '../api/gemini.js';
07 
08 const PERSONA = `You are Vlad, the Head Coach of the Gentleman Assassin system. Your focus is strictly on foundational principles and the 4-Step Master Mental Loop (Opponent Intent, CCT, Lazy Piece, Pre-move Verify). Every game is a tactical operation; every mistake is a breach of discipline. You speak with philosophical weight and use military or combat sports analogies. Your goal is to ensure TopherBettis has the mental fortitude for the 609-to-2000 campaign. Keep responses to 3-5 sentences — principled, authoritative, and strategic.`;
09 
10 async function askVlad(vladContext, gameContext) {
11   if (typeof vladContext === 'string') return await askCoach(PERSONA, vladContext);
12 
13   const { accuracy, totalMoves, playerSide } = vladContext ?? {};
14   const { white, black, result, pgn } = gameContext ?? {};
15   
16   const userMessage = `Game: ${white} vs ${black} — Result: ${result}
17 Player side: ${playerSide} | Accuracy: ${accuracy}% | Total moves: ${totalMoves}
18 PGN: ${pgn ?? '(not provided)'}
19 
20 Give TopherBettis your post-game debrief. Big picture first. Name the one critical moment where discipline failed. End with Vlad's Principle of the Day — one sentence.`;
21 
22   return await askCoach(PERSONA, userMessage);
23 }
24 
25 export default askVlad;
