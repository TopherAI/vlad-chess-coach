import { useState } from "react";
import { Zap } from "lucide-react";
import { askCoachOnce } from "../lib/useCoach";
import { cn } from "../lib/utils";

// ─── Principle Card ───────────────────────────────────────────────────────────
function PrincipleCard({ num, title, command, error, condition, accentColor }) {
  return (
    <div
      className={cn(
        "panel p-7 relative overflow-hidden group transition-all duration-200",
        accentColor === "blue"  && "hover:border-vlad-blue/50",
        accentColor === "ember" && "hover:border-vlad-ember/50",
      )}
    >
      <div
        className={cn(
          "accent-bar group-hover:bg-vlad-blue transition-colors duration-200"
        )}
      />
      <div className="flex items-start gap-6 ml-3">
        <span
          className={cn(
            "font-mono text-5xl font-bold leading-none transition-colors duration-200",
            "text-vlad-surface3 group-hover:text-vlad-blue/40"
          )}
        >
          {num}
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-vlad-text mb-1 font-display">{title}</h3>
          <p className="font-mono text-[12px] text-vlad-blue mb-5">{command}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-vlad-surface2 border border-vlad-border rounded-xl p-4">
              <div className="font-mono text-[10px] font-bold text-vlad-ember uppercase tracking-widest mb-2">
                Common Error
              </div>
              <p className="text-[12px] text-vlad-sub leading-relaxed">{error}</p>
            </div>
            <div className="bg-vlad-surface2 border border-vlad-border rounded-xl p-4">
              <div className="font-mono text-[10px] font-bold text-vlad-green uppercase tracking-widest mb-2">
                Activation Condition
              </div>
              <p className="text-[12px] text-vlad-text font-medium leading-relaxed">{condition}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phase indicator ──────────────────────────────────────────────────────────
function PhaseBlock({ num, title, sub, active }) {
  return (
    <div
      className={cn(
        "flex-1 p-4 rounded-xl border transition-all",
        active
          ? "bg-vlad-surface2 border-vlad-blue/40 shadow-[0_0_20px_rgba(74,128,192,0.06)]"
          : "bg-vlad-bg border-vlad-border opacity-50"
      )}
    >
      <div
        className={cn(
          "font-mono text-[10px] font-bold uppercase tracking-widest mb-1.5",
          active ? "text-vlad-blue" : "text-vlad-muted"
        )}
      >
        Phase {num}{active ? " · Active" : ""}
      </div>
      <div className={cn("text-[13px] font-bold", active ? "text-vlad-text" : "text-vlad-sub")}>
        {title}
      </div>
      <div className={cn("font-mono text-[10px] mt-1", active ? "text-vlad-blue" : "text-vlad-muted")}>
        {sub}
      </div>
    </div>
  );
}

// ─── MiddlegameMat ────────────────────────────────────────────────────────────
export default function MiddlegameMat() {
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("directives");

  const askHikaru = async () => {
    setLoading(true);
    setGuidance(null);
    try {
      const reply = await askCoachOnce(
        "hikaru",
        "Give me live tactical guidance on executing the Gentleman's Assassin middlegame. I'm at 593 ELO targeting 2000. Focus on: when to launch the dual flank attack, how to use the Nf5 knight, and the single biggest mistake I'm likely making right now. Be specific and give me one drill."
      );
      setGuidance(reply);
    } catch {
      setGuidance("⚠ Could not reach Hikaru. Try again.");
    }
    setLoading(false);
  };

  const WEAPONS = [
    { name: "Nf5 Outpost",          desc: "The crown jewel. Knight on f5 cannot be evicted by a pawn. It paralyzes Black's kingside and dominates the game." },
    { name: "f4–f5–f6 Storm",        desc: "Once the knight is anchored and the center is closed, this pawn storm becomes unstoppable." },
    { name: "Queenside Bind (b4)",   desc: "Play b4 before the kingside attack. Forces Black to defend on two fronts simultaneously." },
    { name: "g4–g5 Surge",           desc: "Secondary kingside weapon. Used when f4-f5 push is premature. Creates immediate threats." },
    { name: "a5 Space Grab",         desc: "Extends the queenside bind all the way to a5. Black's queenside pieces become permanently cramped." },
    { name: "Ba2 Retreat",           desc: "Preserve the Italian bishop. Tuck it safely on a2 where it can never be traded or chased." },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between border-b border-vlad-border pb-6">
        <div>
          <div className="section-label text-vlad-blue mb-1.5">Middlegame Mat</div>
          <h1 className="heading-lg mb-1">Gentleman's Assassin — Attack Phase</h1>
          <p className="font-mono text-[11px] text-vlad-muted uppercase tracking-widest">
            5 Tactical Principles · 6 Weapons · Deploy With Precision
          </p>
        </div>
        <button
          onClick={askHikaru}
          disabled={loading}
          className="btn btn-secondary text-vlad-amber border-vlad-amber/30 gap-2"
        >
          <Zap className="w-3.5 h-3.5" />
          {loading ? "Asking Hikaru..." : "⚡ Ask Hikaru"}
        </button>
      </div>

      {/* Phase track */}
      <div className="panel p-5 flex items-center gap-3">
        <PhaseBlock num={1} title="Build the Cage"   sub="Moves 1–9"       active={false} />
        <div className="text-vlad-muted text-sm font-bold">→</div>
        <PhaseBlock num={2} title="Load the Spring"  sub="Nf1→Ng3→Nh4→Nf5" active={false} />
        <div className="text-vlad-muted text-sm font-bold">→</div>
        <PhaseBlock num={3} title="Deploy Weapon"    sub="Attack Execution" active={true}  />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "directives", label: "Tactical Directives" },
          { id: "weapons",    label: "6 Weapons" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "btn text-[11px]",
              activeTab === tab.id
                ? "btn-secondary border-vlad-blue text-vlad-text"
                : "btn-ghost"
            )}
          >
            {activeTab === tab.id && <span className="text-vlad-blue">●</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Intro */}
      <div className="bg-vlad-surface2 border border-vlad-border rounded-xl p-5">
        <p className="font-mono text-[13px] text-vlad-text leading-relaxed">
          The cage is built. These principles govern every middlegame decision — in order of priority.
          Do not skip ahead. Execute them sequentially.
        </p>
      </div>

      {/* Directives */}
      {activeTab === "directives" && (
        <div className="space-y-4">
          <PrincipleCard
            num="01"
            title="Lock the Center"
            command="Stabilize before attack."
            error="Pushing flank pawns while the center is fluid."
            condition="Do not push d4 until all 7 Assassin checklist conditions are met."
            accentColor="blue"
          />
          <PrincipleCard
            num="02"
            title="Establish Nf5 Stranglehold"
            command="Anchor the knight on f5."
            error="Rushing the attack before the knight is placed."
            condition="Clear the Ng3 square first. Load the spring methodically."
            accentColor="blue"
          />
          <PrincipleCard
            num="03"
            title="Dual Flank Attack"
            command="Exhaust their defense on both sides."
            error="Attacking both sides simultaneously before queenside is bound."
            condition="Queenside bind (b4) first. Kingside storm second. Never reverse the order."
            accentColor="blue"
          />
          <PrincipleCard
            num="04"
            title="Queenside Crush"
            command="Cramp Black's queenside with b4."
            error="Ignoring the queenside space advantage before attacking."
            condition="If b4 is available and safe, play it before starting any kingside attack."
            accentColor="blue"
          />
          <PrincipleCard
            num="05"
            title="Kingside Rush"
            command="Launch the f4–f5–f6 pawn storm."
            error="Pushing f4 when the center can still be blown open."
            condition="Only push f4 after the center is completely locked and Nf5 is established."
            accentColor="blue"
          />
        </div>
      )}

      {/* Weapons */}
      {activeTab === "weapons" && (
        <div className="grid grid-cols-2 gap-4">
          {WEAPONS.map((w, i) => (
            <div key={i} className="panel p-5 group hover:border-vlad-blue/40 transition-colors">
              <div className="flex items-start gap-3 mb-2">
                <div className="font-mono text-[10px] font-bold text-vlad-blue bg-vlad-blue/10 px-2 py-1 rounded-md flex-shrink-0">
                  W{i + 1}
                </div>
                <h3 className="text-[14px] font-bold text-vlad-text">{w.name}</h3>
              </div>
              <p className="text-[12px] text-vlad-sub leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hikaru guidance */}
      {(loading || guidance) && (
        <div
          className={cn(
            "panel p-6 border-vlad-amber/30 animate-fade-in",
            guidance && "bg-vlad-amber/3"
          )}
        >
          <div className="font-mono text-[10px] font-bold text-vlad-amber uppercase tracking-widest mb-3">
            ⚡ Hikaru — Live Tactical Guidance
          </div>
          {loading ? (
            <div className="text-vlad-muted text-sm italic font-mono loading-dots flex items-center gap-1">
              Loading<span>.</span><span>.</span><span>.</span>
            </div>
          ) : (
            <p className="text-[13px] text-vlad-sub leading-relaxed whitespace-pre-wrap">{guidance}</p>
          )}
        </div>
      )}

    </div>
  );
}
