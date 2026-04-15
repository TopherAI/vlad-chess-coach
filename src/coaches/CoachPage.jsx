import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, RefreshCw, ChevronRight } from "lucide-react";
import { useCoach, COACHES } from "../lib/useCoach";
import { cn } from "../lib/utils";

const SUGGESTED = {
  vlad: [
    "What is my biggest weakness right now?",
    "Am I following the 30-second rule correctly?",
    "How do I know when the cage is complete?",
    "What is the single most important thing I can fix this week?",
  ],
  magnus: [
    "How do I practice King + Pawn endings?",
    "When should I trade into an endgame?",
    "What is the box method for Rook endings?",
    "Give me a King activity drill for today.",
  ],
  hikaru: [
    "Give me a tactical drill for today.",
    "How do I stop hanging pieces?",
    "What patterns should I drill at 600 ELO?",
    "How do I execute CCT faster?",
  ],
  fabiano: [
    "What if Black plays the Sicilian against e4?",
    "How do I handle d5 after the Italian setup?",
    "What are the critical deviations in the Giuoco Pianissimo?",
    "When does Black try to break with d5?",
  ],
};

function ThinkingDots() {
  return (
    <span className="loading-dots font-mono text-vlad-muted text-sm">
      <span>.</span><span>.</span><span>.</span>
    </span>
  );
}

export function CoachPage() {
  const { coachId } = useParams();
  const navigate = useNavigate();
  const { messages, loading, send, reset, coach } = useCoach(coachId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Redirect if bad coachId
  useEffect(() => {
    if (!COACHES[coachId]) navigate("/");
  }, [coachId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!COACHES[coachId]) return null;

  const accentColor = {
    vlad:    "var(--color-vlad-ember)",
    magnus:  "var(--color-vlad-green)",
    hikaru:  "var(--color-vlad-amber)",
    fabiano: "var(--color-vlad-blue)",
  }[coachId];

  const accentBorder = {
    vlad:    "border-vlad-ember/30",
    magnus:  "border-vlad-green/30",
    hikaru:  "border-vlad-amber/30",
    fabiano: "border-vlad-blue/30",
  }[coachId];

  const accentText = {
    vlad:    "text-vlad-ember",
    magnus:  "text-vlad-green",
    hikaru:  "text-vlad-amber",
    fabiano: "text-vlad-blue",
  }[coachId];

  const handleSend = () => {
    if (!input.trim() || loading) return;
    send(input);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-6rem)] animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className={cn("section-label mb-1.5", accentText)}>Coaching Session</div>
          <h1 className="heading-lg flex items-center gap-3">
            <span>{coach.icon}</span>
            <span>{coach.name}</span>
          </h1>
          <p className="font-mono text-[11px] text-vlad-muted mt-1 uppercase tracking-widest">
            {coach.role}
          </p>
        </div>
        <button
          onClick={reset}
          className="btn btn-ghost gap-2 text-vlad-muted hover:text-vlad-text"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          New Session
        </button>
      </div>

      {/* Suggested questions */}
      <div className="flex gap-2 flex-wrap mb-4">
        {SUGGESTED[coachId]?.map((q) => (
          <button
            key={q}
            onClick={() => { send(q); }}
            disabled={loading}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-mono",
              "text-vlad-sub border-vlad-border bg-vlad-surface transition-all duration-150",
              "hover:border-vlad-border2 hover:text-vlad-text hover:bg-vlad-surface2",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            {q}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className={cn("panel flex-1 flex flex-col overflow-hidden border", accentBorder)}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "msg animate-fade-in",
                msg.role === "user" ? "msg-user" : "msg-coach"
              )}
              style={
                msg.role === "assistant" && i === 0
                  ? { borderLeft: `3px solid ${accentColor}` }
                  : {}
              }
            >
              {msg.role === "assistant" && (
                <div className={cn("font-mono text-[10px] font-bold uppercase tracking-widest mb-1.5", accentText)}>
                  {coach.icon} {coach.name}
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
            </div>
          ))}

          {loading && (
            <div className="msg msg-coach animate-fade-in">
              <div className={cn("font-mono text-[10px] font-bold uppercase tracking-widest mb-1.5", accentText)}>
                {coach.icon} {coach.name}
              </div>
              <ThinkingDots />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input row */}
        <div className="border-t border-vlad-border p-4 flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            disabled={loading}
            placeholder={`Ask ${coach.name} anything...`}
            className={cn(
              "form-input flex-1 resize-none leading-relaxed",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn btn-primary px-4 self-end"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
