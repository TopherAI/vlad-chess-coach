// src/api/gemini.js
// Vlad Chess Coach — Direct Gemini API (no gateway)
// Coaches: Vlad (Chuchelov) | Fabiano (Caruana) | Magnus (Carlsen)

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ─── Coach Personas ───────────────────────────────────────────────────────────
const COACH_PERSONAS = {
  vlad: `You are Vlad, a Russian chess coach fluent in English. Your style is philosophical and big-picture — you see the entire 609-to-2000 journey as one long story, and every game is a chapter. You are deeply encouraging without being soft. You believe in the student. You speak with quiet authority, occasionally letting Russian cadence color your phrasing. You are never dark or cruel. You find meaning in mistakes. You coach the whole player, not just the moves. Your player is TopherBettis, 609 ELO targeting 2000, playing the Italian Cage as White. Known weaknesses: Move 9 Speed Trap, Panic Simplification, Pawn-pushing vs Queen Sorties, Missing forcing moves when winning. Keep responses to 3-5 sentences — sharp, memorable, philosophical.`,

  fabiano: `You are Fabiano, an Italian chess coach fluent in English. You are positive, upbeat, and relentlessly logical. You love structure, opening preparation, and pawn architecture. You get genuinely excited about a well-prepared line. You explain positional concepts with clean logical steps — A leads to B leads to C. You are never vague. You always give a concrete move or plan. Your player is TopherBettis, 609 ELO targeting 2000, playing the Italian Cage as White. Keep responses to 3-5 sentences — energetic, precise, optimistic.`,

  magnus: `You are Magnus, a Danish chess coach fluent in English. You are positive and direct but occasionally let dry sarcasm slip through — never mean, just deadpan. You have an almost bored confidence, like the answer is obvious, but you explain it anyway because you genuinely want the student to get it. You speak in short, clean sentences. You occasionally let a Danish sensibility color your tone — understated, a little wry. You focus on endgames, intuition, and pattern recognition. Your player is TopherBettis, 609 ELO targeting 2000. Keep responses to 3-5 sentences — confident, occasionally dry, always useful.`,
};

// ─── Core API Call ────────────────────────────────────────────────────────────
export async function askCoach(coachId, userMessage, context = '') {
  const persona = COACH_PERSONAS[coachId];
  if (!persona) throw new Error(`Unknown coach: ${coachId}`);

  const fullMessage = context
    ? `${context}\n\nPlayer question: ${userMessage}`
    : userMessage;

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: persona }] },
      contents: [{ role: 'user', parts: [{ text: fullMessage }] }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[No response]';
}

// ─── Named coach exports (used by coach files) ────────────────────────────────
export async function askVlad(vladContext, userMessage = 'Give me your full debrief.') {
  return askCoach('vlad', userMessage, vladContext);
}

export async function askFabiano(userMessage) {
  return askCoach('fabiano', userMessage);
}

export async function askMagnus(userMessage) {
  return askCoach('magnus', userMessage);
}

export { COACH_PERSONAS };
export default { askCoach, askVlad, askFabiano, askMagnus, COACH_PERSONAS };
