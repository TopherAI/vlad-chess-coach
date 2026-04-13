/**
 * src/modules/DrillSergeant.jsx
 * vlad-chess-coach — Drill Sergeant Module (Super AI Consensus Edition)
 *
 * Calibrated to ingest critical positions from the Super AI Consensus engine.
 * Displays coach-specific critiques and Super AI Synthesis as tactical hints.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { askVlad } from "../coaches/vlad.jsx";

// ── Helpers ──────────────────────────────────────────────────────────────────

const CLASSIFICATION_COLORS = {
  best: "#27ae60",
  excellent: "#2ecc71",
  good: "#95a5a6",
  inaccuracy: "#f1c40f",
  mistake: "#e67e22",
  blunder: "#e74c3c",
  critical: "#f39c12", // AI Consensus color
};

const FEEDBACK = {
  correct:  { emoji: "✅", color: "#27ae60", text: "Correct! Italian Cage execution confirmed." },
  close:    { emoji: "🟡", color: "#f39c12", text: "Reasonable, but deviates from the GM Plan." },
  wrong:    { emoji: "❌", color: "#e74c3c", text: "CCT violation. Check the 4-Step Loop." },
  revealed: { emoji: "💡", color: "#3498db", text: "Tactical solution revealed." },
};

// ── Chessboard Component ──────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────

function DrillQueueItem({ drill, index, isActive, onClick }) {
  const color = CLASSIFICATION_COLORS.critical;
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
        <span style={styles.queueTag}>🚨 AI Consensus Moment</span>
      </div>
    </div>
  );
}

function FeedbackBanner({ feedback, vladNote, superAIHint }) {
  if (!feedback && !superAIHint) return null;
  const f = feedback ? FEEDBACK[feedback] : { color: "#888" };
  
  return (
    <div style={{ ...styles.feedbackBanner, borderColor: f.color || "#333", backgroundColor: (f.color || "#333") + "11" }}>
      {f.emoji && <span style={styles.feedbackEmoji}>{f.emoji}</span>}
      <div style={styles.feedbackContent}>
        {feedback && <p style={{ ...styles.feedbackText, color: f.color }}>{f.text}</p>}
        {superAIHint && (
          <div style={styles.superAiHintBox}>
            <span style={styles.superAiHintLabel}>SUPER AI SYNTHESIS</span>
            <p style={styles.superAiHintText}>{superAIHint}</p>
          </div>
        )}
        {vladNote && <p style={styles.vladNote}>🎖️ Vlad: "{vladNote}"</p>}
      </div>
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────

export default function DrillSergeant({ initialDrills = [] }) {
  const [drills, setDrills]             = useState(initialDrills);
  const [activeIndex, setActiveIndex]   = useState(0);
  const [feedback, setFeedback]         = useState(null);
  const [vladNote, setVladNote]         = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [highlights, setHighlights]     = useState([]);
  const [attempts, setAttempts]         = useState(0);
  const [sessionStats, setSessionStats] = useState({ solved: 0, attempts: 0, streak: 0 });
  const [vladLoading, setVladLoading]   = useState(false);

  // ── Auto-load from Super AI Consensus List ──
  useEffect(() => {
    if (initialDrills.length > 0) return;
    try {
      const raw = localStorage.getItem("vlad_critical_list");
      if (!raw) return;
      const record = JSON.parse(raw);
      const moves = record.moves ?? [];
      
      const built = moves.map((m, i) => ({
        id: `consensus-${i}`,
        fen: m.fen,
        solutionMove: m.uci || m.bestMove, // Fallback support
        playerMove: m.actualMove,
        moveNumber: m.moveNumber,
        side: m.side,
        vladCritique: m.vlad,
        superAI: m.superAI,
        solved: false,
      }));

      if (built.length > 0) setDrills(built);
    } catch (err) {
      console.error("Failed to load drills from consensus", err);
    }
  }, []);

  useEffect(() => {
    setFeedback(null);
    setVladNote(null);
    setShowSolution(false);
    setHighlights([]);
    setAttempts(0);
  }, [activeIndex]);

  const activeDrill = drills[activeIndex] ?? null;

  const handleMove = useCallback(async (from, to) => {
    if (!activeDrill || showSolution) return false;
    const uciMove = from + to;
    const solution = activeDrill.solutionMove;
    const isExact = uciMove === solution;
    
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

    setFeedback("wrong");
    setSessionStats(prev => ({ ...prev, streak: 0 }));
    setHighlights([
      { square: from, color: "#e74c3c" },
      { square: to,   color: "#e74c3c" },
    ]);
    
    if (newAttempts >= 3) revealSolution();
    return false;
  }, [activeDrill, attempts, showSolution, activeIndex]);

  const revealSolution = useCallback(() => {
    if (!activeDrill) return;
    setShowSolution(true);
    setFeedback("revealed");
    const sol = activeDrill.solutionMove;
    if (sol && sol.length >= 4) {
      setHighlights([
        { square: sol.slice(0, 2), color: "#3498db" },
        { square: sol.slice(2, 4), color: "#3498db" },
      ]);
    }
    fireVladFeedback(activeDrill, false, attempts);
  }, [activeDrill, attempts]);

  const fireVladFeedback = useCallback(async (drill, solved, attemptsCount) => {
    setVladLoading(true);
    try {
      const prompt = `Drill Result: ${solved ? "Solved" : "Failed"} in ${attemptsCount} tries. 
      Original AI critique: ${drill.vladCritique}. 
      Provide one short, sharp Vlad-style follow-up sentence for TopherBettis.`;
      const response = await askVlad(prompt);
      setVladNote(response);
    } catch {
      setVladNote(drill.vladCritique); // Fallback to original consensus critique
    } finally {
      setVladLoading(false);
    }
  }, []);

  if (drills.length === 0) {
    return (
      <div style={styles.root}>
        <div style={styles.header}>
          <span style={styles.headerIcon}>⚔️</span>
          <div>
            <h1 style={styles.headerTitle}>Drill Sergeant</h1>
            <p style={styles.headerSub}>Awaiting fresh Game Autopsy data...</p>
          </div>
        </div>
        <div style={styles.emptyState}>
          <p style={styles.emptyTitle}>The queue is empty.</p>
          <p style={styles.emptySub}>Run a **Game Autopsy** to generate the Critical AI Consensus list. Your blunders will automatically manifest here as training drills.</p>
        </div>
      </div>
    );
  }

  const solvedCount = drills.filter(d => d.solved).length;
  const orientation = activeDrill?.side === "black" ? "black" : "white";

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>⚔️</span>
          <div>
            <h1 style={styles.headerTitle}>Drill Sergeant</h1>
            <p style={styles.headerSub}>Tactical calibration · {drills.length} Consensus points</p>
          </div>
        </div>
        <div style={styles.streakBox}>
          <span style={styles.streakNum}>{sessionStats.streak}</span>
          <span style={styles.streakLabel}>🔥 streak</span>
        </div>
      </div>

      <div style={styles.mainLayout}>
        <div style={styles.sidebar}>
          <p style={styles.sidebarTitle}>CRITICAL QUEUE</p>
          {drills.map((drill, i) => (
            <DrillQueueItem
              key={drill.id}
              drill={drill}
              index={i}
              isActive={i === activeIndex}
              onClick={() => setActiveIndex(i)}
            />
          ))}
          <div style={styles.progressCounter}>
             {solvedCount} / {drills.length} Reps Complete
          </div>
        </div>

        <div style={styles.drillArea}>
          {activeDrill && (
            <>
              <div style={styles.drillHeader}>
                <div style={styles.drillMeta}>
                  <span style={styles.drillBadge}>🚨 CRITICAL CALIBRATION</span>
                  <span style={styles.drillDesc}>Move {activeDrill.moveNumber} · You are {activeDrill.side}</span>
                </div>
                <span style={styles.attemptsLabel}>
                  {attempts > 0 ? `${attempts} attempts` : "Find the winning move"}
                </span>
              </div>

              <ChessBoard
                fen={activeDrill.fen}
                orientation={orientation}
                onMove={handleMove}
                highlightSquares={highlights}
                disabled={activeDrill.solved || showSolution}
              />

              <FeedbackBanner
                feedback={feedback}
                vladNote={vladLoading ? "Vlad is observing..." : vladNote}
                superAIHint={(!activeDrill.solved && !showSolution) ? activeDrill.superAI : null}
              />

              <div style={styles.controls}>
                {!activeDrill.solved && !showSolution && (
                  <button style={styles.btnGhost} onClick={revealSolution}>
                    💡 Reveal Solution
                  </button>
                )}
                {(activeDrill.solved || showSolution) && activeIndex < drills.length - 1 && (
                  <button style={styles.btn} onClick={() => setActiveIndex(i => i + 1)}>
                    Next Drill →
                  </button>
                )}
              </div>

              <div style={styles.mentalLoop}>
                <p style={styles.mentalLoopTitle}>4-STEP GENTLEMAN ASSASSIN LOOP</p>
                <div style={styles.loopGrid}>
                  <span>1. Intent</span><span>2. CCT</span><span>3. Lazy Piece</span><span>4. Blunder Check</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: { display: "flex", flexDirection: "column", gap: 20, padding: "28px 32px", minHeight: "100vh", backgroundColor: "#0d0d0d", color: "#e8e8e8", fontFamily: "'IBM Plex Mono', monospace", maxWidth: 1000, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #222", paddingBottom: 20 },
  headerLeft:  { display: "flex", alignItems: "center", gap: 14 },
  headerIcon:  { fontSize: 36 },
  headerTitle: { margin: 0, fontSize: 26, fontWeight: 700, color: "#fff" },
  headerSub:   { margin: "2px 0 0", fontSize: 12, color: "#666" },
  streakBox: { display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", backgroundColor: "#1a1200", border: "1px solid #3d2e00", borderRadius: 8 },
  streakNum:   { fontSize: 28, fontWeight: 700, color: "#f39c12", lineHeight: 1 },
  streakLabel: { fontSize: 10, color: "#888", marginTop: 2 },
  mainLayout: { display: "flex", gap: 24, alignItems: "flex-start" },
  sidebar: { display: "flex", flexDirection: "column", gap: 4, width: 220, flexShrink: 0 },
  sidebarTitle: { margin: "0 0 8px", fontSize: 10, color: "#444", letterSpacing: "1px" },
  progressCounter: { marginTop: 12, fontSize: 11, color: "#27ae60", fontWeight: 700, textAlign: "center" },
  queueItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 4, cursor: "pointer", transition: "background 0.15s" },
  queueBadge: { width: 24, height: 24, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  queueInfo:  { display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 },
  queueMove:  { fontSize: 11, color: "#aaa" },
  queueTag:   { fontSize: 9, color: "#666" },
  drillArea:  { flex: 1, display: "flex", flexDirection: "column", gap: 16 },
  drillHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  drillMeta:  { display: "flex", alignItems: "center", gap: 10 },
  drillBadge: { padding: "3px 10px", borderRadius: 3, fontSize: 11, fontWeight: 700, backgroundColor: "#c0392b22", color: "#c0392b" },
  drillDesc:  { fontSize: 13, color: "#aaa" },
  attemptsLabel: { fontSize: 11, color: "#555" },
  feedbackBanner: { display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", border: "1px solid", borderRadius: 6 },
  feedbackEmoji:   { fontSize: 22, flexShrink: 0 },
  feedbackContent: { display: "flex", flexDirection: "column", gap: 8, flex: 1 },
  feedbackText:    { margin: 0, fontSize: 14, fontWeight: 600 },
  superAiHintBox: { padding: "10px 12px", backgroundColor: "#1e1e2f", border: "1px solid #3e3e5f", borderRadius: 4 },
  superAiHintLabel: { fontSize: 9, color: "#a8a8ff", fontWeight: 700, letterSpacing: "1px" },
  superAiHintText: { margin: "4px 0 0", fontSize: 12, color: "#e8e8ff", lineHeight: 1.5 },
  vladNote:        { margin: 0, fontSize: 12, color: "#aaa", fontStyle: "italic" },
  controls: { display: "flex", gap: 12, alignItems: "center" },
  btn: { padding: "10px 22px", backgroundColor: "#c0392b", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnGhost: { padding: "10px 22px", backgroundColor: "transparent", color: "#666", border: "1px solid #333", borderRadius: 6, fontSize: 13, cursor: "pointer" },
  mentalLoop: { padding: "12px 16px", backgroundColor: "#080808", border: "1px solid #1a1a1a", borderRadius: 6 },
  mentalLoopTitle: { margin: "0 0 8px", fontSize: 9, color: "#444", letterSpacing: "1px" },
  loopGrid: { display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666" },
  emptyState: { display: "flex", flexDirection: "column", gap: 12, padding: "48px 0" },
  emptyTitle: { fontSize: 18, color: "#ccc", margin: 0 },
  emptySub:   { fontSize: 13, color: "#555", margin: 0, lineHeight: 1.6 },
};
