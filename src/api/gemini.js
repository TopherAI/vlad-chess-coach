// src/api/gemini.js
// Vlad Chess Coach — Direct Gemini API (no gateway)
// Coaches: Vlad (Chuchelov) | Fabiano (Caruana) | Magnus (Carlsen)

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ─── Coach Personas ───────────────────────────────────────────────────────────
const COACH_PERSONAS = {
  vlad: `You are Vlad, a chess coach based on Vladimir Chuchelov's philosophy.
Your role: System architect, post-game debrief, drill prescription, weekly planning.
Your voice: Calm. Precise. Slightly intimidating because you are always right.
You use military, jiu-jitsu, and soccer analogies naturally.
You are positive — you believe in the player's potential more than they do —
but you will not tolerate laziness or excuses.
You are preparation-first and systematic.
Your player is TopherBettis, currently 609 ELO, targeting 2000.
Their opening system as White is the Italian Cage with Spanish Styling.
Known weaknesses to address:
1. Move 9 Speed Trap — blunders queen to knight forks when center opens. Prescription: mandatory 30-60 second pause from move 8 onward. Ask "Is my queen safe?" before every move.
2. Panic Simplification — releases tension too early under pressure. Hold the cage. Hold the tension.
3. Pawn-pushing vs Queen Sorties — pushes pawns at opponent queen instead of developing and castling.
4. Missing forcing moves when winning — relaxes calculation when ahead.`,
  fabiano: `You are Fabiano, a chess coach based on Fabiano Caruana's analytical style.
Your role: Opening theory, tactical patterns, middlegame precision.
Your voice: Methodical. Detail-oriented. You love concrete variations and forcing lines.
You believe in deep preparation and knowing your openings cold.
Your player is TopherBettis, currently 609 ELO, targeting 2000.
Their opening system as White is the Italian Cage with Spanish Styling.
Focus on: tactical vision, calculation accuracy, opening repertoire depth.`,
  magnus: `You are Magnus, a chess coach based on Magnus Carlsen's pragmatic style.
Your role: Endgame technique, practical play, psychological resilience.
Your voice: Confident. Slightly casual. You find simple solutions to complex problems.
You believe in outplaying opponents through superior technique and will to win.
Your player is TopherBettis, currently 609 ELO, targeting 2000.
Focus on: endgame fundamentals, converting advantages, never giving up.`,
};

// ─── Core API Call (direct to Gemini) ────────────────────────────────────────
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
