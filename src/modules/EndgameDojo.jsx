import { useState } from "react";
import { Crown } from "lucide-react";
import { askCoachOnce } from "../lib/useCoach";
import { cn } from "../lib/utils";

// ─── Endgame data ─────────────────────────────────────────────────────────────
const ENDGAMES = [
  {
    id: "king-pawn",
    title: "King + Pawn",
    desc: "Opposition and outflanking fundamentals.",
    mastery: 85,
    attempts: 42,
    lastResult: "Pass",
    prompt: "Give me specific King+Pawn endgame technique coaching. I'm at 593 ELO targeting 2000 ELO. What are the 2-3 most critical patterns to master, and what is the exact drill I should do today?",
  },
  {
    id: "king-rook",
    title: "King + Rook",
    desc: "The box method and cutting off the king.",
    mastery: 40,
    attempts: 18,
    lastResult: "Fail",
    prompt: "Give me specific King+Rook endgame technique coaching — the box method, Lucena, and Philidor. I'm at 593 ELO targeting 2000 ELO. What is the most important pattern to fix right now?",
  },
  {
    id: "two-bishops",
    title: "Two Bishops",
    desc: "Herding the enemy king to the corner.",
    mastery: 0,
    attempts: 0,
    lastResult: null,
    prompt: "I have zero experience with Two Bishop endgames. I'm at 593 ELO targeting 2000 ELO. Teach me the fundamental pattern for herding the enemy king to the corner step by step.",
  },
  {
    id: "ladder-mates",
    title: "Ladder Mates",
    desc: "Basic heavy piece coordination.",
    mastery: 100,
    attempts: 5,
    lastResult: "Pass",
    prompt: "I've mastered Ladder Mates at 100%. What is the next level of complexity I should study in this theme? I'm at 593 ELO targeting 2000 ELO. What similar patterns build on this foundation?",
  },
];

// ─── Mastery color ────────────────────────────────────────────────────────────
function masteryColor(pct) {
  if (pct >= 80) return "text-vlad-green";
  if (pct >= 30) return "text-vlad-amber";
  if (pct > 0)   return "text-vlad-ember";
  return "text-vlad-muted";
}

function masteryBar(pct) {
  if (pct >= 80) return "bg-vlad-green";
  if (pct >= 30) return "bg-vlad-amber";
  return "bg-vlad-ember";
}

// ─── Endgame Card ─────────────────────────────────────────────────────────────
function EndgameCard({ endgame, onAskMagnus, isLoading }) {
  const resultColor =
    endgame.lastResult === "Pass" ? "text-vlad-green"
    : endgame.lastResult === "Fail" ? "text-vlad-ember"
    : "text-vlad-muted";

  return (
    <div
      onClick={() => onAskMagnus(endgame)}
      className="panel p-6 cursor-pointer group hover:border-vlad-green/40 transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Title + mastery % */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-[15px] font-bold text-vlad-text mb-1 font-display">{endgame.title}</h3>
          <p className="text-[12px] text-vlad-sub">{endgame.desc}</p>
        </div>
        <div className={cn("font-mono text-2xl font-bold", masteryColor(endgame.mastery))}>
          {endgame.mastery}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-track mb-4">
        <div
          className={cn("progress-fill", masteryBar(endgame.mastery))}
          style={{ width: `${endgame.mastery}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 border-t border-vlad-border/50 pt-4">
        <div>
          <div className="section-label mb-1">Attempts</div>
          <div className="text-[13px] font-bold text-vlad-text">{endgame.attempts}</div>
        </div>
        <div>
          <div className="section-label mb-1">Last Result</div>
          <div className={cn("text-[13px] font-bold", resultColor)}>
            {endgame.lastResult ?? "—"}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-4 flex items-center gap-2">
        <Crown className="w-3.5 h-3.5 text-vlad-green" />
        <span className="font-mono text-[10px] font-bold text-vlad-green uppercase tracking-widest">
          {isLoading ? "Magnus is thinking..." : "Click for Magnus analysis"}
        </span>
      </div>
    </div>
  );
}

// ─── EndgameDojo ──────────────────────────────────────────────────────────────
export function EndgameDojo() {
  const [activeEndgame, setActiveEndgame] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const overallMastery = Math.round(
    ENDGAMES.reduce((sum, e) => sum + e.mastery, 0) / ENDGAMES.length
  );

  const askMagnus = async (endgame) => {
    if (loading) return;
    setActiveEndgame(endgame);
    setResponse(null);
    setLoading(true);
    try {
      const reply = await askCoachOnce("magnus", endgame.prompt);
      setResponse(reply);
    } catch {
      setResponse("⚠ Could not reach Magnus. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between border-b border-vlad-border pb-6">
        <div>
          <div className="section-label text-vlad-green mb-1.5">Endgame Dojo</div>
          <h1 className="heading-lg mb-1">Conversion Discipline</h1>
          <p className="font-mono text-[11px] text-vlad-muted uppercase tracking-widest">
            Magnus Technique · Clinical Practice · Win What You Win
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-[11px] text-vlad-sub mb-2">Overall Mastery</div>
          <div className="flex items-center gap-3">
            <div className="progress-track w-32">
              <div className="progress-fill bg-vlad-green" style={{ width: `${overallMastery}%` }} />
            </div>
            <span className="font-mono text-sm font-bold text-vlad-green">{overallMastery}%</span>
          </div>
        </div>
      </div>

      {/* Magnus intro card */}
      <div className="panel p-5 flex items-start gap-4 border-vlad-green/25 bg-vlad-green/4">
        <div className="text-2xl leading-none flex-shrink-0">👑</div>
        <div>
          <div className="font-mono text-[10px] font-bold text-vlad-green uppercase tracking-widest mb-1.5">
            Magnus — Endgame Philosophy
          </div>
          <p className="text-[13px] text-vlad-sub leading-relaxed">
            Click any endgame category below for live technique coaching. I will tell you exactly
            what to practice and how. The endgame is not a phase to survive — it is a phase to win.
          </p>
        </div>
      </div>

      {/* Endgame grid */}
      <div className="grid grid-cols-2 gap-4">
        {ENDGAMES.map((endgame) => (
          <EndgameCard
            key={endgame.id}
            endgame={endgame}
            onAskMagnus={askMagnus}
            isLoading={loading && activeEndgame?.id === endgame.id}
          />
        ))}
      </div>

      {/* Magnus response */}
      {(loading || response) && activeEndgame && (
        <div className="panel p-6 border-vlad-green/30 bg-vlad-green/3 animate-fade-in">
          <div className="font-mono text-[10px] font-bold text-vlad-green uppercase tracking-widest mb-3 flex items-center gap-2">
            <Crown className="w-3.5 h-3.5" />
            Magnus — {activeEndgame.title}
          </div>
          {loading ? (
            <div className="text-vlad-muted text-sm italic font-mono loading-dots flex items-center gap-1">
              Magnus is thinking<span>.</span><span>.</span><span>.</span>
            </div>
          ) : (
            <p className="text-[13px] text-vlad-sub leading-relaxed whitespace-pre-wrap">{response}</p>
          )}
        </div>
      )}

      {/* Endgame philosophy callout */}
      <div className="panel p-6">
        <div className="section-label text-vlad-amber mb-4">Endgame Priority Order</div>
        <div className="space-y-3">
          {[
            { priority: "1", title: "King + Pawn",   note: "Foundation of all endgame play. King opposition is the fundamental skill." },
            { priority: "2", title: "Rook Endings",  note: "60% of all endgames are rook endings. Lucena + Philidor = essential." },
            { priority: "3", title: "Ladder Mates",  note: "Mastered. Never give this up in a won position. Convert ruthlessly." },
            { priority: "4", title: "Two Bishops",   note: "Rare but decisive when it occurs. Learn the herding pattern." },
          ].map((item) => (
            <div key={item.priority} className="flex items-start gap-4 p-4 bg-vlad-surface2 rounded-xl border border-vlad-border">
              <div className="w-7 h-7 rounded-lg bg-vlad-amber/15 text-vlad-amber flex items-center justify-center font-mono text-[12px] font-bold flex-shrink-0">
                {item.priority}
              </div>
              <div>
                <div className="text-[13px] font-bold text-vlad-text mb-0.5">{item.title}</div>
                <div className="text-[12px] text-vlad-sub">{item.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
