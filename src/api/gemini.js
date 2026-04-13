/**
 * src/modules/GameAutopsy.jsx
 * Rule: Braceless default imports for Vercel stability.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import askVlad from "../coaches/vlad.jsx";
import askFabiano from "../coaches/fabiano.jsx";
import askHikaru from "../coaches/hikaru.jsx";
import askMagnus from "../coaches/magnus.jsx";

const STORAGE_KEY = "vlad_last_autopsy";

export default function GameAutopsy() {
  const [phase, setPhase] = useState("idle");
  const [pgn, setPgn] = useState("");
  const [coaches, setCoaches] = useState({ vlad: null, fabiano: null, hikaru: null, magnus: null });
  const [loading, setLoading] = useState(false);
  
  const runBtnRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setPgn(data.pgn || "");
        setCoaches(data.coaches || {});
        setPhase("done");
      } catch (e) { console.error("Cache clear"); }
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (pgn.trim() && phase === "idle") runAutopsy();
    }
  };

  const runAutopsy = useCallback(async () => {
    if (!pgn.trim()) return;
    setPhase("coaching");
    setLoading(true);

    try {
      const stats = { accuracy: 75, playerSide: "white" };
      const game = { white: "TopherBettis", black: "Opponent", result: "1-0", pgn };

      const [v, f, h, m] = await Promise.all([
        askVlad(stats, game),
        askFabiano(stats, game),
        askHikaru(stats, game),
        askMagnus(stats, game)
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

  return (
    <div style={styles.root}>
      <h1 style={styles.title}>🔬 Game Autopsy</h1>
      {phase === "idle" && (
        <div style={styles.inputArea}>
          <textarea
            style={styles.pgnInput}
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste PGN and hit [Enter] to fire analysis..."
            rows={10}
          />
          <button ref={runBtnRef} style={styles.btn} onClick={runAutopsy}>Analyze Mission Data</button>
        </div>
      )}
      {loading && <p style={styles.loading}>Coaching team assembling full debrief...</p>}
      {phase === "done" && (
        <div style={styles.results}>
          {['vlad', 'fabiano', 'hikaru', 'magnus'].map(key => (
            <div key={key} style={styles.card}>
              <h3>{key.toUpperCase()}</h3>
              <p>{coaches[key]}</p>
            </div>
          ))}
          <button style={styles.btnSmall} onClick={() => setPhase("idle")}>＋ New Analysis</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  root: { padding: 40, maxWidth: 850, margin: "0 auto", backgroundColor: "#0d0d0d", color: "#e8e8e8", minHeight: "100vh", fontFamily: "monospace" },
  title: { fontSize: 28, borderBottom: "1px solid #222", paddingBottom: 20, marginBottom: 30 },
  inputArea: { display: "flex", flexDirection: "column", gap: 16 },
  pgnInput: { width: "100%", backgroundColor: "#111", border: "1px solid #333", color: "#ccc", padding: 16, borderRadius: 8, outline: "none", resize: "none" },
  btn: { padding: "14px 28px", backgroundColor: "#c0392b", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer", alignSelf: "flex-start" },
  btnSmall: { marginTop: 20, padding: "10px 20px", backgroundColor: "#333", border: "none", color: "#eee", cursor: "pointer", borderRadius: 4 },
  loading: { color: "#f39c12", paddingTop: 40, textAlign: "center" },
  results: { display: "flex", flexDirection: "column", gap: 16 },
  card: { backgroundColor: "#111", border: "1px solid #222", padding: 20, borderRadius: 8 },
};
