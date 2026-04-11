/**
 * src/modules/DrillSergeant.jsx
 * vlad-chess-coach — Drill Sergeant Module
 *
 * Auto-loads blunder positions from vlad_last_autopsy localStorage.
 * Also accepts initialDrills prop and manual FEN input.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { getClassificationColor } from "../engine/stockfish.js";
import { askVlad } from "../coaches/vlad.jsx";

const FEEDBACK = {
  correct:  { emoji: "✅", color: "#27ae60", text: "Correct! That's the move." },
  close:    { emoji: "🟡", color: "#f39c12", text: "Not bad — but there's a better move." },
  wrong:    { emoji: "❌", color: "#e74c3c", text: "Not quite. Look again." },
  revealed: { emoji: "💡", color: "#3498db", text: "Solution revealed." },
};

// ---------------------------------------------------------------------------
// Chessboard renderer
// ---------------------------------------------------------------------------

function ChessBoard({ fen, orientation, onMove, highlightSquares = [], disabled = false }) {
  const boardRef      = useRef(null);
  const boardInstance = useRef(null);

  useEffect(() => {
    if (!boardRef.current || typeof Chessboard === "undefined") return;
    boardInstance.current = Chessboard(boardRef.current, {
      position:    fen,
      orientation: orientation ?? "white",
      draggable:   !disabled,
      onDrop: (from, to) => {
        if (disabled) return "snapback";
        const result = onMove?.(from, to);
        return result === false ? "snapback" : undefined;
      },
      pieceTheme: "https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png",
    });
    return () => boardInstance.current?.destroy?.();
  }, [fen, orientation, disabled]);

  const squareSize = boardRef.current ? boardRef.current.offsetWidth / 8 : 60;

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 480 }}>
      <div ref={boardRef} style={{ width: "100%" }} />
      {highlightSquares.map(({ square, color }) => {
        const file = square.charCodeAt(0) - 97;
        const rank = parseInt(square[1]) - 1;
        const x = orientation === "black" ? (7 - file) * squareSize : file * squareSize;
        const y = orientation === "black" ? rank * squareSize : (7 - rank) * squareSize;
        return (
          <div key={square} style={{
            position: "absolute", left: x, top: y,
            width: squareSize, height: squareSize,
            backgroundColor: color + "55",
            border: `3px solid ${color}`,
            pointerEvents: "none",
            boxSizing: "border-box",
          }} />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DrillQueueItem({ drill, index, isActive, onClick }) {
  const color = getClassificationColor(drill.classification);
  return (
    <div
      style={{
        ...styles.queueItem,
        backgroundColor: isActive ? "#1a1a1a" : "transparent",
        borderLeft: `3px solid ${isActive ? color : "transparent"}`,
        opacity: drill.solved ? 0.5 : 1,
      }}
      onClick={onClick}
    >
      <span style={{ ...styles.queueBadge, color, backgroundColor: color + "22" }}>
        {drill.solved ? "✓" : index + 1}
      </span>
      <div style={styles.queueInfo}>
        <span style={styles.queueMove}>Move {drill.moveNumber} · {drill.side}</span>
        {drill.weaknessTag && <span style={styles.queueTag}>{drill.weaknessTag}</span>}
      </div>
      <span style={{ ...styles.queueCp, color: "#e74c3c" }}>−{drill.cpLoss}cp</span>
    </div>
  );
}

function FeedbackBanner({ feedback, vladNote }) {
  if (!feedback) return null;
  const f = FEEDBACK[feedback];
  return (
    <div style={{ ...styles.feedbackBanner, borderColor: f.color, backgroundColor: f.color + "11" }}>
      <span style={styles.feedbackEmoji}>{f.emoji}</span>
      <div style={styles.feedbackContent}>
        <p style={{ ...styles.feedbackText, color: f.color }}>{f.text}</p>
        {vladNote && <p style={styles.vladNote}>🎖️ Vlad: "{vladNote}"</p>}
      </div>
    </div>
  );
}

function DrillProgress({ total, solved }) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  return (
    <div style={styles.drillProgressWrap}>
      <span style={styles.drillProgressLabel}>{solved}/{total} drills</span>
      <div style={styles.drillProgressBar}>
        <div style={{ ...styles.drillProgressFill, width: `${pct}%` }} />
      </div>
      <span style={styles.drillProgressPct}>{pct}%</span>
    </div>
  );
}

function ManualFENInput({ onSubmit }) {
  const [fen, setFen]   = useState("");
  const [best, setBest] = useState("");
  return (
    <div style={styles.manualPanel}>
      <p style={styles.manualTitle}>Add Custom Drill Position</p>
      <input
        style={styles.manualInput}
        placeholder="Paste FEN string…"
        value={fen}
        onChange={e => setFen(e.target.value)}
      />
      <input
        style={styles.manualInput}
        placeholder="Best move (UCI, e.g. e2e4)…"
        value={best}
        onChange={e => setBest(e.target.value)}
      />
      <button
        style={{ ...styles.btn, opacity: fen && best ? 1 : 0.4 }}
        disabled={!fen || !best}
        onClick={() => { onSubmit(fen, best); setFen(""); setBest(""); }}
      >
        Add Drill
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DrillSergeant({ initialDrills = [] }) {
  const [drills, setDrills]             = useState(initialDrills);
  const [activeIndex, setActiveIndex]   = useState(0);
  const [feedback, setFeedback]         = useState(null);
  const [vladNote, setVladNote]         = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [highlights, setHighlights]     = useState([]);
  const [attempts, setAttempts]         = useState(0);
  const [sessionStats, setSessionStats] = useState({ solved: 0, attempts: 0, streak: 0 });
  const [showManual, setShowManual]     = useState(false);
  const [vladLoading, setVladLoading]   = useState(false);

  // ── Auto-load from GameAutopsy localStorage on mount ──
  useEffect(() => {
    if (initialDrills.length > 0) return;
    try {
      const raw = localStorage.getItem("vlad_last_autopsy");
      if (!raw) return;
      const saved = JSON.parse(raw);
      const moves = saved?.analysis?.moves ?? [];
      const fens  = saved?.analysis?.fens  ?? [];
      const built = moves
        .filter(m => ["blunder", "mistake"].includes(m.classification) && m.bestMove && fens[m.moveIndex])
        .map((m, i) => ({
          id:             `autopsy-${i}`,
          source:         "autopsy",
          fen:            fens[m.moveIndex],
          solutionMove:   m.bestMove,
          playerMove:     m.actualMove,
          classification: m.classification,
          cpLoss:         m.cpLoss,
          moveNumber:     m.moveNumber,
          side:           m.side,
          weaknessTag:    m.moveNumber >= 8 && m.moveNumber <= 12
                            ? "Move 9 Speed Trap"
                            : m.cpLoss > 200 ? "Missing Forcing Moves" : null,
          attempted:      false,
          solved:         false,
        }));
      if (built.length > 0) setDrills(built);
    } catch { /* fail silently */ }
  }, []);

  // Reset state when switching drills
  useEffect(() => {
    setFeedback(null);
    setVladNote(null);
    setShowSolution(false);
    setHighlights([]);
    setAttempts(0);
  }, [activeIndex]);

  const activeDrill = drills[activeIndex] ?? null;

  // ── Move handler ──
  const handleMove = useCallback(async (from, to) => {
    if (!activeDrill || showSolution) return false;
    const uciMove  = from + to;
    const solution = activeDrill.solutionMove;
    const isExact  = uciMove === solution;
    const isClose  = !isExact && (
      uciMove.slice(0, 2) === solution.slice(0, 2) ||
      uciMove.slice(2, 4) === solution.slice(2, 4)
    );
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setSessionStats(prev => ({ ...prev, attempts: prev.attempts + 1 }));

    if (isExact) {
      setFeedback("correct");
      setHighlights([
        { square: from, color: "#27ae60" },
        { square: to,   color: "#27ae60" },
      ]);
      setDrills(prev => prev.map((d, i) => i === activeIndex ? { ...d, solved: true } : d));
      setSessionStats(prev => ({ ...prev, solved: prev.solved + 1, streak: prev.streak + 1 }));
      fireVladFeedback(activeDrill, true, newAttempts);
      return true;
    }

    setFeedback(isClose ? "close" : "wrong");
    if (!isClose) setSessionStats(prev => ({ ...prev, streak: 0 }));
    setHighlights([
      { square: from, color: "#e74c3c" },
      { square: to,   color: "#e74c3c" },
    ]);
    if (newAttempts >= 3) revealSolution();
    return false;
  }, [activeDrill, attempts, showSolution, activeIndex]);

  // ── Reveal solution ──
  const revealSolution = useCallback(() => {
    if (!activeDrill) return;
    setShowSolution(true);
    setFeedback("revealed");
    const sol = activeDrill.solutionMove;
    setHighlights([
      { square: sol.slice(0, 2), color: "#3498db" },
      { square: sol.slice(2, 4), color: "#3498db" },
    ]);
    fireVladFeedback(activeDrill, false, attempts);
  }, [activeDrill, attempts]);

  // ── Vlad micro-coaching ──
  const fireVladFeedback = useCallback(async (drill, solved, attemptsCount) => {
    setVladLoading(true);
    try {
      const context = `Drill position — Move ${drill.moveNumber} (${drill.side}). Classification: ${drill.classification} (−${drill.cpLoss}cp). Solution: ${drill.solutionMove}. Result: ${solved ? `SOLVED in ${attemptsCount} attempt(s)` : "Required reveal"}. Weakness: ${drill.weaknessTag ?? "general"}. Give one sharp sentence of coaching. Be Vlad.`;
      const response = await askVlad(context, {});
      setVladNote(response);
    } catch {
      setVladNote(null);
    } finally {
      setVladLoading(false);
    }
  }, []);

  // ── Add manual drill ──
  const addManualDrill = useCallback((fen, bestMove) => {
    setDrills(prev => [...prev, {
      id: `manual-${Date.now()}`,
      source: "manual",
      fen,
      solutionMove:   bestMove,
      playerMove:     null,
      classification: "mistake",
      cpLoss:         0,
      moveNumber:     0,
      side:           "white",
      weaknessTag:    null,
      attempted:      false,
      solved:         false,
    }]);
    setShowManual(false);
  }, []);

  // ── Empty state ──
  if (drills.length === 0) {
    return (
      <div style={styles.root}>
        <div style={styles.header}>
          <span style={styles.headerIcon}>⚔️</span>
          <div>
            <h1 style={styles.headerTitle}>Drill Sergeant</h1>
            <p style={styles.headerSub}>Targeted drills from your blunder positions</p>
          </div>
        </div>
        <div style={styles.emptyState}>
          <p style={styles.emptyTitle}>No drills loaded yet.</p>
          <p style={styles.emptySub}>Run a Game Autopsy first — blunder positions will auto-populate here.</p>
          <p style={styles.emptySub}>Or add a custom position below.</p>
          <button style={styles.btn} onClick={() => setShowManual(true)}>+ Add Custom Position</button>
        </div>
        {showManual && <ManualFENInput onSubmit={addManualDrill} />}
      </div>
    );
  }

  const solved      = drills.filter(d => d.solved).length;
  const orientation = activeDrill?.side === "black" ? "black" : "white";

  // ── Render ──
  return (
    <div style={styles.root}>

      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>⚔️</span>
          <div>
            <h1 style={styles.headerTitle}>Drill Sergeant</h1>
            <p style={styles.headerSub}>Drills from your blunders · {drills.length} positions loaded</p>
          </div>
        </div>
        <div style={styles.streakBox}>
          <span style={styles.streakNum}>{sessionStats.streak}</span>
          <span style={styles.streakLabel}>🔥 streak</span>
        </div>
      </div>

      <DrillProgress total={drills.length} solved={solved} />

      <div style={styles.mainLayout}>

        <div style={styles.sidebar}>
          <p style={styles.sidebarTitle}>DRILL QUEUE</p>
          {drills.map((drill, i) => (
            <DrillQueueItem
              key={drill.id}
              drill={drill}
              index={i}
              isActive={i === activeIndex}
              onClick={() => setActiveIndex(i)}
            />
          ))}
          <button style={styles.btnSmall} onClick={() => setShowManual(v => !v)}>
            + Custom Position
          </button>
          {showManual && <ManualFENInput onSubmit={addManualDrill} />}
        </div>

        <div style={styles.drillArea}>
          {activeDrill ? (
            <>
              <div style={styles.drillHeader}>
                <div style={styles.drillMeta}>
                  <span style={{
                    ...styles.drillBadge,
                    color: getClassificationColor(activeDrill.classification),
                    backgroundColor: getClassificationColor(activeDrill.classification) + "22",
                  }}>
                    {activeDrill.classification.toUpperCase()}
                  </span>
                  <span style={styles.drillDesc}>Move {activeDrill.moveNumber} · {activeDrill.side} to move</span>
                  {activeDrill.weaknessTag && (
                    <span style={styles.weaknessTag}>⚠️ {activeDrill.weaknessTag}</span>
                  )}
                </div>
                <span style={styles.attemptsLabel}>
                  {attempts > 0 ? `${attempts} attempt${attempts > 1 ? "s" : ""}` : "Find the best move"}
                </span>
              </div>

              <p style={styles.drillInstruction}>
                {showSolution
                  ? `Solution: ${activeDrill.solutionMove.slice(0, 2)} → ${activeDrill.solutionMove.slice(2, 4)}`
                  : activeDrill.solved
                  ? "✓ Solved — move to next drill"
                  : "Drag a piece to make your move"}
              </p>

              <ChessBoard
                fen={activeDrill.fen}
                orientation={orientation}
                onMove={handleMove}
                highlightSquares={highlights}
                disabled={activeDrill.solved || showSolution}
              />

              <FeedbackBanner
                feedback={feedback}
                vladNote={vladLoading ? "Vlad is thinking…" : vladNote}
              />

              <div style={styles.controls}>
                {!activeDrill.solved && !showSolution && (
                  <button style={styles.btnGhost} onClick={revealSolution}>
                    💡 Show Solution
                  </button>
                )}
                {activeIndex < drills.length - 1 && (
                  <button style={styles.btn} onClick={() => setActiveIndex(i => i + 1)}>
                    Next Drill →
                  </button>
                )}
                {activeIndex === drills.length - 1 && activeDrill.solved && (
                  <div style={styles.sessionComplete}>
                    🎖️ Session complete! {solved}/{drills.length} solved.
                  </div>
                )}
              </div>

              <div style={styles.mentalLoop}>
                <p style={styles.mentalLoopTitle}>4-STEP LOOP</p>
                <ol style={styles.mentalLoopList}>
                  <li>Opponent's intent — what do they want?</li>
                  <li>CCT — Checks, Captures, Threats</li>
                  <li>Lazy piece upgrade</li>
                  <li>Pre-move verify — can they take anything?</li>
                </ol>
              </div>
            </>
          ) : (
            <p style={styles.emptySub}>Select a drill from the queue.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  root: {
    display: "flex", flexDirection: "column", gap: 20,
    padding: "28px 32px", minHeight: "100vh",
    backgroundColor: "#0d0d0d", color: "#e8e8e8",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    maxWidth: 1000, margin: "0 auto",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "1px solid #222", paddingBottom: 20, flexWrap: "wrap", gap: 12,
  },
  headerLeft:  { display: "flex", alignItems: "center", gap: 14 },
  headerIcon:  { fontSize: 36 },
  headerTitle: { margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#fff" },
  headerSub:   { margin: "2px 0 0", fontSize: 12, color: "#666", letterSpacing: "0.5px" },
  streakBox: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "10px 20px", backgroundColor: "#1a1200",
    border: "1px solid #3d2e00", borderRadius: 8,
  },
  streakNum:   { fontSize: 28, fontWeight: 700, color: "#f39c12", lineHeight: 1 },
  streakLabel: { fontSize: 10, color: "#888", marginTop: 2 },
  drillProgressWrap:  { display: "flex", alignItems: "center", gap: 12 },
  drillProgressLabel: { fontSize: 11, color: "#666", minWidth: 60 },
  drillProgressBar:   { flex: 1, height: 5, backgroundColor: "#1a1a1a", borderRadius: 3, overflow: "hidden" },
  drillProgressFill:  { height: "100%", backgroundColor: "#c0392b", borderRadius: 3, transition: "width 0.4s ease" },
  drillProgressPct:   { fontSize: 11, color: "#555", minWidth: 32, textAlign: "right" },
  mainLayout: { display: "flex", gap: 24, alignItems: "flex-start" },
  sidebar: { display: "flex", flexDirection: "column", gap: 4, width: 220, flexShrink: 0 },
  sidebarTitle: { margin: "0 0 8px", fontSize: 10, color: "#444", letterSpacing: "1px" },
  queueItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 10px 10px 12px", borderRadius: 4,
    cursor: "pointer", transition: "background 0.15s",
  },
  queueBadge: { width: 24, height: 24, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  queueInfo:  { display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 },
  queueMove:  { fontSize: 11, color: "#aaa" },
  queueTag:   { fontSize: 9, color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  queueCp:    { fontSize: 10, flexShrink: 0 },
  drillArea:  { flex: 1, display: "flex", flexDirection: "column", gap: 16 },
  drillHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  drillMeta:  { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  drillBadge: { padding: "3px 10px", borderRadius: 3, fontSize: 11, fontWeight: 700, letterSpacing: "0.5px" },
  drillDesc:  { fontSize: 13, color: "#aaa" },
  weaknessTag: { fontSize: 10, color: "#f39c12", backgroundColor: "#2a1f00", padding: "2px 8px", borderRadius: 3 },
  attemptsLabel: { fontSize: 11, color: "#555" },
  drillInstruction: { margin: 0, fontSize: 12, color: "#777", letterSpacing: "0.3px" },
  feedbackBanner: {
    display: "flex", alignItems: "flex-start", gap: 12,
    padding: "14px 16px", border: "1px solid", borderRadius: 6,
  },
  feedbackEmoji:   { fontSize: 22, flexShrink: 0 },
  feedbackContent: { display: "flex", flexDirection: "column", gap: 6 },
  feedbackText:    { margin: 0, fontSize: 14, fontWeight: 600 },
  vladNote:        { margin: 0, fontSize: 12, color: "#aaa", fontStyle: "italic", lineHeight: 1.6 },
  controls: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
  btn: {
    padding: "10px 22px", backgroundColor: "#c0392b", color: "#fff",
    border: "none", borderRadius: 6, fontSize: 13,
    fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, cursor: "pointer",
  },
  btnGhost: {
    padding: "10px 22px", backgroundColor: "transparent", color: "#666",
    border: "1px solid #333", borderRadius: 6, fontSize: 13,
    fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer",
  },
  btnSmall: {
    marginTop: 8, padding: "6px 12px", backgroundColor: "#1a1a1a",
    color: "#666", border: "1px solid #2a2a2a", borderRadius: 4,
    fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer",
  },
  sessionComplete: {
    padding: "10px 16px", backgroundColor: "#0f2010",
    border: "1px solid #1e4d20", borderRadius: 6, fontSize: 13, color: "#27ae60",
  },
  mentalLoop: {
    padding: "14px 16px", backgroundColor: "#0d0d0d",
    border: "1px solid #1a1a1a", borderRadius: 6, marginTop: 8,
  },
  mentalLoopTitle: { margin: "0 0 8px", fontSize: 9, color: "#444", letterSpacing: "1.5px" },
  mentalLoopList: {
    margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column",
    gap: 4, fontSize: 11, color: "#555", lineHeight: 1.6,
  },
  emptyState: { display: "flex", flexDirection: "column", gap: 12, padding: "48px 0", alignItems: "flex-start" },
  emptyTitle: { margin: 0, fontSize: 18, color: "#ccc" },
  emptySub:   { margin: 0, fontSize: 13, color: "#555" },
  manualPanel: {
    display: "flex", flexDirection: "column", gap: 10,
    padding: "16px", backgroundColor: "#111",
    border: "1px solid #222", borderRadius: 6, marginTop: 8,
  },
  manualTitle: { margin: 0, fontSize: 12, color: "#888", letterSpacing: "0.5px" },
  manualInput: {
    padding: "8px 12px", backgroundColor: "#0d0d0d",
    border: "1px solid #2a2a2a", borderRadius: 4,
    color: "#ccc", fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace", outline: "none",
  },
};
