/**
 * src/modules/GameAutopsy.jsx
 * vlad-chess-coach — Game Autopsy Module (Refined Consensus Edition)
 * * MISSION: Restore Enter-key firing and fix the Coach Handshake.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { askVlad } from "../coaches/vlad.jsx";
import { askFabiano } from "../coaches/fabiano.jsx";
import { askMagnus } from "../coaches/magnus.jsx";
import { askHikaru } from "../coaches/hikaru.jsx";

const ITALIAN_CAGE_PLAN = {
  "1w": "e4",   "1b": "e5",
  "2w": "Nf3",  "2b": "Nc6",
  "3w": "Bc4",  "3b": "Bc5",
  "4w": "c3",   "4b": "Nf6",
  "5w": "d3",   "5b": "d6",
  "6w": "O-O",  "6b": "O-O",
  "7w": "Re1",  "7b": "a6",
  "8w": "Bb3",  "8b": "Ba7",
  "9w": "h3",   "9b": "h6",
  "10w": "Nbd2",
};

const PLAYER       = "TopherBettis";
const STORAGE_KEY  = "vlad_last_autopsy";
const CRITICAL_KEY = "vlad_critical_list";

const COACH_META = {
  vlad:    { name: "Vlad",    emoji: "🎖️", title: "Head Coach",          color: "#c0392b" },
  fabiano: { name: "Fabiano", emoji: "♟️", title: "Opening Architect",   color: "#2980b9" },
  hikaru:  { name: "Hikaru",  emoji: "⚡", title: "Middlegame Expert",   color: "#f39c12" },
  magnus:  { name: "Magnus",  emoji: "👑", title: "Endgame Specialist", color: "#27ae60" },
};

const TABS = [
  { id: "coaches",  label: ()  => "🎓 Coaches" },
  { id: "critical", label: (n) => `🚨 Critical (${n})` },
  { id: "moves",    label: ()  => "📋 Move List" },
];

// ── Persistence ─────────────────────────────────────────────────────────────

function saveAutopsy(pgn, gameInfo, analysis, coaches) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      pgn, gameInfo, analysis, coaches, savedAt: Date.now(),
    }));
  } catch { /* fail silently */ }
}

function loadAutopsy() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCriticalList(gameInfo, criticalMoves) {
  try {
    const record = {
      savedAt: Date.now(),
      game: gameInfo
        ? `${gameInfo.white} vs ${gameInfo.black} (${gameInfo.result}) ${gameInfo.date}`
        : "Unknown game",
      moves: criticalMoves,
    };
    localStorage.setItem(CRITICAL_KEY, JSON.stringify(record));
  } catch { /* fail silently */ }
}

// ── PGN Parsing ─────────────────────────────────────────────────────────────

function parsePGN(pgn) {
  if (typeof Chess === "undefined") {
    throw new Error("chess.js not loaded. Check index.html.");
  }
  const game = new Chess();
  const loaded = game.load_pgn(pgn);
  if (!loaded) throw new Error("Invalid PGN format.");

  const white  = game.header().White  ?? "Unknown";
  const black  = game.header().Black  ?? "Unknown";
  const result = game.header().Result ?? "*";
  const date   = game.header().Date   ?? "";
  
  const playerSide = white.toLowerCase().includes(PLAYER.toLowerCase()) ? "white" : "black";

  const sanMoves = game.history();
  const moves = [];
  const replay = new Chess();
  
  for (let i = 0; i < sanMoves.length; i++) {
    const moveObj = replay.move(sanMoves[i]);
    moves.push({
      moveNumber: Math.floor(i / 2) + 1,
      side: i % 2 === 0 ? "white" : "black",
      actualMove: moveObj.san,
      uci: moveObj.from + moveObj.to,
      fen: replay.fen(),
    });
  }

  return { moves, white, black, result, date, playerSide, pgn };
}

function isGmDeviation(moveNumber, side, sanMove) {
  const key = `${moveNumber}${side === "white" ? "w" : "b"}`;
  const expected = ITALIAN_CAGE_PLAN[key];
  return expected && sanMove !== expected;
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function GameAutopsy() {
  const [phase, setPhase]               = useState("idle");
  const [pgn, setPgn]                    = useState("");
  const [gameInfo, setGameInfo]         = useState(null);
  const [analysis, setAnalysis]         = useState(null);
  const [coaches, setCoaches]           = useState({ vlad: null, fabiano: null, magnus: null, hikaru: null });
  const [coachLoading, setCoachLoading] = useState({ vlad: false, fabiano: false, magnus: false, hikaru: false });
  const [activeTab, setActiveTab]       = useState("coaches");
  const [errorMsg, setErrorMsg]         = useState("");

  const runBtnRef = useRef(null);

  // ── Persistence & Pending ──────────────────────────────────────────────────
  useEffect(() => {
    const pending = localStorage.getItem("vlad_pending_pgn");
    if (pending) {
      localStorage.removeItem("vlad_pending_pgn");
      setPgn(pending);
      // Short timeout to ensure state settles before firing
      setTimeout(() => runBtnRef.current?.click(), 100);
      return;
    }
    const saved = loadAutopsy();
    if (saved) {
      setPgn(saved.pgn || "");
      setGameInfo(saved.gameInfo);
      setAnalysis(saved.analysis);
      setCoaches(saved.coaches || {});
      setPhase("done");
    }
  }, []);

  // ── The Fix: Keyboard Firing Protocol ──────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Stop newline
      if (pgn.trim() && phase === "idle") {
        runAutopsy();
      }
    }
  };

  const startNewPGN = () => {
    setPgn("");
    setPhase("idle");
    setAnalysis(null);
    setGameInfo(null);
  };

  const runAutopsy = useCallback(async () => {
    const target = pgn.trim();
    if (!target) return;

    setErrorMsg("");
    setPhase("parsing");

    let parsed;
    try {
      parsed = parsePGN(target);
      setGameInfo(parsed);
    } catch (err) {
      setErrorMsg(err.message);
      setPhase("error");
      return;
    }

    setPhase("analyzing");

    // Phase 1: Super AI Consensus Engine
    let criticalMoves = [];
    try {
      const consensusPrompt = `VLAD Super AI Consensus Engine Request:
Analyze PGN for ${PLAYER} (${parsed.playerSide}):
${target}

Identify the 2-3 most critical turning points. Check 4-Step Loop violations.
Return ONLY a JSON array:
[
  {
    "moveNumber": 10, "side": "white", "actualMove": "d4",
    "vlad": "Principles critique", "fabiano": "Positional critique", 
    "hikaru": "Tactical critique", "magnus": "Intuition critique",
    "superAI": "Final Consensus Synthesis"
  }
]`;
      
      // Use Magnus as the intuition engine for consensus
      const rawRes = await askMagnus({ accuracy: 0 }, { pgn: consensusPrompt });
      const cleanJSON = rawRes.replace(/```json|```/g, "").trim();
      criticalMoves = JSON.parse(cleanJSON);
    } catch (err) {
      console.error("Consensus breach", err);
    }

    const gameAnalysis = {
      moves: parsed.moves,
      critical: criticalMoves,
      summary: { totalMoves: parsed.moves.length, deviations: parsed.moves.filter(m => isGmDeviation(m.moveNumber, m.side, m.actualMove)).length },
    };

    setAnalysis(gameAnalysis);
    saveCriticalList(parsed, criticalMoves);

    // Phase 2: Coach Handshakes
    setPhase("coaching");
    setCoachLoading({ vlad: true, fabiano: true, magnus: true, hikaru: true });

    const context = { accuracy: 80, blunders: 1, mistakes: 2, totalMoves: parsed.moves.length, playerSide: parsed.playerSide };
    
    // Call individual specialized coach modules
    const results = await Promise.allSettled([
      askVlad(context, parsed),
      askFabiano(context, parsed),
      askHikaru(context, parsed),
      askMagnus(context, parsed),
    ]);

    const finalCoaches = {
      vlad: results[0].status === "fulfilled" ? results[0].value : "Communications failure.",
      fabiano: results[1].status === "fulfilled" ? results[1].value : "Communications failure.",
      hikaru: results[2].status === "fulfilled" ? results[2].value : "Communications failure.",
      magnus: results[3].status === "fulfilled" ? results[3].value : "Communications failure.",
    };

    setCoaches(finalCoaches);
    setCoachLoading({ vlad: false, fabiano: false, magnus: false, hikaru: false });
    saveAutopsy(target, parsed, gameAnalysis, finalCoaches);
    setPhase("done");
  }, [pgn]);

  // ── Render Logic ──────────────────────────────────────────────────────────

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🔬</span>
          <div>
            <h1 style={styles.headerTitle}>Game Autopsy</h1>
            <p style={styles.headerSub}>AI Consensus Engine · Gentleman Assassin Protocol</p>
          </div>
        </div>
      </div>

      {phase === "idle" && (
        <div style={styles.inputSection}>
          <textarea
            style={styles.pgnInput}
            placeholder="Paste PGN here... [Enter] to analyze"
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={6}
          />
          <button
            ref={runBtnRef}
            style={{ ...styles.btn, opacity: pgn.trim() ? 1 : 0.4 }}
            disabled={!pgn.trim()}
            onClick={runAutopsy}
          >
            Run Operation →
          </button>
        </div>
      )}

      {phase !== "idle" && phase !== "done" && phase !== "error" && (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <p>{phase === "analyzing" ? "Super AI Consensus in progress..." : "Engaging Coaching Team..."}</p>
        </div>
      )}

      {phase === "error" && (
        <div style={styles.errorBox}>
          <p>⚠️ {errorMsg}</p>
          <button style={styles.btnSmall} onClick={() => setPhase("idle")}>Retry</button>
        </div>
      )}

      {phase === "done" && (
        <div style={styles.results}>
          <div style={styles.tabs}>
            {TABS.map(t => (
              <button
                key={t.id}
                style={{ ...styles.tab, ...(activeTab === t.id ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label(analysis?.critical.length || 0)}
              </button>
            ))}
            <button style={styles.btnNew} onClick={startNewPGN}>＋ New</button>
          </div>

          {activeTab === "coaches" && (
            <div style={styles.coachGrid}>
              {Object.keys(COACH_META).map(key => (
                <div key={key} style={styles.coachCard}>
                  <div style={{ ...styles.coachHeader, borderBottom: `2px solid ${COACH_META[key].color}33` }}>
                    <span style={styles.coachEmoji}>{COACH_META[key].emoji}</span>
                    <span style={{ color: COACH_META[key].color, fontWeight: 700 }}>{COACH_META[key].name}</span>
                  </div>
                  <p style={styles.coachText}>{coaches[key] || "Analyzing..."}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "critical" && (
            <div style={styles.criticalList}>
              {analysis?.critical.map((m, i) => (
                <div key={i} style={styles.criticalCard}>
                  <div style={styles.criticalHeader}>
                    Move {m.moveNumber} {m.actualMove} — Consensus Verdict
                  </div>
                  <p style={styles.superAiText}><strong>SUPER AI:</strong> {m.superAI}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  root: { display: "flex", flexDirection: "column", gap: 24, padding: "28px 32px", minHeight: "100vh", backgroundColor: "#0d0d0d", color: "#e8e8e8", fontFamily: "'IBM Plex Mono', monospace", maxWidth: 900, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", borderBottom: "1px solid #222", paddingBottom: 20 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  headerIcon: { fontSize: 36 },
  headerTitle: { margin: 0, fontSize: 26, fontWeight: 700, color: "#fff" },
  headerSub: { margin: "2px 0 0", fontSize: 12, color: "#666" },
  inputSection: { display: "flex", flexDirection: "column", gap: 12 },
  pgnInput: { width: "100%", backgroundColor: "#111", border: "1px solid #2a2a2a", borderRadius: 6, padding: "14px", color: "#ccc", fontSize: 13, outline: "none", resize: "none" },
  btn: { padding: "12px 24px", backgroundColor: "#c0392b", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" },
  loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 0" },
  spinner: { width: 30, height: 30, border: "3px solid #333", borderTop: "3px solid #c0392b", borderRadius: "50%", animation: "spin 1s linear infinite" },
  errorBox: { padding: "16px", backgroundColor: "#1a0a0a", border: "1px solid #5c1a1a", borderRadius: 6, color: "#e74c3c" },
  results: { display: "flex", flexDirection: "column", gap: 20 },
  tabs: { display: "flex", gap: 0, borderBottom: "1px solid #222", position: "relative" },
  tab: { padding: "10px 20px", background: "none", border: "none", borderBottom: "2px solid transparent", color: "#555", fontSize: 12, cursor: "pointer" },
  tabActive: { color: "#fff", borderBottom: "2px solid #c0392b" },
  btnNew: { position: "absolute", right: 0, bottom: 8, padding: "4px 10px", backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 4, color: "#aaa", fontSize: 11, cursor: "pointer" },
  coachGrid: { display: "flex", flexDirection: "column", gap: 16 },
  coachCard: { backgroundColor: "#111", border: "1px solid #222", borderRadius: 8, overflow: "hidden" },
  coachHeader: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", backgroundColor: "#151515" },
  coachEmoji: { fontSize: 24 },
  coachText: { padding: "16px", margin: 0, fontSize: 13, lineHeight: 1.6, color: "#ccc" },
  criticalList: { display: "flex", flexDirection: "column", gap: 12 },
  criticalCard: { padding: "16px", backgroundColor: "#111", borderLeft: "4px solid #f39c12", borderRadius: 4 },
  criticalHeader: { fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#f39c12" },
  superAiText: { margin: 0, fontSize: 13, lineHeight: 1.5 },
  btnSmall: { marginTop: 10, padding: "6px 12px", backgroundColor: "#222", border: "none", color: "#eee", cursor: "pointer", borderRadius: 4 }
};
