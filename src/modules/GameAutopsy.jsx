/**
 * src/modules/GameAutopsy.jsx
 * vlad-chess-coach — Game Autopsy Module (v4.0 Clean Build)
 * Auto-loads PGN from localStorage (set by Dashboard PGN drop).
 * No manual paste box. Results only.
 */

import { useState, useCallback, useEffect } from "react";
import askVlad from "../coaches/vlad.jsx";
import askFabiano from "../coaches/fabiano.jsx";
import askHikaru from "../coaches/hikaru.jsx";
import askMagnus from "../coaches/magnus.jsx";

const PLAYER       = "TopherBettis";
const STORAGE_KEY  = "vlad_autopsy_save";
const CRITICAL_KEY = "vlad_critical_list";
const PENDING_KEY  = "vlad_pending_pgn";

const COACH_META = {
  vlad:    { name: "Vlad",    emoji: "🎖️", title: "Head Coach - Week Review",  color: "#c0392b" },
  fabiano: { name: "Fabiano", emoji: "♟️", title: "Opening Architect",          color: "#2980b9" },
  hikaru:  { name: "Hikaru",  emoji: "⚡", title: "Middlegame & Tactics",       color: "#f39c12" },
  magnus:  { name: "Magnus",  emoji: "👑", title: "Endgame & Intuition",        color: "#27ae60" },
};

const ITALIAN_CAGE_PLAN = {
  "1w": "e4",   "1b": "e5",
  "2w": "Nf3",  "2b": "Nc6",
  "3w": "Bc4",  "3b": "Bc5",
  "4w": "c3",   "4b": "Nf6",
  "5w": "d3",   "5b": "d6",
  "6w": "O-O",  "6b": "O-O",
  "7w": "Re1",  "7b": "a6",
  "8w": "h3",   "8b": "h6",
  "9w": "Nbd2", "9b": "Ba7",
};

function saveAutopsy(pgn, gameInfo, analysis, coaches) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ pgn, gameInfo, analysis, coaches, savedAt: Date.now() })); } catch {}
}

function loadAutopsy() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

function saveCriticalList(gameInfo, criticalMoves) {
  try { localStorage.setItem(CRITICAL_KEY, JSON.stringify({ game: `${gameInfo.white} vs ${gameInfo.black}`, moves: criticalMoves, savedAt: Date.now() })); } catch {}
}

function isGmDeviation(moveNumber, side, sanMove) {
  const key = `${moveNumber}${side === "white" ? "w" : "b"}`;
  const expected = ITALIAN_CAGE_PLAN[key];
  return expected && sanMove !== expected;
}

function parsePGN(pgn) {
  if (typeof Chess === "undefined") throw new Error("chess.js not loaded. Check index.html.");
  const game = new Chess();
  if (!game.load_pgn(pgn.trim())) throw new Error("Invalid PGN format.");
  const white      = game.header().White  ?? "Unknown";
  const black      = game.header().Black  ?? "Unknown";
  const result     = game.header().Result ?? "*";
  const date       = game.header().Date   ?? "";
  const playerSide = white.toLowerCase().includes(PLAYER.toLowerCase()) ? "white" : "black";
  const moves = game.history({ verbose: true }).map((h, i) => ({
    moveNumber: Math.floor(i / 2) + 1,
    side:       i % 2 === 0 ? "white" : "black",
    actualMove: h.san,
  }));
  return { moves, white, black, result, date, playerSide, pgn };
}

function CoachCard({ coachKey, response, loading }) {
  const meta = COACH_META[coachKey];
  return (
    <div style={S.coachCard}>
      <div style={{ ...S.coachHeader, borderBottom: `2px solid ${meta.color}33` }}>
        <span style={S.coachEmoji}>{meta.emoji}</span>
        <div>
          <div style={{ ...S.coachName, color: meta.color }}>{meta.name}</div>
          <div style={S.coachTitle}>{meta.title}</div>
        </div>
        {loading && <div style={S.spinnerSmall} />}
      </div>
      <div style={S.coachBody}>
        {loading ? <p style={S.placeholder}>Analyzing...</p>
          : response ? <p style={S.coachText}>{response}</p>
          : <p style={S.placeholder}>Awaiting analysis...</p>}
      </div>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={S.statPill}>
      <span style={{ ...S.statValue, color }}>{value}</span>
      <span style={S.statLabel}>{label}</span>
    </div>
  );
}

export default function GameAutopsy() {
  const [phase, setPhase]               = useState("idle");
  const [pgn, setPgn]                   = useState("");
  const [gameInfo, setGameInfo]         = useState(null);
  const [analysis, setAnalysis]         = useState(null);
  const [coaches, setCoaches]           = useState({});
  const [coachLoading, setCoachLoading] = useState({});
  const [errorMsg, setErrorMsg]         = useState("");
  const [activeTab, setActiveTab]       = useState("coaches");
  const [restoredAt, setRestoredAt]     = useState(null);

  const runAutopsyWithPgn = useCallback(async (pgnInput) => {
    const target = pgnInput.trim();
    if (!target) return;

    setPgn(target);
    setPhase("parsing");
    setAnalysis(null);
    setCoaches({});
    setCoachLoading({});
    setErrorMsg("");
    setActiveTab("coaches");

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

    let criticalMoves = [];
    try {
      const consensusPrompt = `You are the VLAD Super AI Consensus Engine. Analyze this chess game for ${PLAYER} (playing ${parsed.playerSide}): ${target}

Identify the 2-3 most critical turning points relative to the Gentleman's Assassin Italian Pianissimo system. Check for 4-Step Mental Loop violations.

Return ONLY a valid JSON array, no markdown:
[{"moveNumber": 12, "side": "white", "actualMove": "d4", "vlad": "critique", "fabiano": "critique", "hikaru": "critique", "magnus": "critique", "superAI": "synthesis"}]`;
      const raw = await askMagnus(consensusPrompt);
      criticalMoves = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch (err) {
      console.error("Consensus error:", err);
    }

    const deviations = parsed.moves.filter(m => isGmDeviation(m.moveNumber, m.side, m.actualMove)).length;
    const gameAnalysis = {
      moves: parsed.moves,
      critical: criticalMoves,
      summary: { totalMoves: parsed.moves.length, deviations, criticalCount: criticalMoves.length },
    };
    setAnalysis(gameAnalysis);
    saveCriticalList(parsed, criticalMoves);

    setPhase("coaching");
    setCoachLoading({ vlad: true, fabiano: true, hikaru: true, magnus: true });

    const ctx = `Game: ${parsed.white} vs ${parsed.black} (${parsed.result}). ${PLAYER} played ${parsed.playerSide}. Moves: ${parsed.moves.length}. GM deviations: ${deviations}. PGN: ${target}`;

    const fire = async (key, fn, prompt) => {
      try {
        const resp = await fn(prompt);
        setCoaches(prev => ({ ...prev, [key]: resp }));
      } catch {
        setCoaches(prev => ({ ...prev, [key]: "Analysis unavailable." }));
      } finally {
        setCoachLoading(prev => ({ ...prev, [key]: false }));
      }
    };

    await Promise.all([
      fire("vlad",    askVlad,    `Vlad, review this game for ${PLAYER}. Italian Cage execution, long-term plan, 4-Step Loop. ${ctx}`),
      fire("fabiano", askFabiano, `Fabiano, positional critique for ${PLAYER}. Where was positional perfection lost? ${ctx}`),
      fire("hikaru",  askHikaru,  `Hikaru, what tactical shots were missed or misplayed? Fast and direct. ${ctx}`),
      fire("magnus",  askMagnus,  `Magnus, intuitive read on this game for ${PLAYER}. Key turning point? ${ctx}`),
    ]);

    saveAutopsy(target, parsed, gameAnalysis, {});
    setPhase("done");
  }, []);

  useEffect(() => {
    const pending = localStorage.getItem(PENDING_KEY);
    if (pending) {
      localStorage.removeItem(PENDING_KEY);
      runAutopsyWithPgn(pending);
      return;
    }
    const saved = loadAutopsy();
    if (saved?.gameInfo && saved?.analysis) {
      setPgn(saved.pgn || "");
      setGameInfo(saved.gameInfo);
      setAnalysis(saved.analysis);
      setCoaches(saved.coaches || {});
      setRestoredAt(saved.savedAt);
      setPhase("done");
    }
  }, [runAutopsyWithPgn]);

  const startNew = () => {
    setPgn(""); setPhase("idle"); setAnalysis(null);
    setGameInfo(null); setCoaches({}); setRestoredAt(null); setErrorMsg("");
  };

  const criticalList = analysis?.critical ?? [];

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.headerLeft}>
          <span style={S.headerIcon}>🔬</span>
          <div>
            <h1 style={S.headerTitle}>Game Autopsy</h1>
            <p style={S.headerSub}>Super AI Consensus · Vlad · Fabiano · Hikaru · Magnus</p>
          </div>
        </div>
        {gameInfo && (
          <div style={S.headerMeta}>
            <span style={S.metaChip}>{gameInfo.white} vs {gameInfo.black}</span>
            <span style={S.metaChip}>{gameInfo.result}</span>
            {phase === "done" && <button style={S.btnSmall} onClick={startNew}>+ New Game</button>}
          </div>
        )}
      </div>

      {phase === "idle" && (
        <div style={S.emptyState}>
          <span style={{ fontSize: 52 }}>🎯</span>
          <p style={S.emptyTitle}>No game loaded</p>
          <p style={S.emptySub}>Drop a PGN file on the Dashboard to begin. Your autopsy will appear here automatically.</p>
        </div>
      )}

      {(phase === "parsing" || phase === "analyzing" || phase === "coaching") && (
        <div style={S.loadingBox}>
          <div style={S.spinner} />
          <p style={S.loadingText}>
            {phase === "parsing"   ? "Parsing game data..." :
             phase === "analyzing" ? "Super AI Consensus generating critical moments..." :
                                     "Coaching team assembling full debrief..."}
          </p>
        </div>
      )}

      {phase === "error" && (
        <div style={S.errorBox}>
          <span>⚠️ {errorMsg}</span>
          <button style={S.btnSmall} onClick={startNew}>Try Again</button>
        </div>
      )}

      {phase === "done" && restoredAt && (
        <div style={S.restoredBanner}>
          📂 Last game restored — {new Date(restoredAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </div>
      )}

      {phase === "done" && analysis && (
        <div style={S.results}>
          <div style={S.statRow}>
            <StatPill label="Total Moves"    value={analysis.summary.totalMoves}    color="#95a5a6" />
            <StatPill label="GM Deviations"  value={analysis.summary.deviations}    color="#f39c12" />
            <StatPill label="Critical Turns" value={analysis.summary.criticalCount} color="#e74c3c" />
          </div>

          <div style={S.tabs}>
            {[
              { id: "coaches",  label: "Coaches" },
              { id: "critical", label: `Critical (${criticalList.length})` },
              { id: "moves",    label: "Move List" },
            ].map(t => (
              <button key={t.id} style={{ ...S.tab, ...(activeTab === t.id ? S.tabActive : {}) }} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "coaches" && (
            <div style={S.coachGrid}>
              {Object.keys(COACH_META).map(key => (
                <CoachCard key={key} coachKey={key} response={coaches[key]} loading={coachLoading[key]} />
              ))}
            </div>
          )}

          {activeTab === "critical" && (
            <div style={S.criticalList}>
              {criticalList.length === 0 ? (
                <p style={{ color: "#27ae60", fontSize: 14 }}>No critical deviations detected. Clean game.</p>
              ) : criticalList.map((move, i) => (
                <div key={i} style={S.criticalCard}>
                  <div style={S.criticalHeader}>
                    <span style={S.criticalBadge}>Critical Turn</span>
                    <span style={S.criticalMove}>Move {move.moveNumber}{move.side === "white" ? "." : "..."} {move.actualMove}</span>
                  </div>
                  <div style={S.superAiBox}>
                    <span style={S.superAiLabel}>SUPER AI SYNTHESIS</span>
                    <p style={S.superAiText}>{move.superAI}</p>
                  </div>
                  <div style={S.consensusGrid}>
                    {["vlad", "fabiano", "hikaru", "magnus"].map(key => (
                      <div key={key} style={S.consensusItem}>
                        <span style={S.consensusName}>{COACH_META[key].emoji} {COACH_META[key].name}</span>
                        <p style={S.consensusText}>{move[key]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "moves" && (
            <div style={S.moveList}>
              <div style={S.gmLegend}>
                <span style={S.deviationBadge}>Off-Plan</span>
                <span style={{ fontSize: 11, color: "#555" }}>deviates from Italian Cage GM plan</span>
              </div>
              {analysis.moves.map((move, i) => {
                const dev = isGmDeviation(move.moveNumber, move.side, move.actualMove);
                return (
                  <div key={i} style={S.moveRow}>
                    <span style={S.moveNum}>{move.moveNumber}{move.side === "white" ? "." : "..."}</span>
                    <span style={S.moveUCI}>{move.actualMove}</span>
                    {dev && <span style={S.deviationBadge}>Off-Plan</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const S = {
  root: { display: "flex", flexDirection: "column", gap: 24, padding: "28px 32px", minHeight: "100vh", backgroundColor: "#0d0d0d", color: "#e8e8e8", fontFamily: "'IBM Plex Mono', monospace", maxWidth: 900, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, borderBottom: "1px solid #222", paddingBottom: 20 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  headerIcon: { fontSize: 36 },
  headerTitle: { margin: 0, fontSize: 26, fontWeight: 700, color: "#fff" },
  headerSub: { margin: "2px 0 0", fontSize: 12, color: "#666" },
  headerMeta: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  metaChip: { padding: "4px 10px", borderRadius: 4, backgroundColor: "#1a1a1a", border: "1px solid #333", fontSize: 11, color: "#aaa" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "60px 20px", textAlign: "center" },
  emptyTitle: { margin: 0, fontSize: 20, color: "#ccc", fontWeight: 700 },
  emptySub: { margin: 0, fontSize: 13, color: "#555", lineHeight: 1.7, maxWidth: 400 },
  loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "60px 0" },
  spinner: { width: 32, height: 32, border: "3px solid #222", borderTop: "3px solid #c0392b", borderRadius: "50%", animation: "spin 1s linear infinite" },
  spinnerSmall: { marginLeft: "auto", width: 16, height: 16, border: "2px solid #333", borderTop: "2px solid #c0392b", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadingText: { margin: 0, fontSize: 13, color: "#555" },
  errorBox: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", backgroundColor: "#1a0808", border: "1px solid #5c1a1a", borderRadius: 6, fontSize: 13, color: "#e74c3c" },
  restoredBanner: { padding: "10px 16px", backgroundColor: "#0f1f0f", border: "1px solid #1a3a1a", borderRadius: 6, fontSize: 12, color: "#4a9a4a" },
  results: { display: "flex", flexDirection: "column", gap: 20 },
  statRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  statPill: { display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 16px", backgroundColor: "#111", border: "1px solid #222", borderRadius: 6, minWidth: 80 },
  statValue: { fontSize: 22, fontWeight: 700 },
  statLabel: { fontSize: 10, color: "#555", marginTop: 2 },
  tabs: { display: "flex", gap: 0, borderBottom: "1px solid #222" },
  tab: { padding: "10px 20px", backgroundColor: "transparent", border: "none", borderBottom: "2px solid transparent", color: "#555", fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" },
  tabActive: { color: "#fff", borderBottom: "2px solid #c0392b" },
  coachGrid: { display: "flex", flexDirection: "column", gap: 16 },
  coachCard: { backgroundColor: "#111", border: "1px solid #222", borderRadius: 8, overflow: "hidden" },
  coachHeader: { display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", backgroundColor: "#141414" },
  coachEmoji: { fontSize: 26 },
  coachName: { fontSize: 15, fontWeight: 700 },
  coachTitle: { fontSize: 10, color: "#555" },
  coachBody: { padding: "16px 18px" },
  coachText: { margin: 0, fontSize: 13, lineHeight: 1.8, color: "#ccc" },
  placeholder: { margin: 0, fontSize: 12, color: "#444", fontStyle: "italic" },
  criticalList: { display: "flex", flexDirection: "column", gap: 16 },
  criticalCard: { padding: "16px", backgroundColor: "#111", borderLeft: "4px solid #f39c12", border: "1px solid #222", borderRadius: 6, display: "flex", flexDirection: "column", gap: 12 },
  criticalHeader: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  criticalBadge: { padding: "3px 10px", borderRadius: 3, fontSize: 11, fontWeight: 700, backgroundColor: "#f39c1222", color: "#f39c12" },
  criticalMove: { fontSize: 14, fontWeight: 600, color: "#ccc" },
  superAiBox: { padding: "12px 14px", backgroundColor: "#1e1e2f", border: "1px solid #3e3e5f", borderRadius: 6 },
  superAiLabel: { display: "block", fontSize: 9, color: "#a8a8ff", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 6 },
  superAiText: { margin: 0, fontSize: 13, color: "#e8e8ff", lineHeight: 1.6 },
  consensusGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  consensusItem: { padding: "10px 12px", backgroundColor: "#151515", border: "1px solid #2a2a2a", borderRadius: 4 },
  consensusName: { display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4 },
  consensusText: { margin: 0, fontSize: 12, color: "#ccc", lineHeight: 1.5 },
  moveList: { display: "flex", flexDirection: "column", gap: 2, maxHeight: 480, overflowY: "auto" },
  gmLegend: { display: "flex", alignItems: "center", gap: 8, padding: "8px 0 12px", borderBottom: "1px solid #1a1a1a", marginBottom: 4 },
  moveRow: { display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 4 },
  moveNum: { width: 40, fontSize: 11, color: "#555", flexShrink: 0 },
  moveUCI: { width: 60, fontSize: 13, fontWeight: 600, color: "#ccc" },
  deviationBadge: { padding: "2px 7px", borderRadius: 3, fontSize: 10, backgroundColor: "#2a1a00", color: "#f39c12", border: "1px solid #5c3a00" },
  btnSmall: { padding: "6px 14px", backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 4, color: "#aaa", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" },
};
