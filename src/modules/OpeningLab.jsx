/**
 * src/modules/OpeningLab.jsx
 * vlad-chess-coach — Opening Lab Module
 *
 * Italian Cage deep prep. Interactive move tree, deviation detection,
 * and Fabiano-voiced opening coaching.
 *
 * Dependencies (load in index.html):
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js"></script>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.js"></script>
 *   Italian Cage knowledge base via data/italianCage.js
 *   Coach personas via src/coaches/fabiano.jsx, vlad.js
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ITALIAN_CAGE } from "../../data/italianCage.js";
import { askFabiano } from "../coaches/fabiano.jsx";
import { askVlad } from "../coaches/vlad.jsx";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// The non-negotiable Coiled Spring move order from VLAD.md
const COILED_SPRING = ["e2e4", "g1f3", "f1c4", "c2c3", "d2d3", "a2a4", "e1g1", "h2h3", "e1e1"];

const CORE_MOVES = [
  { move: "e2e4",  label: "1. e4",   note: "Control the center. Non-negotiable." },
  { move: "g1f3",  label: "2. Nf3",  note: "Develop, attack e5." },
  { move: "f1c4",  label: "3. Bc4",  note: "Italian. Target f7." },
  { move: "c2c3",  label: "4. c3",   note: "Prepares d4. Restricts Black." },
  { move: "d2d3",  label: "5. d3",   note: "Solid base. No early overcommitment." },
  { move: "a2a4",  label: "6. a4",   note: "Cramps queenside. Bishop retreat square." },
  { move: "e1g1",  label: "7. O-O",  note: "Castle. King safe. Rook activated." },
  { move: "h2h3",  label: "8. h3",   note: "Prevents ...Bg4 pin. Luft." },
  { move: "e1e1",  label: "9. Re1",  note: "Rook to open file. Cage complete." },
];

const TACTICS = [
  { id: "strangler",  name: "The Strangler",        desc: "Nbd2→f1→g3→f5 — knight maneuver to f5", icon: "🐍" },
  { id: "expansion",  name: "Queenside Expansion",  desc: "b4 push — space grab", icon: "⬛" },
  { id: "toxicbait",  name: "Toxic Baiting",        desc: "Bg5 pins — create tension", icon: "☠️" },
  { id: "sacrifice",  name: "High-Velocity Sacrifice", desc: "Bxh6 — king exposure", icon: "⚡" },
  { id: "explosion",  name: "Central Explosion",    desc: "d4 break — open lines", icon: "💥" },
];

// Common Black responses to the Italian
const BLACK_RESPONSES = [
  { id: "giuoco",   label: "Giuoco Piano (3...Bc5)",    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3" },
  { id: "twoknight",label: "Two Knights (3...Nf6)",     fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
  { id: "hungarian", label: "Hungarian (3...Be7)",      fen: "r1bqk1nr/ppppbppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
  { id: "classical", label: "Classical (3...Bc5 4...Nf6)", fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 5" },
];

// ---------------------------------------------------------------------------
// Move tree node component
// ---------------------------------------------------------------------------

function MoveNode({ step, index, isActive, isCompleted, onClick }) {
  return (
    <div
      style={{
        ...styles.moveNode,
        backgroundColor: isActive    ? "#1a2810" :
                         isCompleted ? "#0f1a0f" : "#111",
        border: `1px solid ${isActive ? "#27ae60" : isCompleted ? "#1e4d20" : "#222"}`,
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <span style={{
        ...styles.moveNodeNum,
        backgroundColor: isCompleted ? "#27ae60" : isActive ? "#c0392b" : "#222",
        color: (isCompleted || isActive) ? "#fff" : "#555",
      }}>
        {isCompleted ? "✓" : index + 1}
      </span>
      <div style={styles.moveNodeInfo}>
        <span style={styles.moveNodeLabel}>{step.label}</span>
        <span style={styles.moveNodeNote}>{step.note}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tactic card
// ---------------------------------------------------------------------------

function TacticCard({ tactic, isSelected, onClick, fabNote }) {
  return (
    <div
      style={{
        ...styles.tacticCard,
        border: `1px solid ${isSelected ? "#2980b9" : "#222"}`,
        backgroundColor: isSelected ? "#0a1520" : "#111",
      }}
      onClick={onClick}
    >
      <div style={styles.tacticHeader}>
        <span style={styles.tacticIcon}>{tactic.icon}</span>
        <div>
          <p style={styles.tacticName}>{tactic.name}</p>
          <p style={styles.tacticDesc}>{tactic.desc}</p>
        </div>
      </div>
      {isSelected && fabNote && (
        <p style={styles.tacticNote}>♟️ Fabiano: "{fabNote}"</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Response scenario card
// ---------------------------------------------------------------------------

function ResponseCard({ response, isSelected, onClick }) {
  return (
    <div
      style={{
        ...styles.responseCard,
        border: `1px solid ${isSelected ? "#c0392b" : "#222"}`,
        backgroundColor: isSelected ? "#1a0a0a" : "#111",
      }}
      onClick={onClick}
    >
      <span style={styles.responseLabel}>{response.label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function OpeningLab() {
  const [activeStep, setActiveStep]         = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [selectedTactic, setSelectedTactic] = useState(null);
  const [tacticNotes, setTacticNotes]       = useState({});
  const [tacticLoading, setTacticLoading]   = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [responseCoaching, setResponseCoaching] = useState(null);
  const [responseLoading, setResponseLoading]   = useState(false);
  const [quizMode, setQuizMode]             = useState(false);
  const [quizMove, setQuizMove]             = useState(null);
  const [quizFeedback, setQuizFeedback]     = useState(null);
  const [vladNote, setVladNote]             = useState(null);
  const [activeTab, setActiveTab]           = useState("sequence"); // sequence | tactics | responses | quiz

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------

  const handleStepClick = useCallback((index) => {
    setActiveStep(index);
    if (!completedSteps.includes(index)) {
      setCompletedSteps(prev => [...prev, index]);
    }
  }, [completedSteps]);

  const handleMarkComplete = useCallback(() => {
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps(prev => [...prev, activeStep]);
    }
    if (activeStep < CORE_MOVES.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  }, [activeStep, completedSteps]);

  // ---------------------------------------------------------------------------
  // Tactic deep dive
  // ---------------------------------------------------------------------------

  const handleTacticSelect = useCallback(async (tactic) => {
    setSelectedTactic(tactic.id);
    if (tacticNotes[tactic.id]) return; // already fetched

    setTacticLoading(true);
    try {
      const context = `
Explain the "${tactic.name}" tactic in the Italian Cage system for a 609 ELO player.
Tactic: ${tactic.desc}
Give 2-3 sentences on when to execute it and what to watch for. Be Fabiano — methodical, precise.
      `.trim();
      const note = await askFabiano(context, {});
      setTacticNotes(prev => ({ ...prev, [tactic.id]: note }));
    } catch {
      setTacticNotes(prev => ({ ...prev, [tactic.id]: "Analysis unavailable." }));
    } finally {
      setTacticLoading(false);
    }
  }, [tacticNotes]);

  // ---------------------------------------------------------------------------
  // Black response coaching
  // ---------------------------------------------------------------------------

  const handleResponseSelect = useCallback(async (response) => {
    setSelectedResponse(response.id);
    setResponseCoaching(null);
    setResponseLoading(true);
    try {
      const context = `
TopherBettis plays the Italian Cage (Coiled Spring setup) as White.
Black plays: ${response.label}
FEN after Black's move: ${response.fen}
How should White continue in the Cage system? What are the key ideas?
Be Fabiano — positional, preparation-obsessed, 3-4 sentences.
      `.trim();
      const coaching = await askFabiano(context, {});
      setResponseCoaching(coaching);
    } catch {
      setResponseCoaching("Analysis unavailable.");
    } finally {
      setResponseLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Quiz mode
  // ---------------------------------------------------------------------------

  const startQuiz = useCallback(async () => {
    setQuizMode(true);
    setQuizFeedback(null);
    setVladNote(null);
    // Pick a random step that hasn't been quizzed
    const idx = Math.floor(Math.random() * CORE_MOVES.length);
    setQuizMove(idx);
  }, []);

  const handleQuizAnswer = useCallback(async (guessIndex) => {
    const correct = guessIndex === quizMove;
    setQuizFeedback({ correct, correctIndex: quizMove });

    if (!correct) {
      // Vlad fires on wrong answer
      try {
        const context = `
Player got quiz question wrong in OpeningLab.
Correct move was: ${CORE_MOVES[quizMove].label} — "${CORE_MOVES[quizMove].note}"
Give one sharp sentence reminding them why this move matters. Be Vlad.
        `.trim();
        const note = await askVlad(context, {});
        setVladNote(note);
      } catch { /* silent */ }
    }
  }, [quizMove]);

  // Quiz answer options — correct + 2 random wrong
  const quizOptions = quizMove !== null ? (() => {
    const wrong = CORE_MOVES
      .map((_, i) => i)
      .filter(i => i !== quizMove)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    return [...wrong, quizMove].sort(() => Math.random() - 0.5);
  })() : [];

  const progress = Math.round((completedSteps.length / CORE_MOVES.length) * 100);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={styles.root}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🏛️</span>
          <div>
            <h1 style={styles.headerTitle}>Opening Lab</h1>
            <p style={styles.headerSub}>Italian Cage · Coiled Spring System · Gentleman Assassin</p>
          </div>
        </div>
        <div style={styles.progressChip}>
          <span style={styles.progressNum}>{completedSteps.length}/{CORE_MOVES.length}</span>
          <span style={styles.progressLabel}>moves studied</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: "sequence",  label: "📋 Move Sequence" },
          { key: "tactics",   label: "⚔️ 5 Tactics" },
          { key: "responses", label: "🔄 Black Responses" },
          { key: "quiz",      label: "🧠 Quiz Me" },
        ].map(tab => (
          <button
            key={tab.key}
            style={{ ...styles.tab, ...(activeTab === tab.key ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Move Sequence Tab ── */}
      {activeTab === "sequence" && (
        <div style={styles.sequenceLayout}>
          <div style={styles.moveTree}>
            {CORE_MOVES.map((step, i) => (
              <MoveNode
                key={i}
                step={step}
                index={i}
                isActive={i === activeStep}
                isCompleted={completedSteps.includes(i)}
                onClick={() => handleStepClick(i)}
              />
            ))}
          </div>
          <div style={styles.stepDetail}>
            <div style={styles.stepDetailHeader}>
              <span style={styles.stepDetailLabel}>{CORE_MOVES[activeStep].label}</span>
              <span style={styles.stepDetailNum}>Move {activeStep + 1} of {CORE_MOVES.length}</span>
            </div>
            <p style={styles.stepDetailNote}>{CORE_MOVES[activeStep].note}</p>

            {/* Philosophy reminder */}
            <div style={styles.philosophyBox}>
              <p style={styles.philosophyTitle}>THE PHILOSOPHY</p>
              <p style={styles.philosophyText}>
                Feign quiet positional play. Induce opponent over-extension.
                Cage is built. Spring is coiled. Then strike.
              </p>
            </div>

            <button style={styles.btn} onClick={handleMarkComplete}>
              {completedSteps.includes(activeStep) ? "Next Move →" : "Mark Studied →"}
            </button>

            {completedSteps.length === CORE_MOVES.length && (
              <div style={styles.completeBanner}>
                🎖️ Coiled Spring fully studied. Time to drill.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tactics Tab ── */}
      {activeTab === "tactics" && (
        <div style={styles.tacticsLayout}>
          <div style={styles.tacticList}>
            {TACTICS.map(tactic => (
              <TacticCard
                key={tactic.id}
                tactic={tactic}
                isSelected={selectedTactic === tactic.id}
                onClick={() => handleTacticSelect(tactic)}
                fabNote={tacticNotes[tactic.id]}
              />
            ))}
            {tacticLoading && (
              <p style={styles.loadingText}>♟️ Fabiano analyzing…</p>
            )}
          </div>
          <div style={styles.tacticReminder}>
            <p style={styles.tacticReminderTitle}>ARSENAL RULE</p>
            <p style={styles.tacticReminderText}>
              These 5 tactics are only unleashed AFTER the cage is built.
              Never telegraph. Build first. Strike second.
            </p>
          </div>
        </div>
      )}

      {/* ── Black Responses Tab ── */}
      {activeTab === "responses" && (
        <div style={styles.responsesLayout}>
          <div style={styles.responseGrid}>
            {BLACK_RESPONSES.map(r => (
              <ResponseCard
                key={r.id}
                response={r}
                isSelected={selectedResponse === r.id}
                onClick={() => handleResponseSelect(r)}
              />
            ))}
          </div>
          {responseLoading && (
            <p style={styles.loadingText}>♟️ Fabiano preparing response plan…</p>
          )}
          {responseCoaching && !responseLoading && (
            <div style={styles.responseCoachBox}>
              <p style={styles.responseCoachTitle}>♟️ FABIANO'S PLAN</p>
              <p style={styles.responseCoachText}>{responseCoaching}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Quiz Tab ── */}
      {activeTab === "quiz" && (
        <div style={styles.quizLayout}>
          {!quizMode ? (
            <div style={styles.quizStart}>
              <p style={styles.quizIntro}>
                Test your Coiled Spring move order. Vlad will correct you if you're wrong.
              </p>
              <button style={styles.btn} onClick={startQuiz}>Start Quiz</button>
            </div>
          ) : (
            <>
              <p style={styles.quizQuestion}>
                What is move <strong style={{ color: "#c0392b" }}>{quizMove + 1}</strong> in the Coiled Spring sequence?
              </p>
              <div style={styles.quizOptions}>
                {quizOptions.map((optIndex) => {
                  const isCorrect = quizFeedback?.correctIndex === optIndex;
                  const isWrong   = quizFeedback && !isCorrect && optIndex !== quizFeedback.correctIndex;
                  return (
                    <button
                      key={optIndex}
                      style={{
                        ...styles.quizOption,
                        backgroundColor: quizFeedback
                          ? isCorrect ? "#0f2010" : "#1a0a0a"
                          : "#111",
                        border: `1px solid ${quizFeedback
                          ? isCorrect ? "#27ae60" : "#333"
                          : "#333"}`,
                        color: quizFeedback ? isCorrect ? "#27ae60" : "#444" : "#ccc",
                      }}
                      disabled={!!quizFeedback}
                      onClick={() => handleQuizAnswer(optIndex)}
                    >
                      {CORE_MOVES[optIndex].label}
                    </button>
                  );
                })}
              </div>
              {quizFeedback && (
                <div style={styles.quizFeedback}>
                  <p style={{ color: quizFeedback.correct ? "#27ae60" : "#e74c3c", margin: 0, fontWeight: 700 }}>
                    {quizFeedback.correct ? "✅ Correct!" : "❌ Wrong."}
                  </p>
                  <p style={styles.quizCorrectNote}>
                    Move {quizMove + 1}: {CORE_MOVES[quizMove].label} — {CORE_MOVES[quizMove].note}
                  </p>
                  {vladNote && (
                    <p style={styles.vladQuizNote}>🎖️ Vlad: "{vladNote}"</p>
                  )}
                  <button style={styles.btnGhost} onClick={startQuiz}>Next Question →</button>
                </div>
              )}
            </>
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
    gap: 20,
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
    alignItems: "center",
    borderBottom: "1px solid #222",
    paddingBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  headerLeft:  { display: "flex", alignItems: "center", gap: 14 },
  headerIcon:  { fontSize: 36 },
  headerTitle: { margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#fff" },
  headerSub:   { margin: "2px 0 0", fontSize: 12, color: "#666", letterSpacing: "0.5px" },

  progressChip: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "10px 20px",
    backgroundColor: "#111",
    border: "1px solid #222",
    borderRadius: 8,
  },
  progressNum:   { fontSize: 22, fontWeight: 700, color: "#27ae60" },
  progressLabel: { fontSize: 10, color: "#555", marginTop: 2 },

  progressBar:  { height: 4, backgroundColor: "#1a1a1a", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#27ae60", borderRadius: 2, transition: "width 0.4s ease" },

  tabs: { display: "flex", gap: 0, borderBottom: "1px solid #222", flexWrap: "wrap" },
  tab: {
    padding: "10px 18px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#555",
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
    cursor: "pointer",
    letterSpacing: "0.5px",
  },
  tabActive: { color: "#e8e8e8", borderBottom: "2px solid #27ae60" },

  // Sequence
  sequenceLayout: { display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" },
  moveTree: { display: "flex", flexDirection: "column", gap: 6, width: 280, flexShrink: 0 },
  moveNode: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 14px", borderRadius: 6, cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
  },
  moveNodeNum: {
    width: 26, height: 26, borderRadius: 4,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, flexShrink: 0,
    transition: "background 0.2s",
  },
  moveNodeInfo: { display: "flex", flexDirection: "column", gap: 2 },
  moveNodeLabel: { fontSize: 13, fontWeight: 600, color: "#ccc" },
  moveNodeNote:  { fontSize: 10, color: "#555", lineHeight: 1.4 },

  stepDetail: { flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 240 },
  stepDetailHeader: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  stepDetailLabel: { fontSize: 28, fontWeight: 700, color: "#fff" },
  stepDetailNum:   { fontSize: 11, color: "#555" },
  stepDetailNote:  { fontSize: 14, color: "#aaa", lineHeight: 1.7, margin: 0 },

  philosophyBox: {
    padding: "14px 16px",
    backgroundColor: "#0d1a0d",
    border: "1px solid #1e3a1e",
    borderRadius: 6,
  },
  philosophyTitle: { margin: "0 0 6px", fontSize: 9, color: "#3a6b3a", letterSpacing: "1.5px" },
  philosophyText:  { margin: 0, fontSize: 12, color: "#5a8a5a", lineHeight: 1.7, fontStyle: "italic" },

  completeBanner: {
    padding: "12px 16px",
    backgroundColor: "#0f2010",
    border: "1px solid #1e4d20",
    borderRadius: 6,
    fontSize: 13,
    color: "#27ae60",
  },

  // Tactics
  tacticsLayout: { display: "flex", flexDirection: "column", gap: 12 },
  tacticList:    { display: "flex", flexDirection: "column", gap: 10 },
  tacticCard: {
    padding: "14px 16px", borderRadius: 8,
    cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
  },
  tacticHeader: { display: "flex", alignItems: "flex-start", gap: 12 },
  tacticIcon:   { fontSize: 24, flexShrink: 0 },
  tacticName:   { margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#ccc" },
  tacticDesc:   { margin: 0, fontSize: 11, color: "#666" },
  tacticNote:   { margin: "10px 0 0", fontSize: 12, color: "#7fb3d3", fontStyle: "italic", lineHeight: 1.6 },
  tacticReminder: {
    padding: "14px 16px",
    backgroundColor: "#1a0f00",
    border: "1px solid #3d2800",
    borderRadius: 6,
  },
  tacticReminderTitle: { margin: "0 0 6px", fontSize: 9, color: "#7a5500", letterSpacing: "1.5px" },
  tacticReminderText:  { margin: 0, fontSize: 12, color: "#8a6a2a", lineHeight: 1.7 },

  // Responses
  responsesLayout: { display: "flex", flexDirection: "column", gap: 16 },
  responseGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  responseCard: {
    padding: "14px 16px", borderRadius: 6,
    cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
  },
  responseLabel: { fontSize: 12, color: "#aaa" },
  responseCoachBox: {
    padding: "16px 18px",
    backgroundColor: "#0a1520",
    border: "1px solid #1a3a5c",
    borderRadius: 8,
  },
  responseCoachTitle: { margin: "0 0 8px", fontSize: 10, color: "#2980b9", letterSpacing: "1px" },
  responseCoachText:  { margin: 0, fontSize: 13, color: "#aaa", lineHeight: 1.8 },

  // Quiz
  quizLayout:   { display: "flex", flexDirection: "column", gap: 20 },
  quizStart:    { display: "flex", flexDirection: "column", gap: 16 },
  quizIntro:    { margin: 0, fontSize: 14, color: "#aaa", lineHeight: 1.7 },
  quizQuestion: { fontSize: 16, color: "#ccc", lineHeight: 1.6, margin: 0 },
  quizOptions:  { display: "flex", flexDirection: "column", gap: 10 },
  quizOption: {
    padding: "14px 18px",
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "'IBM Plex Mono', monospace",
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color 0.2s, background 0.2s, color 0.2s",
  },
  quizFeedback: {
    display: "flex", flexDirection: "column", gap: 10,
    padding: "16px 18px",
    backgroundColor: "#111",
    border: "1px solid #222",
    borderRadius: 8,
  },
  quizCorrectNote: { margin: 0, fontSize: 12, color: "#888" },
  vladQuizNote:    { margin: 0, fontSize: 12, color: "#c0392b", fontStyle: "italic" },

  // Shared
  loadingText: { margin: 0, fontSize: 12, color: "#555", fontStyle: "italic" },
  btn: {
    padding: "10px 22px",
    backgroundColor: "#c0392b",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 700,
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  btnGhost: {
    padding: "10px 22px",
    backgroundColor: "transparent",
    color: "#666",
    border: "1px solid #333",
    borderRadius: 6,
    fontSize: 13,
    fontFamily: "'IBM Plex Mono', monospace",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
};
