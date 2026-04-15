import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Microscope, BookOpen, Crosshair, Crown, User,
  ArrowRight, ChevronRight,
} from "lucide-react";
import { cn } from "../lib/utils";

// ─── Tactical Clock ───────────────────────────────────────────────────────────
function TacticalClock() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const interval = useRef(null);

  const toggle = () => {
    if (running) {
      clearInterval(interval.current);
      setRunning(false);
    } else {
      setRunning(true);
      interval.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
  };

  const reset = () => {
    clearInterval(interval.current);
    setRunning(false);
    setSeconds(0);
  };

  useEffect(() => () => clearInterval(interval.current), []);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const display = `${m}:${String(s).padStart(2, "0")}`;
  const over30 = seconds >= 30 && seconds < 60;
  const isGood = seconds >= 30;

  return (
    <div className="panel p-5 flex flex-col justify-between h-full">
      <div className="section-label mb-2">Tactical Clock</div>
      <div
        className={cn(
          "font-mono text-5xl font-bold tracking-tighter transition-colors duration-300",
          isGood ? "text-vlad-green" : "text-vlad-text"
        )}
      >
        {display}
      </div>
      {over30 && (
        <div className="font-mono text-[10px] text-vlad-green uppercase tracking-widest mt-1">
          ✓ 30s rule satisfied
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <button onClick={toggle} className="btn btn-primary flex-1 py-2 text-[11px]">
          {running ? "Stop" : "Start"}
        </button>
        <button onClick={reset} className="btn btn-secondary px-3 py-2 text-[11px]">
          ↺
        </button>
      </div>
    </div>
  );
}

// ─── Module Card ──────────────────────────────────────────────────────────────
function ModuleCard({ to, icon: Icon, title, desc, metric, hoverBorder }) {
  return (
    <Link
      to={to}
      className={cn(
        "panel panel-hover p-5 block group relative overflow-hidden",
        hoverBorder
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-5">
        <div className="w-9 h-9 rounded-lg bg-vlad-surface2 border border-vlad-border flex items-center justify-center group-hover:bg-vlad-surface3 transition-colors">
          <Icon className="w-4 h-4 text-vlad-sub group-hover:text-vlad-text transition-colors" />
        </div>
        <ArrowRight className="w-4 h-4 text-vlad-muted opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
      </div>
      <div className="heading-md text-base mb-1">{title}</div>
      <p className="text-[12px] text-vlad-muted mb-5 leading-relaxed">{desc}</p>
      <div className="font-mono text-[10px] text-vlad-sub font-bold uppercase tracking-wider pt-4 border-t border-vlad-border/50">
        {metric}
      </div>
    </Link>
  );
}

// ─── Coach Card ───────────────────────────────────────────────────────────────
function CoachCard({ to, icon, name, role, desc, accentText }) {
  return (
    <Link to={to} className="panel panel-hover p-5 block group">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg leading-none">{icon}</span>
            <span className="heading-md text-base">{name}</span>
          </div>
          <div className="font-mono text-[10px] text-vlad-muted uppercase tracking-widest">{role}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-vlad-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-[12px] text-vlad-sub leading-relaxed mb-4">{desc}</p>
      <div className={cn("font-mono text-[11px] font-bold flex items-center gap-1.5 transition-opacity", accentText)}>
        Chat now <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

// ─── Campaign Stage ───────────────────────────────────────────────────────────
function CampaignStage({ range, title, status }) {
  return (
    <div
      className={cn(
        "flex-1 p-4 rounded-xl border transition-all",
        status === "active"
          ? "border-vlad-ember bg-vlad-surface shadow-[0_0_20px_rgba(224,75,52,0.08)]"
          : "border-vlad-border bg-vlad-bg opacity-50"
      )}
    >
      <div
        className={cn(
          "font-mono text-[9px] font-bold uppercase tracking-widest mb-1.5",
          status === "active" ? "text-vlad-ember" : "text-vlad-muted"
        )}
      >
        {range}
      </div>
      <div
        className={cn(
          "text-[13px] font-bold",
          status === "active" ? "text-vlad-text" : "text-vlad-sub"
        )}
      >
        {title}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  return (
    <div className="space-y-8 pb-12 animate-fade-in">

      {/* Top row */}
      <div className="grid grid-cols-12 gap-4">

        {/* Identity */}
        <div className="col-span-4 panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full border border-vlad-border bg-vlad-surface2 flex items-center justify-center font-display font-bold text-lg text-vlad-text">
                TB
              </div>
              <div>
                <div className="font-display text-xl font-bold text-vlad-text">Topher Bettis</div>
                <div className="font-mono text-[10px] text-vlad-muted uppercase tracking-widest mt-0.5">
                  TopherBettis · Chess.com
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="badge badge-ember">Italian Cage</span>
              <span className="badge badge-ember">Positional</span>
              <span className="badge badge-muted">593 ELO</span>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="section-label">Progress to 2000</span>
              <span className="font-mono text-[11px] font-bold text-vlad-green">+18 last 10</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill bg-vlad-ember" style={{ width: "30%" }} />
            </div>
            <div className="flex justify-between text-[11px] text-vlad-muted font-mono">
              <span>593</span>
              <span>Next: 600</span>
              <span>2000</span>
            </div>
          </div>
        </div>

        {/* Mission Briefing */}
        <div className="col-span-5 panel p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-vlad-ember/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <div className="section-label text-vlad-ember mb-3">Mission Briefing</div>
            <div className="flex items-baseline gap-4 mb-4">
              <span className="metric-big">593</span>
              <span className="text-2xl text-vlad-muted font-bold">→</span>
              <span className="metric-big text-vlad-green">2000</span>
            </div>
            <p className="text-[12px] text-vlad-sub leading-relaxed">
              Gentleman's Assassin system · Italian Cage · Slow positional pressure
              into dual flank attack. Every game: cage first, then load the spring.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-vlad-border/50 flex items-center justify-between">
            <div className="text-[12px] text-vlad-sub">
              <span className="text-vlad-text font-bold">Today:</span> 1 opening review · 10 tactical reps · 1 endgame drill
            </div>
          </div>
        </div>

        {/* Clock */}
        <div className="col-span-3">
          <TacticalClock />
        </div>
      </div>

      {/* Master Mental Loop */}
      <div>
        <div className="section-label mb-3">4-Step Master Mental Loop</div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { n: "1", title: "Opponent Intent",   desc: "What are they threatening? Is the queen safe?" },
            { n: "2", title: "CCT Check",          desc: "Checks · Captures · Threats — in that order." },
            { n: "3", title: "Worst Piece",        desc: "Find it. Move it forward and central." },
            { n: "4", title: "Verify",             desc: "Look away. Return. Blunder check." },
          ].map((step) => (
            <div
              key={step.n}
              className="panel p-4 flex items-start gap-3 group hover:border-vlad-ember/40 transition-colors cursor-default"
            >
              <div className="w-7 h-7 rounded-lg bg-vlad-surface3 flex items-center justify-center font-mono text-[11px] font-bold text-vlad-sub group-hover:bg-vlad-ember group-hover:text-white transition-colors flex-shrink-0">
                {step.n}
              </div>
              <div>
                <div className="text-[12px] font-bold text-vlad-text mb-1">{step.title}</div>
                <div className="text-[11px] text-vlad-muted leading-relaxed">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Track */}
      <div>
        <div className="section-label mb-3">Campaign Track</div>
        <div className="flex items-center gap-2">
          <CampaignStage range="400–600"   title="Beginner"     status="active" />
          <div className="text-vlad-border text-xs font-bold">→</div>
          <CampaignStage range="600–1000"  title="Intermediate" status="locked" />
          <div className="text-vlad-border text-xs font-bold">→</div>
          <CampaignStage range="1000–1400" title="Club Player"  status="locked" />
          <div className="text-vlad-border text-xs font-bold">→</div>
          <CampaignStage range="1400–1800" title="Advanced"     status="locked" />
          <div className="text-vlad-border text-xs font-bold">→</div>
          <CampaignStage range="1800–2000" title="Expert"       status="locked" />
        </div>
      </div>

      {/* Training Modules */}
      <div>
        <div className="section-label mb-3">Training Modules</div>
        <div className="grid grid-cols-3 gap-4">
          <ModuleCard
            to="/autopsy"
            icon={Microscope}
            title="Game Autopsy"
            desc="Upload PGN · 4-coach consensus analysis · Find recurring blunders"
            metric="12 reviews completed"
            hoverBorder="hover:border-vlad-ember/50"
          />
          <ModuleCard
            to="/openings"
            icon={BookOpen}
            title="Opening Lab"
            desc="9-move Gentleman's Assassin system · Response trees · Ask Fabiano"
            metric="41% mastered"
            hoverBorder="hover:border-vlad-amber/50"
          />
          <ModuleCard
            to="/middlegame"
            icon={Crosshair}
            title="Middlegame Mat"
            desc="5 Assassin principles · Load the spring · Deploy the weapon"
            metric="Phase 3 active"
            hoverBorder="hover:border-vlad-blue/50"
          />
          <ModuleCard
            to="/endgame"
            icon={Crown}
            title="Endgame Dojo"
            desc="Conversion discipline · Magnus technique · Clinical practice"
            metric="King+Pawn: 85%"
            hoverBorder="hover:border-vlad-green/50"
          />
          <ModuleCard
            to="/profile"
            icon={User}
            title="My Profile"
            desc="Update your opening, goals, and style preferences"
            metric="Settings"
            hoverBorder="hover:border-vlad-border2"
          />
        </div>
      </div>

      {/* Coaching Staff */}
      <div>
        <div className="section-label mb-3">Coaching Staff</div>
        <div className="grid grid-cols-4 gap-4">
          <CoachCard
            to="/coach/vlad"
            icon="🎖"
            name="Vlad"
            role="Head Coach"
            desc="Principles, discipline, and the Gentleman's Assassin system."
            accentText="text-vlad-ember"
          />
          <CoachCard
            to="/coach/magnus"
            icon="👑"
            name="Magnus"
            role="Endgame Coach"
            desc="Conversion technique, king activity, and endgame precision."
            accentText="text-vlad-green"
          />
          <CoachCard
            to="/coach/hikaru"
            icon="⚡"
            name="Hikaru"
            role="Tactics Coach"
            desc="Pattern recognition, blunder prevention, CCT execution."
            accentText="text-vlad-amber"
          />
          <CoachCard
            to="/coach/fabiano"
            icon="♟"
            name="Fabiano"
            role="Opening Architect"
            desc="Italian theory, Black's responses, and move-order precision."
            accentText="text-vlad-blue"
          />
        </div>
      </div>

    </div>
  );
}
