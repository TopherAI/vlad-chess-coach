// src/api/gemini.js
// Vlad Chess Coach — Gateway-routed Gemini wrapper
// Coaches: Vlad (Chuchelov) | Fabiano (Caruana) | Magnus (Carlsen)

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'https://web-production-0bf47.up.railway.app';
const GATEWAY_SECRET = import.meta.env.VITE_GATEWAY_SECRET;

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

// ─── Core API Call (routed through LLM Gateway) ───────────────────────────────

/**
 * Ask a coach a question with optional chess context.
 *
 * @param {string} coachId     - 'vlad' | 'fabiano' | 'magnus'
 * @param {string} userMessage - The player's question or position context
 * @param {string} context     - Optional game analysis context (from buildVladContext)
 * @returns {Promise<string>}  - Coach response text
 */
export async function askCoach(coachId, userMessage, context = '') {
  const persona = COACH_PERSONAS[coachId];
  if (!persona) throw new Error(`Unknown coach: ${coachId}`);

  const fullMessage = context
    ? `${context}\n\nPlayer question: ${userMessage}`
    : userMessage;

  const response = await fetch(`${GATEWAY_URL}/gemini/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gateway-secret': GATEWAY_SECRET,
    },
    body: JSON.stringify({
      message: fullMessage,
      model: 'gemini-1.5-pro',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gateway error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.response;
}

/**
 * Ask Vlad for a post-game debrief using game analysis context.
 *
 * @param {string} vladContext - Output from buildVladContext()
 * @param {string} userMessage - Optional follow-up question
 * @returns {Promise<string>}
 */
export async function askVlad(vladContext, userMessage = 'Give me your full debrief.') {
  return askCoach('vlad', userMessage, vladContext);
}

/**
 * Ask Fabiano for opening/tactical advice.
 *
 * @param {string} userMessage
 * @returns {Promise<string>}
 */
export async function askFabiano(userMessage) {
  return askCoach('fabiano', userMessage);
}

/**
 * Ask Magnus for endgame/practical advice.
 *
 * @param {string} userMessage
 * @returns {Promise<string>}
 */
export async function askMagnus(userMessage) {
  return askCoach('magnus', userMessage);
}

export { COACH_PERSONAS };

export default {
  askCoach,
  askVlad,
  askFabiano,
  askMagnus,
  COACH_PERSONAS,
};
