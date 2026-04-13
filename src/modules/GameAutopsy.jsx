/**
 * src/modules/GameAutopsy.jsx
 * vlad-chess-coach — Game Autopsy Module (Refined Consensus Edition)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { askVlad } from "../coaches/vlad.jsx";
import { askFabiano } from "../coaches/fabiano.jsx";
import { askMagnus } from "../coaches/magnus.jsx";
import { askHikaru } from "../coaches/hikaru.jsx";

const ITALIAN_CAGE_PLAN = {
  "1w":  "e4",   "1b":  "e5",
  "2w":  "Nf3",  "2b":  "Nc6",
  "3w":  "Bc4",  "3b":  "Bc5",
  "4w":  "c3",   "4b":  "Nf6",
  "5w":  "d3",   "5b":  "d6",
  "6w":  "O-O",  "6b":  "O-O",
  "7w":  "Re1",  "7b":  "a6",
  "8w":  "Bb3",  "8b":  "Ba7",
  "9w":  "h3",   "9b":  "h6",
  "10w": "Nbd2",
};

const PLAYER       = "TopherBettis";
const STORAGE_KEY  = "vlad_last_autopsy";
const CRITICAL_KEY = "vlad_critical_list";

const COACH_META = {
  vlad:    { name: "Vlad",    emoji: "🎖️", title: "Head Coach",          color: "#c0392b" },
  fabiano: { name: "Fabiano", emoji: "♟️", title: "Positional Analysis", color: "#2980b9" },
  hikaru:  { name: "Hikaru",  emoji: "⚡", title: "Tactical Genius",     color: "#f39c12" },
  magnus:  { name: "Magnus",  emoji: "👑", title: "Endgame & Intuition", color: "#27ae60" },
};

const TABS = [
  { id: "coaches",  label: ()  => "🎓 Coaches" },
  { id: "critical", label: (n) => `🚨 Critical (${n})` },
  { id: "moves",    label: ()  => "📋 Move List" },
];

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

function loadCriticalList() {
  try {
    const raw = localStorage.getItem(CRITICAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function formatCriticalText(record) {
  if (!record) return "";
  const date = new Date(record.savedAt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  return [
    `VLAD CHESS COACH — AI CONSENSUS LIST`,
    `Generated: ${date}`,
    `Game: ${record.game}`,
    ``,
    ...record.moves.map(m =>
      `Move ${m.moveNumber}${m.side === "white" ? "." : "…"} ${m.actualMove}\n[SUPER AI]: ${m.superAI}\n`
    ),
  ].join("\n");
}

function parsePGN(pgn) {
  if (typeof Chess === "undefined") {
    throw new Error("chess.js not loaded. Add CDN script to index.html.");
  }
  const game = new Chess();
  const loaded = game.load_pgn(pgn);
  if (!loaded) throw new Error("Invalid PGN — could not parse.");

  const white  = game.header().White  ?? "Unknown";
  const black  = game.header().Black  ?? "Unknown";
  const result = game.header().Result ?? "*";
  const date   = game.header().Date   ?? "";
  const event  = game.header().Event  ?? "";

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

  return { moves, sanMoves, white, black, result, date, event, playerSide, pgn };
}

function isGmDeviation(moveNumber, side, sanMove) {
  const key      = `${moveNumber}${side === "white" ? "w" : "b"}`;
  const expected = ITALIAN_CAGE_PLAN[key];
  if (!expected) return false;
  return sanMove !== expected;
}

function MoveRow({ move, isSelected, onClick }) {
  const deviated = isGmDeviation(move.moveNumber, move.side, move.actualMove);

  return (
    <div
      style={{
        ...styles.moveRow,
        backgroundColor: isSelected ? "#1e2a1e" : "transparent",
        borderLeft: `3px solid ${isSelected ? "#27ae60" : "transparent"}`,
      }}
      onClick={onClick}
    >
      <span style={styles.moveNum}>{move.moveNumber}{move.side === "white" ? "." : "…"}</span>
      <span style={styles.moveUCI}>{move.actualMove}</span>
      {deviated && (
        <span
          style={styles.deviationBadge}
          title={`GM Plan expected: ${ITALIAN_CAGE_PLAN[`${move.moveNumber}${move.side === "white" ? "w" : "b"}`]}`}
        >
          ⚠️ Off-Plan
        </span>
      )}
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
        <div style={{ ...S_PROGRESS.progressFill, width: `${pct}%` }} />
      </div>
      <div style={styles.progressPct}>{pct}% — move {current} of {total}</div>
    </div>
  );
}

const S_PROGRESS = {
  progressFill: { height: "100%", backgroundColor: "#c0392b", borderRadius: 3, transition: "width 0.3s ease" },
};

export default function GameAutopsy() {
  const [phase, setPhase]               = useState("idle");
  const [pgn, setPgn]                    = useState("");
  const [gameInfo, setGameInfo]         = useState(null);
  const [analysis, setAnalysis]         = useState(null);
  const [progress, setProgress]         = useState({ current: 0, total: 0 });
  const [selectedMove, setSelectedMove] = useState(null);
  const [coaches, setCoaches]           = useState({ vlad: null, fabiano: null, magnus: null, hikaru: null });
  const [coachLoading, setCoachLoading] = useState({ vlad: false, fabiano: false, magnus: false, hikaru: false });
  const [errorMsg, setErrorMsg]         = useState("");
  const [activeTab, setActiveTab]       = useState("coaches");
  const [restoredFrom, setRestoredFrom] = useState(null);

  const fileRef   = useRef(null);
  const runBtnRef = useRef(null);
  const pgnRef    = useRef("");
  const phaseRef  = useRef("idle");

  useEffect(() => { pgnRef.current  = pgn;   }, [pgn]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Enter") return;
      if (phaseRef.current !== "idle") return;
      if (!pgnRef.current.trim()) return;
      runBtnRef.current?.click();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const pending = localStorage.getItem("vlad_pending_pgn");
    if (pending) {
      localStorage.removeItem("vlad_pending_pgn");
      setPgn(pending);
      setPhase("idle");
      setTimeout(() => { runBtnRef.current?.click(); }, 300);
      return;
    }
    const saved = loadAutopsy();
    if (saved?.analysis && saved?.gameInfo) {
      setPgn(saved.pgn ?? "");
      setGameInfo(saved.gameInfo);
      setAnalysis(saved.analysis);
      setCoaches(saved.coaches ?? { vlad: null, fabiano: null, magnus: null, hikaru: null });
      setRestoredFrom(saved.savedAt);
      setPhase("done");
    }
  }, []);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPgn(ev.target.result ?? "");
    reader.readAsText(file);
  }, []);

  const startNewPGN = useCallback(() => {
    setPgn("");
    setPhase("idle");
    setAnalysis(null);
    setGameInfo(null);
    setCoaches({ vlad: null, fabiano: null, magnus: null, hikaru: null });
    setSelectedMove(null);
    setRestoredFrom(null);
  }, []);

  const runAutopsy = useCallback(async (pgnOverride) => {
    const target = (typeof pgnOverride === "string" ? pgnOverride : pgn).trim();
    if (!target) return;

    setPhase("parsing");
    setAnalysis(null);
    setCoaches({ vlad: null, fabiano: null, magnus: null, hikaru: null });
    setErrorMsg("");
    setSelectedMove(null);
    setRestoredFrom(null);
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
    setProgress({ current: parsed.moves.length, total: parsed.moves.length });

    let criticalMoves = [];
    try {
      const consensusPrompt = `You are the VLAD Super AI Gateway. 
Analyze this PGN for ${parsed.playerSide}:
${target}

Identify the 1-3 most critical turning points or mistakes relative to the "Gentleman Assassin" (Italian Pianissimo) style.
Check if the 4-Step Master Mental Loop (Opponent Intent, CCT, Lazy Piece, Blunder Check) was violated.

Return ONLY a JSON array, no markdown, no preamble:
[
  {
    "moveNumber": 14,
    "side": "white",
    "actualMove": "exd5",
    "vlad": "1 short philosophical critique on the long-term plan",
    "fabiano": "1 short critique on positional perfection",
    "magnus": "1 short blunt intuitive read",
    "hikaru": "1 short aggressive tactical critique",
    "superAI": "Synthesis: The custom best move for the Italian Cage and why it holds the advantage."
  }
]`;
      const rawConsensus = await askMagnus(consensusPrompt);
      const cleanJSON = rawConsensus.replace(/```json|```/g, "").trim();
      const parsedCritical = JSON.parse(cleanJSON);

      criticalMoves = parsedCritical.map(cj => {
        const realMove = parsed.moves.find(m => m.moveNumber === cj.moveNumber && m.side === cj.side);
        return { ...realMove, ...cj };
      }).filter(m => m.fen);
    } catch (err) {
      console.error("Consensus generation failed", err);
      criticalMoves = [];
    }

    const deviations = parsed.moves.filter(m => isGmDeviation(m.moveNumber, m.side, m.actualMove)).length;
    const gameAnalysis = {
      moves: parsed.moves,
      critical: criticalMoves,
      summary: { totalMoves: parsed.moves.length, deviations },
    };

    setAnalysis(gameAnalysis);
    saveCriticalList(parsed, criticalMoves);

    setPhase("coaching");
    setCoachLoading({ vlad: true, fabiano: true, magnus: true, hikaru: true });

    const coachingContext = `Game context: ${parsed.white} vs ${parsed.black}. Side: ${parsed.playerSide}. Deviations: ${deviations}. Critical moments: ${criticalMoves.length}. Full PGN: ${target}`;

    const fireCoach = async (key, fn, specializedPrompt) => {
      try {
        const resp = await fn(specializedPrompt, { ...parsed, summary: gameAnalysis.summary });
        setCoaches(prev => ({ ...prev, [key]: resp }));
        return resp;
      } catch (err) {
        const msg = `[Unavailable]`;
        setCoaches(prev => ({ ...prev, [key]: msg }));
        return msg;
      } finally {
        setCoachLoading(prev => ({ ...prev, [key]: false }));
      }
    };

    const coachPrompts = {
      vlad: `Vlad, review this game for TopherBettis. Focus on the Week review & Long term plan. Did he maintain the Italian Cage? ${coachingContext}`,
      fabiano: `Fabiano, positional critique for TopherBettis. Where did he lose Positional Perfection? ${coachingContext}`,
      magnus: `Magnus, give TopherBettis an intuitive read on this game. Positive wit only. ${coachingContext}`,
      hikaru: `Hikaru, where were the tactical shots missed? Speed and tactics check. ${coachingContext}`,
    };

    const [vR, fR, mR, hR] = await Promise.all([
      fireCoach("vlad", askVlad, coachPrompts.vlad),
      fireCoach("fabiano", askFabiano, coachPrompts.fabiano),
      fireCoach("magnus", askMagnus, coachPrompts.magnus),
      fireCoach("hikaru", askHikaru, coachPrompts.hikaru),
    ]);

    saveAutopsy(target, parsed, gameAnalysis, { vlad: vR, fabiano: fR, magnus: mR, hikaru: hR });
    setPhase("done");
  }, [pgn]);

  const criticalList = analysis?.critical ?? [];

  const savedDate = restoredFrom
    ? new Date(restoredFrom).toLocaleDateString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : null;

  const downloadCritical = () => {
    const record = loadCriticalList();
    if (!record) return;
    const text = formatCriticalText(record);
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `vlad-critical-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.root}>

      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🔬</span>
          <div>
            <h1 style={styles.headerTitle}>Game Autopsy</h1>
            <p style={styles.headerSub}>AI Consensus Engine · Vlad · Fabiano · Hikaru · Magnus</p>
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

      {restoredFrom && phase === "done" && (
        <div style={styles.restoredBanner}>
          <span>📂 Last game restored — {savedDate}</span>
          <button style={styles.btnSmall} onClick={startNewPGN}>＋ Analyze New PGN</button>
        </div>
      )}

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

      {phase === "idle" && (
        <div style={styles.pasteSection}>
          <textarea
            style={styles.pgnInput}
            placeholder="…or paste PGN directly here (Cmd+V from dashboard · Enter to analyze)"
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

      {(phase === "parsing" || phase === "analyzing" || phase === "coaching") && (
        <div style={styles.progressSection}>
          <AnalysisProgress
            current={progress.current}
            total={progress.total}
            phase={
              phase === "parsing"   ? "Parsing chess.com PGN…"                      :
              phase === "analyzing" ? "Super AI generating consensus…"           :
                                      "Coaching team assembling full debrief…"
            }
          />
        </div>
      )}

      {phase === "error" && (
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>⚠️</span>
          <span>{errorMsg}</span>
          <button style={styles.btnSmall} onClick={() => setPhase("idle")}>Try Again</button>
         </div>
      )}

      {(phase === "coaching" || phase === "done") && analysis && (
        <div style={styles.results}>

          <div style={styles.summaryRow}>
            <div style={styles.statRow}>
              <StatPill label="Total Moves"  value={analysis.summary.totalMoves}  color="#95a5a6" />
              <StatPill label="GM Deviations" value={analysis.summary.deviations} color="#f39c12" />
              <StatPill label="Critical Turns" value={criticalList.length}        color="#e74c3c" />
            </div>
          </div>

          <div style={styles.tabs}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label(criticalList.length)}
              </button>
            ))}
          </div>

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
              <div style={styles.criticalToolbar}>
                <span style={styles.criticalInfo}>
                  {criticalList.length > 0
                    ? `${criticalList.length} critical moment${criticalList.length > 1 ? "s" : ""} · Consensus generated`
                    : "No critical deviations this game"}
                </span>
                {criticalList.length > 0 && (
                  <button style={styles.btnSmall} onClick={downloadCritical}>
                    ⬇ Download List
                  </button>
                )}
              </div>
              {criticalList.length === 0 ? (
                <p style={styles.noCritical}>Clean game — completely aligned with plan. 💪</p>
              ) : (
                criticalList.map((move, i) => (
                  <div key={i} style={{ ...styles.criticalCard, borderLeft: `4px solid #f39c12` }}>
                    <div style={styles.criticalHeader}>
                      <span style={{ ...styles.criticalBadge, color: "#f39c12", backgroundColor: "#f39c1222" }}>
                        🚨 Critical Turn
                      </span>
                      <span style={styles.criticalMove}>
                        Move {move.moveNumber}{move.side === "white" ? "." : "…"} {move.actualMove}
                      </span>
                    </div>
                    
                    <div style={styles.superAiBox}>
                      <span style={styles.superAiLabel}>SUPER AI SYNTHESIS</span>
                      <p style={styles.superAiText}>{move.superAI}</p>
                    </div>

                    <div style={styles.consensusGrid}>
                      <div style={styles.consensusItem}>
                        <span style={styles.consensusName}>🎖️ Vlad</span>
                        <p style={styles.consensusText}>{move.vlad}</p>
                      </div>
                      <div style={styles.consensusItem}>
                        <span style={styles.consensusName}>♟️ Fabiano</span>
                        <p style={styles.consensusText}>{move.fabiano}</p>
                      </div>
                      <div style={styles.consensusItem}>
                        <span style={styles.consensusName}>⚡ Hikaru</span>
                        <p style={styles.consensusText}>{move.hikaru}</p>
                      </div>
                      <div style={styles.consensusItem}>
                        <span style={styles.consensusName}>👑 Magnus</span>
                        <p style={styles.consensusText}>{move.magnus}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "moves" && (
            <div style={styles.moveList}>
              <div style={styles.gmLegend}>
                <span style={styles.deviationBadge}>⚠️ Off-Plan</span>
                <span style={styles.gmLegendText}>= deviates from your Italian Cage GM Plan</span>
              </div>
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

const styles = {
  root: {
    display: "flex", flexDirection: "column", gap: 24,
    padding: "28px 32px", minHeight: "100vh",
    backgroundColor: "#0d0d0d", color: "#e8e8e8",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    maxWidth: 900, margin: "0 auto",
  },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", flexWrap: "wrap", gap: 12,
    borderBottom: "1px solid #222", paddingBottom: 20,
  },
  headerLeft:  { display: "flex", alignItems: "center", gap: 14 },
  headerIcon:  { fontSize: 36 },
  headerTitle: { margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#fff" },
  headerSub:   { margin: "2px 0 0", fontSize: 12, color: "#666", letterSpacing: "0.5px" },
  headerMeta:  { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  metaChip: {
    padding: "4px 10px", borderRadius: 4,
    backgroundColor: "#1a1a1a", border: "1px solid #333",
    fontSize: 11, color: "#aaa", letterSpacing: "0.3px",
  },
  restoredBanner: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 16px", backgroundColor: "#0f1f0f",
    border: "1px solid #1a3a1a", borderRadius: 6,
    fontSize: 12, color: "#4a9a4a",
  },
  uploadZone: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 8, padding: "48px 32px",
    border: "2px dashed #333", borderRadius: 8,
    cursor: "pointer", transition: "border-color 0.2s", backgroundColor: "#111",
  },
  uploadIcon:   { fontSize: 48 },
  uploadTitle:  { margin: 0, fontSize: 18, color: "#ccc" },
  uploadSub:    { margin: 0, fontSize: 13, color: "#555" },
  uploadLoaded: {
    marginTop: 8, padding: "6px 14px",
    backgroundColor: "#1a2e1a", borderRadius: 4,
    fontSize: 12, color: "#27ae60",
  },
  pasteSection: { display: "flex", flexDirection: "column", gap: 12 },
  pgnInput: {
    width: "100%", backgroundColor: "#111",
    border: "1px solid #2a2a2a", borderRadius: 6,
    padding: "12px 14px", color: "#ccc",
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
    resize: "vertical", boxSizing: "border-box", outline: "none",
  },
  btn: {
    padding: "12px 24px", backgroundColor: "#c0392b",
    color: "#fff", border: "none", borderRadius: 6,
    fontSize: 14, fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 700, cursor: "pointer", letterSpacing: "0.5px",
    transition: "background 0.2s", alignSelf: "flex-start",
  },
  btnSmall: {
    padding: "6px 14px", backgroundColor: "#1a3a1a",
    color: "#4a9a4a", border: "1px solid #2a5a2a",
    borderRadius: 4, fontSize: 12, cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  progressSection: { padding: "24px 0" },
  progressWrap:    { display: "flex", flexDirection: "column", gap: 8 },
  progressPhase:   { fontSize: 13, color: "#aaa", letterSpacing: "0.5px" },
  progressBar:     { height: 6, backgroundColor: "#1a1a1a", borderRadius: 3, overflow: "hidden" },
  progressPct:     { fontSize: 11, color: "#555" },
  errorBox: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "16px 20px", backgroundColor: "#1f0a0a",
    border: "1px solid #5c1a1a", borderRadius: 6,
    fontSize: 13, color: "#e74c3c",
  },
  errorIcon: { fontSize: 20 },
  results:     { display: "flex", flexDirection: "column", gap: 20 },
  summaryRow: { display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" },
  statRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  statPill: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "10px 16px", backgroundColor: "#111",
    border: "1px solid #222", borderRadius: 6, minWidth: 72,
  },
  statValue: { fontSize: 22, fontWeight: 700 },
  statLabel: { fontSize: 10, color: "#555", marginTop: 2, letterSpacing: "0.5px" },
  tabs: { display: "flex", gap: 0, borderBottom: "1px solid #222" },
  tab: {
    padding: "10px 20px", backgroundColor: "transparent",
    border: "none", borderBottom: "2px solid transparent",
    color: "#555", fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace",
    cursor: "pointer", letterSpacing: "0.5px", transition: "color 0.2s",
  },
  tabActive: { color: "#e8e8e8", borderBottom: "2px solid #c0392b" },
  moveList: {
    display: "flex", flexDirection: "column", gap: 2,
    maxHeight: 480, overflowY: "auto",
  },
  gmLegend: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 0 12px", borderBottom: "1px solid #1a1a1a", marginBottom: 4,
  },
  gmLegendText: { fontSize: 11, color: "#555" },
  moveRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "8px 12px", borderRadius: 4,
    cursor: "pointer", transition: "background 0.15s",
  },
  moveNum:   { width: 40, fontSize: 11, color: "#555", flexShrink: 0 },
  moveUCI:   { width: 60, fontSize: 13, fontWeight: 600, color: "#ccc", letterSpacing: "0.5px" },
  deviationBadge: {
    padding: "2px 7px", borderRadius: 3, fontSize: 10,
    backgroundColor: "#2a1a00", color: "#f39c12",
    border: "1px solid #5c3a00", letterSpacing: "0.3px",
    whiteSpace: "nowrap", flexShrink: 0,
  },
  coachGrid: { display: "flex", flexDirection: "column", gap: 16 },
  coachCard: {
    backgroundColor: "#111", border: "1px solid #222",
    borderRadius: 8, overflow: "hidden",
  },
  coachHeader: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "14px 18px", backgroundColor: "#141414",
  },
  coachEmoji:       { fontSize: 28 },
  coachName:        { fontSize: 16, fontWeight: 700 },
  coachTitle:       { fontSize: 11, color: "#555", letterSpacing: "0.5px" },
  coachSpinner: {
    marginLeft: "auto", width: 16, height: 16,
    border: "2px solid #333", borderTop: "2px solid #c0392b",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  coachBody:        { padding: "16px 18px" },
  coachText:        { margin: 0, fontSize: 13, lineHeight: 1.8, color: "#ccc" },
  coachPlaceholder: { margin: 0, fontSize: 12, color: "#444", fontStyle: "italic" },
  coachLoading:     { display: "flex", justifyContent: "center", padding: "16px 0" },
  loadingDots:      { display: "flex", gap: 6 },
  criticalList:     { display: "flex", flexDirection: "column", gap: 12 },
  criticalToolbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    paddingBottom: 12, borderBottom: "1px solid #1a1a1a",
  },
  criticalInfo: { fontSize: 11, color: "#555" },
  noCritical:   { color: "#27ae60", fontSize: 14, padding: "16px 0" },
  criticalCard: {
    padding: "14px 16px", backgroundColor: "#111",
    border: "1px solid #222", borderRadius: 6,
    display: "flex", flexDirection: "column", gap: 8,
  },
  criticalHeader:  { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  criticalBadge:   { padding: "3px 10px", borderRadius: 3, fontSize: 12, fontWeight: 700 },
  criticalMove:    { fontSize: 14, fontWeight: 600, color: "#ccc" },
  superAiBox: { padding: "12px 14px", backgroundColor: "#1e1e2f", border: "1px solid #3e3e5f", borderRadius: 6, marginTop: 4 },
  superAiLabel: { fontSize: 10, color: "#a8a8ff", letterSpacing: "1.5px", fontWeight: 700 },
  superAiText: { margin: "6px 0 0", fontSize: 13, color: "#e8e8ff", lineHeight: 1.6 },
  consensusGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 },
  consensusItem: { padding: "10px", backgroundColor: "#151515", border: "1px solid #2a2a2a", borderRadius: 4 },
  consensusName: { fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4, display: "block" },
  consensusText: { margin: 0, fontSize: 12, color: "#ccc", lineHeight: 1.5 },
};
