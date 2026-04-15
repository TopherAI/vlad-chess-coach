import { useState, useRef, useEffect } from "react";
import { Send, Play, RotateCcw } from "lucide-react";
import { askCoachOnce, COACHES } from "../lib/useCoach";
import { cn } from "../lib/utils";

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, color }) {
  return (
    <div className="panel p-5 text-center">
      <div className={cn("font-display text-4xl font-bold tracking-tight mb-1.5", color ?? "text-vlad-text")}>
        {value}
      </div>
      <div className="font-mono text-[10px] text-vlad-muted uppercase tracking-[0.2em] font-bold">
        {label}
      </div>
    </div>
  );
}

// ─── Coach Analysis Card ──────────────────────────────────────────────────────
function CoachAnalysisCard({ coachId, response, loading }) {
  const c = COACHES[coachId];
  const accentColor = {
    vlad:    "var(--color-vlad-ember)",
    magnus:  "var(--color-vlad-green)",
    hikaru:  "var(--color-vlad-amber)",
    fabiano: "var(--color-vlad-blue)",
  }[coachId];
  const accentText = {
    vlad:    "text-vlad-ember",
    magnus:  "text-vlad-green",
    hikaru:  "text-vlad-amber",
    fabiano: "text-vlad-blue",
  }[coachId];

  return (
    <div
      className="panel relative overflow-hidden"
      style={{ borderLeftColor: accentColor, borderLeftWidth: "3px" }}
    >
      <div className="p-5 border-b border-vlad-border/50 flex items-center gap-4">
        <div className="text-2xl leading-none">{c.icon}</div>
        <div>
          <div className={cn("font-mono text-[11px] font-bold uppercase tracking-widest", accentText)}>
            {c.name}
          </div>
          <div className="font-mono text-[10px] text-vlad-muted mt-0.5">{c.role}</div>
        </div>
      </div>
      <div className="p-5 bg-vlad-surface/50">
        {loading ? (
          <div className="text-vlad-muted text-sm italic font-mono loading-dots flex items-center gap-1">
            Analyzing<span>.</span><span>.</span><span>.</span>
          </div>
        ) : response ? (
          <p className="text-[13px] text-vlad-sub leading-relaxed whitespace-pre-wrap">{response}</p>
        ) : (
          <p className="text-[13px] text-vlad-muted italic font-mono">Awaiting analysis...</p>
        )}
      </div>
    </div>
  );
}

// ─── Quick Chat ───────────────────────────────────────────────────────────────
function QuickChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const system = `You are a combined chess coaching voice representing Vlad Chuchelov, Magnus Carlsen, Hikaru Nakamura, and Fabiano Caruana. The student is Topher Bettis, 593 ELO, Chess.com username TopherBettis, targeting 2000 ELO using the Gentleman's Assassin Italian Cage system. Latest game: 167 total moves, 13 GM deviations in the opening, 149 moves after move 9 played in under 30 seconds (30-second rule violation). Give specific, direct coaching. Under 180 words.`;
      const reply = await askCoachOnce("vlad", text);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠ Connection error. Try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="panel flex flex-col overflow-hidden">
      <div className="p-4 border-b border-vlad-border flex items-center gap-3">
        <span className="text-lg">💬</span>
        <div>
          <div className="text-[13px] font-bold text-vlad-text">Quick Question</div>
          <div className="font-mono text-[10px] text-vlad-muted">Ask any coach about this game</div>
        </div>
      </div>
      <div className="overflow-y-auto flex flex-col gap-3 p-4" style={{ minHeight: "160px", maxHeight: "280px" }}>
        {messages.length === 0 && (
          <p className="text-[12px] text-vlad-muted italic font-mono text-center mt-4">
            e.g. "Why did I keep losing time in the endgame?"
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "msg animate-fade-in",
              m.role === "user" ? "msg-user" : "msg-coach"
            )}
          >
            <div className="whitespace-pre-wrap leading-relaxed text-[13px]">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="msg msg-coach animate-fade-in">
            <div className="text-vlad-muted text-sm italic font-mono loading-dots flex items-center gap-1">
              Thinking<span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="border-t border-vlad-border p-3 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1}
          disabled={loading}
          placeholder="Ask about this game..."
          className="form-input flex-1 resize-none text-[12px]"
          style={{ minHeight: "38px" }}
        />
        <button onClick={send} disabled={loading || !input.trim()} className="btn btn-primary px-3 self-end">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── GameAutopsy ──────────────────────────────────────────────────────────────
export function GameAutopsy() {
  const [analyses, setAnalyses] = useState({ vlad: null, magnus: null, hikaru: null, fabiano: null });
  const [loading, setLoading] = useState({ vlad: false, magnus: false, hikaru: false, fabiano: false });
  const [ran, setRan] = useState(false);

  const GAME_CONTEXT = `Latest game: TopherBettis (White) vs chidobe-awuziebot · Result: 1-0 · 167 total moves · 13 GM deviations in the opening (post-move 9) · 149 moves played in under 30 seconds after move 9 — this is a 30-second rule violation. The student is using the Gentleman's Assassin Italian Cage system. Analyze from your specialty angle. Be direct, specific, under 160 words.`;

  const runCoach = async (id) => {
    setLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const reply = await askCoachOnce(id, `Please give your analysis of my game. Context: ${GAME_CONTEXT}`);
      setAnalyses((prev) => ({ ...prev, [id]: reply }));
    } catch {
      setAnalyses((prev) => ({ ...prev, [id]: "⚠ Analysis failed. Try again." }));
    }
    setLoading((prev) => ({ ...prev, [id]: false }));
  };

  const runAll = async () => {
    setRan(true);
    setAnalyses({ vlad: null, magnus: null, hikaru: null, fabiano: null });
    // Fire all 4 in parallel
    ["vlad", "magnus", "hikaru", "fabiano"].forEach((id) => runCoach(id));
  };

  const reset = () => {
    setAnalyses({ vlad: null, magnus: null, hikaru: null, fabiano: null });
    setLoading({ vlad: false, magnus: false, hikaru: false, fabiano: false });
    setRan(false);
  };

  const anyLoading = Object.values(loading).some(Boolean);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="section-label mb-1.5">Game Autopsy</div>
          <h1 className="heading-lg mb-1">Super AI Consensus</h1>
          <p className="font-mono text-[11px] text-vlad-muted uppercase tracking-widest">
            Vlad · Fabiano · Hikaru · Magnus
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ran && (
            <button onClick={reset} className="btn btn-ghost gap-2 text-vlad-muted">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
          <button
            onClick={runAll}
            disabled={anyLoading}
            className="btn btn-primary gap-2"
          >
            <Play className="w-3.5 h-3.5" />
            {anyLoading ? "Analyzing..." : "Run Full Autopsy"}
          </button>
        </div>
      </div>

      {/* Game info bar */}
      <div className="flex gap-2 flex-wrap">
        <div className="panel px-4 py-2 font-mono text-[12px] font-bold text-vlad-text">
          TopherBettis vs chidobe-awuziebot
        </div>
        <div className="panel px-4 py-2 font-mono text-[12px] font-bold text-vlad-green">
          1–0
        </div>
        <div className="panel px-4 py-2 font-mono text-[12px] font-bold text-vlad-sub cursor-pointer hover:text-vlad-text transition-colors">
          + New Game
        </div>
      </div>

      {/* Restored banner */}
      <div className="flex items-center gap-3 bg-vlad-green/8 border border-vlad-green/25 rounded-xl px-4 py-3">
        <span className="text-lg">📁</span>
        <span className="font-mono text-[12px] font-bold text-vlad-green">
          Last game restored — Apr 13, 11:26 PM
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard value="167" label="Total Moves" />
        <StatCard value="13"  label="GM Deviations"  color="text-vlad-amber" />
        <StatCard value="0"   label="Critical Turns"  color="text-vlad-ember" />
        <StatCard value="149" label="Speed Traps"     color="text-vlad-ember" />
      </div>

      {/* 30-second violation */}
      <div className="border border-vlad-ember/40 bg-vlad-ember/6 rounded-xl p-5 flex items-start gap-4">
        <span className="text-2xl leading-none flex-shrink-0">🎖</span>
        <div>
          <div className="font-mono text-[10px] font-bold text-vlad-ember uppercase tracking-widest mb-2">
            Vlad — 30-Second Rule Violation
          </div>
          <p className="text-[13px] text-vlad-text leading-relaxed">
            149 moves after move 9 were played in under 30 seconds. The pause is not optional.
            The cage demands respect. You cannot execute the system on autopilot.
          </p>
        </div>
      </div>

      {/* Individual coach buttons */}
      <div className="flex gap-2 flex-wrap">
        <span className="font-mono text-[10px] text-vlad-muted uppercase tracking-widest self-center mr-1">
          Ask individual:
        </span>
        {["vlad","magnus","hikaru","fabiano"].map((id) => {
          const c = COACHES[id];
          const accentText = {
            vlad: "text-vlad-ember", magnus: "text-vlad-green",
            hikaru: "text-vlad-amber", fabiano: "text-vlad-blue",
          }[id];
          const accentBorder = {
            vlad: "border-vlad-ember/40", magnus: "border-vlad-green/40",
            hikaru: "border-vlad-amber/40", fabiano: "border-vlad-blue/40",
          }[id];
          return (
            <button
              key={id}
              onClick={() => { setRan(true); runCoach(id); }}
              disabled={loading[id]}
              className={cn("btn btn-secondary text-[11px]", accentText, accentBorder)}
            >
              {c.icon} Ask {c.name}
            </button>
          );
        })}
      </div>

      {/* Coach analysis cards */}
      {ran && (
        <div className="space-y-3">
          <div className="section-label">Coach Responses</div>
          <div className="grid grid-cols-2 gap-4">
            {["vlad","magnus","hikaru","fabiano"].map((id) => (
              <CoachAnalysisCard
                key={id}
                coachId={id}
                response={analyses[id]}
                loading={loading[id]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick chat */}
      <QuickChat />

    </div>
  );
}
