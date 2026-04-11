import { useState, useEffect } from "react";
import GameAutopsy from "@modules/GameAutopsy.jsx";
import DrillSergeant from "@modules/DrillSergeant.jsx";
import OpeningLab from "@modules/OpeningLab.jsx";
import MiddlegameMat from "@modules/MiddlegameMat.jsx";
import EndgameDojo from "@modules/EndgameDojo.jsx";

// ── Constants ───────────────────────────────────────────────────────────────

const NAV = [
  { id: "dashboard",   label: "Dashboard",       icon: "🏠" },
  { id: "autopsy",     label: "Game Autopsy",    icon: "🔬" },
  { id: "drills",      label: "Drill Sergeant",  icon: "⚔️" },
  { id: "opening",     label: "Opening Lab",     icon: "🏛️" },
  { id: "middlegame",  label: "Middlegame Mat",  icon: "🗡️" },
  { id: "endgame",     label: "Endgame Dojo",    icon: "👑" },
];

const PLAYER = "TopherBettis";
const ELO    = 609;
const TARGET = 2000;

// ── PGN Drop Zone Card ────────────────────────────────────────────────────────

function PgnDropCard({ onNavigate }) {
  const [dragging, setDragging] = useState(false);
  const [pgn, setPgn]           = useState("");
  const [ready, setReady]       = useState(false);

  const load = (text) => {
    if (!text?.trim()) return;
    setPgn(text.trim());
    setReady(true);
  };

  const launch = () => {
    localStorage.setItem("vlad_pending_pgn", pgn);
    onNavigate("autopsy");
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => load(ev.target.result ?? "");
      reader.readAsText(file);
    } else {
      load(e.dataTransfer.getData("text"));
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        navigator.clipboard.readText().then(text => {
          if (text?.trim().startsWith("[") || text?.includes("1.")) load(text);
        }).catch(() => {});
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        ...S.moduleCard,
        borderTop: `3px solid ${ready ? "#27ae60" : dragging ? "#f39c12" : "#c0392b"}`,
        outline: dragging ? "2px dashed #f39c12" : "none",
        backgroundColor: dragging ? "#1a1200" : ready ? "#0a1a0a" : "#111",
        transition: "all 0.2s",
        cursor: "default",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <span style={S.moduleIcon}>{ready ? "✅" : dragging ? "📂" : "🎯"}</span>
      <p style={S.moduleTitle}>{ready ? "PGN Ready" : "Drop PGN Here"}</p>
      <p style={S.moduleDesc}>
        {ready
          ? `${pgn.split("\n").length} lines loaded`
          : dragging ? "Release to load" : "Drag a .pgn file · or Cmd+V"}
      </p>
      {ready && (
        <button
          onClick={launch}
          style={{
            marginTop: 8,
            padding: "8px 16px",
            backgroundColor: "#c0392b",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}
        >
          Game Analysis →
        </button>
      )}
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ onNavigate }) {
  const progress = Math.round(((ELO - 400) / (TARGET - 400)) * 100);

  return (
    <div style={S.dashRoot}>

      {/* Hero */}
      <div style={S.hero}>
        <div style={S.heroLeft}>
          <p style={S.heroGreeting}>MISSION BRIEFING</p>
          <h1 style={S.heroTitle}>
            <span style={{ color: "#c0392b" }}>609</span>
            <span style={S.heroArrow}> → </span>
            <span style={{ color: "#27ae60" }}>2000</span>
          </h1>
          <p style={S.heroSub}>18–24 month campaign · Gentleman Assassin system</p>
        </div>
        <div style={S.heroRight}>
          <p style={S.progressLabel}>CAMPAIGN PROGRESS</p>
          <div style={S.progressTrack}>
            <div style={{ ...S.progressFill, width: `${progress}%` }} />
            <div style={{ ...S.progressMarker, left: `${progress}%` }} />
          </div>
          <div style={S.progressEnds}>
            <span>400</span>
            <span style={{ color: "#e8e8e8", fontWeight: 700 }}>{ELO}</span>
            <span>2000</span>
          </div>
        </div>
      </div>

      {/* Phase tracker */}
      <div style={S.phaseRow}>
        {[
          { range: "609→1000",  label: "Phase 1: Triage",    mission: "Zero hanging pieces",          active: true  },
          { range: "1000→1400", label: "Phase 2: Structure", mission: "Piece activity + structure",   active: false },
          { range: "1400→1800", label: "Phase 3: Weaponize", mission: "Deep prep + technique",        active: false },
          { range: "1800→2000", label: "Phase 4: Mastery",   mission: "Candidate moves + psychology", active: false },
        ].map((phase, i) => (
          <div
            key={i}
            style={{
              ...S.phaseCard,
              border: `1px solid ${phase.active ? "#c0392b" : "#1a1a1a"}`,
              backgroundColor: phase.active ? "#1a0808" : "#0d0d0d",
            }}
          >
            <p style={{ ...S.phaseRange, color: phase.active ? "#c0392b" : "#333" }}>{phase.range}</p>
            <p style={S.phaseLabel}>{phase.label}</p>
            <p style={S.phaseMission}>{phase.mission}</p>
            {phase.active && <span style={S.activeChip}>ACTIVE</span>}
          </div>
        ))}
      </div>

      {/* 4-Step Loop */}
      <div style={S.loopBox}>
        <p style={S.loopTitle}>4-STEP MASTER MENTAL LOOP · Execute before EVERY move</p>
        <div style={S.loopSteps}>
          {[
            { num: "1", label: "OPPONENT'S INTENT", desc: "What does my opponent want? Is my queen safe?" },
            { num: "2", label: "CCT CHECK",          desc: "Checks, Captures, Threats — all of them" },
            { num: "3", label: "LAZY PIECE",         desc: "What is my worst piece? Can this move improve it?" },
            { num: "4", label: "PRE-MOVE VERIFY",    desc: "After I move, can they take anything for free?" },
          ].map(step => (
            <div key={step.num} style={S.loopStep}>
              <span style={S.loopNum}>{step.num}</span>
              <div>
                <p style={S.loopLabel}>{step.label}</p>
                <p style={S.loopDesc}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module cards */}
      <p style={S.sectionTitle}>TRAINING MODULES</p>
      <div style={S.moduleGrid}>
        {[
          { id: "autopsy",    icon: "🔬", title: "Game Autopsy",    desc: "Upload PGN → Stockfish + 3-coach debrief",    color: "#c0392b" },
          { id: "drills",     icon: "⚔️", title: "Drill Sergeant",  desc: "Targeted puzzles from YOUR blunder positions", color: "#e67e22" },
          { id: "opening",    icon: "🏛️", title: "Opening Lab",     desc: "Italian Cage deep prep · Quiz mode",          color: "#2980b9" },
          { id: "middlegame", icon: "🗡️", title: "Middlegame Mat",  desc: "5 Assassin weapons · Hikaru tactical coaching", color: "#f39c12" },
          { id: "endgame",    icon: "👑", title: "Endgame Dojo",    desc: "Magnus-voiced conversion training",           color: "#27ae60" },
        ].map(mod => (
          <div
            key={mod.id}
            style={{ ...S.moduleCard, borderTop: `3px solid ${mod.color}` }}
            onClick={() => onNavigate(mod.id)}
          >
            <span style={S.moduleIcon}>{mod.icon}</span>
            <p style={S.moduleTitle}>{mod.title}</p>
            <p style={S.moduleDesc}>{mod.desc}</p>
            <span style={{ ...S.moduleArrow, color: mod.color }}>→</span>
          </div>
        ))}
        <PgnDropCard onNavigate={onNavigate} />
      </div>

      {/* Coaching team */}
      <p style={S.sectionTitle}>COACHING TEAM</p>
      <div style={S.coachRow}>
        {[
          { emoji: "🎖️", name: "Vlad",    based: "Vladimir Chuchelov", role: "Head Coach · Drill prescription · Weekly plan",    color: "#c0392b" },
          { emoji: "♟️", name: "Fabiano", based: "Fabiano Caruana",    role: "Opening prep · Positional benchmarking",            color: "#2980b9" },
          { emoji: "👑", name: "Magnus",  based: "Magnus Carlsen",     role: "Endgame conversion · Intuition · Reality checks",   color: "#27ae60" },
          { emoji: "⚡", name: "Hikaru",  based: "Hikaru Nakamura",    role: "Middlegame tactics · Attack patterns · 5 weapons",  color: "#f39c12" },
        ].map(coach => (
          <div key={coach.name} style={S.coachCard}>
            <span style={S.coachEmoji}>{coach.emoji}</span>
            <p style={{ ...S.coachName, color: coach.color }}>{coach.name}</p>
            <p style={S.coachBased}>Based on {coach.based}</p>
            <p style={S.coachRole}>{coach.role}</p>
          </div>
        ))}
      </div>

      {/* Weakness alerts */}
      <p style={S.sectionTitle}>ACTIVE WEAKNESS ALERTS</p>
      <div style={S.weaknessList}>
        {[
          { label: "Move 9 Speed Trap",     severity: "CRITICAL", desc: "Mandatory 30-60s pause from move 8 onward" },
          { label: "Panic Simplification",  severity: "HIGH",     desc: "Hold the tension — cage is the advantage" },
          { label: "Queen Sortie Response", severity: "HIGH",     desc: "Develop and Castle. Don't push pawns." },
          { label: "Missing Forcing Moves", severity: "MEDIUM",   desc: "CCT check every move, especially when winning" },
        ].map((w, i) => (
          <div key={i} style={S.weaknessItem}>
            <span style={{
              ...S.severityChip,
              backgroundColor: w.severity === "CRITICAL" ? "#3a0808" : w.severity === "HIGH" ? "#2a1800" : "#1a1a0a",
              color:           w.severity === "CRITICAL" ? "#e74c3c" : w.severity === "HIGH" ? "#f39c12" : "#aaa",
              border: `1px solid ${w.severity === "CRITICAL" ? "#5c1a1a" : w.severity === "HIGH" ? "#5c3a00" : "#333"}`,
            }}>
              {w.severity}
            </span>
            <div>
              <p style={S.weaknessLabel}>{w.label}</p>
              <p style={S.weaknessDesc}>{w.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────

export default function App() {
  const [active, setActive]   = useState("dashboard");
  const [navOpen, setNavOpen] = useState(true);

  const renderContent = () => {
    switch (active) {
      case "dashboard":  return <Dashboard onNavigate={setActive} />;
      case "autopsy":    return <GameAutopsy />;
      case "drills":     return <DrillSergeant />;
      case "opening":    return <OpeningLab />;
      case "middlegame": return <MiddlegameMat />;
      case "endgame":    return <EndgameDojo />;
      default:           return <Dashboard onNavigate={setActive} />;
    }
  };

  return (
    <div style={S.shell}>

      {/* Sidebar */}
      <nav style={{ ...S.nav, width: navOpen ? 220 : 60 }}>

        <div style={S.navLogo} onClick={() => setNavOpen(v => !v)}>
          {navOpen ? (
            <>
              <span style={S.navLogoIcon}>♟️</span>
              <div>
                <p style={S.navLogoTitle}>VLAD</p>
                <p style={S.navLogoSub}>Chess Coach</p>
              </div>
            </>
          ) : (
            <span style={{ fontSize: 24 }}>♟️</span>
          )}
        </div>

        {navOpen && (
          <div style={S.playerChip}>
            <p style={S.playerName}>{PLAYER}</p>
            <p style={S.playerElo}>
              ELO <span style={{ color: "#c0392b", fontWeight: 700 }}>{ELO}</span>
              {" → "}
              <span style={{ color: "#27ae60" }}>{TARGET}</span>
            </p>
          </div>
        )}

        <div style={S.navItems}>
          {NAV.map(item => (
            <button
              key={item.id}
              style={{
                ...S.navItem,
                backgroundColor: active === item.id ? "#1a0808" : "transparent",
                borderLeft: `3px solid ${active === item.id ? "#c0392b" : "transparent"}`,
                justifyContent: navOpen ? "flex-start" : "center",
              }}
              onClick={() => setActive(item.id)}
              title={!navOpen ? item.label : undefined}
            >
              <span style={S.navIcon}>{item.icon}</span>
              {navOpen && (
                <span style={{ ...S.navLabel, color: active === item.id ? "#e8e8e8" : "#666" }}>
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </div>

        {navOpen && (
          <div style={S.navFooter}>
            <p style={S.navFooterText}>609 → 2000</p>
            <p style={S.navFooterSub}>The machine is running.</p>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main style={S.main}>
        {renderContent()}
      </main>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  shell: { display: "flex", height: "100vh", overflow: "hidden" },
  nav: {
    display: "flex", flexDirection: "column",
    backgroundColor: "#080808",
    borderRight: "1px solid #1a1a1a",
    flexShrink: 0,
    transition: "width 0.25s ease",
    overflow: "hidden",
  },
  navLogo: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "20px 16px",
    borderBottom: "1px solid #1a1a1a",
    cursor: "pointer",
  },
  navLogoIcon:  { fontSize: 28, flexShrink: 0 },
  navLogoTitle: { margin: 0, fontSize: 16, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: "#fff", letterSpacing: "2px" },
  navLogoSub:   { margin: 0, fontSize: 10, color: "#444", letterSpacing: "1px" },
  playerChip: {
    margin: "12px 12px 4px",
    padding: "10px 12px",
    backgroundColor: "#111",
    border: "1px solid #222",
    borderRadius: 6,
  },
  playerName: { margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#ccc", fontFamily: "'IBM Plex Mono', monospace" },
  playerElo:  { margin: 0, fontSize: 11, color: "#555", fontFamily: "'IBM Plex Mono', monospace" },
  navItems: { display: "flex", flexDirection: "column", gap: 2, padding: "12px 8px", flex: 1 },
  navItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    transition: "background 0.15s",
    whiteSpace: "nowrap",
  },
  navIcon:  { fontSize: 16, flexShrink: 0 },
  navLabel: { fontSize: 12, transition: "color 0.15s" },
  navFooter: { padding: "14px 16px", borderTop: "1px solid #1a1a1a" },
  navFooterText: { margin: "0 0 2px", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "#c0392b" },
  navFooterSub:  { margin: 0, fontSize: 10, color: "#333", fontFamily: "'IBM Plex Mono', monospace" },
  main: { flex: 1, overflowY: "auto", backgroundColor: "#0d0d0d" },
  dashRoot: {
    display: "flex", flexDirection: "column", gap: 28,
    padding: "32px 36px",
    maxWidth: 1000,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  hero: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-end",
    flexWrap: "wrap", gap: 24,
    paddingBottom: 24,
    borderBottom: "1px solid #1a1a1a",
  },
  heroLeft:     {},
  heroGreeting: { margin: "0 0 6px", fontSize: 10, color: "#444", letterSpacing: "2px" },
  heroTitle:    { margin: "0 0 6px", fontSize: 48, fontWeight: 700, lineHeight: 1, letterSpacing: "-1px" },
  heroArrow:    { color: "#333" },
  heroSub:      { margin: 0, fontSize: 12, color: "#555" },
  heroRight:    { minWidth: 280 },
  progressLabel: { margin: "0 0 8px", fontSize: 9, color: "#444", letterSpacing: "1.5px" },
  progressTrack: {
    position: "relative", height: 8,
    backgroundColor: "#1a1a1a", borderRadius: 4, overflow: "visible",
  },
  progressFill: {
    height: "100%", backgroundColor: "#c0392b",
    borderRadius: 4, transition: "width 1s ease",
  },
  progressMarker: {
    position: "absolute", top: -3,
    width: 14, height: 14,
    backgroundColor: "#c0392b",
    borderRadius: "50%",
    border: "2px solid #0d0d0d",
    transform: "translateX(-50%)",
    transition: "left 1s ease",
  },
  progressEnds: {
    display: "flex", justifyContent: "space-between",
    marginTop: 6, fontSize: 10, color: "#444",
  },
  phaseRow: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 },
  phaseCard: {
    padding: "14px 16px", borderRadius: 8,
    display: "flex", flexDirection: "column", gap: 4,
    position: "relative",
  },
  phaseRange:   { margin: 0, fontSize: 11, fontWeight: 700 },
  phaseLabel:   { margin: 0, fontSize: 13, color: "#ccc", fontWeight: 600 },
  phaseMission: { margin: 0, fontSize: 10, color: "#555", lineHeight: 1.5 },
  activeChip: {
    position: "absolute", top: 10, right: 10,
    padding: "2px 6px",
    backgroundColor: "#3a0808",
    color: "#e74c3c",
    fontSize: 8,
    borderRadius: 2,
    letterSpacing: "1px",
  },
  loopBox: {
    padding: "20px",
    backgroundColor: "#080808",
    border: "1px solid #1a1a1a",
    borderRadius: 8,
  },
  loopTitle: { margin: "0 0 14px", fontSize: 9, color: "#444", letterSpacing: "1.5px" },
  loopSteps: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 },
  loopStep:  { display: "flex", alignItems: "flex-start", gap: 10 },
  loopNum: {
    width: 24, height: 24, borderRadius: 4,
    backgroundColor: "#c0392b", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  loopLabel: { margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: "#ccc" },
  loopDesc:  { margin: 0, fontSize: 10, color: "#555", lineHeight: 1.5 },
  sectionTitle: { margin: 0, fontSize: 10, color: "#444", letterSpacing: "1.5px" },
  moduleGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 },
  moduleCard: {
    padding: "18px 16px",
    backgroundColor: "#111",
    borderRadius: 8,
    cursor: "pointer",
    display: "flex", flexDirection: "column", gap: 6,
    transition: "background 0.2s",
    position: "relative",
  },
  moduleIcon:  { fontSize: 28 },
  moduleTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: "#ccc" },
  moduleDesc:  { margin: 0, fontSize: 11, color: "#555", lineHeight: 1.5, flex: 1 },
  moduleArrow: { fontSize: 18, fontWeight: 700, alignSelf: "flex-end" },
  coachRow: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 },
  coachCard: {
    padding: "16px",
    backgroundColor: "#111",
    border: "1px solid #1a1a1a",
    borderRadius: 8,
    display: "flex", flexDirection: "column", gap: 4,
  },
  coachEmoji: { fontSize: 28 },
  coachName:  { margin: 0, fontSize: 15, fontWeight: 700 },
  coachBased: { margin: 0, fontSize: 10, color: "#444" },
  coachRole:  { margin: 0, fontSize: 11, color: "#666", lineHeight: 1.5 },
  weaknessList: { display: "flex", flexDirection: "column", gap: 10 },
  weaknessItem: {
    display: "flex", alignItems: "flex-start", gap: 14,
    padding: "12px 14px",
    backgroundColor: "#0d0d0d",
    border: "1px solid #1a1a1a",
    borderRadius: 6,
  },
  severityChip:  { padding: "3px 8px", borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: "1px", flexShrink: 0, marginTop: 2 },
  weaknessLabel: { margin: "0 0 2px", fontSize: 13, color: "#ccc", fontWeight: 600 },
  weaknessDesc:  { margin: 0, fontSize: 11, color: "#555" },
};
