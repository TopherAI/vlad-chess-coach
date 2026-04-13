/**
 * src/modules/GameAutopsy.jsx
 * vlad-chess-coach — Game Autopsy Terminal
 */

import { useState, useCallback, useRef, useEffect } from "react";
import askVlad from "../coaches/vlad.jsx";
import askFabiano from "../coaches/fabiano.jsx";
import askHikaru from "../coaches/hikaru.jsx";
import askMagnus from "../coaches/magnus.jsx";

const STORAGE_KEY = "vlad_last_autopsy";

const COACH_META = {
  vlad:    { name: "Vlad",    emoji: "🎖️", color: "#c0392b" },
  fabiano: { name: "Fabiano", emoji: "♟️", color: "#2980b9" },
  hikaru:  { name: "Hikaru",  emoji: "⚡", color: "#f39c12" },
  magnus:  { name: "Magnus",  emoji: "👑", color: "#27ae60" },
};

export default function GameAutopsy() {
  const [phase, setPhase] = useState("idle");
  const [pgn, setPgn] = useState("");
  const [coaches, setCoaches] = useState({ vlad: null, fabiano: null, hikaru: null, magnus: null });
  const [loading, setLoading] = useState(false);
  
  const runBtnRef = useRef(null);

  // Persistence logic
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setPgn(data.pgn || "");
        setCoaches(data.coaches || {});
        setPhase("done");
      } catch (e) { console.error("Cache corrupted"); }
    }
  }, []);

  // RESTORED: Enter Key firing protocol
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Stop newline in textarea
      if (pgn.trim() && phase === "idle") {
        runAutopsy();
      }
    }
  };

  const runAutopsy = useCallback(async () => {
    if (!pgn.trim()) return;
    
    setPhase("coaching");
    setLoading(true);

    try {
      // Mocked context for testing - this will be replaced by real engine data in Phase 3
      const gameCtx = { white: "TopherBettis", black: "Opponent", result: "1-0", pgn };
      const stats = { accuracy: 75, totalMoves: 35, playerSide: "white" };

      // Execute full tactical consensus
      const [v, f, h, m] = await Promise.all([
        askVlad(stats, gameCtx),
        askFabiano(stats, gameCtx),
        askHikaru(stats, gameCtx),
        askMagnus(stats, gameCtx)
      ]);

      const results = { vlad: v, fabiano: f, hikaru: h, magnus: m };
      setCoaches(results);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pgn, coaches: results }));
      setPhase("done");
    } catch (err) {
      console.error("Autopsy Failed:", err);
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  }, [pgn]);

  const resetAutopsy = () => {
    setPgn("");
    setPhase("idle");
    setCoaches({ vlad: null, fabiano: null, hikaru: null, magnus: null });
  };

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔬 Game Autopsy</h1>
        <p style={styles.subtitle}>AI Consensus Protocol · Mission Readiness Check</p>
      </div>

      {phase === "idle" && (
        <div style={styles.inputArea}>
          <textarea
            style={styles.pgnInput}
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste your PGN and hit [Enter] to analyze..."
            rows={10}
          />
          <button ref={runBtnRef} style={styles.btn} onClick={runAutopsy}>
            Analyze Mission Data
          </button>
        </div>
      )}

      {loading && (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Coaching team analyzing PGN. Stand by for debrief.</p>
        </div>
      )}

      {phase === "done" && (
        <div style={styles.results}>
          {Object.keys(COACH_META).map(key => (
            <div key={key} style={styles.coachCard}>
              <div style={{ ...styles.coachHeader, borderBottom: `2px solid ${COACH_META[key].color}` }}>
                <span style={styles.emoji}>{COACH_META[key].emoji}</span>
                <span style={{ color: COACH_META[key].color, fontWeight: 700 }}>{COACH_META[key].name}</span>
              </div>
              <p style={styles.coachText}>{coaches[key]}</p>
            </div>
          ))}
          <button style={styles.btnGhost} onClick={resetAutopsy}>
            ＋ Analyze New PGN
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  root: { padding: "40px 20px", maxWidth: 850, margin: "0 auto", backgroundColor: "#0d0d0d", color: "#e8e8e8", minHeight: "100vh", fontFamily: "'IBM Plex Mono', monospace" },
  header: { marginBottom: 32, borderBottom: "1px solid #222", paddingBottom: 20 },
  title: { fontSize: 28, margin: 0, fontWeight: 700, color: "#fff" },
  subtitle: { margin: "8px 0 0", fontSize: 12, color: "#666", letterSpacing: "1px" },
  inputArea: { display: "flex", flexDirection: "column", gap: 16 },
  pgnInput: { width: "100%", backgroundColor: "#111", border: "1px solid #333", color: "#ccc", padding: 16, borderRadius: 8, outline: "none", fontSize: 13, lineHeight: 1.6, resize: "none" },
  btn: { padding: "14px 28px", backgroundColor: "#c0392b", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer", alignSelf: "flex-start", fontSize: 14 },
  btnGhost: { marginTop: 20, padding: "10px 20px", backgroundColor: "transparent", border: "1px solid #333", color: "#666", borderRadius: 6, cursor: "pointer", alignSelf: "flex-start", fontSize: 12 },
  loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 60 },
  spinner: { width: 40, height: 40, border: "3px solid #1a1a1a", borderTop: "3px solid #c0392b", borderRadius: "50%", animation: "spin 1s linear infinite" },
  loadingText: { fontSize: 14, color: "#aaa" },
  results: { display: "flex", flexDirection: "column", gap: 16 },
  coachCard: { backgroundColor: "#111", border: "1px solid #222", borderRadius: 8, overflow: "hidden" },
  coachHeader: { padding: "12px 20px", backgroundColor: "#151515", display: "flex", alignItems: "center", gap: 12 },
  emoji: { fontSize: 24 },
  coachText: { padding: "20px", margin: 0, fontSize: 14, lineHeight: 1.8, color: "#ccc" }
};
