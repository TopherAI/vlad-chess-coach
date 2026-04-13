01 /**
02  * src/api/gemini.js
03  * THE CONDUIT: Pure API logic to Railway Gateway
04  * Standard: Default export (Braceless Import)
05  */
06 
07 const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;
08 
09 async function askCoach(persona, userMessage, context = '') {
10   const fullMessage = context
11     ? `${context}\n\nContext/Question: ${userMessage}`
12     : userMessage;
13 
14   const response = await fetch(GATEWAY_URL, {
15     method: 'POST',
16     headers: { 
17       'Content-Type': 'application/json',
18       'X-App-Source': 'vlad-chess-coach'
19     },
20     body: JSON.stringify({
21       model: "gemini-3-flash",
22       system_instruction: persona,
23       prompt: fullMessage,
24       temperature: 0.7,
25     }),
26   });
27 
28   if (!response.ok) {
29     const err = await response.text();
30     throw new Error(`Gateway connection failure ${response.status}: ${err}`);
31   }
32 
33   const data = await response.json();
34   return data.text || data.candidates?.[0]?.content?.parts?.[0]?.text || '[No response]';
35 }
36 
37 export default askCoach;
