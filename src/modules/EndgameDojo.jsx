/**
 * src/modules/EndgameDojo.jsx
 * vlad-chess-coach -- Endgame Dojo Module
 * Magnus-voiced endgame conversion training.
 * No Stockfish -- uses custom AI consensus via coach personas.
 */

import { useState, useCallback } from "react";
import askMagnus from "../coaches/magnus.jsx";

const ENDGAME_CATEGORIES = [
  {
    id: "kp",
    label: "King + Pawn",
    icon: "♙",
    description: "Passed pawn promotion. The ladder. The box.",
    positions: [
      { id: "kp-1", title: "Opposition & Pawn Promotion", fen: "8/8/8/8/8/4K3/4P3/4k3 w - - 0 1", goal: "Promote the pawn", key_concept: "Opposition -- your king must lead the pawn", difficulty: "beginner" },
      { id: "kp-2", title: "King in the Square", fen: "8/8/8/3p4/8/8/8/4K3 b - - 0 1", goal: "Stop the passed pawn", key_concept: "The square rule -- can your king catch the pawn?", difficulty: "beginner" },
      { id: "kp-3", title: "Pawn Breakthrough", fen: "8/ppp5/8/PPP5/8/8/8/4K2k w - - 0 1", goal: "Create a passed pawn", key_concept: "Pawn breaks -- one pawn sacrificed to create a passer", difficulty: "intermediate" },
    ],
  },
  {
    id: "kr",
    label: "King + Rook",
    icon: "♖",
    description: "Rook coordination. Back rank. Lucena & Philidor.",
    positions: [
      { id: "kr-1", title: "Philidor Defense (Drawing)", fen: "4k3/8/8/8/r7/8/4K3/4R3 w - - 0 1", goal: "Hold the draw as the defending side", key_concept: "Philidor position -- rook on 6th rank until king advances", difficulty: "intermediate" },
      { id: "kr-2", title: "Lucena Position (Winning)", fen: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1", goal: "Convert the Lucena -- build the bridge", key_concept: "Bridge building -- rook cuts off the king then supports promotion", difficulty: "intermediate" },
      { id: "kr-3", title: "Rook Behind Passed Pawn", fen: "8/8/8/8/r7/8/PP6/1K2k3 b - - 0 1", goal: "Activate rook behind the passed pawn", key_concept: "Rook belongs BEHIND the passed pawn -- always", difficulty: "beginner" },
    ],
  },
  {
    id: "kb",
    label: "Two Bishops",
    icon: "♗",
    description: "Two-bishop endgame. TopherBettis is actively mastering this.",
    positions: [
      { id: "kb-1", title: "Two Bishops vs King", fen: "8/8/8/8/8/2B5/1B6/4K2k w - - 0 1", goal: "Force checkmate with two bishops", key_concept: "Drive king to corner. Bishops control color complexes.", difficulty: "intermediate" },
      { id: "kb-2", title: "Bishop Pair Advantage", fen: "8/5p2/6p1/6P1/5P2/2B5/1B6/2K2k2 w - - 0 1", goal: "Convert bishop pair advantage in pawn endgame", key_concept: "Bishop pair dominates in open positions -- activate both", difficulty: "intermediate" },
    ],
  },
  {
    id: "ladder",
    label: "Ladder Mates",
    icon: "♜",
    description: "GM-level patience. TopherBettis confirmed strength.",
    positions: [
      { id: "ladder-1", title: "Queen Ladder Mate", fen: "8/8/8/8/8/1k6/8/KQ6 w - - 0 1", goal: "Deliver ladder mate with queen", key_concept: "Cut off king rank by rank. No stalemate.", difficulty: "beginner" },
      { id: "ladder-2", title: "Rook Ladder Mate", fen: "8/8/8/8/8/1k6/8/KR6 w - - 0 1", goal: "Deliver ladder mate with rook", key_concept: "Opposition with king. Rook cuts off the file.", difficulty: "beginner" },
    ],
  },
];

const DIFFICULTY_COLORS = {
  beginner:     "#27ae60",
  intermediate: "#f39c12",
  advanced:     "#e74c3c",
};

function CategoryCard({ category, isSelected, onClick, solvedCount }) {
  const total = category.positions.length;
  return (
    <div
      style={{ ...styles.categoryCard, border: `1px solid ${isSelected ? "#27ae60" : "#222"}`, backgroundColor: isSelected ? "#0d1a0d" : "#111" }}
      onClick={onClick}
    >
      <span style={styles.categoryIcon}>{category.icon}</span>
      <div style={styles.categoryInfo}>
        <p style={styles.categoryLabel}>{category.label}</p>
        <p style={styles.categoryDesc}>{category.description}</p>
        <p style={styles.categorySolved}>{solvedCount}/{total} solved</p>
      </div>
    </div>
  );
}

function PositionCard({ position, isSolved, isActive, onClick }) {
  return (
    <div
      style={{ ...styles.positionCard, border: `1px solid ${isActive ? "#27ae60" : isSolved ? "#1e4d20" : "#222"}`, backgroundColor: isActive ? "#0d1a0d" : isSolved ? "#0a150a" : "#111", cursor: "pointer" }}
      onClick={onClick}
    >
      <div style={styles.positionHeader}>
        <span style={styles.positionTitle}>{position.title}</span>
        <span style={{ ...styles.diffBadge, color: DIFFICULTY_COLORS[position.difficulty], backgroundColor: DIFFICULTY_COLORS[position.difficulty] + "22" }}>
          {position.difficulty}
        </span>
      </div>
      <p style={styles.positionGoal}>Goal: {position.goal}</p>
      {isSolved && <span style={styles.solvedBadge}>Solved</span>}
    </div>
  );
}

function MagnusCard({ text, loading }) {
  return (
    <div style={styles.magnusCard}>
      <div style={styles.magnusHeader}>
        <span style={styles.magnusEmoji}>👑</span>
        <div>
          <p style={styles.magnusName}>Magnus</p>
          <p style={styles.magnusTitle}>Endgame & Intuition</p>
        </div>
      </div>
      <div style={styles.magnusBody}>
        {loading ? (
          <p style={styles.loadingText}>Calculating...</p>
        ) : text ? (
          <p style={styles.magnusText}>{text}</p>
        ) : (
          <p style={styles.magnusPlaceholder}>Select a position to begin.</p>
        )}
      </div>
    </div>
  );
}

export default function EndgameDojo() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [solvedPositions, setSolvedPositions]   = useState([]);
  const [magnusNote, setMagnusNote]             = useState(null);
  const [magnusLoading, setMagnusLoading]       = useState(false);
  const [showKey, setShowKey]                   = useState(false);

  const totalPositions = ENDGAME_CATEGORIES.reduce((sum, c) => sum + c.positions.length, 0);
  const totalSolved    = solvedPositions.length;

  const handleSelectPosition = useCallback(async (position) => {
    setSelectedPosition(position);
    setShowKey(false);
    setMagnusNote(null);
    setMagnusLoading(true);
    try {
      const context = `Endgame position: ${position.title}. FEN: ${position.fen}. Goal: ${position.goal}. Key concept: ${position.key_concept}. Player: TopherBettis, 617 ELO. Give 2-3 sentences of coaching in Magnus's voice -- confident, precise, no fluff.`;
      const note = await askMagnus(context);
      setMagnusNote(note);
    } catch {
      setMagnusNote("Endgame technique. No excuses. Convert.");
    } finally {
      setMagnusLoading(false);
    }
  }, []);

  const handleMarkSolved = useCallback(() => {
    if (!selectedPosition) return;
    if (!solvedPositions.includes(selectedPosition.id)) {
      setSolvedPositions(prev => [...prev, selectedPosition.id]);
    }
  }, [selectedPosition, solvedPositions]);

  return (
    <div style={styles.root}>

      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>👑</span>
          <div>
            <h1 style={styles.headerTitle}>Endgame Dojo</h1>
            <p style={styles.headerSub}>Magnus mode -- Convert what should be converted</p>
          </div>
        </div>
        <div style={styles.statBox}>
          <span style={styles.statNum}>{totalSolved}/{totalPositions}</span>
          <span style={styles.statLabel}>positions solved</span>
        </div>
      </div>

      <MagnusCard text={magnusNote} loading={magnusLoading} />

      <div style={styles.categoryGrid}>
        {ENDGAME_CATEGORIES.map(cat => (
          <CategoryCard
            key={cat.id}
            category={cat}
            isSelected={selectedCategory?.id === cat.id}
            solvedCount={cat.positions.filter(p => solvedPositions.includes(p.id)).length}
            onClick={() => setSelectedCategory(cat)}
          />
        ))}
      </div>

      {selectedCategory && (
        <div style={styles.positionSection}>
          <p style={styles.sectionTitle}>{selectedCategory.label} -- POSITIONS</p>
          <div style={styles.positionList}>
            {selectedCategory.positions.map(pos => (
              <PositionCard
                key={pos.id}
                position={pos}
                isSolved={solvedPositions.includes(pos.id)}
                isActive={selectedPosition?.id === pos.id}
                onClick={() => handleSelectPosition(pos)}
              />
            ))}
          </div>
        </div>
      )}

      {selectedPosition && (
        <div style={styles.positionDetail}>
          <div style={styles.detailHeader}>
            <h2 style={styles.detailTitle}>{selectedPosition.title}</h2>
            <span style={{ ...styles.diffBadge, color: DIFFICULTY_COLORS[selectedPosition.difficulty], backgroundColor: DIFFICULTY_COLORS[selectedPosition.difficulty] + "22" }}>
              {selectedPosition.difficulty}
            </span>
          </div>
          <div style={styles.fenBox}>
            <p style={styles.fenLabel}>POSITION FEN</p>
            <p style={styles.fenText}>{selectedPosition.fen}</p>
          </div>
          <div style={styles.goalBox}>
            <p style={styles.goalLabel}>GOAL</p>
            <p style={styles.goalText}>{selectedPosition.goal}</p>
          </div>
          <button style={styles.btnGhost} onClick={() => setShowKey(v => !v)}>
            {showKey ? "Hide Key Concept" : "Show Key Concept"}
          </button>
          {showKey && (
            <div style={styles.keyBox}>
              <p style={styles.keyText}>{selectedPosition.key_concept}</p>
            </div>
          )}
          {!solvedPositions.includes(selectedPosition.id) ? (
            <button style={styles.btnGreen} onClick={handleMarkSolved}>Mark Solved</button>
          ) : (
            <div style={styles.solvedConfirm}>Solved</div>
          )}
        </div>
      )}

      <div style={styles.magnusReminder}>
        <p style={styles.magnusReminderTitle}>MAGNUS'S RULE</p>
        <p style={styles.magnusReminderText}>
          The game isn't over until it's over. No draws from winning positions. Convert what should be converted.
        </p>
      </div>
    </div>
  );
}

const styles = {
  root: { display: "flex", flexDirection: "column", gap: 20, padding: "28px 32px", minHeight: "100vh", backgroundColor: "#0d0d0d", color: "#e8e8e8", fontFamily: "'IBM Plex Mono', monospace", maxWidth: 900, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #222", paddingBottom: 20, flexWrap: "wrap", gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  headerIcon: { fontSize: 36 },
  headerTitle: { margin: 0, fontSize: 26, fontWeight: 700, color: "#fff" },
  headerSub: { margin: "2px 0 0", fontSize: 12, color: "#666" },
  statBox: { display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", backgroundColor: "#111", border: "1px solid #222", borderRadius: 8 },
  statNum: { fontSize: 22, fontWeight: 700, color: "#27ae60" },
  statLabel: { fontSize: 10, color: "#555", marginTop: 2 },
  magnusCard: { backgroundColor: "#0a1200", border: "1px solid #1a2e00", borderRadius: 8, overflow: "hidden" },
  magnusHeader: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", backgroundColor: "#0d1800", borderBottom: "1px solid #1a2e0055" },
  magnusEmoji: { fontSize: 26 },
  magnusName: { margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#27ae60" },
  magnusTitle: { margin: 0, fontSize: 10, color: "#3a6b3a" },
  magnusBody: { padding: "14px 16px" },
  magnusText: { margin: 0, fontSize: 13, color: "#8aaf8a", lineHeight: 1.8 },
  magnusPlaceholder: { margin: 0, fontSize: 12, color: "#2a3a2a", fontStyle: "italic" },
  loadingText: { margin: 0, fontSize: 12, color: "#3a5a3a", fontStyle: "italic" },
  categoryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  categoryCard: { display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 8, cursor: "pointer", transition: "border-color 0.2s" },
  categoryIcon: { fontSize: 26, flexShrink: 0 },
  categoryInfo: { display: "flex", flexDirection: "column", gap: 4 },
  categoryLabel: { margin: 0, fontSize: 13, fontWeight: 700, color: "#ccc" },
  categoryDesc: { margin: 0, fontSize: 10, color: "#666", lineHeight: 1.5 },
  categorySolved: { margin: 0, fontSize: 10, color: "#27ae60" },
  positionSection: { display: "flex", flexDirection: "column", gap: 10 },
  sectionTitle: { margin: 0, fontSize: 10, color: "#444", letterSpacing: "1px" },
  positionList: { display: "flex", flexDirection: "column", gap: 8 },
  positionCard: { padding: "12px 16px", borderRadius: 6, transition: "border-color 0.2s" },
  positionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  positionTitle: { fontSize: 13, fontWeight: 600, color: "#ccc" },
  positionGoal: { margin: 0, fontSize: 11, color: "#666" },
  solvedBadge: { display: "inline-block", marginTop: 6, padding: "2px 8px", borderRadius: 3, fontSize: 10, color: "#27ae60", backgroundColor: "#0f2010" },
  diffBadge: { padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 600 },
  positionDetail: { padding: "20px", backgroundColor: "#111", border: "1px solid #222", borderRadius: 8, display: "flex", flexDirection: "column", gap: 14 },
  detailHeader: { display: "flex", alignItems: "center", gap: 12 },
  detailTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" },
  fenBox: { padding: "10px 12px", backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 4 },
  fenLabel: { margin: "0 0 4px", fontSize: 9, color: "#444", letterSpacing: "1px" },
  fenText: { margin: 0, fontSize: 10, color: "#555", wordBreak: "break-all", lineHeight: 1.5 },
  goalBox: { padding: "10px 12px", backgroundColor: "#0a150a", border: "1px solid #1a2e1a", borderRadius: 4 },
  goalLabel: { margin: "0 0 4px", fontSize: 9, color: "#2a5a2a", letterSpacing: "1px" },
  goalText: { margin: 0, fontSize: 13, color: "#8aaf8a" },
  keyBox: { padding: "10px 12px", backgroundColor: "#1a1200", border: "1px solid #3d2e00", borderRadius: 4 },
  keyText: { margin: 0, fontSize: 12, color: "#8a6a2a", lineHeight: 1.7 },
  solvedConfirm: { padding: "10px 16px", backgroundColor: "#0f2010", border: "1px solid #1e4d20", borderRadius: 6, fontSize: 13, color: "#27ae60", textAlign: "center" },
  magnusReminder: { padding: "14px 16px", backgroundColor: "#0a1200", border: "1px solid #1a2e00", borderRadius: 6 },
  magnusReminderTitle: { margin: "0 0 6px", fontSize: 9, color: "#2a4a2a", letterSpacing: "1.5px" },
  magnusReminderText: { margin: 0, fontSize: 12, color: "#3a6b3a", lineHeight: 1.7, fontStyle: "italic" },
  btnGhost: { padding: "8px 16px", backgroundColor: "transparent", color: "#555", border: "1px solid #2a2a2a", borderRadius: 6, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer", alignSelf: "flex-start" },
  btnGreen: { padding: "10px 22px", backgroundColor: "#1e4d20", color: "#27ae60", border: "1px solid #27ae60", borderRadius: 6, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, cursor: "pointer" },
};
