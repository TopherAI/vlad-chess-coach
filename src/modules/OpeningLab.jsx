import { useState } from "react";
import { CheckCircle, ChevronRight } from "lucide-react";
import { askCoachOnce } from "../lib/useCoach";
import { cn } from "../lib/utils";

// ─── Move data ────────────────────────────────────────────────────────────────
const MOVES = [
  {
    num: 1, move: "e4", uci: "e2e4",
    title: "Central control",
    desc: "Control the center. This is not optional. Everything flows from this first claim of territory.",
    why: "Opens lines for the Queen and Bishop immediately, staking a claim on d5 and f5.",
    black: "To challenge the center immediately with e5, c5 (Sicilian), or e6 (French).",
    mistake: "Playing passively. e4 demands an active follow-up. Do not let Black dictate the pace.",
    trigger: "\"Claim the hill.\"",
  },
  {
    num: 2, move: "Nf3", uci: "g1f3",
    title: "Development + tempo",
    desc: "Develop with a purpose — immediately pressure the e5 pawn and establish central influence.",
    why: "Gains tempo by attacking e5, develops toward the center, and prepares Bc4.",
    black: "To consolidate the center pawn with Nc6 or play d6 to defend.",
    mistake: "Playing Nc3 here — it loses the tempo attack on e5 that defines the Italian.",
    trigger: "\"Chase the pawn.\"",
  },
  {
    num: 3, move: "Bc4", uci: "f1c4",
    title: "Target f7",
    desc: "Eyes the f7 weakness — Black's most vulnerable square. The Italian bishop is a silent assassin.",
    why: "Controls the critical a2-g8 diagonal. Eyes f7, the weakest pawn in Black's camp.",
    black: "To play Bc5 or Nf6, neutralizing the diagonal and contesting the Italian's bite.",
    mistake: "Moving this bishop again before the cage is built — loses tempo unless it wins material.",
    trigger: "\"See the target.\"",
  },
  {
    num: 4, move: "c3", uci: "c2c3",
    title: "Cage foundation",
    desc: "Build the cage structure. This pawn supports d4 later and signals your positional intent.",
    why: "Supports the future d4 push. Solidifies the center before any attacking action.",
    black: "To push d5 immediately to challenge the cage before it is complete.",
    mistake: "Playing d4 before c3 — gives Black the c4 square and unnecessary counterplay.",
    trigger: "\"Lay the foundation.\"",
  },
  {
    num: 5, move: "d3", uci: "d2d3",
    title: "Closed center — patience",
    desc: "Lock the center. Refuse the open game. This is where the Gentleman's Assassin diverges from amateurs.",
    why: "Keeps the position closed, denying Black any counterplay based on open files.",
    black: "To maneuver pieces quietly and seek a pawn break — d5 or f5.",
    mistake: "Pushing d4 prematurely — opens the center and releases all the tension in your favor.",
    trigger: "\"Close the door.\"",
  },
  {
    num: 6, move: "a4", uci: "a2a4",
    title: "Prophylaxis + bishop safety",
    desc: "Prevent b5 forever. Protect the Italian bishop before Black chases it away.",
    why: "Stops b5 from driving the bishop off the critical a2-g8 diagonal. Costs nothing.",
    black: "To ignore it and develop — hoping to find b5 later at a better moment.",
    mistake: "Forgetting a4 — Black plays b5 and the bishop loses time being chased.",
    trigger: "\"Guard the bishop.\"",
  },
  {
    num: 7, move: "O-O", uci: "e1g1",
    title: "King safety",
    desc: "Castle. The king must be safe before you attack. No exceptions.",
    why: "King safety is the precondition for all attacking play. Rook connects to e1.",
    black: "To keep the center open and delay castling — trying to exploit your uncastled king.",
    mistake: "Delaying castling while launching the attack — leaves the king exposed.",
    trigger: "\"King first.\"",
  },
  {
    num: 8, move: "h3", uci: "h2h3",
    title: "Anti-pin shield",
    desc: "Prevent Bg4. The pin on Nf3 destroys your knight coordination and delays the spring.",
    why: "Stops the annoying Bg4 pin that pressures Nf3 — the key piece in your system.",
    black: "To accept that Bg4 is prevented and reposition the bishop elsewhere.",
    mistake: "Forgetting h3 — allowing Bg4 to pin and disrupt the knight maneuver sequence.",
    trigger: "\"Close the pin lane.\"",
  },
  {
    num: 9, move: "Re1", uci: "f1e1",
    title: "Cage completion",
    desc: "The cage is built. Now load the spring: Nbd2 → Nf1 → Ng3 → Nh4 → Nf5.",
    why: "Rook on e1 defends e4, supports the center, and frees the f1 square for the knight.",
    black: "To probe for weaknesses now — they know the cage phase is complete.",
    mistake: "Launching the attack before all 9 cage moves are in place. The system is the system.",
    trigger: "\"The cage is built.\"",
  },
];

// ─── Move list item ───────────────────────────────────────────────────────────
function MoveItem({ move, active, studied, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer",
        active
          ? "bg-vlad-surface2 border-vlad-amber shadow-[inset_3px_0_0_var(--color-vlad-amber)] rounded-l-none"
          : "bg-vlad-surface border-vlad-border hover:bg-vlad-surface2 hover:border-vlad-border2"
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold flex-shrink-0",
          active ? "bg-vlad-amber text-vlad-bg" : "bg-vlad-surface3 text-vlad-muted"
        )}
      >
        {move.num}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("font-mono text-sm font-bold", active ? "text-vlad-text" : "text-vlad-sub")}>
          {move.num}. {move.move}
        </div>
        <div className="font-mono text-[10px] text-vlad-muted truncate">{move.desc.split(".")[0]}.</div>
      </div>
      {studied && <CheckCircle className="w-3.5 h-3.5 text-vlad-green flex-shrink-0" />}
    </div>
  );
}

// ─── Detail card ─────────────────────────────────────────────────────────────
function InfoBox({ label, color, content }) {
  const colorMap = {
    amber: "text-vlad-amber",
    muted: "text-vlad-muted",
    ember: "text-vlad-ember",
    blue:  "text-vlad-blue",
  };
  return (
    <div className="bg-vlad-surface2 border border-vlad-border rounded-xl p-4">
      <div className={cn("font-mono text-[10px] font-bold uppercase tracking-widest mb-2", colorMap[color])}>
        {label}
      </div>
      <p className="text-[12px] text-vlad-sub leading-relaxed">{content}</p>
    </div>
  );
}

// ─── OpeningLab ───────────────────────────────────────────────────────────────
export default function OpeningLab() {
  const [current, setCurrent] = useState(0);
  const [studied, setStudied] = useState(new Set());
  const [fabQuestion, setFabQuestion] = useState("");
  const [fabAnswer, setFabAnswer] = useState(null);
  const [fabLoading, setFabLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("system");

  const move = MOVES[current];

  const markStudied = () => {
    setStudied((prev) => new Set([...prev, current]));
  };

  const nextMove = () => {
    if (current < 8) {
      setCurrent(current + 1);
      setFabAnswer(null);
      setFabQuestion("");
    }
  };

  const selectMove = (i) => {
    setCurrent(i);
    setFabAnswer(null);
    setFabQuestion("");
  };

  const askFabiano = async () => {
    const q = fabQuestion.trim();
    if (!q || fabLoading) return;
    setFabLoading(true);
    setFabAnswer(null);
    try {
      const prompt = `About move ${move.num}. ${move.move} (${move.title}) in the Gentleman's Assassin system: ${q}`;
      const reply = await askCoachOnce("fabiano", prompt);
      setFabAnswer(reply);
    } catch {
      setFabAnswer("⚠ Could not reach Fabiano. Try again.");
    }
    setFabLoading(false);
  };

  const masteryPct = Math.round((studied.size / 9) * 100);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between border-b border-vlad-border pb-6">
        <div>
          <div className="section-label text-vlad-amber mb-1.5">Opening Lab</div>
          <h1 className="heading-lg mb-1">Gentleman's Assassin</h1>
          <p className="font-mono text-[11px] text-vlad-muted uppercase tracking-widest">
            Italian / Giuoco Pianissimo · v3.0 · My Opening System
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-[11px] text-vlad-sub mb-2">Mastery Progress</div>
          <div className="flex items-center gap-3">
            <div className="progress-track w-32">
              <div className="progress-fill bg-vlad-amber" style={{ width: `${masteryPct}%` }} />
            </div>
            <span className="font-mono text-sm font-bold text-vlad-amber">{masteryPct}%</span>
          </div>
          <div className="font-mono text-[10px] text-vlad-muted mt-1">{studied.size}/9 studied</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "system", label: "9-Move System" },
          { id: "trees",  label: "Response Trees" },
          { id: "check",  label: "Assassin Check" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "btn text-[11px]",
              activeTab === tab.id
                ? "btn-secondary border-vlad-amber text-vlad-text shadow-[0_0_12px_rgba(212,160,32,0.08)]"
                : "btn-ghost"
            )}
          >
            {activeTab === tab.id && <span className="text-vlad-amber">●</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "system" && (
        <div className="grid grid-cols-12 gap-6">

          {/* Move list */}
          <div className="col-span-4 space-y-1">
            <div className="flex justify-between items-center px-1 mb-3">
              <span className="section-label text-vlad-amber">The 9 Moves</span>
            </div>
            {MOVES.map((m, i) => (
              <MoveItem
                key={i}
                move={m}
                active={current === i}
                studied={studied.has(i)}
                onClick={() => selectMove(i)}
              />
            ))}
          </div>

          {/* Detail panel */}
          <div className="col-span-8 panel p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-vlad-amber/4 rounded-full blur-3xl pointer-events-none" />

            {/* Move notation header */}
            <div className="flex justify-between items-start mb-7 relative z-10">
              <div>
                <div className="section-label mb-1">Move {move.num}</div>
                <div className="font-mono text-5xl font-bold text-vlad-text leading-none mt-2">
                  {move.num}. {move.move}
                </div>
              </div>
              <div className="bg-vlad-surface2 border border-vlad-border rounded-xl px-4 py-2.5 font-mono text-sm">
                <div className="text-[9px] text-vlad-muted uppercase tracking-widest mb-1">UCI</div>
                <div className="text-base font-bold text-vlad-text">{move.uci}</div>
              </div>
            </div>

            {/* Title + description */}
            <div className="mb-7 relative z-10">
              <h2 className="text-xl font-bold text-vlad-text mb-2">{move.title}</h2>
              <p className="text-[13px] text-vlad-sub leading-relaxed">{move.desc}</p>
            </div>

            {/* Info boxes */}
            <div className="grid grid-cols-2 gap-4 mb-7 relative z-10">
              <InfoBox label="Why it matters"   color="amber" content={move.why}     />
              <InfoBox label="What Black wants"  color="muted" content={move.black}   />
              <InfoBox label="Common Mistake"    color="ember" content={move.mistake} />
              <InfoBox label="Trigger phrase"    color="blue"  content={move.trigger} />
            </div>

            {/* Ask Fabiano */}
            <div className="border-t border-vlad-border pt-5 relative z-10">
              <div className="section-label text-vlad-blue mb-3">♟ Ask Fabiano About This Move</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fabQuestion}
                  onChange={(e) => setFabQuestion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") askFabiano(); }}
                  placeholder={`e.g. What if Black plays Nf6 instead of Nc6 here?`}
                  disabled={fabLoading}
                  className="form-input flex-1 text-[12px]"
                />
                <button
                  onClick={askFabiano}
                  disabled={fabLoading || !fabQuestion.trim()}
                  className="btn btn-secondary text-[11px] text-vlad-blue border-vlad-blue/30 whitespace-nowrap"
                >
                  {fabLoading ? "Asking..." : "Ask ♟"}
                </button>
              </div>
              {fabAnswer && (
                <div className="mt-3 p-4 rounded-xl bg-vlad-blue/6 border border-vlad-blue/25 animate-fade-in">
                  <div className="font-mono text-[10px] text-vlad-blue font-bold uppercase tracking-widest mb-2">
                    ♟ Fabiano
                  </div>
                  <p className="text-[13px] text-vlad-sub leading-relaxed whitespace-pre-wrap">{fabAnswer}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-5 relative z-10">
              <button
                onClick={markStudied}
                className={cn(
                  "btn flex-1 py-3",
                  studied.has(current) ? "btn-secondary text-vlad-green border-vlad-green/30" : "btn-amber"
                )}
              >
                {studied.has(current) ? "✓ Studied" : "Mark as Studied"}
              </button>
              <button
                onClick={nextMove}
                disabled={current >= 8}
                className="btn btn-secondary flex-1 py-3 disabled:opacity-40"
              >
                Next Move →
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "trees" && (
        <div className="panel p-8 text-center">
          <div className="text-4xl mb-4">🌲</div>
          <h2 className="heading-md mb-2">Response Trees</h2>
          <p className="text-[13px] text-vlad-sub">
            Black's main replies — e5, c5, e6, d6 — and your continuation for each.
            Coming in the next build.
          </p>
        </div>
      )}

      {activeTab === "check" && (
        <div className="panel p-8">
          <div className="section-label text-vlad-amber mb-4">Assassin Checklist</div>
          <p className="text-[13px] text-vlad-sub mb-6">
            All 7 conditions must be met before pushing d4 and launching the middlegame.
          </p>
          <div className="space-y-3">
            {[
              "All 9 cage moves are on the board",
              "King is castled and safe",
              "h3 is played — Bg4 pin is impossible",
              "Re1 is on the e-file",
              "a4 is played — b5 is impossible",
              "Center is fully closed (no open d or e file)",
              "Knight maneuver Nbd2→Nf1→Ng3 is in progress or complete",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-vlad-surface2 border border-vlad-border">
                <div className="w-6 h-6 rounded-md border border-vlad-border bg-vlad-surface3 flex-shrink-0" />
                <span className="text-[13px] text-vlad-sub">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
