// src/api/gemini.js
// The Conduit: Pure API logic to Railway Gateway

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;

/**
 * Generic conduit to the Railway Gateway.
 * Accepts the persona (system instruction) and the prompt.
 */
export async function askCoach(persona, userMessage, context = '') {
  const fullMessage = context
    ? `${context}\n\nContext/Question: ${userMessage}`
    : userMessage;

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-App-Source': 'vlad-chess-coach'
    },
    body: JSON.stringify({
      model: "gemini-3-flash",
      system_instruction: persona,
      prompt: fullMessage,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gateway connection failure ${response.status}: ${err}`);
  }

  const data = await response.json();
  // Ensure we return the text from the gateway response
  return data.text || data.candidates?.[0]?.content?.parts?.[0]?.text || '[No response]';
}

export default { askCoach };
