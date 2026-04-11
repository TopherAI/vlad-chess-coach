/**
 * src/modules/GameAutopsy.jsx
 * vlad-chess-coach — Game Autopsy Module
 *
 * Full pipeline:
 *   PGN upload → chess.js parse → Stockfish analysis → Vlad/Fabiano/Magnus debrief
 *
 * Dependencies (load in index.html before React bundle):
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js"></script>
 *   Gemini API via src/api/gemini.js
 *   Stockfish engine via src/engine/stockfish.js
 *   Coach personas via src/coaches/vlad.jsx, fabiano.js, magnus.js
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { analyzeGame, terminateEngine, getClassificationColor, buildVladContext } from "../engine/stockfish.js";
import { askVlad } from "../coaches/vlad.jsx";
import { askFabiano } from "../coaches/fabiano.jsx";
import { askMagnus } from "../coaches/magnus.jsx";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLAYER = "TopherBettis";
const STORAGE_KEY = "vlad_last_autopsy";

const COACH_META = {
  vlad:    { name: "Vlad",    emoji: "🎖️", title: "Head Coach",         color: "#c0392b" },
  fabiano: { name: "Fabiano", emoji: "♟️", title: "Positional Analysis", color: "#2980b9" },
  magnus:  { name: "Magnus",  emoji: "👑", title: "Endgame & Intuition", color: "#27ae60" },
};

const CLASSIFICATION_LABELS = {
  best:        { label: "Best",        symbol: "★" },
  excellent:   { label: "Excellent",   symbol: "✦" },
  good:        { label: "Good",        symbol: "●" },
  inaccuracy:  { label: "Inaccuracy",  symbol: "?!" },
  mistake:     { label: "Mistake",     symbol: "?" },
  blunder:     { label: "Blunder",     symbol: "??" },
};

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function saveAutopsy(pgn, gameInfo, analysis, coaches) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pgn, gameInfo, analysis, coaches, savedAt: Date.now() }));
  } catch { /* storage full or unavailable — fail silently */ }
}

function loadAutopsy() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Utility — parse PGN with chess.js
// ---------------------------------------------------------------------------

function parsePGN(pgn) {
  if (typeof Chess === "undefined") {
    throw new Error("chess.js not loaded. Add CDN script to index.html.");
  }
  const game = new Chess();
  const loaded = game.load_pgn(pgn);
  if (!loaded) throw new Error("Invalid PGN — could not parse.");

  const history = game.history({ verbose: true });
  const moves   = history.map(m => m.from + m.to + (m.promotion ?? ""));

  const white  = game.header().White  ?? "Unknown";
  const black  = game.header().Black  ?? "Unknown";
  const result = game.header().Result ?? "*";
  const date   = game.header().Date   ?? "";
  const event  = game.header().Event  ?? "";

  const playerSide =
    white.toLowerCase().includes(PLAYER.toLowerCase()) ? "white" :
    black.toLowerCase().includes(PLAYER.toLowerCase()) ? "black" :
    "white";

  return { moves, white, black, result, date, event, playerSide, pgn };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AccuracyRing({ accuracy }) {
  const radius = 36;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (accuracy / 100) * circ;
  const color  = accuracy >= 85 ? "#27ae60" : accuracy >= 70 ? "#f39c12" : "#e74c3c";

  return (
    <div style={styles.accuracyRing}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#2a2a2a" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={{ ...styles.accuracyLabel, color }}>
        <span style={styles.accuracyNum}>{accuracy}%</span>
        <span style={styles.accuracyText}>Accuracy</span>
      </div>
    </div>
  );
}

function MoveRow({ move, isSelected, onClick }) {
  const cls   = CLASSIFICATION_LABELS[move.classification] ?? CLASSIFICATION_LABELS.good;
  const color = getClassificationColor(move.classification);
  const evalStr = move.mate != null
    ? `M${Math.abs(move.mate)}`
    : move.evalAfter != null
    ? (move.evalAfter >= 0 ? "+" : "") + (move.evalAfter / 100).toFixed(2)
    : "—";

  return (
    <div
      style={{
        ...styles.moveRow,
        backgroundColor: isSelected ? "#1e2a1e" : "transparent",
        borderLeft: `3px solid ${isSelected ? color : "transparent"}`,
      }}
      onClick={onClick}
    >
      <span style={styles.moveNum}>{move.moveNumber}{move.side === "white" ? "." : "…"}</span>
      <span style={styles.moveUCI}>{move.actualMove}</span>
      <span style={{ ...styles.moveBadge, backgroundColor: color + "22", color }}>
        {cls.symbol} {cls.label}
      </span>
      <span style={styles.moveEval}>{evalStr}</span>
    </div>
  );
}

function CoachCard({ coachKey, response, loading }) {
  const meta = COACH_META[coachKey];
  return (
    <div style={styles.coachCard}>
      <div style={{ ...styles.coachHeader, borderBottom: `2px solid ${meta.color}33` }}>
        <span style={styles.coachEmoji}>{meta.emoji}</span>
        <div>
          <div style={{ ...styles.coachName, color: meta.color }}>{meta.name}</div>
          <div style={styles.coachTitle}>{meta.title}</div>
        </div>
        {loading && <div style={styles.coachSpinner} />}
      </div>
      <div style={styles.coachBody}>
        {loading ? (
          <div style={styles.coachLoading}>
            <div style={styles.loadingDots}><span /><span /><span /></div>
          </div>
        ) : response ? (
          <p style={styles.coachText}>{response}</p>
        ) : (
          <p style={styles.coachPlaceholder}>Waiting for analysis…</p>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={styles.statPill}>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function AnalysisProgress({ current, total, phase }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div style={styles.progressWrap}>
      <div style={styles.progressPhase}>{phase}</div>
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${pct}%` }} />
      </div>
      <div style={styles.progressPct}>{pct}% — move {current} of {total}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function GameAutopsy() {
  const [phase, setPhase]               = useState("idle");
  const [pgn, setPgn]                   = useState("");
  const [gameInfo, setGameInfo]         = useState(null);
  const [analysis, setAnalysis]         = useState(null);
  const [progress, setProgress]         = useState({ current: 0, total: 0 });
  const [selectedMove, setSelectedMove] = useState(null);
  const [coaches, setCoaches]           = useState({ vlad: null, fabiano: null, magnus: null });
  const [coachLoading, setCoachLoading] = useState({ vlad: false, fabiano: false, magnus: false });
  const [errorMsg, setErrorMsg]         = useState("");
  const [activeTab, setActiveTab]       = useState("moves");
  const [restoredFrom, setRestoredFrom] = useState(null);

  const fileRef    = useRef(null);
  const runBtnRef  = useRef(null);

  // ---- On mount: check for pending PGN from dashboard drop zone, else restore last game ----
  useEffect(() => {
    const pending = localStorage.getItem("vlad_pending_pgn");
    if (pending) {
      localStorage.removeItem("vlad_pending_pgn");
      setPgn(pending);
      setPhase("idle");
      // Auto-trigger after state settles
      setTimeout(() => {
        runBtnRef.current?.click();
      }, 150);
      return;
    }

    const saved = loadAutopsy();
    if (saved?.analysis && saved?.gameInfo) {
      setPgn(saved.pgn ?? "");
      setGameInfo(saved.gameInfo);
      setAnalysis(saved.analysis);
      setCoaches(saved.coaches ?? { vlad: null, fabiano: null, magnus: null });
      setRestoredFrom(saved.savedAt);
      setPhase("done");
    }
  }, []);

  // ---- File upload handler ----
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPgn(ev.target.result ?? "");
    reader.readAsText(file);
  }, []);

  // ---- Reset to new PGN entry ----
  const startNewPGN = useCallback(() => {
    setPgn("");
    setPhase("idle");
    setAnalysis(null);
    setGameInfo(null);
    setCoaches({ vlad: null, fabiano: null, magnus: null });
    setSelectedMove(null);
    setRestoredFrom(null);
  }, []);

  // ---- Main analysis pipeline ----
  const runAutopsy = useCallback(async (pgnOverride) => {
    const target = (typeof pgnOverride === "string" ? pgnOverride : pgn).trim();
    if (!target) return;

    setPhase("parsing");
    setAnalysis(null);
    setCoaches({ vlad: null, fabiano: null, magnus: null });
    setErrorMsg("");
    setSelectedMove(null);
    setRestoredFrom(null);

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
    setProgress({ current: 0, total: parsed.moves.length });

    let gameAnalysis;
    try {
      gameAnalysis = await analyzeGame(parsed.moves, {
        depth: 14,
        onProgress: (curr, total) => setProgress({ current: curr, total }),
      });
      setAnalysis(gameAnalysis);
    } catch (err) {
      setErrorMsg("Stockfish analysis failed: " + err.message);
      setPhase("error");
      return;
    }

    // ---- Fire all 3 coaches in parallel ----
    setPhase("coaching");
    setCoachLoading({ vlad: true, fabiano: true, magnus: true });

    const vladContext  = buildVladContext(gameAnalysis, parsed.playerSide);
    const gameContext  = { ...parsed, summary: gameAnalysis.summary };
    const finalCoaches = { vlad: null, fabiano: null, magnus: null };

    const fireCoach = async (key, fn) => {
      try {
        const resp = await fn(vladContext, gameContext);
        finalCoaches[key] = resp;
        setCoaches(prev => ({ ...prev, [key]: resp }));
      } catch (err) {
        const msg = `[${key} unavailable: ${err.message}]`;
        finalCoaches[key] = msg;
        setCoaches(prev => ({ ...prev, [key]: msg }));
      } finally {
        setCoachLoading(prev => ({ ...prev, [key]: false }));
      }
    };

    await Promise.all([
      fireCoach("vlad",    askVlad),
      fireCoach("fabiano", askFabiano),
      fireCoach("magnus",  askMagnus),
    ]);

    saveAutopsy(target, parsed, gameAnalysis, finalCoaches);
    setPhase("done");
  }, [pgn]);

  const criticalMoves = analysis?.moves?.filter(m =>
    ["blunder", "mistake"].includes(m.classification)
  ) ?? [];

  const savedDate = restoredFrom
    ? new Date(restoredFrom).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={styles.root}>

      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🔬</span>
          <div>
            <h1 style={styles.headerTitle}>Game Autopsy</h1>
            <p style={styles.headerSub}>Post-mortem analysis · Vlad · Fabiano · Magnus</p>
          </div>
        </div>
        {gameInfo && phase === "done" && (
          <div style={styles.headerMeta}>
            <span style={styles.metaChip}>{gameInfo.white} vs {gameInfo.black}</span>
            <span style={styles.metaChip}>{gameInfo.result}</span>
            {gameInfo.date && <span style={styles.metaChip}>{gameInfo.date}</span>}
          </div>
        )}
      </div>

      {/* ── Restored Banner ── */}
      {restoredFrom && phase === "done" && (
        <div style={styles.restoredBanner}>
          <span>📂 Last game restored — {savedDate}</span>
          <button style={styles.btnSmall} onClick={startNewPGN}>＋ Analyze New PGN</button>
        </div>
      )}

      {/* ── Upload Zone ── */}
      {phase === "idle" && (
        <div style={styles.uploadZone} onClick={() => fileRef.current?.click()}>
          <input
            ref={fileRef}
            type="file"
            accept=".pgn"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <div style={styles.uploadIcon}>♟️</div>
          <p style={styles.uploadTitle}>Drop your PGN file here</p>
          <p style={styles.uploadSub}>or click to browse</p>
          {pgn && (
            <div style={styles.uploadLoaded}>
              ✅ PGN loaded — {pgn.split("\n").length} lines · ready to analyze
            </div>
          )}
        </div>
      )}

      {/* ── PGN textarea + Run button ── */}
      {phase === "idle" && (
        <div style={styles.pasteSection}>
          <textarea
            style={styles.pgnInput}
            placeholder="…or paste PGN directly here (Cmd+V from dashboard also lands here)"
            value={pgn}
            onChange={e => setPgn(e.target.value)}
            rows={5}
          />
          <button
            ref={runBtnRef}
            style={{ ...styles.btn, opacity: pgn.trim() ? 1 : 0.4 }}
            disabled={!pgn.trim()}
            onClick={runAutopsy}
          >
            Game Analysis →
          </button>
        </div>
      )}

      {/* ── Progress ── */}
      {(phase === "parsing" || phase === "analyzing" || phase === "coaching") && (
        <div style={styles.progressSection}>
          <AnalysisProgress
            current={progress.current}
            total={progress.total}
            phase={
              phase === "parsing"   ? "Parsing PGN…" :
              phase === "analyzing" ? "Stockfish analyzing moves…" :
              "Coaching team assembling debrief…"
            }
          />
        </div>
      )}

      {/* ── Error ── */}
      {phase === "error" && (
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>⚠️</span>
          <span>{errorMsg}</span>
          <button style={styles.btnSmall} onClick={() => setPhase("idle")}>Try Again</button>
        </div>
      )}

      {/* ── Results ── */}
      {(phase === "coaching" || phase === "done") && analysis && (
        <div style={styles.results}>
          <div style={styles.summaryRow}>
            <AccuracyRing accuracy={analysis.summary.accuracy} />
            <div style={styles.statRow}>
              <StatPill label="Blunders"     value={analysis.summary.blunders}     color="#e74c3c" />
              <StatPill label="Mistakes"     value={analysis.summary.mistakes}     color="#e67e22" />
              <StatPill label="Inaccuracies" value={analysis.summary.inaccuracies} color="#f39c12" />
              <StatPill label="Total Moves"  value={analysis.summary.totalMoves}   color="#95a5a6" />
            </div>
          </div>

          <div style={styles.tabs}>
            {["moves", "coaches", "critical"].map(tab => (
              <button
                key={tab}
                style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "moves"   ? "📋 Move List" :
                 tab === "coaches" ? "🎓 Coaches" :
                                    `🚨 Critical (${criticalMoves.length})`}
              </button>
            ))}
          </div>

          {activeTab === "moves" && (
            <div style={styles.moveList}>
              {analysis.moves.map((move, i) => (
                <MoveRow
                  key={i}
                  move={move}
                  isSelected={selectedMove === i}
                  onClick={() => setSelectedMove(i === selectedMove ? null : i)}
                />
              ))}
            </div>
          )}

          {activeTab === "coaches" && (
            <div style={styles.coachGrid}>
              {Object.keys(COACH_META).map(key => (
                <CoachCard
                  key={key}
                  coachKey={key}
                  response={coaches[key]}
                  loading={coachLoading[key]}
                />
              ))}
            </div>
          )}

          {activeTab === "critical" && (
            <div style={styles.criticalList}>
              {criticalMoves.length === 0 ? (
                <p style={styles.noCritical}>Clean game — no blunders or mistakes. 💪</p>
              ) : (
                criticalMoves.map((move, i) => {
                  const color = getClassificationColor(move.classification);
                  const cls   = CLASSIFICATION_LABELS[move.classification];
                  return (
                    <div key={i} style={{ ...styles.criticalCard, borderLeft: `4px solid ${color}` }}>
                      <div style={styles.criticalHeader}>
                        <span style={{ ...styles.criticalBadge, color, backgroundColor: color + "22" }}>
                          {cls.symbol} {cls.label}
                        </span>
                        <span style={styles.criticalMove}>
                          Move {move.moveNumber}{move.side === "white" ? "." : "…"} {move.actualMove}
                        </span>
                        <span style={styles.criticalCpLoss}>−{move.cpLoss}cp</span>
                      </div>
                      <div style={styles.criticalDetail}>
                        <span>Best was: <strong style={{ color: "#27ae60" }}>{move.bestMove}</strong></span>
                        <span style={styles.criticalEval}>
                          Eval after: {move.evalAfter >= 0 ? "+" : ""}{(move.evalAfter / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {phase === "done" && !restoredFrom && (
            <button
              style={{ ...styles.btn, marginTop: 24, alignSelf: "flex-start" }}
              onClick={startNewPGN}
            >
              ＋ Analyze Another Game
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    padding: "28px 32px",
    minHeight: "100vh",
    backgroundColor: "#0d0d0d",
    color: "#e8e8e8",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    maxWidth: 900,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    borderBottom: "1px solid #222",
    paddingBottom: 20,
  },
  headerLeft:  { display: "flex", alignItems: "center", gap: 14 },
  headerIcon:  { fontSize: 36 },
  headerTitle: { margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#fff" },
  headerSub:   { margin: "2px 0 0", fontSize: 12, color: "#666", letterSpacing: "0.5px" },
  headerMeta:  { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  metaChip: {
    padding: "4px 10px",
    borderRadius: 4,
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    fontSize: 11,
    color: "#aaa",
    letterSpacing: "0.3px",
  },
  restoredBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    backgroundColor: "#0f1f0f",
    border: "1px solid #1a3a1a",
    borderRadius: 6,
    fontSize: 12,
    color: "#4a9a4a",
  },
  uploadZone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "48px 32px",
    border: "2px dashed #333",
    borderRadius: 8,
    cursor: "pointer",
    transition: "border-color 0.2s",
    backgroundColor: "#111",
  },
  uploadIcon:   { fontSize: 48 },
  uploadTitle:  { margin: 0, fontSize: 18, color: "#ccc" },
  uploadSub:    { margin: 0, fontSize: 13, color: "#555" },
  uploadLoaded: { marginTop: 8, padding: "6px 14px", backgroundColor: "#1a2e1a", borderRadius: 4, fontSize: 12, color: "#27ae60" },
  pasteSection: { display: "flex", flexDirection: "column", gap: 12 },
  pgnInput: {
    width: "100%",
    backgroundColor: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 6,
    padding: "12px 14px",
    color: "#ccc",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
  },
  btn: {
    padding: "12px 24px",
    backgroundColor: "#c0392b",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.5px",
    transition: "background 0.2s",
    alignSelf: "flex-start",
  },
  btnSmall: {
    padding: "6px 14px",
    backgroundColor: "#1a3a1a",
    color: "#4a9a4a",
    border: "1px solid #2a5a2a",
    borderRadius: 4,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  progressSection: { padding: "24px 0" },
  progressWrap:    { display: "flex", flexDirection: "column", gap: 8 },
  progressPhase:   { fontSize: 13, color: "#aaa", letterSpacing: "0.5px" },
  progressBar:     { height: 6, backgroundColor: "#1a1a1a", borderRadius: 3, overflow: "hidden" },
  progressFill:    { height: "100%", backgroundColor: "#c0392b", borderRadius: 3, transition: "width 0.3s ease" },
  progressPct:     { fontSize: 11, color: "#555" },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 20px",
    backgroundColor: "#1f0a0a",
    border: "1px solid #5c1a1a",
    borderRadius: 6,
    fontSize: 13,
    color: "#e74c3c",
  },
  errorIcon: { fontSize: 20 },
  results:    { display: "flex", flexDirection: "column", gap: 20 },
  summaryRow: { display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" },
  accuracyRing: { position: "relative", width: 96, height: 96, flexShrink: 0 },
  accuracyLabel: {
    position: "absolute", top: 0, left: 0,
    width: "100%", height: "100%",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
  },
  accuracyNum:  { fontSize: 18, fontWeight: 700, lineHeight: 1 },
  accuracyText: { fontSize: 9, color: "#666", letterSpacing: "0.5px", marginTop: 2 },
  statRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  statPill: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "10px 16px",
    backgroundColor: "#111",
    border: "1px solid #222",
    borderRadius: 6,
    minWidth: 72,
  },
  statValue: { fontSize: 22, fontWeight: 700 },
  statLabel: { fontSize: 10, color: "#555", marginTop: 2, letterSpacing: "0.5px" },
  tabs: { display: "flex", gap: 0, borderBottom: "1px solid #222" },
  tab: {
    padding: "10px 20px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#555",
    fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace",
    cursor: "pointer",
    letterSpacing: "0.5px",
    transition: "color 0.2s",
  },
  tabActive: {
    color: "#e8e8e8",
    borderBottom: "2px solid #c0392b",
  },
  moveList: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    maxHeight: 480,
    overflowY: "auto",
  },
  moveRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 12px",
    borderRadius: 4,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  moveNum:   { width: 40, fontSize: 11, color: "#555", flexShrink: 0 },
  moveUCI:   { width: 60, fontSize: 13, fontWeight: 600, color: "#ccc", letterSpacing: "0.5px" },
  moveBadge: { padding: "2px 8px", borderRadius: 3, fontSize: 11, letterSpacing: "0.3px" },
  moveEval:  { marginLeft: "auto", fontSize: 11, color: "#666", fontVariantNumeric: "tabular-nums" },
  coachGrid: { display: "flex", flexDirection: "column", gap: 16 },
  coachCard: {
    backgroundColor: "#111",
    border: "1px solid #222",
    borderRadius: 8,
    overflow: "hidden",
  },
  coachHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    backgroundColor: "#141414",
  },
  coachEmoji:       { fontSize: 28 },
  coachName:        { fontSize: 16, fontWeight: 700 },
  coachTitle:       { fontSize: 11, color: "#555", letterSpacing: "0.5px" },
  coachSpinner:     { marginLeft: "auto", width: 16, height: 16, border: "2px solid #333", borderTop: "2px solid #c0392b", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  coachBody:        { padding: "16px 18px" },
  coachText:        { margin: 0, fontSize: 13, lineHeight: 1.8, color: "#ccc" },
  coachPlaceholder: { margin: 0, fontSize: 12, color: "#444", fontStyle: "italic" },
  coachLoading:     { display: "flex", justifyContent: "center", padding: "16px 0" },
  loadingDots:      { display: "flex", gap: 6 },
  criticalList: { display: "flex", flexDirection: "column", gap: 12 },
  noCritical:   { color: "#27ae60", fontSize: 14, padding: "16px 0" },
  criticalCard: {
    padding: "14px 16px",
    backgroundColor: "#111",
    border: "1px solid #222",
    borderRadius: 6,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  criticalHeader:  { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  criticalBadge:   { padding: "3px 10px", borderRadius: 3, fontSize: 12, fontWeight: 700 },
  criticalMove:    { fontSize: 14, fontWeight: 600, color: "#ccc" },
  criticalCpLoss:  { marginLeft: "auto", fontSize: 12, color: "#e74c3c" },
  criticalDetail:  { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666" },
  criticalEval:    { color: "#555" },
};
