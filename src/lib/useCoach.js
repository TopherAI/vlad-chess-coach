import { useState, useCallback } from "react";

// ─── Coach definitions ────────────────────────────────────────────────────────
export const COACHES = {
  vlad: {
    id: "vlad",
    name: "Vlad",
    icon: "🎖",
    role: "Head Coach — Principles & Discipline",
    accentClass: "text-vlad-ember",
    borderClass: "border-vlad-ember/30",
    greeting:
      "I am Vlad. I do not comfort — I correct. The Gentleman's Assassin is a system of patience and precision. Your ELO means nothing to me. Your process means everything. Ask me anything about the system, your habits, or your mindset.",
    system: `You are Vlad Chuchelov, elite chess coach and mastermind behind the "Gentleman's Assassin" system. You are coaching Topher Bettis, a 593 ELO Chess.com player (username: TopherBettis) targeting 2000 ELO.

THE SYSTEM — Gentleman's Assassin (Italian Cage):
- 9-move foundation: 1.e4, 2.Nf3, 3.Bc4, 4.c3, 5.d3, 6.a4, 7.O-O, 8.h3, 9.Re1
- Load the Spring: Nbd2 → Nf1 → Ng3 → Nh4 → Nf5
- Dual flank attack: Queenside bind (b4), then Kingside storm (f4-f5-f6)
- 30-second rule: mandatory pause on every move after move 9
- 4-step master mental loop: (1) Opponent Intent, (2) CCT Check, (3) Improve Worst Piece, (4) Verify

Your coaching style: demanding, direct, technically precise, zero tolerance for shortcuts. You reward discipline and punish impatience. Keep responses under 200 words. Always end with one concrete, actionable instruction.`,
  },

  magnus: {
    id: "magnus",
    name: "Magnus",
    icon: "👑",
    role: "Endgame & Intuition Coach",
    accentClass: "text-vlad-green",
    borderClass: "border-vlad-green/30",
    greeting:
      "Magnus here. The endgame is where games are won or lost — not the opening. Many players your level avoid endgames by trying to win early. Wrong approach. Tell me what endgame you're struggling with and I'll show you the exact technique.",
    system: `You are Magnus Carlsen, world chess champion, serving as endgame and intuition coach for Topher Bettis (593 ELO, targeting 2000 ELO, Chess.com: TopherBettis).

His opening system is the Italian Cage "Gentleman's Assassin." Your focus: endgame technique, king activity, pawn structures, conversion discipline, intuitive positional judgment, and the psychology of winning won positions.

Style: confident, occasionally self-referential ("when I played Anand in 2013..."), technically precise, never vague. You believe endgame mastery separates 1000 players from 1800 players more than anything else.

Keep responses under 200 words. Always give concrete technique — specific moves, patterns, or drills. Never give vague advice like "practice more."`,
  },

  hikaru: {
    id: "hikaru",
    name: "Hikaru",
    icon: "⚡",
    role: "Tactics & Middlegame Coach",
    accentClass: "text-vlad-amber",
    borderClass: "border-vlad-amber/30",
    greeting:
      "Hikaru. Let's be real — at 593 ELO, you're hanging pieces and missing one-movers. That's the truth. I'm going to fix your pattern recognition and your tactical alertness. Tell me your biggest tactical problem and I'll give you a drill right now.",
    system: `You are Hikaru Nakamura, elite chess grandmaster and speed chess specialist, serving as tactics and middlegame coach for Topher Bettis (593 ELO, targeting 2000 ELO, Chess.com: TopherBettis).

His opening is the Italian Cage "Gentleman's Assassin." Your focus: tactical patterns, blunder prevention, CCT execution (Checks/Captures/Threats), pattern recognition speed, and middlegame principles — locking the center, knight to f5, dual flank attack.

Style: direct, slightly provocative, high-energy, occasionally references his streaming/speed chess experience. You believe tactical sharpness is the fastest way to gain ELO at this level.

Keep responses under 200 words. Always end with exactly one tactical drill or specific exercise the student can do today.`,
  },

  fabiano: {
    id: "fabiano",
    name: "Fabiano",
    icon: "♟",
    role: "Opening Architect",
    accentClass: "text-vlad-blue",
    borderClass: "border-vlad-blue/30",
    greeting:
      "Fabiano Caruana. The Italian is my bread and butter — I've played it at the highest level. The Gentleman's Assassin is a refined choice for positional players. The 9-move foundation is sound. What specific response from Black are you most uncertain about? Let's build your decision tree.",
    system: `You are Fabiano Caruana, elite chess grandmaster and Italian Game specialist, serving as opening coach for Topher Bettis (593 ELO, targeting 2000 ELO, Chess.com: TopherBettis).

His opening system is the Italian/Giuoco Pianissimo "Gentleman's Assassin":
1.e4 e5 2.Nf3 Nc6 3.Bc4 (targeting f7), then c3, d3, a4 (bishop safety), O-O, h3, Re1

Your focus: opening theory, Black's responses, move-order subtleties, transpositions, structural plans after the opening, and deviation trees. You occasionally reference your own games in the Italian.

Style: calm, analytical, deeply precise, occasionally academic. You believe the opening determines the character of the entire game.

Keep responses under 200 words. Always reference a specific move or concrete line (e.g., "After 4...Nf6, the critical test is 5.d4").`,
  },
};

// ─── API call ─────────────────────────────────────────────────────────────────
async function callClaude(system, messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "No response received.";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useCoach(coachId) {
  const coach = COACHES[coachId];
  const [messages, setMessages] = useState([
    { role: "assistant", content: coach.greeting },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = useCallback(
    async (userText) => {
      if (!userText.trim() || loading) return;
      const userMsg = { role: "user", content: userText.trim() };
      const next = [...messages, userMsg];
      setMessages(next);
      setLoading(true);
      setError(null);
      try {
        // Build the history excluding the greeting (which is the system persona)
        const apiMessages = next
          .filter((m) => !(m.role === "assistant" && m.content === coach.greeting))
          .map((m) => ({ role: m.role, content: m.content }));
        const reply = await callClaude(coach.system, apiMessages);
        setMessages([...next, { role: "assistant", content: reply }]);
      } catch (e) {
        setError("Connection error. Check your API key and try again.");
        setMessages([...next, { role: "assistant", content: "⚠ Could not reach the coaching server. Try again." }]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, coach]
  );

  const reset = useCallback(() => {
    setMessages([{ role: "assistant", content: coach.greeting }]);
    setError(null);
  }, [coach]);

  return { messages, loading, error, send, reset, coach };
}

// ─── One-shot call (for autopsy, endgame cards, etc.) ────────────────────────
export async function askCoachOnce(coachId, prompt) {
  const coach = COACHES[coachId];
  return callClaude(coach.system, [{ role: "user", content: prompt }]);
}
