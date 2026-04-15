/**
 * src/modules/OpeningLab.jsx
 * vlad-chess-coach — Opening Lab Module (v3.0 Gentleman's Assassin)
 * Pure AI consensus via askCoach(persona, userMessage). No Stockfish. We are special.
 * 9-move universal cage + 4 Black response lines
 * + Phase 2 Nbd2→Nf1→Ng3→Ba2→Nh5/Nf5 kingside attack map
 * Standard: Braceless default imports for Vercel stability.
 */

import { useState, useCallback, useEffect } from "react";
import askFabiano from "../coaches/fabiano.jsx";
import askVlad from "../coaches/vlad.jsx";
import askMagnus from "../coaches/magnus.jsx";

// ── THE 9-MOVE UNIVERSAL SYSTEM ──────────────────────────────────────────────

const UNIVERSAL_SYSTEM = [
  {
    move: "1. e4",
    uci: "e2e4",
    vlad: "Control the center. This is not optional. Everything begins here.",
    principle: "Central control",
  },
  {
    move: "2. Nf3",
    uci: "g1f3",
    vlad: "Develop with tempo. Knight attacks e5. Black must defend or concede.",
    principle: "Development + tempo",
  },
  {
    move: "3. Bc4",
    uci: "f1c4",
    vlad: "The Italian Bishop. f7 is your target. It has always been your target.",
    principle: "Target f7 weakness",
  },
  {
    move: "4. c3",
    uci: "c2c3",
    vlad: "Build the bunker. c3 prepares d4. Also — stops their knights from b4.",
    principle: "Cage foundation",
  },
  {
    move: "5. d3",
    uci: "d2d3",
    vlad: "THE Pianissimo move. You do not tip your hand. You build. They wonder.",
    principle: "Closed center — patience",
  },
  {
    move: "6. a4",
    uci: "a2a4",
    vlad: "Prophylaxis. Na5 is neutralized before it breathes. Ba2 escape hatch created.",
    principle: "Prophylaxis + bishop safety",
  },
  {
    move: "7. O-O",
    uci: "e1g1",
    vlad: "Castle. King is safe. Now we think only about attack. Non-negotiable by move 7.",
    principle: "King safety",
  },
  {
    move: "8. h3",
    uci: "h2h3",
    vlad: "SACRED. Stops Bg4 pin on your knight. Enables Be3. Do not skip this move.",
    principle: "Anti-pin shield",
  },
  {
    move: "9. Re1",
    uci: "f1e1",
    vlad: "Rook to e-file. Central support. Future Re3 battery ready. The cage is complete.",
    principle: "Cage completion",
  },
];

// ── 4 BLACK RESPONSE LINES ───────────────────────────────────────────────────

const BLACK_RESPONSES = [
  {
    id: "giuoco",
    label: "Giuoco Piano",
    trigger: "3...Bc5",
    color: "#c0392b",
    icon: "♝",
    subtitle: "Closed center · Full Gentleman Assassin",
    description: "Black mirrors with Bc5. This is our ideal territory. Closed center, slow build, devastating kingside attack.",
    vladIntro: "This is what we want. They play Bc5, we play our system. Nine moves. The cage is complete. Now the Assassin wakes.",
    phase2: [
      { move: "Nbd2", note: "Load the spring. Knight begins the march to f1." },
      { move: "Nf1", note: "Reroute complete. Ng3 square is next." },
      { move: "Ng3", note: "Knight threatens h5 and f5. Black must watch two squares." },
      { move: "Ba2", note: "Bishop to the safe house. Still watching f7." },
      { move: "Nh5 or Nf5", note: "THE STRANGLER. Knight lands on f5 or h5. Attack begins." },
      { move: "Re3", note: "Rook swings to attack. Battery ready. Black suffocates." },
      { move: "d4 break", note: "Release the coiled spring when ready. Center explodes." },
    ],
    deviations: [
      { trigger: "...Na5 (bishop attack)", response: "Ba2 — already prepared by a4. Bishop stays on the diagonal." },
      { trigger: "...d5 (central break)", response: "exd5. Open lines favor our development lead. Continue building." },
      { trigger: "...Be6 (trade offer)", response: "Bb3 or Bxe6. Doubled f-pawns are a long-term target." },
      { trigger: "...Ng4 (before h3)", response: "h3 immediately. They lose tempo retreating. This is why h3 is sacred." },
    ],
  },
  {
    id: "sicilian_ed",
    label: "Sicilian ...e6/d6",
    trigger: "1...c5 then ...e6 or ...d6",
    color: "#8e44ad",
    icon: "♟",
    subtitle: "Ba2 sniper · Ng3→Nh5→Nf5",
    description: "Black plays the Sicilian with ...e6 or ...d6. Same 9 moves. Ba2 sniper position activates. Knight routing to Nf5 is the crusher.",
    vladIntro: "They think the Sicilian saves them. It does not. Same nine moves. Ba2 becomes a sniper. The knight marches to f5. They die the same death.",
    phase2: [
      { move: "Nbd2", note: "Same routing. Black's Sicilian structure changes nothing." },
      { move: "Nf1", note: "Knight continues. The machine does not care what Black played." },
      { move: "Ng3", note: "Spring loaded. Now Ba2 and Ng3 coordinate." },
      { move: "Ba2", note: "The sniper. Bishop watches f7 from a2. Permanent." },
      { move: "Nh5", note: "h5 square available because Black's g6 push is delayed." },
      { move: "Nf5", note: "The crusher. Knight on f5 in Sicilian is devastating." },
      { move: "f4-f5 thrust", note: "Open the f-file. Rook on f1 joins. Attack is terminal." },
    ],
    deviations: [
      { trigger: "...d5 (break attempt)", response: "Do not panic. exd5 and recapture. Development advantage holds." },
      { trigger: "...a6 ...b5 (queenside)", response: "Watch for ...d5 break. a3-b4 if they commit queenside." },
      { trigger: "...Nc6 then ...e5", response: "Allow it. d3 structure absorbs e5. We attack kingside anyway." },
      { trigger: "Black castles queenside", response: "Open the center immediately. d4 break with full force." },
    ],
  },
  {
    id: "dragon",
    label: "Dragon Sicilian",
    trigger: "1...c5 then ...g6",
    color: "#e67e22",
    icon: "🐉",
    subtitle: "axb5 exchange win · Nf5 crusher",
    description: "Black plays the Dragon with ...g6. Same 9 moves. The a4 move becomes a weapon — axb5 exchange advantage. Nf5 is the final crusher.",
    vladIntro: "The Dragon player thinks they are dangerous. They are not. Our a4 becomes a weapon. We take on b5. We win the exchange fight. The knight goes to f5. The Dragon breathes its last.",
    phase2: [
      { move: "Nbd2", note: "Same routing. Dragon or not — the plan does not change." },
      { move: "axb5 (when ...b5 comes)", note: "THE EXCHANGE WIN. a4 was waiting for this. We win the a-file." },
      { move: "Nf1 → Ng3", note: "Knight marches regardless. Two-front pressure." },
      { move: "Ba2", note: "Sniper position. f7 is still the target." },
      { move: "Nf5", note: "Dragon players castle kingside. Nf5 is the immediate threat." },
      { move: "Rxa-file", note: "Open a-file after axb5 exchange. Second attack vector." },
      { move: "d4 break", note: "Open the center when Nf5 is established. Lethal combination." },
    ],
    deviations: [
      { trigger: "...b5 (the critical pawn push)", response: "axb5. This is what a4 was waiting for. Take immediately." },
      { trigger: "...h5 (anti-Nf5)", response: "Nh3. Knight reroutes. g4-g5 pawn storm becomes available." },
      { trigger: "Black delays castling", response: "d4 immediately. Punish the uncastled king." },
      { trigger: "...d5 (Dragon counter)", response: "e5. Drive the knight. Our structure handles the tension." },
    ],
  },
  {
    id: "two_knights",
    label: "Two Knights",
    trigger: "2...Nf6",
    color: "#27ae60",
    icon: "♞",
    subtitle: "d3 solves it · Fold into system",
    description: "Black plays Two Knights with ...Nf6. d3 on move 5 neutralizes all sharp lines (Ng5, Bc5 tricks). Fold seamlessly into the cage system.",
    vladIntro: "Two Knights. They wait for Ng5. We play d3. They are confused. There is no Ng5. There is only the cage. d3 folds everything into our system. They have prepared for the wrong opponent.",
    phase2: [
      { move: "Nbd2", note: "Two Knights transposes to Line 1 territory after d3. Same march." },
      { move: "Nf1", note: "If Black plays ...Bc5, we are now in pure Giuoco Piano." },
      { move: "Ng3", note: "The routing never changes. This is the beauty of the system." },
      { move: "Ba2", note: "Safe house. Knight on f5 is the destination." },
      { move: "Nf5", note: "The Strangler lands. Two Knights or not — same ending." },
      { move: "Re3", note: "Rook joins the attack. Battery on the third rank." },
      { move: "d4 break", note: "Release when ready. The cage always wins." },
    ],
    deviations: [
      { trigger: "...Bc5 (transposes)", response: "Welcome it. Pure Giuoco Piano. We are in Line 1 territory." },
      { trigger: "...d5 (central counter)", response: "exd5 Nxd5. Open position favors our development lead." },
      { trigger: "...Na5 (bishop attack)", response: "Ba2. Already prepared. Bishop stays on the a2-g8 diagonal." },
      { trigger: "...Ng4 (attack d3)", response: "h3. Ng4 without preparation loses tempo. Non-negotiable." },
    ],
  },
];

// ── ASSASSIN CHECKLIST ───────────────────────────────────────────────────────

const ASSASSIN_CHECKLIST = [
  { id: 1, condition: "Knight on f1", note: "Rerouting has begun. Ng3 square is next." },
  { id: 2, condition: "h3 is played", note: "Sacred shield active. Bg4 pin impossible." },
  { id: 3, condition: "Bishop on b3 or a2", note: "Safe house secured. Still eyes f7." },
  { id: 4, condition: "Rook on e1", note: "Central support. Re3 swing ready." },
  { id: 5, condition: "King castled", note: "King safety confirmed before attack." },
  { id: 6, condition: "Zero hanging pieces", note: "No loose pieces before the strike." },
  { id: 7, condition: "Ng3 square clear", note: "Path open for the knight maneuver." },
];

// ── QUIZ DATA ────────────────────────────────────────────────────────────────

const SYSTEM_QUIZ = [
  {
    question: "What is the correct move order for moves 4 and 5?",
    options: ["4.d3 5.c3", "4.c3 5.d3", "4.O-O 5.d3", "4.c3 5.O-O"],
    correct: 1,
    explanation: "4.c3 then 5.d3. The bunker is always built c3 first, then d3. This is the Pianissimo foundation.",
  },
  {
    question: "Why is 6.a4 played before castling?",
    options: ["To attack the queenside", "To prevent ...Na5 and create Ba2 escape hatch", "To support d4 later", "To stop ...b5 immediately"],
    correct: 1,
    explanation: "a4 neutralizes ...Na5 before it happens AND creates the Ba2 safe house. Prophylaxis and preparation in one move.",
  },
  {
    question: "Vlad calls h3 'SACRED.' Why?",
    options: ["It threatens Black's bishop", "It prevents Bg4 pinning the Nf3, enables Be3", "It prepares g4", "It creates luft for the king"],
    correct: 1,
    explanation: "h3 stops Bg4 which would pin Nf3 against the queen. It also enables Be3 development. Without h3, the whole attack collapses.",
  },
  {
    question: "Black plays the Dragon Sicilian (...g6). How does a4 become a weapon?",
    options: ["a5 space gaining", "axb5 exchange advantage when Black plays ...b5", "Opens the a-file for attack", "Stops queenside castling"],
    correct: 1,
    explanation: "When Black plays ...b5 in the Dragon, axb5 wins the exchange fight and opens the a-file. The a4 move was waiting for this moment.",
  },
  {
    question: "What is the Phase 2 knight routing sequence?",
    options: ["Nc3→Ne2→Ng3→Nf5", "Nbd2→Nf1→Ng3→Nf5 or Nh5", "Nf3→Nh4→Nf5", "Nb1→Nd2→Nf3→Ng5"],
    correct: 1,
    explanation: "Nbd2→Nf1→Ng3→Nf5 (or Nh5). This is the Strangler maneuver. The knight marches from d2 to the killing square on f5.",
  },
  {
    question: "Two Knights: Black plays ...Nf6. What is our move 5 instead of d4?",
    options: ["5.Ng5", "5.d4", "5.d3", "5.O-O"],
    correct: 2,
    explanation: "5.d3. This refuses all sharp lines (Ng5 tricks, ...Bc5 complications) and folds directly into our cage structure. They prepared for the wrong game.",
  },
  {
    question: "What completes the cage on move 9?",
    options: ["h3", "Nbd2", "Re1", "Be3"],
    correct: 2,
    explanation: "9.Re1. When the rook lands on e1, the cage is complete. Central support, e4 protected, future Re3 swing loaded. Execute.",
  },
];

// ── COMPONENT ────────────────────────────────────────────────────────────────

export default function OpeningLab() {
  const [activeView, setActiveView] = useState("system"); // system | lines | checklist | quiz
  const [selectedMove, setSelectedMove] = useState(0);
  const [selectedLine, setSelectedLine] = useState(null);
  const [lineTab, setLineTab] = useState("phase2"); // phase2 | deviations | vlad
  const [studiedMoves, setStudiedMoves] = useState({});
  const [checklist, setChecklist] = useState({});
  const [vladCommentary, setVladCommentary] = useState({});
  const [loadingVlad, setLoadingVlad] = useState(null);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [vladFeedback, setVladFeedback] = useState("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const totalStudied = Object.values(studiedMoves).filter(Boolean).length;
  const progressPct = Math.round((totalStudied / UNIVERSAL_SYSTEM.length) * 100);
  const checklistComplete = ASSASSIN_CHECKLIST.every(item => checklist[item.id]);

  const toggleStudied = (idx) =>
    setStudiedMoves(prev => ({ ...prev, [idx]: !prev[idx] }));

  const toggleChecklist = (id) =>
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));

  const fetchVladCommentary = useCallback(async (moveIdx) => {
    if (vladCommentary[moveIdx]) return;
    setLoadingVlad(moveIdx);
    const m = UNIVERSAL_SYSTEM[moveIdx];
    try {
      const persona = `You are Vlad, a demanding Eastern European chess coach based on Vladimir Chuchelov. You are teaching TopherBettis (ELO 617) your opening system. Be direct, precise, intense. 2-3 sentences max.`;
      const result = await askVlad(
        `${persona}\n\nExplain WHY ${m.move} is played in the Gentleman's Assassin system. Principle: ${m.principle}. Core note: ${m.vlad}`
      );
      setVladCommentary(prev => ({ ...prev, [moveIdx]: result }));
    } catch {
      setVladCommentary(prev => ({ ...prev, [moveIdx]: m.vlad }));
    }
    setLoadingVlad(null);
  }, [vladCommentary]);

  const fetchLineVlad = useCallback(async (lineId) => {
    const key = `line_${lineId}`;
    if (vladCommentary[key]) return;
    setLoadingVlad(key);
    const line = BLACK_RESPONSES.find(l => l.id === lineId);
    try {
      const result = await askVlad(
        `You are Vlad, demanding Eastern European chess coach. TopherBettis (ELO 617) is studying the ${line.label} response (${line.trigger}) to his Gentleman's Assassin system. Give your coaching introduction in 3-4 sentences. Be intense, precise, Eastern European in tone.`
      );
      setVladCommentary(prev => ({ ...prev, [key]: result }));
    } catch {
      setVladCommentary(prev => ({ ...prev, [key]: line.vladIntro }));
    }
    setLoadingVlad(null);
  }, [vladCommentary]);

  const handleQuizAnswer = useCallback(async (idx) => {
    const q = SYSTEM_QUIZ[quizIndex];
    setQuizAnswer(idx);
    if (idx === q.correct) {
      setQuizScore(prev => prev + 1);
    } else {
      setLoadingFeedback(true);
      try {
        const feedback = await askVlad(
          `You are Vlad. TopherBettis answered a quiz question wrong. Question: "${q.question}". Correct answer: "${q.options[q.correct]}". Give a sharp 1-2 sentence correction in your demanding style.`
        );
        setVladFeedback(feedback);
      } catch {
        setVladFeedback("Wrong. Study the sequence again. No shortcuts.");
      }
      setLoadingFeedback(false);
    }
  }, [quizIndex]);

  const nextQuestion = () => {
    if (quizIndex === SYSTEM_QUIZ.length - 1) {
      setQuizDone(true);
    } else {
      setQuizIndex(prev => prev + 1);
      setQuizAnswer(null);
      setVladFeedback("");
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setQuizAnswer(null);
    setQuizScore(0);
    setQuizDone(false);
    setQuizStarted(false);
    setVladFeedback("");
  };

  return (
    <div style={S.root}>

      {/* ── HEADER ── */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <span style={S.headerIcon}>🗡️</span>
          <div>
            <h1 style={S.headerTitle}>Opening Lab</h1>
            <p style={S.headerSub}>GENTLEMAN'S ASSASSIN — v3.0 · MY OPENING SYSTEM</p>
          </div>
        </div>
        <div style={S.progressChip}>
          <span style={S.progressNum}>{progressPct}%</span>
          <span style={S.progressLabel}>MOVES STUDIED</span>
        </div>
      </div>

      <div style={S.progressBar}>
        <div style={{ ...S.progressFill, width: `${progressPct}%` }} />
      </div>

      {/* ── VLAD QUOTE ── */}
      <div style={S.vladQuote}>
        <span style={S.vladQuoteText}>"Nine moves. One system. Four Black responses. The cage is always complete by move nine. Always."</span>
        <span style={S.vladQuoteAttr}>— Vlad</span>
      </div>

      {/* ── TOP NAV ── */}
      <div style={S.topNav}>
        {[
          { id: "system",    label: "9-MOVE SYSTEM",  icon: "🏗️" },
          { id: "lines",     label: "4 RESPONSES",    icon: "♟️" },
          { id: "checklist", label: "ASSASSIN CHECK", icon: "⚔️" },
          { id: "quiz",      label: "QUIZ",            icon: "🎯" },
        ].map(v => (
          <button
            key={v.id}
            style={{ ...S.topNavBtn, ...(activeView === v.id ? S.topNavBtnActive : {}) }}
            onClick={() => setActiveView(v.id)}
          >
            <span>{v.icon}</span>
            <span>{v.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          VIEW: 9-MOVE SYSTEM
      ════════════════════════════════════════════════════════════ */}
      {activeView === "system" && (
        <div style={S.systemLayout}>

          {/* Move list */}
          <div style={S.moveList}>
            <div style={S.moveListHeader}>
              <span style={S.moveListTitle}>THE 9 MOVES</span>
              <span style={S.moveListSub}>Click to study</span>
            </div>
            {UNIVERSAL_SYSTEM.map((m, i) => {
              const studied = studiedMoves[i];
              const active = selectedMove === i;
              return (
                <div
                  key={i}
                  style={{
                    ...S.moveRow,
                    border: `1px solid ${active ? "#c0392b" : studied ? "#1e4d20" : "#1a1a1a"}`,
                    backgroundColor: active ? "#1a0808" : studied ? "#0a1200" : "#0d0d0d",
                  }}
                  onClick={() => {
                    setSelectedMove(i);
                    fetchVladCommentary(i);
                  }}
                >
                  <div style={{
                    ...S.moveRowNum,
                    backgroundColor: studied ? "#27ae60" : active ? "#c0392b" : "#1a1a1a",
                  }}>
                    {studied ? "✓" : i + 1}
                  </div>
                  <div style={S.moveRowContent}>
                    <span style={{ ...S.moveRowLabel, color: active ? "#fff" : "#ccc" }}>{m.move}</span>
                    <span style={S.moveRowPrinciple}>{m.principle}</span>
                  </div>
                  {studied && <span style={S.studiedDot}>●</span>}
                </div>
              );
            })}

            <div style={S.systemProgress}>
              <div style={S.systemProgressBar}>
                <div style={{ ...S.systemProgressFill, width: `${progressPct}%` }} />
              </div>
              <span style={S.systemProgressLabel}>{totalStudied}/{UNIVERSAL_SYSTEM.length} studied</span>
            </div>
          </div>

          {/* Move detail */}
          <div style={S.moveDetail}>
            {(() => {
              const m = UNIVERSAL_SYSTEM[selectedMove];
              const vladText = vladCommentary[selectedMove];
              return (
                <>
                  <div style={S.moveDetailHeader}>
                    <span style={S.moveDetailMove}>{m.move}</span>
                    <span style={S.moveDetailIndex}>Move {selectedMove + 1} of 9</span>
                  </div>

                  <div style={S.principleTag}>
                    <span style={S.principleLabel}>PRINCIPLE</span>
                    <span style={S.principleText}>{m.principle}</span>
                  </div>

                  {/* Vlad commentary box */}
                  <div style={S.vladBox}>
                    <div style={S.vladBoxHeader}>
                      <span style={S.vladBoxIcon}>🎖️</span>
                      <span style={S.vladBoxTitle}>VLAD SAYS</span>
                    </div>
                    {loadingVlad === selectedMove ? (
                      <p style={S.vladLoading}>Consulting Vlad...</p>
                    ) : vladText ? (
                      <p style={S.vladText}>{vladText}</p>
                    ) : (
                      <p style={S.vladDefault}>"{m.vlad}"</p>
                    )}
                    {!vladText && loadingVlad !== selectedMove && (
                      <button
                        style={S.askVladBtn}
                        onClick={() => fetchVladCommentary(selectedMove)}
                      >
                        Ask Vlad for deeper commentary →
                      </button>
                    )}
                  </div>

                  {/* UCI move */}
                  <div style={S.uciBox}>
                    <span style={S.uciLabel}>UCI</span>
                    <span style={S.uciText}>{m.uci}</span>
                  </div>

                  <button
                    style={{
                      ...S.studyBtn,
                      backgroundColor: studiedMoves[selectedMove] ? "#1e4d20" : "#c0392b",
                    }}
                    onClick={() => toggleStudied(selectedMove)}
                  >
                    {studiedMoves[selectedMove] ? "✓ Marked Studied" : "Mark as Studied"}
                  </button>

                  {selectedMove < 8 && (
                    <button
                      style={S.nextMoveBtn}
                      onClick={() => {
                        setSelectedMove(prev => prev + 1);
                        fetchVladCommentary(selectedMove + 1);
                      }}
                    >
                      Next Move →
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          VIEW: 4 BLACK RESPONSES
      ════════════════════════════════════════════════════════════ */}
      {activeView === "lines" && (
        <div style={S.linesLayout}>

          {/* Line selector */}
          <div style={S.lineSelectorGrid}>
            {BLACK_RESPONSES.map(line => (
              <div
                key={line.id}
                style={{
                  ...S.lineCard,
                  border: `1px solid ${selectedLine?.id === line.id ? line.color : "#1e1e1e"}`,
                  backgroundColor: selectedLine?.id === line.id ? `${line.color}12` : "#0d0d0d",
                }}
                onClick={() => {
                  setSelectedLine(line);
                  setLineTab("phase2");
                  fetchLineVlad(line.id);
                }}
              >
                <span style={S.lineCardIcon}>{line.icon}</span>
                <div style={S.lineCardInfo}>
                  <span style={{ ...S.lineCardLabel, color: selectedLine?.id === line.id ? line.color : "#ccc" }}>
                    {line.label}
                  </span>
                  <span style={S.lineCardTrigger}>{line.trigger}</span>
                  <span style={S.lineCardSub}>{line.subtitle}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Line detail */}
          {selectedLine && (
            <div style={S.lineDetail}>

              <div style={{ ...S.lineDetailHeader, borderLeftColor: selectedLine.color }}>
                <span style={{ ...S.lineDetailTitle, color: selectedLine.color }}>{selectedLine.label}</span>
                <span style={S.lineDetailDesc}>{selectedLine.description}</span>
              </div>

              {/* Sub-tabs */}
              <div style={S.lineTabs}>
                {[
                  { id: "phase2",     label: "PHASE 2 ATTACK" },
                  { id: "deviations", label: "DEVIATIONS" },
                  { id: "vlad",       label: "VLAD COACHING" },
                ].map(t => (
                  <button
                    key={t.id}
                    style={{
                      ...S.lineTab,
                      ...(lineTab === t.id ? { color: selectedLine.color, borderBottomColor: selectedLine.color } : {}),
                    }}
                    onClick={() => setLineTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Phase 2 */}
              {lineTab === "phase2" && (
                <div style={S.phase2Layout}>
                  <div style={S.phase2Header}>
                    <span style={S.phase2Title}>Nbd2 → Nf1 → Ng3 → Ba2 → Nh5/Nf5</span>
                    <span style={S.phase2Sub}>The Strangler Sequence</span>
                  </div>
                  {selectedLine.phase2.map((step, i) => (
                    <div key={i} style={S.phase2Step}>
                      <div style={{ ...S.phase2StepNum, backgroundColor: selectedLine.color }}>
                        {i + 1}
                      </div>
                      <div style={S.phase2StepContent}>
                        <span style={S.phase2StepMove}>{step.move}</span>
                        <span style={S.phase2StepNote}>{step.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Deviations */}
              {lineTab === "deviations" && (
                <div style={S.deviationsLayout}>
                  {selectedLine.deviations.map((d, i) => (
                    <div key={i} style={S.deviationCard}>
                      <div style={S.deviationTrigger}>
                        <span style={S.deviationTriggerLabel}>IF BLACK PLAYS</span>
                        <span style={S.deviationTriggerText}>{d.trigger}</span>
                      </div>
                      <div style={S.deviationArrow}>→</div>
                      <div style={S.deviationResponse}>
                        <span style={S.deviationResponseLabel}>WE RESPOND</span>
                        <span style={S.deviationResponseText}>{d.response}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vlad coaching */}
              {lineTab === "vlad" && (
                <div style={S.vladCoachingBox}>
                  <div style={S.vladCoachingHeader}>
                    <span style={S.vladCoachingIcon}>🎖️</span>
                    <span style={S.vladCoachingTitle}>VLAD ON {selectedLine.label.toUpperCase()}</span>
                  </div>
                  {loadingVlad === `line_${selectedLine.id}` ? (
                    <p style={S.vladLoading}>Vlad is preparing his coaching...</p>
                  ) : (
                    <p style={S.vladCoachingText}>
                      {vladCommentary[`line_${selectedLine.id}`] || selectedLine.vladIntro}
                    </p>
                  )}
                  {!vladCommentary[`line_${selectedLine.id}`] && loadingVlad !== `line_${selectedLine.id}` && (
                    <button
                      style={S.askVladBtn}
                      onClick={() => fetchLineVlad(selectedLine.id)}
                    >
                      Get live Vlad coaching →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {!selectedLine && (
            <div style={S.lineSelectPrompt}>
              <span style={S.lineSelectPromptIcon}>☝️</span>
              <span style={S.lineSelectPromptText}>Select a Black response above to study the attack plan</span>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          VIEW: ASSASSIN CHECKLIST
      ════════════════════════════════════════════════════════════ */}
      {activeView === "checklist" && (
        <div style={S.checklistLayout}>

          <div style={S.checklistIntro}>
            <p style={S.checklistRule}>"Before you strike — verify the cage. Every condition. Every time."</p>
            <p style={S.checklistRuleAttr}>— Vlad</p>
          </div>

          <div style={S.checklistItems}>
            {ASSASSIN_CHECKLIST.map(item => (
              <div
                key={item.id}
                style={{
                  ...S.checklistItem,
                  border: `1px solid ${checklist[item.id] ? "#1e4d20" : "#1a1a1a"}`,
                  backgroundColor: checklist[item.id] ? "#0a1200" : "#0d0d0d",
                }}
                onClick={() => toggleChecklist(item.id)}
              >
                <div style={{
                  ...S.checklistBox,
                  borderColor: checklist[item.id] ? "#27ae60" : "#333",
                  backgroundColor: checklist[item.id] ? "#27ae60" : "transparent",
                }}>
                  {checklist[item.id] ? "✓" : ""}
                </div>
                <div style={S.checklistContent}>
                  <span style={S.checklistCondition}>{item.condition}</span>
                  <span style={S.checklistNote}>{item.note}</span>
                </div>
              </div>
            ))}
          </div>

          {checklistComplete && (
            <div style={S.checklistComplete}>
              <span style={S.checklistCompleteIcon}>⚔️</span>
              <span style={S.checklistCompleteText}>CAGE VERIFIED. THE ASSASSIN IS READY TO STRIKE.</span>
            </div>
          )}

          {/* Phase 2 strike sequence */}
          <div style={S.strikeBox}>
            <p style={S.strikeTitle}>PHASE 2 · STRIKE SEQUENCE</p>
            {[
              { move: "Nbd2 → Nf1", note: "Load the spring. Begin the march." },
              { move: "Ng3", note: "Spring loaded. Two squares threatened." },
              { move: "Ba2", note: "Bishop to safe house. f7 in crosshairs." },
              { move: "Nh5 / Nf5", note: "THE STRANGLER. Knight lands. Attack begins." },
              { move: "Re3", note: "Rook swings. Battery assembled." },
              { move: "d4 break", note: "Release the spring. Center explodes. Execute." },
            ].map((step, i) => (
              <div key={i} style={S.strikeStep}>
                <span style={S.strikeStepNum}>{i + 1}</span>
                <div>
                  <span style={S.strikeStepMove}>{step.move}</span>
                  <span style={S.strikeStepNote}>{step.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          VIEW: QUIZ
      ════════════════════════════════════════════════════════════ */}
      {activeView === "quiz" && (
        <div style={S.quizLayout}>

          {!quizStarted && !quizDone && (
            <div style={S.quizIntro}>
              <span style={S.quizIntroIcon}>🎯</span>
              <h2 style={S.quizIntroTitle}>System Knowledge Test</h2>
              <p style={S.quizIntroDesc}>
                {SYSTEM_QUIZ.length} questions. The 9-move sequence, the 4 Black responses, the Phase 2 attack. Vlad grades your wrong answers personally.
              </p>
              <button style={S.quizStartBtn} onClick={() => setQuizStarted(true)}>
                Begin Test
              </button>
            </div>
          )}

          {quizStarted && !quizDone && (
            <div style={S.quizCard}>
              <div style={S.quizProgress}>
                <div style={S.quizProgressBar}>
                  <div style={{ ...S.quizProgressFill, width: `${((quizIndex) / SYSTEM_QUIZ.length) * 100}%` }} />
                </div>
                <span style={S.quizProgressLabel}>
                  Question {quizIndex + 1} of {SYSTEM_QUIZ.length} · Score: {quizScore}
                </span>
              </div>

              <p style={S.quizQuestion}>{SYSTEM_QUIZ[quizIndex].question}</p>

              <div style={S.quizOptions}>
                {SYSTEM_QUIZ[quizIndex].options.map((opt, i) => {
                  let bg = "#111";
                  let border = "#222";
                  if (quizAnswer !== null) {
                    if (i === SYSTEM_QUIZ[quizIndex].correct) { bg = "#0f2010"; border = "#27ae60"; }
                    else if (i === quizAnswer && i !== SYSTEM_QUIZ[quizIndex].correct) { bg = "#1a0000"; border = "#c0392b"; }
                  }
                  return (
                    <button
                      key={i}
                      style={{ ...S.quizOption, backgroundColor: bg, borderColor: border }}
                      onClick={() => quizAnswer === null && handleQuizAnswer(i)}
                    >
                      <span style={S.quizOptionLetter}>{["A", "B", "C", "D"][i]}</span>
                      <span style={S.quizOptionText}>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {quizAnswer !== null && (
                <div style={S.quizFeedback}>
                  <p style={S.quizExplanation}>{SYSTEM_QUIZ[quizIndex].explanation}</p>
                  {loadingFeedback && <p style={S.vladLoading}>Vlad is reviewing your answer...</p>}
                  {vladFeedback && (
                    <div style={S.vladFeedbackBox}>
                      <span style={S.vladFeedbackIcon}>🎖️</span>
                      <p style={S.vladFeedbackText}>"{vladFeedback}"</p>
                    </div>
                  )}
                  <button style={S.quizNextBtn} onClick={nextQuestion}>
                    {quizIndex === SYSTEM_QUIZ.length - 1 ? "See Results" : "Next Question →"}
                  </button>
                </div>
              )}
            </div>
          )}

          {quizDone && (
            <div style={S.quizResults}>
              <span style={S.quizResultsIcon}>
                {quizScore >= 6 ? "⚔️" : quizScore >= 4 ? "🗡️" : "📚"}
              </span>
              <h2 style={S.quizResultsTitle}>
                {quizScore}/{SYSTEM_QUIZ.length}
              </h2>
              <p style={S.quizResultsRating}>
                {quizScore === 7 ? "ASSASSIN READY. The system is in your bones." :
                 quizScore >= 5 ? "Solid. Two more sessions and the cage is automatic." :
                 "Back to the sequence. Study. Then return."}
              </p>
              <button style={S.quizRetryBtn} onClick={resetQuiz}>
                Retake Test
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── STYLES ───────────────────────────────────────────────────────────────────

const S = {
  root: {
    display: "flex", flexDirection: "column", gap: 20,
    padding: "28px 32px", minHeight: "100vh",
    backgroundColor: "#0d0d0d", color: "#e8e8e8",
    fontFamily: "'IBM Plex Mono', monospace",
    maxWidth: 960, margin: "0 auto",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #222", paddingBottom: 20 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  headerIcon: { fontSize: 36 },
  headerTitle: { margin: 0, fontSize: 26, fontWeight: 700, color: "#fff" },
  headerSub: { margin: 0, fontSize: 11, color: "#666" },
  progressChip: { display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", backgroundColor: "#111", border: "1px solid #222" },
  progressNum: { fontSize: 22, fontWeight: 700, color: "#c0392b" },
  progressLabel: { fontSize: 10, color: "#555" },
  progressBar: { height: 3, backgroundColor: "#1a1a1a" },
  progressFill: { height: "100%", backgroundColor: "#c0392b", transition: "width 0.4s" },
  vladQuote: { padding: "12px 16px", backgroundColor: "#0f0a00", border: "1px solid #3d2800", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
  vladQuoteText: { fontSize: 12, color: "#8a6a2a", fontStyle: "italic", flex: 1 },
  vladQuoteAttr: { fontSize: 10, color: "#5a4010", whiteSpace: "nowrap" },
  topNav: { display: "flex", gap: 8, flexWrap: "wrap" },
  topNavBtn: { padding: "9px 16px", backgroundColor: "#111", border: "1px solid #222", color: "#555", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, letterSpacing: "0.5px", fontFamily: "'IBM Plex Mono', monospace" },
  topNavBtnActive: { backgroundColor: "#1a0808", border: "1px solid #c0392b", color: "#e8e8e8" },
  systemLayout: { display: "flex", gap: 24, flexWrap: "wrap" },
  moveList: { display: "flex", flexDirection: "column", gap: 6, width: 280, minWidth: 240 },
  moveListHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  moveListTitle: { fontSize: 10, color: "#c0392b", fontWeight: 700, letterSpacing: "1.5px" },
  moveListSub: { fontSize: 10, color: "#444" },
  moveRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer", transition: "border-color 0.15s" },
  moveRowNum: { width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 },
  moveRowContent: { display: "flex", flexDirection: "column", flex: 1 },
  moveRowLabel: { fontSize: 13, fontWeight: 600 },
  moveRowPrinciple: { fontSize: 10, color: "#666" },
  studiedDot: { fontSize: 8, color: "#27ae60" },
  systemProgress: { display: "flex", flexDirection: "column", gap: 6, marginTop: 8, padding: "10px 0" },
  systemProgressBar: { height: 3, backgroundColor: "#1a1a1a" },
  systemProgressFill: { height: "100%", backgroundColor: "#27ae60", transition: "width 0.4s" },
  systemProgressLabel: { fontSize: 10, color: "#555" },
  moveDetail: { flex: 1, display: "flex", flexDirection: "column", gap: 14, minWidth: 280 },
  moveDetailHeader: { display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 14, borderBottom: "1px solid #1a1a1a" },
  moveDetailMove: { fontSize: 36, fontWeight: 700, color: "#fff" },
  moveDetailIndex: { fontSize: 11, color: "#555" },
  principleTag: { display: "flex", flexDirection: "column", gap: 3 },
  principleLabel: { fontSize: 9, color: "#c0392b", letterSpacing: "1.5px" },
  principleText: { fontSize: 14, color: "#ccc", fontWeight: 600 },
  vladBox: { padding: "16px", backgroundColor: "#0f0a00", border: "1px solid #3d2800" },
  vladBoxHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  vladBoxIcon: { fontSize: 16 },
  vladBoxTitle: { fontSize: 9, color: "#8a6a2a", letterSpacing: "1.5px", fontWeight: 700 },
  vladText: { fontSize: 13, color: "#c8a85a", lineHeight: 1.6, margin: 0 },
  vladDefault: { fontSize: 13, color: "#8a6a2a", fontStyle: "italic", lineHeight: 1.6, margin: 0 },
  vladLoading: { fontSize: 12, color: "#555", fontStyle: "italic", margin: 0 },
  askVladBtn: { marginTop: 10, padding: "8px 14px", backgroundColor: "transparent", border: "1px solid #5a4010", color: "#8a6a2a", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" },
  uciBox: { display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" },
  uciLabel: { fontSize: 9, color: "#444", letterSpacing: "1px" },
  uciText: { fontSize: 12, color: "#666", fontFamily: "monospace" },
  studyBtn: { padding: "12px", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 },
  nextMoveBtn: { padding: "10px", backgroundColor: "transparent", border: "1px solid #222", color: "#555", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 },
  linesLayout: { display: "flex", flexDirection: "column", gap: 16 },
  lineSelectorGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  lineCard: { padding: "14px 16px", cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start", transition: "border-color 0.15s" },
  lineCardIcon: { fontSize: 22, flexShrink: 0 },
  lineCardInfo: { display: "flex", flexDirection: "column", gap: 3 },
  lineCardLabel: { fontSize: 13, fontWeight: 700 },
  lineCardTrigger: { fontSize: 10, color: "#555" },
  lineCardSub: { fontSize: 10, color: "#666", fontStyle: "italic" },
  lineDetail: { display: "flex", flexDirection: "column", gap: 14, marginTop: 6 },
  lineDetailHeader: { padding: "14px 16px", borderLeft: "3px solid", backgroundColor: "#0d0d0d" },
  lineDetailTitle: { display: "block", fontSize: 18, fontWeight: 700, marginBottom: 6 },
  lineDetailDesc: { display: "block", fontSize: 12, color: "#888", lineHeight: 1.6 },
  lineTabs: { display: "flex", borderBottom: "1px solid #1a1a1a", gap: 0 },
  lineTab: { padding: "9px 16px", background: "transparent", border: "none", borderBottom: "2px solid transparent", color: "#555", fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.5px" },
  phase2Layout: { display: "flex", flexDirection: "column", gap: 10 },
  phase2Header: { padding: "12px 14px", backgroundColor: "#0a0a12", border: "1px solid #1a1a2e", display: "flex", flexDirection: "column", gap: 4 },
  phase2Title: { fontSize: 12, color: "#6a6aaa", fontWeight: 700 },
  phase2Sub: { fontSize: 10, color: "#4a4a6a", fontStyle: "italic" },
  phase2Step: { display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px", backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a" },
  phase2StepNum: { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 },
  phase2StepContent: { display: "flex", flexDirection: "column", gap: 3 },
  phase2StepMove: { fontSize: 13, fontWeight: 700, color: "#ccc" },
  phase2StepNote: { fontSize: 11, color: "#666" },
  deviationsLayout: { display: "flex", flexDirection: "column", gap: 10 },
  deviationCard: { display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", flexWrap: "wrap" },
  deviationTrigger: { display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 140 },
  deviationTriggerLabel: { fontSize: 8, color: "#7a5500", letterSpacing: "1px" },
  deviationTriggerText: { fontSize: 12, color: "#ccc", fontWeight: 600 },
  deviationArrow: { fontSize: 18, color: "#444", flexShrink: 0 },
  deviationResponse: { display: "flex", flexDirection: "column", gap: 3, flex: 2, minWidth: 180 },
  deviationResponseLabel: { fontSize: 8, color: "#3a6b3a", letterSpacing: "1px" },
  deviationResponseText: { fontSize: 12, color: "#8a8", fontWeight: 600 },
  vladCoachingBox: { padding: "20px", backgroundColor: "#0f0a00", border: "1px solid #3d2800" },
  vladCoachingHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14 },
  vladCoachingIcon: { fontSize: 18 },
  vladCoachingTitle: { fontSize: 10, color: "#8a6a2a", letterSpacing: "1.5px", fontWeight: 700 },
  vladCoachingText: { fontSize: 13, color: "#c8a85a", lineHeight: 1.7, margin: 0 },
  lineSelectPrompt: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "40px", color: "#444" },
  lineSelectPromptIcon: { fontSize: 28 },
  lineSelectPromptText: { fontSize: 13 },
  checklistLayout: { display: "flex", flexDirection: "column", gap: 14 },
  checklistIntro: { padding: "14px 18px", backgroundColor: "#0f0a00", border: "1px solid #3d2800" },
  checklistRule: { margin: 0, fontSize: 13, color: "#8a6a2a", fontStyle: "italic" },
  checklistRuleAttr: { margin: "6px 0 0", fontSize: 10, color: "#5a4010" },
  checklistItems: { display: "flex", flexDirection: "column", gap: 8 },
  checklistItem: { display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer", transition: "background 0.15s" },
  checklistBox: { width: 22, height: 22, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 },
  checklistContent: { display: "flex", flexDirection: "column", gap: 3 },
  checklistCondition: { fontSize: 13, color: "#ccc", fontWeight: 600 },
  checklistNote: { fontSize: 10, color: "#666" },
  checklistComplete: { display: "flex", alignItems: "center", gap: 12, padding: "16px", backgroundColor: "#0a1a0a", border: "1px solid #27ae60" },
  checklistCompleteIcon: { fontSize: 22 },
  checklistCompleteText: { fontSize: 11, color: "#27ae60", fontWeight: 700, letterSpacing: "0.5px" },
  strikeBox: { padding: "16px 18px", backgroundColor: "#0a0a12", border: "1px solid #1a1a2e" },
  strikeTitle: { margin: "0 0 14px", fontSize: 10, color: "#4a4a8a", fontWeight: 700, letterSpacing: "1.5px" },
  strikeStep: { display: "flex", gap: 14, padding: "10px 0", borderBottom: "1px solid #141420" },
  strikeStepNum: { fontSize: 12, color: "#4a4a8a", width: 16, flexShrink: 0 },
  strikeStepMove: { display: "block", fontSize: 13, color: "#ccc", fontWeight: 600 },
  strikeStepNote: { display: "block", fontSize: 10, color: "#555", marginTop: 3 },
  quizLayout: { display: "flex", flexDirection: "column", gap: 20 },
  quizIntro: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "40px 20px", textAlign: "center" },
  quizIntroIcon: { fontSize: 40 },
  quizIntroTitle: { margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" },
  quizIntroDesc: { margin: 0, fontSize: 13, color: "#888", lineHeight: 1.7, maxWidth: 460 },
  quizStartBtn: { padding: "14px 40px", backgroundColor: "#c0392b", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" },
  quizCard: { display: "flex", flexDirection: "column", gap: 18, padding: "24px", backgroundColor: "#111", border: "1px solid #222" },
  quizProgress: { display: "flex", flexDirection: "column", gap: 6 },
  quizProgressBar: { height: 3, backgroundColor: "#1a1a1a" },
  quizProgressFill: { height: "100%", backgroundColor: "#c0392b", transition: "width 0.4s" },
  quizProgressLabel: { fontSize: 10, color: "#555" },
  quizQuestion: { fontSize: 16, color: "#fff", fontWeight: 600, lineHeight: 1.5, margin: 0 },
  quizOptions: { display: "flex", flexDirection: "column", gap: 8 },
  quizOption: { display: "flex", gap: 12, alignItems: "center", padding: "13px 16px", border: "1px solid", color: "#bbb", cursor: "pointer", textAlign: "left", fontFamily: "'IBM Plex Mono', monospace", transition: "background 0.15s" },
  quizOptionLetter: { fontSize: 11, fontWeight: 700, color: "#555", flexShrink: 0 },
  quizOptionText: { fontSize: 13 },
  quizFeedback: { display: "flex", flexDirection: "column", gap: 12, padding: "16px", backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a" },
  quizExplanation: { margin: 0, fontSize: 13, color: "#bbb", lineHeight: 1.6 },
  vladFeedbackBox: { display: "flex", gap: 10, alignItems: "flex-start", padding: "12px", backgroundColor: "#0f0a00", border: "1px solid #3d2800" },
  vladFeedbackIcon: { fontSize: 16, flexShrink: 0 },
  vladFeedbackText: { margin: 0, fontSize: 12, color: "#c8a85a", fontStyle: "italic", lineHeight: 1.6 },
  quizNextBtn: { padding: "12px", backgroundColor: "#c0392b", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 },
  quizResults: { display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 20px", textAlign: "center" },
  quizResultsIcon: { fontSize: 48 },
  quizResultsTitle: { margin: 0, fontSize: 48, fontWeight: 700, color: "#fff" },
  quizResultsRating: { margin: 0, fontSize: 14, color: "#888", maxWidth: 400, lineHeight: 1.6 },
  quizRetryBtn: { padding: "12px 32px", backgroundColor: "transparent", border: "1px solid #c0392b", color: "#c0392b", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" },
};
