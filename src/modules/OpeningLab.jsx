/**
 * src/modules/OpeningLab.jsx
 * vlad-chess-coach — Opening Lab Module (v2.2 Gentleman's Assassin)
 * Standard: Braceless default imports for Vercel stability.
 * FULL FILE HANDOFF - ALL 4 LINES + QUIZ ENGINE + COACH INTEGRATION
 * FIXED: Removed non-existent UI component dependencies to stabilize build.
 */

import { useState, useCallback, useEffect } from "react";
import askFabiano from "../coaches/fabiano.jsx";
import askVlad from "../coaches/vlad.jsx";
import askMagnus from "../coaches/magnus.jsx";

const LINES = [
  {
    id: "line1",
    code: "LINE 1",
    name: "Giuoco Pianissimo",
    subtitle: "The Gentleman Assassin",
    color: "#c0392b",
    tagline: "Build like a Gentleman. Attack like an Assassin.",
    terminalFen: "r1bqr1k1/bpp2pp1/p1np1n1p/4p3/4P3/1BPP1N1P/PP1N1PP1/R1BQR1K1 w - - 1 11",
    moves: [
      { move: "e2e4", label: "1. e4",  note: "Control the center. Non-negotiable." },
      { move: "g1f3", label: "2. Nf3", note: "Develop, attack e5 with tempo." },
      { move: "f1c4", label: "3. Bc4", note: "Italian Bishop. Target f7 — Black's eternal weakness." },
      { move: "c2c3", label: "4. c3",  note: "Prepares d4. Creates the c3-d3 bunker." },
      { move: "d2d3", label: "5. d3",  note: "THE Pianissimo move. Build slow. Don't tip your hand." },
      { move: "a2a4", label: "6. a4",  note: "Prophylaxis vs Na5. Creates a2 escape hatch for bishop." },
      { move: "e1g1", label: "7. O-O", note: "Castle. King safe. Always by move 7." },
      { move: "h2h3", label: "8. h3",  note: "SACRED. Stops Bg4 pin. Enables Be3. Non-negotiable." },
      { move: "f1e1", label: "9. Re1", note: "Rook to e-file. Supports e4. Cage is complete." },
    ],
    responses: [
      { id: "bc5", label: "3...Bc5 (Giuoco Piano)",  fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
      { id: "nf6", label: "3...Nf6 (Two Knights)",   fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
      { id: "be7", label: "3...Be7 (Hungarian)",      fen: "r1bqk1nr/ppppbppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
      { id: "d6",  label: "3...d6 (Classical)",       fen: "r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4" },
    ],
    deviations: [
      { trigger: "Black plays ...d5 early", response: "exd5 — open lines favor our better development and Bc4 pressure." },
      { trigger: "Black plays ...Be6 (trade offer)", response: "Bxe6 fxe6 (doubled pawns long-term target) OR Bb3 and continue." },
      { trigger: "Black plays ...Ng4 before h3", response: "h3 immediately. They lose a tempo retreating. This is why h3 is sacred." },
      { trigger: "Black plays ...Na5 (bishop attack)", response: "Ba2 — bishop retreats to safe house, stays on diagonal." },
      { trigger: "Black plays ...f5 (early aggression)", response: "Castle. Let them overextend. The f5 pawn becomes a target later." },
    ],
  },
  {
    id: "line2",
    code: "LINE 2",
    name: "Two Knights — d3 System",
    subtitle: "The Misdirect",
    color: "#e67e22",
    tagline: "They prep for Ng5. We play c3/d3.",
    terminalFen: "r1bq1rk1/pp2bppp/2np1n2/2p1p3/P3P3/2PP1N2/BP1N1PPP/R1BQR1K1 b - - 0 10",
    moves: [
      { move: "e2e4", label: "1. e4",  note: "Same face. Same calm." },
      { move: "g1f3", label: "2. Nf3", note: "Develop. Attack e5." },
      { move: "f1c4", label: "3. Bc4", note: "Italian Bishop. Black plays Nf6 instead of Bc5." },
      { move: "c2c3", label: "4. c3",  note: "Bunker first. Same as Line 1 — cage structure identical." },
      { move: "d2d3", label: "5. d3",  note: "Gentleman's move. Refuse all sharp lines." },
      { move: "a2a4", label: "6. a4",  note: "Neutralizes Na5 queenside expansion immediately." },
      { move: "e1g1", label: "7. O-O", note: "Castle. King safe before complications." },
      { move: "h2h3", label: "8. h3",  note: "Mandatory prophylactic. Stop Bg4." },
      { move: "f1e1", label: "9. Re1", note: "Cage completion. Rook to e-file." },
    ],
    responses: [
      { id: "bc5t", label: "...Bc5 (transposes to Line 1)", fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5" },
      { id: "d5",   label: "...d5 (counterattack)",          fen: "r1bqkb1r/ppp2ppp/2n2n2/3pp3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq d6 0 5" },
      { id: "na5",  label: "...Na5 (bishop attack)",          fen: "r1bqkb1r/pppp1ppp/5n2/n3p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 2 5" },
      { id: "be7t", label: "...Be7 (solid setup)",            fen: "r1bqk2r/ppppbppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5" },
    ],
    deviations: [
      { trigger: "Black plays ...Bc5 (transposition)", response: "Welcome it. We are in Line 1 territory. Same cage applies." },
      { trigger: "Black plays ...d5 early", response: "exd5 Nxd5. Open position favors our development lead." },
      { trigger: "Black plays ...Na5 (bishop attack)", response: "a4 already played. Ba2. Bishop stays on the long diagonal." },
      { trigger: "Black plays ...Ng4 (attack d3)", response: "h3 immediately. Ng4 without preparation loses tempo." },
    ],
  },
  {
    id: "line3",
    code: "LINE 3",
    name: "Sicilian — Bc4 Bypass",
    subtitle: "The Bypass",
    color: "#8e44ad",
    tagline: "Skip the theory jungle entirely.",
    terminalFen: "r1b2rk1/ppq1bppp/2nppn2/8/4P3/1BPPBN2/PP1N1PPP/R2QR1K1 b - - 0 11",
    moves: [
      { move: "e2e4", label: "1. e4",  note: "Black plays c5. The Sicilian. Stay calm." },
      { move: "g1f3", label: "2. Nf3", note: "Develop. Do not play 2.d4 — that is their world." },
      { move: "f1c4", label: "3. Bc4", note: "Anti-Sicilian. Avoids Najdorf, Dragon, all of it." },
      { move: "d2d3", label: "4. d3",  note: "Cage structure. Mirror Line 1." },
      { move: "c2c3", label: "5. c3",  note: "Prepare d4 if needed. Solidify." },
      { move: "e1g1", label: "6. O-O", note: "Castle fast. King safe before action." },
      { move: "h2h3", label: "7. h3",  note: "Sacred shield. Stop Bg4 pin." },
      { move: "f1e1", label: "8. Re1", note: "Rook to e-file. Cage complete." },
    ],
    responses: [
      { id: "e6",  label: "...e6 (French-like)",      fen: "rnbqkbnr/pp1p1ppp/4p3/2p5/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4" },
      { id: "e5",  label: "...e5 (Grand Prix style)",  fen: "rnbqkbnr/pp1p1ppp/8/2p1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq e6 0 4" },
      { id: "nc6", label: "...Nc6 (Classical)",         fen: "r1bqkbnr/pp1ppppp/2n5/2p5/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3" },
      { id: "d6s", label: "...d6 (Scheveningen-ish)",  fen: "rnbqkbnr/pp2pppp/3p4/2p5/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4" },
    ],
    deviations: [
      { trigger: "Black plays ...d5 (central break)", response: "Do not panic. exd5 and recapture. Our development advantage holds." },
      { trigger: "Black goes queenside with ...a6 ...b5", response: "Watch for ...d5 break. Queenside expansion a3-b4 if they commit." },
      { trigger: "Black castles kingside", response: "Same Nf1-g3-f5 knight routing. Standard Assassin activation." },
      { trigger: "Black keeps king in center", response: "Use d4 break earlier to open files against the uncastled king." },
    ],
  },
  {
    id: "line4",
    code: "LINE 4",
    name: "Petrov — d3 Refusal",
    subtitle: "The Refusal",
    color: "#27ae60",
    tagline: "Refuse the draw. Force the cage.",
    terminalFen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5",
    moves: [
      { move: "e2e4", label: "1. e4",  note: "Black plays e5. Standard." },
      { move: "g1f3", label: "2. Nf3", note: "Develop. Black plays Nf6 — the Petrov." },
      { move: "d2d3", label: "3. d3",  note: "Rejects drawish 3.Nxe5. Forces Black into Italian cage structure." },
      { move: "f1c4", label: "4. Bc4", note: "Italian bishop. Now we are in familiar territory." },
      { move: "a2a4", label: "5. a4",  note: "Prophylaxis. Secure the bishop escape hatch early." },
      { move: "e1g1", label: "6. O-O", note: "Castle. King safe." },
      { move: "h2h3", label: "7. h3",  note: "Sacred shield. Stop Bg4." },
      { move: "f1e1", label: "8. Re1", note: "Cage complete. Ready for Assassin phase." },
    ],
    responses: [
      { id: "nc6p",  label: "...Nc6 (transposes to Line 1)", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5" },
      { id: "d6p",    label: "...d6 (Philidor-like)",           fen: "rnbqkb1r/pppp1ppp/3p1n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5" },
      { id: "bc5p",  label: "...Bc5 (active bishop)",         fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5" },
      { id: "exd3p", label: "...d5 (central counter)",        fen: "rnbqkb1r/ppp2ppp/5n2/3pp3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq d6 0 5" },
    ],
    deviations: [
      { trigger: "Black plays ...Nxe4 (grabbing the pawn)", response: "d4. Open the center immediately. Our development advantage is decisive." },
      { trigger: "Black plays ...d5 (central counter)", response: "exd5. Recapture and continue development. Standard procedure." },
      { trigger: "Black plays ...Nc6 (transposition)", response: "Welcome it. We are in Line 1 territory now." },
      { trigger: "Black plays ...Bc5 (active bishop)", response: "Mirror their energy. Continue cage construction. h3 before Nbd2." },
    ],
  },
];

const ASSASSIN_CHECKLIST = [
  { id: 1, condition: "Knight on f1", note: "Rerouting for the Ng3 to Nf5 maneuver." },
  { id: 2, condition: "h3 is played", note: "Secured against Bg4 pin." },
  { id: 3, condition: "Bishop secure on b3 or a2", note: "Retreated safely, still eyeing f7." },
  { id: 4, condition: "Rook on e1", note: "Central support and future Re3 swing." },
  { id: 5, condition: "King castled", note: "King safety confirmed." },
  { id: 6, condition: "Zero hanging pieces", note: "No loose pieces before attacking." },
  { id: 7, condition: "Ng3 square is clear", note: "Path open for the knight maneuver." },
];

const STRIKE_SEQUENCE = [
  { move: "Nf1 to Ng3", note: "Load the spring. Knight begins the march." },
  { move: "Bb3 or Ba2", note: "Bishop secured in the safe house." },
  { move: "Be3 or Bg5", note: "Second bishop activates. Pin or control." },
  { move: "Qe2", note: "Queen supports e4, prepares Re3 battery." },
  { move: "Ng3 to Nf5", note: "The Strangler lands. Black suffocates." },
  { move: "Re1 to Re3", note: "Rook swings. Attack begins in earnest." },
  { move: "d4 break", note: "Release the coiled spring. Center explodes." },
];

const FALLBACK_QUESTIONS = {
  line1: [
    { question: "After 1.e4 e5 2.Nf3 Nc6 3.Bc4 — what is the correct 4th move?", options: ["4. d4", "4. c3", "4. O-O", "4. Ng5"], correct: 1, explanation: "4.c3 — bunker first. Creates the c3-d3 foundation. d3 follows on move 5." },
    { question: "After c3, what is move 5?", options: ["5. d4", "5. d3", "5. O-O", "5. a4"], correct: 1, explanation: "5.d3 — THE Pianissimo move. c3 then d3. Build the cage slow." },
    { question: "After d3, what comes next?", options: ["O-O", "h3", "a4", "Nbd2"], correct: 2, explanation: "6.a4 — prophylaxis vs Na5. Creates the a2 escape hatch before castling." },
    { question: "Black plays ...Na5 attacking your Bc4. Correct response?", options: ["Bxf7+", "Bb3", "Ba2", "d4"], correct: 2, explanation: "Ba2 — the safe house built by a4. Bishop stays on the a2-g8 diagonal." },
    { question: "What is the LAST move that completes the cage?", options: ["h3", "O-O", "a4", "Re1"], correct: 3, explanation: "9.Re1 — rook to e-file. When Re1 lands, the cage is complete. Execute." },
  ],
  line2: [
    { question: "Black plays Nf6 (Two Knights). What is our 4th move?", options: ["4. Ng5", "4. d4", "4. c3", "4. O-O"], correct: 2, explanation: "4.c3 — same bunker as Line 1. Cage structure is identical. d3 follows on move 5." },
    { question: "After c3, what is move 5?", options: ["a4", "O-O", "d3", "h3"], correct: 2, explanation: "5.d3 — the Gentleman's move. c3 then d3. Same sequence as Line 1." },
    { question: "After d3, what comes next?", options: ["O-O", "h3", "a4", "Nbd2"], correct: 2, explanation: "6.a4 — neutralizes ...Na5 immediately. Bishop escape hatch secured before castling." },
    { question: "When does h3 get played in Line 2?", options: ["Move 5", "Move 6", "Move 8", "Move 9"], correct: 2, explanation: "Move 8. After O-O. Sacred sequence: a4 → O-O → h3. Never before castling." },
    { question: "What does the Misdirect name refer to?", options: ["Misdirecting your king", "Black expects Ng5, we play c3/d3 instead", "Hiding the bishop", "A queenside feint"], correct: 1, explanation: "They prep for Ng5. We play c3 then d3. They prepared for the wrong opponent." },
  ],
};

async function generateQuizQuestions(line) {
  const prompt = `You are generating a chess quiz for TopherBettis (ELO 609) who is studying the Gentleman's Assassin opening system. Line: ${line.name}. Respond with ONLY a JSON array, no markdown: [{"question": "...", "options": ["...", "...", "...", "..."], "correct": 0, "explanation": "..."}]`;
  const raw = await askMagnus(prompt);
  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  return parsed.slice(0, 5);
}

export default function OpeningLab() {
  const [activeLine, setActiveLine] = useState(LINES[0]);
  const [activeTab, setActiveTab] = useState("sequence");
  const [selectedMove, setSelectedMove] = useState(0);
  const [studiedMoves, setStudiedMoves] = useState({});
  const [checklist, setChecklist] = useState({});
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [responseCoaching, setResponseCoaching] = useState({});
  const [magnusCoaching, setMagnusCoaching] = useState({});
  const [loadingResponse, setLoadingResponse] = useState(null);
  const [loadingMagnus, setLoadingMagnus] = useState(null);

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [vladFeedback, setVladFeedback] = useState("");
  const [loadingVlad, setLoadingVlad] = useState(false);

  const currentLine = activeLine;
  const totalStudied = Object.values(studiedMoves).filter(Boolean).length;
  const totalMovesCount = LINES.reduce((acc, l) => acc + l.moves.length, 0);
  const progressPct = Math.round((totalStudied / totalMovesCount) * 100);

  const toggleStudied = (key) => setStudiedMoves(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleChecklist = (id) => setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  const checklistComplete = ASSASSIN_CHECKLIST.every(item => checklist[item.id]);

  const loadQuestions = useCallback(async (line) => {
    setQuizLoading(true);
    setQuizQuestions([]);
    setQuizStarted(false);
    setQuizIndex(0);
    setQuizAnswer(null);
    setQuizScore(0);
    setQuizDone(false);
    setVladFeedback("");
    try {
      const questions = await generateQuizQuestions(line);
      setQuizQuestions(questions);
    } catch {
      setQuizQuestions(FALLBACK_QUESTIONS[line.id] || FALLBACK_QUESTIONS.line1);
    }
    setQuizLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "quiz") {
      loadQuestions(currentLine);
    }
  }, [activeTab, currentLine.id, loadQuestions]);

  const handleResponseClick = useCallback(async (response) => {
    setSelectedResponse(response.id);
    const needsFabiano = !responseCoaching[response.id];
    const needsMagnus = !magnusCoaching[response.id];
    if (!needsFabiano && !needsMagnus) return;
    if (needsFabiano) setLoadingResponse(response.id);
    if (needsMagnus) setLoadingMagnus(response.id);
    const [fabianoResult, magnusResult] = await Promise.all([
      needsFabiano ? askFabiano(`Explain ${response.label} GA response.`).catch(() => "N/A") : Promise.resolve(responseCoaching[response.id]),
      needsMagnus ? askMagnus(`Intuition for ${response.label}.`).catch(() => "N/A") : Promise.resolve(magnusCoaching[response.id]),
    ]);
    setResponseCoaching(prev => ({ ...prev, [response.id]: fabianoResult }));
    setMagnusCoaching(prev => ({ ...prev, [response.id]: magnusResult }));
    setLoadingResponse(null);
    setLoadingMagnus(null);
  }, [responseCoaching, magnusCoaching]);

  const handleQuizAnswer = useCallback(async (idx) => {
    const q = quizQuestions[quizIndex];
    setQuizAnswer(idx);
    if (idx === q.correct) {
      setQuizScore(prev => prev + 1);
    } else {
      setLoadingVlad(true);
      try {
        const feedback = await askVlad(`Correct ${q.question}. It was ${q.options[q.correct]}.`);
        setVladFeedback(feedback);
      } catch {
        setVladFeedback("Review the sequence.");
      }
      setLoadingVlad(false);
    }
  }, [quizIndex, quizQuestions]);

  const nextQuestion = () => {
    if (quizIndex === quizQuestions.length - 1) setQuizDone(true);
    else {
      setQuizIndex(prev => prev + 1);
      setQuizAnswer(null);
      setVladFeedback("");
    }
  };

  const tabsList = [
    { id: "sequence",  label: "MOVE SEQUENCE" },
    { id: "assassin",  label: "ASSASSIN" },
    { id: "responses",  label: "RESPONSES" },
    { id: "deviations", label: "DEVIATIONS" },
    { id: "quiz",       label: "QUIZ" },
  ];

  return (
    <div style={styles.root}>
      {/* HEADER SECTION */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🗡️</span>
          <div>
            <h1 style={styles.headerTitle}>Opening Lab</h1>
            <p style={styles.headerSub}>GENTLEMAN'S ASSASSIN — v2.2</p>
          </div>
        </div>
        <div style={styles.progressChip}>
          <span style={styles.progressNum}>{progressPct}%</span>
          <span style={styles.progressLabel}>STUDIED</span>
        </div>
      </div>

      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progressPct}%`, backgroundColor: currentLine.color }} />
      </div>

      {/* LINE SELECTOR */}
      <div style={styles.lineSelector}>
        {LINES.map(line => (
          <button
            key={line.id}
            style={{
              ...styles.lineBtn,
              borderColor: activeLine.id === line.id ? line.color : "#333",
              color: activeLine.id === line.id ? line.color : "#555",
              backgroundColor: activeLine.id === line.id ? `${line.color}15` : "transparent",
            }}
            onClick={() => {
              setActiveLine(line);
              setActiveTab("sequence");
              setSelectedMove(0);
              setSelectedResponse(null);
            }}
          >
            <span style={styles.lineBtnCode}>{line.code}</span>
            <span style={styles.lineBtnName}>{line.name}</span>
          </button>
        ))}
      </div>

      <div style={{ ...styles.taglineBar, borderLeftColor: currentLine.color }}>
        <span style={{ fontSize: 12, color: currentLine.color, fontStyle: "italic" }}>"{currentLine.tagline}"</span>
      </div>

      {/* TABS SECTION */}
      <div style={styles.tabs}>
        {tabsList.map(tab => (
          <button
            key={tab.id}
            style={{ ...styles.tab, ...(activeTab === tab.id ? { ...styles.tabActive, color: currentLine.color, borderBottomColor: currentLine.color } : {}) }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT SECTIONS */}
      {activeTab === "sequence" && (
        <div style={styles.sequenceLayout}>
          <div style={styles.moveTree}>
            {currentLine.moves.map((m, i) => {
              const key = `${currentLine.id}-${i}`;
              const isStudied = studiedMoves[key];
              const isActive = selectedMove === i;
              return (
                <div
                  key={i}
                  style={{ ...styles.moveNode, border: `1px solid ${isActive ? currentLine.color : isStudied ? "#1e4d20" : "#1e1e1e"}`, backgroundColor: isActive ? `${currentLine.color}15` : isStudied ? "#0a1200" : "#0a0a0a" }}
                  onClick={() => setSelectedMove(i)}
                >
                  <div style={{ ...styles.moveNodeNum, backgroundColor: isStudied ? "#27ae60" : isActive ? currentLine.color : "#1a1a1a", color: "#fff" }}>{isStudied ? "✓" : i + 1}</div>
                  <div style={styles.moveNodeInfo}>
                    <span style={styles.moveNodeLabel}>{m.label}</span>
                    <span style={styles.moveNodeNote}>{m.note}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* STEP DETAIL BOX - REPLACES CARD */}
          <div style={styles.stepDetail}>
            {(() => {
              const m = currentLine.moves[selectedMove];
              const key = `${currentLine.id}-${selectedMove}`;
              return (
                <div style={styles.nativeCard}>
                  <div style={styles.stepDetailHeader}>
                    <span style={{ ...styles.stepDetailLabel, color: currentLine.color }}>{m.label}</span>
                    <span style={styles.stepDetailNum}>Move {selectedMove + 1} of {currentLine.moves.length}</span>
                  </div>
                  <p style={styles.stepDetailNote}>{m.note}</p>
                  <div style={{ ...styles.philosophyBox, borderColor: `${currentLine.color}44` }}>
                    <p style={styles.philosophyTitle}>CAGE PHILOSOPHY</p>
                    <p style={styles.philosophyText}>Construct the cage quietly. Every move has a purpose.</p>
                  </div>
                  <div style={styles.fenBox}>
                    <span style={styles.fenLabel}>TERMINAL FEN</span>
                    <span style={styles.fenText}>{currentLine.terminalFen}</span>
                  </div>
                  <button style={{ ...styles.btn, backgroundColor: studiedMoves[key] ? "#1e4d20" : currentLine.color }} onClick={() => toggleStudied(key)}>
                    {studiedMoves[key] ? "✓ Studied" : "Mark Studied"}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === "assassin" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={styles.assassinHeader}><p style={styles.assassinRule}>"Patience is the mark of a killer." — Vlad</p></div>
          <div style={styles.checklistGrid}>
            {ASSASSIN_CHECKLIST.map(item => (
              <div key={item.id} style={{ ...styles.checklistItem, border: `1px solid ${checklist[item.id] ? "#1e4d20" : "#1e1e1e"}`, backgroundColor: checklist[item.id] ? "#0a1200" : "#0a0a0a" }} onClick={() => toggleChecklist(item.id)}>
                <div style={{ ...styles.checklistBox, borderColor: checklist[item.id] ? "#27ae60" : "#333", backgroundColor: checklist[item.id] ? "#27ae60" : "transparent" }}>{checklist[item.id] ? "✓" : ""}</div>
                <div><div style={styles.checklistLabel}>{item.condition}</div><div style={styles.checklistDesc}>{item.note}</div></div>
              </div>
            ))}
          </div>
          <div style={styles.strikeSequence}>
            <p style={styles.strikeTitle}>STRIKE SEQUENCE</p>
            {STRIKE_SEQUENCE.map((step, i) => (
              <div key={i} style={{ ...styles.strikeStep, borderBottomColor: i === STRIKE_SEQUENCE.length - 1 ? "transparent" : "#141420" }}>
                <div style={styles.strikeNum}>{i + 1}</div>
                <div><div style={styles.strikeMoveLabel}>{step.move}</div><div style={styles.strikeNote}>{step.note}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "responses" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={styles.responseGrid}>
            {currentLine.responses.map(r => (
              <div key={r.id} style={{ ...styles.responseCard, border: `1px solid ${selectedResponse === r.id ? currentLine.color : "#1e1e1e"}`, backgroundColor: selectedResponse === r.id ? `${currentLine.color}10` : "#0a0a0a" }} onClick={() => handleResponseClick(r)}>
                <div style={styles.responseLabel}>{r.label}</div>
              </div>
            ))}
          </div>
          {selectedResponse && (
            <>
              <div style={{ ...styles.responseCoachBox, borderColor: `${currentLine.color}44` }}>
                <p style={{ ...styles.responseCoachTitle, color: currentLine.color }}>FABIANO ANALYSIS</p>
                {loadingResponse === selectedResponse ? <p style={styles.loadingText}>Calculating...</p> : <p style={styles.responseCoachText}>{responseCoaching[selectedResponse]}</p>}
              </div>
              <div style={{ ...styles.responseCoachBox, borderColor: "#27ae6044" }}>
                <p style={{ ...styles.responseCoachTitle, color: "#27ae60" }}>MAGNUS INTUITION</p>
                {loadingMagnus === selectedResponse ? <p style={styles.loadingText}>Thinking...</p> : <p style={styles.responseCoachText}>{magnusCoaching[selectedResponse]}</p>}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "deviations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {currentLine.deviations.map((d, i) => (
            <div key={i} style={styles.deviationCard}>
              <div style={styles.deviationTrigger}><span style={{ fontSize: 8, color: "#7a5500" }}>TRIGGER</span><span style={styles.deviationTriggerText}>{d.trigger}</span></div>
              <div style={styles.deviationResponse}><span style={{ fontSize: 8, color: "#3a6b3a" }}>RESPONSE</span><span style={styles.deviationResponseText}>{d.response}</span></div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "quiz" && (
        <div style={styles.quizLayout}>
          {quizLoading ? <div style={styles.quizLoadingBox}><p style={styles.quizLoadingText}>Generating questions...</p></div> : 
           quizStarted ? (
             <div style={styles.nativeCard}>
               <p style={styles.quizQuestion}>{quizQuestions[quizIndex]?.question}</p>
               <div style={styles.quizOptions}>
                 {quizQuestions[quizIndex]?.options.map((opt, i) => (
                   <button key={i} style={{ ...styles.quizOption, backgroundColor: quizAnswer === i ? (i === quizQuestions[quizIndex].correct ? "#0f2010" : "#1a0000") : "#111" }} onClick={() => quizAnswer === null && handleQuizAnswer(i)}>
                     {opt}
                   </button>
                 ))}
               </div>
               {quizAnswer !== null && (
                 <div style={styles.quizFeedback}>
                   <p style={styles.quizCorrectNote}>{quizQuestions[quizIndex].explanation}</p>
                   {vladFeedback && <p style={{ fontSize: 12, color: "#c0392b", fontStyle: "italic", marginTop: 8 }}>"{vladFeedback}"</p>}
                   <button style={{ ...styles.btn, backgroundColor: currentLine.color, marginTop: 12 }} onClick={nextQuestion}>Next</button>
                 </div>
               )}
             </div>
           ) : <button style={{ ...styles.btn, backgroundColor: currentLine.color }} onClick={() => setQuizStarted(true)}>Start Quiz</button>
          }
        </div>
      )}
    </div>
  );
}

const styles = {
  root: { display: "flex", flexDirection: "column", gap: 20, padding: "28px 32px", minHeight: "100vh", backgroundColor: "#0d0d0d", color: "#e8e8e8", fontFamily: "monospace", maxWidth: 960, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #222", paddingBottom: 20 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  headerIcon: { fontSize: 36 },
  headerTitle: { margin: 0, fontSize: 26, fontWeight: 700, color: "#fff" },
  headerSub: { margin: 0, fontSize: 12, color: "#666" },
  progressChip: { display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", backgroundColor: "#111", border: "1px solid #222" },
  progressNum: { fontSize: 22, fontWeight: 700, color: "#27ae60" },
  progressLabel: { fontSize: 10, color: "#555" },
  progressBar: { height: 4, backgroundColor: "#1a1a1a" },
  progressFill: { height: "100%", transition: "width 0.4s" },
  lineSelector: { display: "flex", gap: 8, flexWrap: "wrap" },
  lineBtn: { padding: "8px 14px", background: "transparent", border: "1px solid", cursor: "pointer", display: "flex", flexDirection: "column", minWidth: 130 },
  lineBtnCode: { fontSize: 8, letterSpacing: "2px" },
  lineBtnName: { fontSize: 11, fontWeight: 600 },
  taglineBar: { padding: "8px 14px", borderLeft: "3px solid", backgroundColor: "#111" },
  tabs: { display: "flex", borderBottom: "1px solid #222" },
  tab: { padding: "10px 14px", background: "transparent", border: "none", color: "#555", fontSize: 11, cursor: "pointer" },
  tabActive: { borderBottom: "2px solid" },
  sequenceLayout: { display: "flex", gap: 24, flexWrap: "wrap" },
  moveTree: { display: "flex", flexDirection: "column", gap: 6, width: 290 },
  moveNode: { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer" },
  moveNodeNum: { width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 },
  moveNodeInfo: { display: "flex", flexDirection: "column" },
  moveNodeLabel: { fontSize: 13, fontWeight: 600, color: "#ccc" },
  moveNodeNote: { fontSize: 10, color: "#888" },
  stepDetail: { flex: 1, display: "flex", flexDirection: "column", gap: 16 },
  nativeCard: { padding: "24px", backgroundColor: "#121212", border: "1px solid #222", borderRadius: "4px" },
  stepDetailHeader: { display: "flex", justifyContent: "space-between" },
  stepDetailLabel: { fontSize: 28, fontWeight: 700 },
  stepDetailNum: { fontSize: 11, color: "#555" },
  stepDetailNote: { fontSize: 14, color: "#bbb", margin: 0 },
  philosophyBox: { padding: "14px 16px", backgroundColor: "#0d1a0d", border: "1px solid", marginTop: 16 },
  philosophyTitle: { fontSize: 9, color: "#3a6b3a" },
  philosophyText: { fontSize: 12, color: "#5a8a5a", fontStyle: "italic" },
  fenBox: { padding: "10px 14px", backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", marginTop: 16 },
  fenLabel: { fontSize: 8, color: "#444" },
  fenText: { fontSize: 9, color: "#666", wordBreak: "break-all" },
  btn: { padding: "12px", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", width: "100%", marginTop: 16 },
  assassinHeader: { padding: "14px 18px", backgroundColor: "#0f0a00", border: "1px solid #3d2800" },
  assassinRule: { fontSize: 12, color: "#8a6a2a", fontStyle: "italic" },
  checklistGrid: { display: "flex", flexDirection: "column", gap: 8 },
  checklistItem: { display: "flex", alignItems: "center", gap: 14, padding: "12px 16px" },
  checklistBox: { width: 22, height: 22, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center" },
  checklistLabel: { fontSize: 13, color: "#ccc", fontWeight: 600 },
  checklistDesc: { fontSize: 10, color: "#666" },
  strikeSequence: { padding: "16px 18px", backgroundColor: "#0a0a12", border: "1px solid #1a1a2e", marginTop: 16 },
  strikeTitle: { fontSize: 10, color: "#4a4a8a", fontWeight: 700 },
  strikeStep: { display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid #141420" },
  strikeNum: { width: 20, fontSize: 12, color: "#4a4a8a" },
  strikeMoveLabel: { fontSize: 13, color: "#ccc", fontWeight: 600 },
  strikeNote: { fontSize: 10, color: "#555" },
  responseGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  responseCard: { padding: "12px 16px" },
  responseLabel: { fontSize: 13, color: "#ccc", fontWeight: 600 },
  responseCoachBox: { padding: "14px 16px", border: "1px solid", marginTop: 12 },
  responseCoachTitle: { fontSize: 9, fontWeight: 700 },
  responseCoachText: { fontSize: 12, color: "#bbb", margin: "6px 0 0" },
  deviationCard: { padding: "12px 16px", backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" },
  deviationTrigger: { display: "flex", flexDirection: "column", gap: 4 },
  deviationTriggerText: { fontSize: 13, color: "#ccc", fontWeight: 600 },
  deviationResponse: { display: "flex", flexDirection: "column", gap: 4, marginTop: 10 },
  deviationResponseText: { fontSize: 13, color: "#8a8", fontWeight: 600 },
  quizLayout: { display: "flex", flexDirection: "column", gap: 20 },
  quizQuestion: { fontSize: 18, color: "#fff", fontWeight: 600 },
  quizOptions: { display: "flex", flexDirection: "column", gap: 10, marginTop: 16 },
  quizOption: { padding: "14px", textAlign: "left", border: "1px solid #222", color: "#bbb", cursor: "pointer" },
  quizFeedback: { padding: "16px", backgroundColor: "#111", marginTop: 16 },
  quizCorrectNote: { fontSize: 14 },
  loadingText: { fontSize: 12, color: "#555" },
  quizLoadingBox: { textAlign: "center", padding: "40px" },
  quizLoadingText: { fontSize: 16, color: "#555" }
};
