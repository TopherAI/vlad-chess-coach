import { useState, useEffect, useRef } from "react";
import GameAutopsy from "./modules/GameAutopsy.jsx";
import DrillSergeant from "./modules/DrillSergeant.jsx";
import OpeningLab from "./modules/OpeningLab.jsx";
import MiddlegameMat from "./modules/MiddlegameMat.jsx";
import EndgameDojo from "./modules/EndgameDojo.jsx";

// ── Constants ─────────────────────────────────────────────────────────────────

const NAV = [
  { id: "dashboard",  label: "Dashboard",      icon: "🏠" },
  { id: "profile",    label: "Profile",         icon: "👤" },
  { id: "autopsy",    label: "Game Autopsy",   icon: "🔬" },
  { id: "drills",     label: "Drill Sergeant", icon: "⚔️" },
  { id: "opening",    label: "Opening Lab",    icon: "🏛️" },
  { id: "middlegame", label: "Middlegame Mat", icon: "🗡️" },
  { id: "endgame",    label: "Endgame Dojo",   icon: "👑" },
];

const TARGET = 2000;

// ── Chess stages (no belts) ───────────────────────────────────────────────────

const STAGES = [
  { min: 0,    max: 600,  range: "400-600",   label: "Beginner",      mission: "Fundamentals & pattern recognition", color: "#aaaaaa" },
  { min: 600,  max: 1000, range: "600-1000",  label: "Intermediate",  mission: "No blunders - Piece triage",         color: "#3498db" },
  { min: 1000, max: 1400, range: "1000-1400", label: "Club Player",   mission: "Piece activity - Pawn structure",    color: "#9b59b6" },
  { min: 1400, max: 1800, range: "1400-1800", label: "Advanced",      mission: "Deep prep - Technique",              color: "#c8932a" },
  { min: 1800, max: 2000, range: "1800-2000", label: "Expert",        mission: "Candidate moves - Precision",        color: "#1abc9c" },
];

function getStage(elo) {
  return STAGES.find(s => elo >= s.min && elo < s.max) || STAGES[0];
}

// ── Default profile ───────────────────────────────────────────────────────────

const DEFAULT_PROFILE = {
  name: "Topher Bettis",
  email: "",
  goal: "Reach 2000 ELO",
  style: "Positional",
  openingWhite: "Gentleman's Assassin (Italian/Giuoco Pianissimo)",
  openingBlack: "",
};

// ── Game Clock ────────────────────────────────────────────────────────────────

function GameClock() {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTime, setSelectedTime] = useState(30);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
  };

  const playBeep = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const beep = (offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(880, ctx.currentTime + offset);
      gain.gain.setValueAtTime(0.05, ctx.currentTime + offset);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.15);
    };
    beep(0); beep(0.2);
  };

  const startTimer = () => {
    if (isRunning) return;
    initAudio();
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); setIsRunning(false); playBeep(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => { clearInterval(timerRef.current); setIsRunning(false); };
  const resetTimer = () => { clearInterval(timerRef.current); setIsRunning(false); setTimeLeft(selectedTime); };

  const handleTimeChange = (e) => {
    const t = parseInt(e.target.value, 10);
    setSelectedTime(t); setTimeLeft(t); pauseTimer();
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
      <p style={{ margin: 0, fontSize: 10, color: "#c0392b", letterSpacing: "1.5px", fontWeight: 700 }}>TACTICAL CLOCK</p>
      <div style={{ fontSize: 40, fontWeight: 700, color: timeLeft <= 5 && timeLeft > 0 ? "#e74c3c" : "#e8e8e8", fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1 }}>
        {fmt(timeLeft)}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <select value={selectedTime} onChange={handleTimeChange} style={{ backgroundColor: "#111", color: "#aaa", border: "1px solid #333", padding: "4px 6px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, outline: "none" }}>
          <option value={30}>30s</option>
          <option value={60}>1m</option>
          <option value={120}>2m</option>
          <option value={300}>5m</option>
        </select>
        <button onClick={isRunning ? pauseTimer : startTimer} style={{ ...S.btnSmall, backgroundColor: isRunning ? "#c0392b" : "#27ae60", color: "#fff", borderColor: isRunning ? "#c0392b" : "#27ae60" }}>
          {isRunning ? "Pause" : "Start"}
        </button>
        <button onClick={resetTimer} style={{ ...S.btnSmall, backgroundColor: "#222", color: "#ccc", borderColor: "#333" }}>
          Reset
        </button>
      </div>
    </div>
  );
}

// ── PGN Drop Card ─────────────────────────────────────────────────────────────

function PgnDropCard({ onNavigate }) {
  const [dragging, setDragging] = useState(false);
  const [pgn, setPgn] = useState("");
  const [ready, setReady] = useState(false);

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
        display: "flex", flexDirection: "column", gap: 8,
        height: "100%", justifyContent: "center",
      }}
    >
      <p style={{ margin: 0, fontSize: 10, color: ready ? "#27ae60" : "#c0392b", letterSpacing: "1.5px", fontWeight: 700 }}>
        {ready ? "PGN READY" : "DROP PGN"}
      </p>
      <p style={{ margin: 0, fontSize: 11, color: "#555" }}>
        {ready ? `${pgn.split("\n").length} lines loaded` : dragging ? "Release to load" : "Drag .pgn · Cmd+V"}
      </p>
      {ready ? (
        <button onClick={launch} style={{ ...S.btnSmall, backgroundColor: "#c0392b", color: "#fff", borderColor: "#c0392b", marginTop: 4 }}>
          Analyze →
        </button>
      ) : (
        <span style={{ fontSize: 28 }}>{dragging ? "📂" : "🎯"}</span>
      )}
    </div>
  );
}

// ── Profile Page ──────────────────────────────────────────────────────────────

function ProfilePage({ profile, onSave }) {
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const initials = form.name ? form.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "TB";

  return (
    <div style={S.profileRoot}>
      <div style={S.profileHeader}>
        <div style={S.profileAvatar}>{initials}</div>
        <div>
          <h1 style={S.profileName}>{form.name || "Your Name"}</h1>
          <p style={S.profileSub}>Player Profile · vlad-chess-coach</p>
        </div>
      </div>

      <div style={S.profileGrid}>
        {[
          { label: "FULL NAME",              field: "name",          placeholder: "Topher Bettis" },
          { label: "EMAIL",                  field: "email",         placeholder: "you@example.com" },
          { label: "GOAL",                   field: "goal",          placeholder: "Reach 2000 ELO" },
          { label: "STYLE OF PLAY",          field: "style",         placeholder: "Positional / Tactical / Universal" },
          { label: "PREFERRED OPENING (WHITE)", field: "openingWhite", placeholder: "Gentleman's Assassin" },
          { label: "PREFERRED OPENING (BLACK)", field: "openingBlack", placeholder: "e.g. Sicilian, French..." },
        ].map(({ label, field, placeholder }) => (
          <div key={field} style={S.profileField}>
            <label style={S.profileLabel}>{label}</label>
            <input
              style={S.profileInput}
              value={form[field]}
              placeholder={placeholder}
              onChange={e => handleChange(field, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button style={{ ...S.profileSaveBtn, backgroundColor: saved ? "#27ae60" : "#c0392b" }} onClick={handleSave}>
        {saved ? "✓ Saved" : "Save Profile"}
      </button>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard({ onNavigate, currentElo, profile }) {
  const stage = getStage(currentElo);
  const progress = Math.round(((currentElo - 400) / (TARGET - 400)) * 100);
  const initials = profile.name ? profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "TB";

  return (
    <div style={S.dashRoot}>

      {/* ── TOP PROFILE CHIP ── */}
      <div style={S.profileChip}>
        <div style={S.profileChipAvatar}>{initials}</div>
        <div style={S.profileChipInfo}>
          <span style={S.profileChipName}>{profile.name || "TopherBettis"}</span>
          <span style={S.profileChipDetail}>{profile.openingWhite || "Gentleman's Assassin"} · {profile.style || "Positional"}</span>
        </div>
        <div style={{ ...S.profileChipElo, color: stage.color }}>
          <span style={S.profileChipEloNum}>{currentElo}</span>
          <span style={S.profileChipEloLabel}>{stage.label.toUpperCase()}</span>
        </div>
      </div>

      {/* ── HERO — 3 EQUAL COLUMNS ── */}
      <div style={S.hero}>

        {/* Col 1 — Mission */}
        <div style={S.heroCol}>
          <p style={S.heroGreeting}>MISSION BRIEFING</p>
          <h1 style={S.heroTitle}>
            <span style={{ color: stage.color }}>{currentElo}</span>
            <span style={{ color: "#333" }}> → </span>
            <span style={{ color: "#27ae60" }}>2000</span>
          </h1>
          <p style={S.heroSub}>The Italian-Spanish System<br />"The Gentleman Assassin"</p>
        </div>

        {/* Col 2 — Clock */}
        <div style={S.heroCol}>
          <GameClock />
        </div>

        {/* Col 3 — PGN Drop */}
        <div style={S.heroCol}>
          <PgnDropCard onNavigate={onNavigate} />
        </div>

      </div>

      {/* ── 4-STEP LOOP — above stages ── */}
      <div style={S.loopBox}>
        <p style={S.loopTitle}>4-STEP MASTER MENTAL LOOP · Execute before EVERY move</p>
        <div style={S.loopSteps}>
          {[
            { num: "1", label: "OPPONENT'S INTENT", desc: "What does my opponent want? Is my queen safe?" },
            { num: "2", label: "CCT CHECK",          desc: "Checks, Captures, Threats" },
            { num: "3", label: "LAZY PIECE",          desc: "Move my worst piece. Forward & central." },
            { num: "4", label: "PRE-MOVE VERIFY",     desc: "Look away. Is this move a blunder?" },
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

      {/* ── STAGE TRACKER ── */}
      <p style={S.sectionTitle}>CAMPAIGN STAGE</p>
      <div style={S.stageRow}>
        {STAGES.map((s, i) => {
          const isActive = currentElo >= s.min && currentElo < s.max;
          const isComplete = currentElo >= s.max;
          return (
            <div key={i} style={{ ...S.stageCard, border: `1px solid ${isActive ? s.color : "#1a1a1a"}`, backgroundColor: isActive ? `${s.color}15` : "#0d0d0d", opacity: isComplete ? 0.5 : 1 }}>
              <p style={{ ...S.stageRange, color: isActive || isComplete ? s.color : "#555" }}>{s.range}</p>
              <p style={{ ...S.stageLabel, color: isActive || isComplete ? s.color : "#888" }}>
                {s.label}{isComplete ? " ✓" : ""}
              </p>
              <p style={S.stageMission}>{s.mission}</p>
              {isActive && <span style={{ ...S.activeChip, backgroundColor: s.color }}>ACTIVE</span>}
            </div>
          );
        })}
      </div>

      {/* ── MODULES 3×2 ── */}
      <p style={S.sectionTitle}>TRAINING MODULES</p>
      <div style={S.moduleGrid}>
        {[
          { id: "autopsy",    icon: "🔬", title: "Game Autopsy",   desc: "Upload PGN → AI consensus debrief",        color: "#c0392b" },
          { id: "drills",     icon: "⚔️", title: "Drill Sergeant", desc: "Targeted puzzles from your blunders",      color: "#e67e22" },
          { id: "opening",    icon: "🏛️", title: "Opening Lab",    desc: "Gentleman's Assassin · 9-move system",     color: "#2980b9" },
          { id: "middlegame", icon: "🗡️", title: "Middlegame Mat", desc: "5 Assassin weapons · Hikaru coaching",     color: "#f39c12" },
          { id: "endgame",    icon: "👑", title: "Endgame Dojo",   desc: "Magnus-voiced conversion training",        color: "#27ae60" },
          { id: "profile",    icon: "👤", title: "My Profile",     desc: "Style · openings · goals",                 color: "#9b59b6" },
        ].map(mod => (
          <div key={mod.id} style={{ ...S.moduleCard, borderTop: `3px solid ${mod.color}` }} onClick={() => onNavigate(mod.id)}>
            <span style={S.moduleIcon}>{mod.icon}</span>
            <p style={S.moduleTitle}>{mod.title}</p>
            <p style={S.moduleDesc}>{mod.desc}</p>
            <span style={{ ...S.moduleArrow, color: mod.color }}>→</span>
          </div>
        ))}
      </div>

      {/* ── COACHING TEAM ── */}
      <p style={S.sectionTitle}>COACHING TEAM</p>
      <div style={S.coachRow}>
        {[
          { emoji: "🎖️", name: "Vlad",    based: "Vladimir Chuchelov", role: "Opening system · Week review · Long-term plan", color: "#c0392b", url: "https://www.youtube.com/results?search_query=Vladimir+Chuchelov+chess" },
          { emoji: "♟️", name: "Fabiano", based: "Fabiano Caruana",    role: "Positional perfection · Structure",              color: "#2980b9", url: "https://www.youtube.com/results?search_query=Fabiano+Caruana+best+games" },
          { emoji: "⚡", name: "Hikaru",  based: "Hikaru Nakamura",    role: "Middlegame tactics · 5 weapons · Attack",        color: "#f39c12", url: "https://www.youtube.com/results?search_query=Hikaru+Nakamura+best+games" },
          { emoji: "👑", name: "Magnus",  based: "Magnus Carlsen",     role: "Endgame conversion · Intuition",                 color: "#27ae60", url: "https://www.youtube.com/results?search_query=Magnus+Carlsen+best+games" },
        ].map(coach => (
          <a key={coach.name} href={coach.url} target="_blank" rel="noopener noreferrer" style={{ ...S.coachCard, textDecoration: "none" }}>
            <span style={S.coachEmoji}>{coach.emoji}</span>
            <p style={{ ...S.coachName, color: coach.color }}>{coach.name}</p>
            <p style={S.coachBased}>Based on {coach.based}</p>
            <p style={S.coachRole}>{coach.role}</p>
            <span style={{ ...S.coachLink, color: coach.color }}>Watch games →</span>
          </a>
        ))}
      </div>

    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────

export default function App() {
  const [active, setActive]     = useState("dashboard");
  const [navOpen, setNavOpen]   = useState(true);
  const [currentElo, setCurrentElo] = useState(617);
  const [profile, setProfile]   = useState(() => {
    try {
      const saved = localStorage.getItem("vlad_profile");
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch { return DEFAULT_PROFILE; }
  });

  useEffect(() => {
    const fetchElo = async () => {
      try {
        const res = await fetch("https://api.chess.com/pub/player/topherbettis/stats");
        const data = await res.json();
        const elo = data?.chess_rapid?.last?.rating || 617;
        setCurrentElo(elo);
      } catch { /* keep default */ }
    };
    fetchElo();
  }, []);

  const handleSaveProfile = (updated) => {
    setProfile(updated);
    localStorage.setItem("vlad_profile", JSON.stringify(updated));
  };

  const stage = getStage(currentElo);

  const renderContent = () => {
    switch (active) {
      case "dashboard":  return <Dashboard onNavigate={setActive} currentElo={currentElo} profile={profile} />;
      case "profile":    return <ProfilePage profile={profile} onSave={handleSaveProfile} />;
      case "autopsy":    return <GameAutopsy />;
      case "drills":     return <DrillSergeant />;
      case "opening":    return <OpeningLab />;
      case "middlegame": return <MiddlegameMat />;
      case "endgame":    return <EndgameDojo />;
      default:           return <Dashboard onNavigate={setActive} currentElo={currentElo} profile={profile} />;
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
              <div style={S.navTitleContainer}>
                <div style={S.navLogoTitle}>
                  <span>V</span><span>L</span><span>A</span><span>D</span>
                </div>
                <div style={S.navLogoSub}>CHESS COACH</div>
              </div>
            </>
          ) : (
            <span style={{ fontSize: 24 }}>♟️</span>
          )}
        </div>

        {navOpen && (
          <div style={S.playerChip}>
            <p style={S.playerName}>TopherBettis</p>
            <p style={S.playerElo}>
              ELO <span style={{ color: stage.color, fontWeight: 700 }}>{currentElo}</span>
              {" → "}
              <span style={{ color: "#27ae60" }}>{TARGET}</span>
            </p>
            <p style={{ ...S.playerStage, color: stage.color }}>{stage.label}</p>
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
            <p style={{ ...S.navFooterText, color: stage.color }}>{currentElo} → 2000</p>
            <p style={S.navFooterSub}>{stage.label} · The machine is running.</p>
          </div>
        )}
      </nav>

      {/* Main */}
      <main style={S.main}>{renderContent()}</main>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  shell:   { display: "flex", height: "100vh", overflow: "hidden" },
  nav: {
    display: "flex", flexDirection: "column",
    backgroundColor: "#080808", borderRight: "1px solid #1a1a1a",
    flexShrink: 0, transition: "width 0.25s ease", overflow: "hidden",
  },
  navLogo: { display: "flex", alignItems: "center", gap: 10, padding: "20px 16px", borderBottom: "1px solid #1a1a1a", cursor: "pointer" },
  navLogoIcon: { fontSize: 52, flexShrink: 0 },
  navTitleContainer: { display: "flex", flexDirection: "column", justifyContent: "center" },
  navLogoTitle: { margin: "0 0 2px", fontSize: 30, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: "#fff", display: "flex", justifyContent: "space-between", lineHeight: 1 },
  navLogoSub:   { margin: 0, fontSize: 10, color: "#666", letterSpacing: "1px", lineHeight: 1.4, whiteSpace: "nowrap" },
  playerChip: { margin: "12px 12px 4px", padding: "10px 12px", backgroundColor: "#111", border: "1px solid #222", borderRadius: 6 },
  playerName:  { margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#ccc", fontFamily: "'IBM Plex Mono', monospace" },
  playerElo:   { margin: "0 0 2px", fontSize: 11, color: "#555", fontFamily: "'IBM Plex Mono', monospace" },
  playerStage: { margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "1px", fontFamily: "'IBM Plex Mono', monospace" },
  navItems: { display: "flex", flexDirection: "column", gap: 2, padding: "12px 8px", flex: 1 },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, transition: "background 0.15s", whiteSpace: "nowrap" },
  navIcon:  { fontSize: 16, flexShrink: 0 },
  navLabel: { fontSize: 12, transition: "color 0.15s" },
  navFooter: { padding: "14px 16px", borderTop: "1px solid #1a1a1a" },
  navFooterText: { margin: "0 0 2px", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" },
  navFooterSub:  { margin: 0, fontSize: 10, color: "#333", fontFamily: "'IBM Plex Mono', monospace" },
  main: { flex: 1, overflowY: "auto", backgroundColor: "#0d0d0d" },

  // Dashboard
  dashRoot: { display: "flex", flexDirection: "column", gap: 28, padding: "28px 32px", maxWidth: 1000, fontFamily: "'IBM Plex Mono', monospace" },

  // Profile chip at top of dashboard
  profileChip: { display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", backgroundColor: "#111", border: "1px solid #222", borderRadius: 8 },
  profileChipAvatar: { width: 40, height: 40, borderRadius: "50%", backgroundColor: "#1a0808", border: "1px solid #c0392b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#c0392b", flexShrink: 0 },
  profileChipInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 3 },
  profileChipName: { fontSize: 13, fontWeight: 700, color: "#ccc" },
  profileChipDetail: { fontSize: 10, color: "#555" },
  profileChipElo: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 },
  profileChipEloNum: { fontSize: 22, fontWeight: 700, lineHeight: 1 },
  profileChipEloLabel: { fontSize: 9, letterSpacing: "1.5px" },

  // Hero — 3 equal columns
  hero: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, paddingBottom: 24, borderBottom: "1px solid #1a1a1a" },
  heroCol: { display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 },
  heroGreeting: { margin: 0, fontSize: 10, color: "#444", letterSpacing: "2px" },
  heroTitle:    { margin: 0, fontSize: 44, fontWeight: 700, lineHeight: 1, letterSpacing: "-1px" },
  heroSub:      { margin: 0, fontSize: 11, color: "#555", lineHeight: 1.6 },

  // 4-step loop
  loopBox:   { padding: "20px", backgroundColor: "#080808", border: "1px solid #1a1a1a", borderRadius: 8 },
  loopTitle: { margin: "0 0 14px", fontSize: 10, color: "#fff", letterSpacing: "1.5px" },
  loopSteps: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 },
  loopStep:  { display: "flex", alignItems: "flex-start", gap: 10 },
  loopNum:   { width: 24, height: 24, borderRadius: 4, backgroundColor: "#c0392b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  loopLabel: { margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: "#ccc" },
  loopDesc:  { margin: 0, fontSize: 10, color: "#555", lineHeight: 1.5 },

  // Stage tracker
  sectionTitle: { margin: 0, fontSize: 10, color: "#444", letterSpacing: "1.5px" },
  stageRow: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 },
  stageCard: { padding: "14px 16px", borderRadius: 8, display: "flex", flexDirection: "column", gap: 4, position: "relative" },
  stageRange:   { margin: 0, fontSize: 11, fontWeight: 700 },
  stageLabel:   { margin: 0, fontSize: 13, fontWeight: 600 },
  stageMission: { margin: 0, fontSize: 10, color: "#555", lineHeight: 1.5 },
  activeChip: { position: "absolute", top: 10, right: 10, padding: "2px 6px", fontSize: 8, borderRadius: 2, letterSpacing: "1px", fontWeight: 700, color: "#fff" },

  // Modules 3×2
  moduleGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 },
  moduleCard: { padding: "18px 16px", backgroundColor: "#111", borderRadius: 8, cursor: "pointer", display: "flex", flexDirection: "column", gap: 6, transition: "background 0.2s", position: "relative" },
  moduleIcon:  { fontSize: 26 },
  moduleTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: "#ccc" },
  moduleDesc:  { margin: 0, fontSize: 11, color: "#555", lineHeight: 1.5, flex: 1 },
  moduleArrow: { fontSize: 18, fontWeight: 700, alignSelf: "flex-end" },

  // Coaches
  coachRow: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 },
  coachCard: { padding: "16px", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: 8, display: "flex", flexDirection: "column", gap: 4, cursor: "pointer", transition: "border-color 0.2s" },
  coachEmoji: { fontSize: 26 },
  coachName:  { margin: 0, fontSize: 15, fontWeight: 700 },
  coachBased: { margin: 0, fontSize: 10, color: "#444" },
  coachRole:  { margin: 0, fontSize: 11, color: "#666", lineHeight: 1.5, flex: 1 },
  coachLink:  { fontSize: 10, fontWeight: 700, marginTop: 4 },

  // Profile page
  profileRoot: { display: "flex", flexDirection: "column", gap: 28, padding: "32px 36px", maxWidth: 600, fontFamily: "'IBM Plex Mono', monospace" },
  profileHeader: { display: "flex", alignItems: "center", gap: 18, paddingBottom: 24, borderBottom: "1px solid #1a1a1a" },
  profileAvatar: { width: 64, height: 64, borderRadius: "50%", backgroundColor: "#1a0808", border: "2px solid #c0392b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#c0392b", flexShrink: 0 },
  profileName:   { margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#fff" },
  profileSub:    { margin: 0, fontSize: 11, color: "#555" },
  profileGrid:   { display: "flex", flexDirection: "column", gap: 16 },
  profileField:  { display: "flex", flexDirection: "column", gap: 6 },
  profileLabel:  { fontSize: 9, color: "#c0392b", letterSpacing: "1.5px", fontWeight: 700 },
  profileInput:  { padding: "10px 14px", backgroundColor: "#111", border: "1px solid #222", color: "#e8e8e8", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", outline: "none" },
  profileSaveBtn: { padding: "14px", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, transition: "background 0.2s" },

  // Shared
  btnSmall: { padding: "5px 12px", border: "1px solid", borderRadius: 4, fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 },
};
