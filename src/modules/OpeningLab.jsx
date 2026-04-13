/**
 * src/modules/OpeningLab.jsx
 * vlad-chess-coach — Opening Lab Module (v2.2 Gentleman's Assassin)
 */

import { useState, useCallback, useEffect } from "react";
import { askFabiano } from "../coaches/fabiano.jsx";
import { askVlad } from "../coaches/vlad.jsx";
import { askMagnus } from "../api/gemini.js";

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
      { move: "e2e4", label: "1. e4",  note: "Control the center. Non-negotiable." },
      { move: "g1f3", label: "2. Nf3", note: "Develop, attack e5 with tempo." },
      { move: "f1c4", label: "3. Bc4", note: "Italian Bishop. Target f7 — Black's eternal weakness." },
      { move: "c2c3", label: "4. c3",  note: "Prepares d4. Creates the c3-d3 bunker." },
      { move: "d2d3", label: "5. d3",  note: "THE Pianissimo move. Build slow. Don't tip your hand." },
      { move: "a2a4", label: "6. a4",  note: "Prophylaxis vs Na5. Creates a2 escape hatch for bishop." },
      { move: "e1g1", label: "7. O-O", note: "Castle. King safe. Always by move 7." },
      { move: "h2h3", label: "8. h3",  note: "SACRED. Stops Bg4 pin. Enables Be3. Non-negotiable." },
      { move: "f1e1", label: "9. Re1", note: "Rook to e-file. Supports e4. Cage is complete." },
    ],
    responses: [
      { id: "bc5", label: "3...Bc5 (Giuoco Piano)",  fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
      { id: "nf6", label: "3...Nf6 (Two Knights)",   fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
      { id: "be7", label: "3...Be7 (Hungarian)",     fen: "r1bqk1nr/ppppbppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
      { id: "d6",  label: "3...d6 (Classical)",      fen: "r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4" },
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
      { move: "e2e4", label: "1. e4",  note: "Same face. Same calm." },
      { move: "g1f3", label: "2. Nf3", note: "Develop. Attack e5." },
      { move: "f1c4", label: "3. Bc4", note: "Italian Bishop. Black plays Nf6 instead of Bc5." },
      { move: "c2c3", label: "4. c3",  note: "Bunker first. Same as Line 1 — cage structure identical." },
      { move: "d2d3", label: "5. d3",  note: "Gentleman's move. Refuse all sharp lines." },
      { move: "a2a4", label: "6. a4",  note: "Neutralizes Na5 queenside expansion immediately." },
      { move: "e1g1", label: "7. O-O", note: "Castle. King safe before complications." },
      { move: "h2h3", label: "8. h3",  note: "Mandatory prophylactic. Stop Bg4." },
      { move: "f1e1", label: "9. Re1", note: "Cage completion. Rook to e-file." },
    ],
    responses: [
      { id: "bc5t", label: "...Bc5 (transposes to Line 1)", fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5" },
      { id: "d5",   label: "...d5 (counterattack)",         fen: "r1bqkb1r/ppp2ppp/2n2n2/3pp3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq d6 0 5" },
      { id: "na5",  label: "...Na5 (bishop attack)",        fen: "r1bqkb1r/pppp1ppp/5n2/n3p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 2 5" },
      { id: "be7t", label: "...Be7 (solid setup)",          fen: "r1bqk2r/ppppbppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5" },
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
      { move: "e2e4", label: "1. e4",  note: "Black plays c5. The Sicilian. Stay calm." },
      { move: "g1f3", label: "2. Nf3", note: "Develop. Do not play 2.d4 — that is their world." },
      { move: "f1c4", label: "3. Bc4", note: "Anti-Sicilian. Avoids Najdorf, Dragon, all of it." },
      { move: "d2d3", label: "4. d3",  note: "Cage structure. Mirror Line 1." },
      { move: "c2c3", label: "5. c3",  note: "Prepare d4 if needed. Solidify." },
      { move: "e1g1", label: "6. O-O", note: "Castle fast. King safe before action." },
      { move: "h2h3", label: "7. h3",  note: "Sacred shield. Stop Bg4 pin." },
      { move: "f1e1", label: "8. Re1", note: "Rook to e-file. Cage complete." },
    ],
    responses: [
      { id: "e6",  label: "...e6 (French-like)",      fen: "rnbqkbnr/pp1p1ppp/4p3/2p5/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4" },
      { id: "e5",  label: "...e5 (Grand Prix style)",  fen: "rnbqkbnr/pp1p1ppp/8/2p1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq e6 0 4" },
      { id: "nc6", label: "...Nc6 (Classical)",        fen: "r1bqkbnr/pp1ppppp/2n5/2p5/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3" },
      { id: "d6s", label: "...d6 (Scheveningen-ish)",  fen: "rnbqkbnr/pp2pppp/3p4/2p5/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4" },
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
      { move: "e2e4", label: "1. e4",  note: "Black plays e5. Standard." },
      { move: "g1f3", label: "2. Nf3", note: "Develop. Black plays Nf6 — the Petrov." },
      { move: "d2d3", label: "3. d3",  note: "Rejects drawish 3.Nxe5. Forces Black into Italian cage structure." },
      { move: "f1c4", label: "4. Bc4", note: "Italian bishop. Now we are in familiar territory." },
      { move: "a2a4", label: "5. a4",  note: "Prophylaxis. Secure the bishop escape hatch early." },
      { move: "e1g1", label: "6. O-O", note: "Castle. King safe." },
      { move: "h2h3", label: "7. h3",  note: "Sacred shield. Stop Bg4." },
      { move: "f1e1", label: "8. Re1", note: "Cage complete. Ready for Assassin phase." },
    ],
    responses: [
      { id: "nc6p",  label: "...Nc6 (transposes to Line 1)", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5" },
      { id: "d6p",   label: "...d6 (Philidor-like)",         fen: "rnbqkb1r/pppp1ppp/3p1n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5" },
      { id: "bc5p",  label: "...Bc5 (active bishop)",        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5" },
      { id: "exd3p", label: "...d5 (central counter)",       fen: "rnbqkb1r/ppp2ppp/5n2/3pp3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq d6 0 5" },
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
  line3: [
    { question: "Black plays 1...c5 (Sicilian). Our 2nd move?", options: ["2. d4", "2. Nc3", "2. Nf3", "2. Bc4"], correct: 2, explanation: "2.Nf3 first — then Bc4. Prevents ...e6 blocking the diagonal." },
    { question: "Why does Bc4 work against the Sicilian?", options: ["It attacks c6", "It avoids all Sicilian theory", "It controls d5", "It prepares d4"], correct: 1, explanation: "The Bc4 Bypass skips the Najdorf, Dragon, Scheveningen — all of it." },
    { question: "Black plays ...d5. Correct response?", options: ["Panic and retreat", "exd5 and recapture", "c4", "d4"], correct: 1, explanation: "exd5 and recapture. Our development advantage holds. Do not panic." },
    { question: "What does c3 accomplish in Line 3?", options: ["Protects the bishop", "Prepares d4 and solidifies", "Attacks b4", "Supports e4 only"], correct: 1, explanation: "c3 prepares d4 if needed and solidifies the center structure." },
    { question: "What is the final move that completes the cage in Line 3?", options: ["h3", "O-O", "c3", "Re1"], correct: 3, explanation: "Re1 — rook to e-file. Cage complete. Assassin ready." },
  ],
  line4: [
    { question: "Black plays 2...Nf6 (Petrov). Our 3rd move?", options: ["3. Nxe5", "3. d4", "3. d3", "3. Nc3"], correct: 2, explanation: "3.d3 — rejects the drawish Nxe5 line. Forces Black into our cage." },
    { question: "Why refuse 3.Nxe5 in the Petrov?", options: ["It loses material", "It leads to drawish simplified positions", "It is illegal", "It weakens our king"], correct: 1, explanation: "3.Nxe5 leads to early simplification and dull draws. We play 3.d3 instead." },
    { question: "Black plays ...Nxe4 grabbing the pawn. Response?", options: ["Recapture immediately", "d4 — open the center", "Ignore it", "O-O first"], correct: 1, explanation: "d4. Open the center immediately. Our development advantage is decisive." },
    { question: "After 3.d3, what move comes next?", options: ["h3", "O-O", "Bc4", "a4"], correct: 2, explanation: "4.Bc4 — Italian bishop. We are now in familiar territory." },
    { question: "What does the Refusal name mean in Line 4?", options: ["Refusing to castle", "Refusing the draw with d3 instead of Nxe5", "Refusing Black's pawn", "Refusing to open the center"], correct: 1, explanation: "We refuse the draw. 3.d3 forces Black into our cage instead of equal simplification." },
  ],
};

async function generateQuizQuestions(line) {
  const prompt = `You are generating a chess quiz for TopherBettis (ELO 609) who is studying the Gentleman's Assassin opening system.

Generate exactly 5 multiple-choice questions about the "${line.name}" opening line (${line.tagline}).

The exact move order for this line is: ${line.moves.map(m => m.label + ": " + m.note).join(" | ")}

Rules:
- Each question tests move order, purpose of a specific move, or response to Black's play
- 4 options each, exactly 1 correct answer
- Keep it practical — things that matter at ELO 609-2000
- Explanations should be sharp and memorable, like Vlad would say them

Respond with ONLY a JSON array, no markdown, no backticks, no preamble:
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correct": 0,
    "explanation": "..."
  }
]`;

  const raw = await askMagnus(prompt);
  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Bad response");
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
  const totalMoves = LINES.reduce((acc, l) => acc + l.moves.length, 0);
  const progressPct = Math.round((totalStudied / totalMoves) * 100);

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
  }, [activeTab, currentLine.id]);

  const handleResponseClick = useCallback(async (response) => {
    setSelectedResponse(response.id);
    const needsFabiano = !responseCoaching[response.id];
    const needsMagnus = !magnusCoaching[response.id];
    if (!needsFabiano && !needsMagnus) return;

    if (needsFabiano) setLoadingResponse(response.id);
    if (needsMagnus) setLoadingMagnus(response.id);

    const fabianoPrompt = `You are Fabiano Caruana — precise, analytical. The player is TopherBettis (ELO 609, building toward 2000). They are playing the Gentleman's Assassin system (Italian Pianissimo Cage). Black has just played ${response.label}. In 2-3 sentences: explain the threat this move creates, and the exact response within the Gentleman's Assassin system.`;
    const magnusPrompt = `You are Magnus Carlsen — intuitive, blunt, occasionally sardonic. The player is TopherBettis (ELO 609). They are playing the Italian Pianissimo Cage. Black has just played ${response.label}. In 1-2 sentences: give a raw intuitive read on this position. No theory — just feel. What does the position want?`;

    const [fabianoResult, magnusResult] = await Promise.all([
      needsFabiano
        ? askFabiano(fabianoPrompt).catch(() => "Fabiano is unavailable. Trust the system.")
        : Promise.resolve(responseCoaching[response.id]),
      needsMagnus
        ? askMagnus(magnusPrompt).catch(() => "Feel the position. The cage is solid.")
        : Promise.resolve(magnusCoaching[response.id]),
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
      setVladFeedback("");
    } else {
      setLoadingVlad(true);
      try {
        const prompt = `You are Vlad — stern Eastern European chess coach. TopherBettis answered a quiz question wrong. Question: "${q.question}". They chose "${q.options[idx]}" but correct answer is "${q.options[q.correct]}". Give a sharp, motivating 1-2 sentence correction in Vlad's voice.`;
        const feedback = await askVlad(prompt);
        setVladFeedback(feedback);
      } catch {
        setVladFeedback("Nyet. The cage must be built in order. Patience before power.");
      }
      setLoadingVlad(false);
    }
  }, [quizIndex, quizQuestions]);

  const nextQuestion = () => {
    const isLast = quizIndex === quizQuestions.length - 1;
    if (isLast) {
      setQuizDone(true);
    } else {
      setQuizIndex(prev => prev + 1);
      setQuizAnswer(null);
      setVladFeedback("");
    }
  };

  const getVladVerdict = (score, total) => {
    const pct = score / total;
    if (pct === 1)   return "Perfect. The cage is in your hands. Now execute.";
    if (pct >= 0.8)  return "Strong. One weakness. Find it. Fix it before next game.";
    if (pct >= 0.6)  return "Acceptable. But acceptable loses games. Drill the failures.";
    if (pct >= 0.4)  return "The cage is leaking. Review the sequence. Again.";
    return "You are building on sand. Back to the beginning. Every move. Every purpose.";
  };

  const tabs = [
    { id: "sequence",   label: "MOVE SEQUENCE" },
    { id: "assassin",   label: "ASSASSIN" },
    { id: "responses",  label: "RESPONSES" },
    { id: "deviations", label: "DEVIATIONS" },
    { id: "quiz",       label: "QUIZ" },
  ];

  return (
    <div style={styles.root}>

      {/* Header */}
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

      {/* Progress Bar */}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progressPct}%`, backgroundColor: currentLine.color }} />
      </div>

      {/* Line Selector */}
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

      {/* Tagline */}
      <div style={{ ...styles.taglineBar, borderLeftColor: currentLine.color }}>
        <span style={{ fontSize: 12, color: currentLine.color, fontStyle: "italic" }}>
          "{currentLine.tagline}"
        </span>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id
                ? { ...styles.tabActive, color: currentLine.color, borderBottomColor: currentLine.color }
                : {}),
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MOVE SEQUENCE ── */}
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
                  style={{
                    ...styles.moveNode,
                    border: `1px solid ${isActive ? currentLine.color : isStudied ? "#1e4d20" : "#1e1e1e"}`,
                    backgroundColor: isActive ? `${currentLine.color}15` : isStudied ? "#0a1200" : "#0a0a0a",
                  }}
                  onClick={() => setSelectedMove(i)}
                >
                  <div style={{
                    ...styles.moveNodeNum,
                    backgroundColor: isStudied ? "#27ae60" : isActive ? currentLine.color : "#1a1a1a",
                    color: "#fff",
                  }}>
                    {isStudied ? "✓" : i + 1}
                  </div>
                  <div style={styles.moveNodeInfo}>
                    <span style={styles.moveNodeLabel}>{m.label}</span>
                    <span style={styles.moveNodeNote}>{m.note}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.stepDetail}>
            {(() => {
              const m = currentLine.moves[selectedMove];
              const key = `${currentLine.id}-${selectedMove}`;
              return (
                <>
                  <div style={styles.stepDetailHeader}>
                    <span style={{ ...styles.stepDetailLabel, color: currentLine.color }}>{m.label}</span>
                    <span style={styles.stepDetailNum}>Move {selectedMove + 1} of {currentLine.moves.length}</span>
                  </div>
                  <p style={styles.stepDetailNote}>{m.note}</p>
                  <div style={{ ...styles.philosophyBox, borderColor: `${currentLine.color}44` }}>
                    <p style={styles.philosophyTitle}>CAGE PHILOSOPHY</p>
                    <p style={styles.philosophyText}>
                      Construct the cage quietly for 9 moves. Execute violently when Black flinches.
                      Every move has a purpose. Every tempo is a loaded spring.
                    </p>
                  </div>
                  <div style={styles.fenBox}>
                    <span style={styles.fenLabel}>TERMINAL FEN</span>
                    <span style={styles.fenText}>{currentLine.terminalFen}</span>
                  </div>
                  <button
                    style={{ ...styles.btn, backgroundColor: studiedMoves[key] ? "#1e4d20" : currentLine.color }}
                    onClick={() => toggleStudied(key)}
                  >
                    {studiedMoves[key] ? "✓ Studied" : "Mark Studied"}
                  </button>
                  {currentLine.moves.every((_, i) => studiedMoves[`${currentLine.id}-${i}`]) && (
                    <div style={styles.completeBanner}>
                      ✓ {currentLine.name} complete. The cage is built. Activate the Assassin.
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── ASSASSIN ── */}
      {activeTab === "assassin" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={styles.assassinHeader}>
            <p style={styles.assassinRule}>
              "The assassin does not strike until all conditions are perfect.
              Premature aggression is the mark of a beginner. Patience is the mark of a killer."
              — Vlad
            </p>
          </div>
          <div style={styles.checklistGrid}>
            {ASSASSIN_CHECKLIST.map(item => (
              <div
                key={item.id}
                style={{
                  ...styles.checklistItem,
                  border: `1px solid ${checklist[item.id] ? "#1e4d20" : "#1e1e1e"}`,
                  backgroundColor: checklist[item.id] ? "#0a1200" : "#0a0a0a",
                  cursor: "pointer",
                }}
                onClick={() => toggleChecklist(item.id)}
              >
                <div style={{
                  ...styles.checklistBox,
                  borderColor: checklist[item.id] ? "#27ae60" : "#333",
                  backgroundColor: checklist[item.id] ? "#27ae60" : "transparent",
                }}>
                  {checklist[item.id] ? "✓" : ""}
                </div>
                <div>
                  <div style={styles.checklistLabel}>{item.condition}</div>
                  <div style={styles.checklistDesc}>{item.note}</div>
                </div>
              </div>
            ))}
          </div>
          {checklistComplete && (
            <div style={styles.completeBanner}>
              ⚡ ALL CONDITIONS MET. The assassin is cleared to strike. Execute the sequence below.
            </div>
          )}
          <div style={styles.strikeSequence}>
            <p style={styles.strikeTitle}>STRIKE SEQUENCE</p>
            {STRIKE_SEQUENCE.map((step, i) => (
              <div key={i} style={{ ...styles.strikeStep, borderBottomColor: i === STRIKE_SEQUENCE.length - 1 ? "transparent" : "#141420" }}>
                <div style={styles.strikeNum}>{i + 1}</div>
                <div>
                  <div style={styles.strikeMoveLabel}>{step.move}</div>
                  <div style={styles.strikeNote}>{step.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RESPONSES ── */}
      {activeTab === "responses" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={styles.sectionLabel}>BLACK'S RESPONSES — {currentLine.name.toUpperCase()}</p>
          <div style={styles.responseGrid}>
            {currentLine.responses.map(r => (
              <div
                key={r.id}
                style={{
                  ...styles.responseCard,
                  border: `1px solid ${selectedResponse === r.id ? currentLine.color : "#1e1e1e"}`,
                  backgroundColor: selectedResponse === r.id ? `${currentLine.color}10` : "#0a0a0a",
                  cursor: "pointer",
                }}
                onClick={() => handleResponseClick(r)}
              >
                <div style={styles.responseLabel}>{r.label}</div>
              </div>
            ))}
          </div>
          {selectedResponse && (
            <>
              <div style={{ ...styles.responseCoachBox, borderColor: `${currentLine.color}44` }}>
                <p style={{ ...styles.responseCoachTitle, color: currentLine.color }}>FABIANO ANALYSIS</p>
                {loadingResponse === selectedResponse ? (
                  <p style={styles.loadingText}>Fabiano is calculating...</p>
                ) : (
                  <p style={styles.responseCoachText}>{responseCoaching[selectedResponse]}</p>
                )}
              </div>
              <div style={{ ...styles.responseCoachBox, borderColor: "#27ae6044" }}>
                <p style={{ ...styles.responseCoachTitle, color: "#27ae60" }}>MAGNUS — INTUITION</p>
                {loadingMagnus === selectedResponse ? (
                  <p style={styles.loadingText}>Magnus is feeling the position...</p>
                ) : (
                  <p style={styles.responseCoachText}>{magnusCoaching[selectedResponse]}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── DEVIATIONS ── */}
      {activeTab === "deviations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={styles.sectionLabel}>WHEN BLACK BREAKS THE SCRIPT — {currentLine.name.toUpperCase()}</p>
          {currentLine.deviations.map((d, i) => (
            <div key={i} style={styles.deviationCard}>
              <div style={styles.deviationTrigger}>
                <span style={{ fontSize: 8, color: "#7a5500", letterSpacing: "1.5px" }}>TRIGGER</span>
                <span style={styles.deviationTriggerText}>{d.trigger}</span>
              </div>
              <div style={styles.deviationResponse}>
                <span style={{ fontSize: 8, color: "#3a6b3a", letterSpacing: "1.5px" }}>RESPONSE</span>
                <span style={styles.deviationResponseText}>{d.response}</span>
              </div>
            </div>
          ))}
          <div style={styles.deviationRule}>
            <p style={{ margin: 0, fontSize: 12, color: "#5a8a5a", lineHeight: 1.7, fontStyle: "italic" }}>
              At ELO 609, opponents will deviate constantly. This is not chaos — it is opportunity.
              Every deviation from theory gives us a development advantage. Stay calm. Run the loop.
            </p>
          </div>
        </div>
      )}

      {/* ── QUIZ ── */}
      {activeTab === "quiz" && (
        <div style={styles.quizLayout}>

          {quizLoading && (
            <div style={styles.quizLoadingBox}>
              <p style={styles.quizLoadingText}>⚙ Generating questions for {currentLine.name}...</p>
            </div>
          )}

          {!quizLoading && !quizStarted && !quizDone && quizQuestions.length > 0 && (
            <div style={styles.quizStart}>
              <p style={styles.quizIntro}>
                {quizQuestions.length} questions on <span style={{ color: currentLine.color }}>{currentLine.name}</span>.
                Vlad is watching. Build the cage in the right order — every time.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={{ ...styles.btn, backgroundColor: currentLine.color }} onClick={() => setQuizStarted(true)}>
                  Start Quiz
                </button>
                <button style={styles.btnGhost} onClick={() => loadQuestions(currentLine)}>
                  ↺ Regenerate
                </button>
              </div>
            </div>
          )}

          {!quizLoading && quizStarted && !quizDone && quizQuestions.length > 0 && (() => {
            const q = quizQuestions[quizIndex];
            return (
              <>
                <div style={styles.quizMeta}>
                  <span style={{ fontSize: 9, color: "#555", letterSpacing: "1.5px" }}>
                    QUESTION {quizIndex + 1} OF {quizQuestions.length}
                  </span>
                  <span style={{ fontSize: 9, color: currentLine.color, letterSpacing: "1.5px" }}>
                    SCORE {quizScore}/{quizIndex + (quizAnswer !== null ? 1 : 0)}
                  </span>
                </div>
                <p style={styles.quizQuestion}>{q.question}</p>
                <div style={styles.quizOptions}>
                  {q.options.map((opt, i) => {
                    let bg = "#111", border = "#222", color = "#bbb";
                    if (quizAnswer !== null) {
                      if (i === q.correct) { bg = "#0f2010"; border = "#27ae60"; color = "#27ae60"; }
                      else if (i === quizAnswer) { bg = "#1a0000"; border = "#c0392b"; color = "#c0392b"; }
                    }
                    return (
                      <button
                        key={i}
                        style={{ ...styles.quizOption, backgroundColor: bg, border: `1px solid ${border}`, color }}
                        onClick={() => quizAnswer === null && handleQuizAnswer(i)}
                        disabled={quizAnswer !== null}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {quizAnswer !== null && (
                  <div style={styles.quizFeedback}>
                    {quizAnswer === q.correct ? (
                      <p style={{ ...styles.quizCorrectNote, color: "#27ae60" }}>✓ Correct. {q.explanation}</p>
                    ) : (
                      <>
                        <p style={styles.quizCorrectNote}>{q.explanation}</p>
                        {loadingVlad
                          ? <p style={styles.loadingText}>Vlad is watching...</p>
                          : vladFeedback
                            ? <p style={styles.vladQuizNote}>"{vladFeedback}"</p>
                            : null
                        }
                      </>
                    )}
                    <button style={{ ...styles.btn, backgroundColor: currentLine.color }} onClick={nextQuestion}>
                      {quizIndex === quizQuestions.length - 1 ? "See Results" : "Next Question"}
                    </button>
                  </div>
                )}
              </>
            );
          })()}

          {!quizLoading && quizDone && (
            <div style={styles.quizEndScreen}>
              <div style={styles.quizScoreDisplay}>
                <span style={{ ...styles.quizScoreBig, color: currentLine.color }}>
                  {quizScore}/{quizQuestions.length}
                </span>
                <span style={styles.quizScoreLabel}>FINAL SCORE</span>
              </div>
              <div style={styles.vladVerdictBox}>
                <p style={styles.vladVerdictLabel}>VLAD'S VERDICT</p>
                <p style={styles.vladVerdictText}>"{getVladVerdict(quizScore, quizQuestions.length)}"</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={{ ...styles.btn, backgroundColor: currentLine.color }} onClick={() => loadQuestions(currentLine)}>
                  ↺ New Quiz
                </button>
                <button style={styles.btnGhost} onClick={() => {
                  setQuizStarted(true);
                  setQuizDone(false);
                  setQuizIndex(0);
                  setQuizAnswer(null);
                  setQuizScore(0);
                  setVladFeedback("");
                }}>
                  Retry Same
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

const styles = {
  root: { display: "flex", flexDirection: "column", gap: 20, padding: "28px 32px", minHeight: "100vh", backgroundColor: "#0d0d0d", color: "#e8e8e8", fontFamily: "'IBM Plex Mono', 'Courier New', monospace", maxWidth: 960, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #222", paddingBottom: 20, flexWrap: "wrap", gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  headerIcon: { fontSize: 36 },
  headerTitle: { margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#fff" },
  headerSub: { margin: "2px 0 0", fontSize: 12, color: "#666", letterSpacing: "0.5px" },
  progressChip: { display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", backgroundColor: "#111", border: "1px solid #222", borderRadius: 8 },
  progressNum: { fontSize: 22, fontWeight: 700, color: "#27ae60" },
  progressLabel: { fontSize: 10, color: "#555", marginTop: 2 },
  progressBar: { height: 4, backgroundColor: "#1a1a1a", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2, transition: "width 0.4s ease" },
  lineSelector: { display: "flex", gap: 8, flexWrap: "wrap" },
  lineBtn: { padding: "8px 14px", background: "transparent", border: "1px solid", borderRadius: 6, cursor: "pointer", display: "flex", flexDirection: "column", gap: 2, fontFamily: "'IBM Plex Mono', monospace", transition: "all 0.15s", minWidth: 130 },
  lineBtnCode: { fontSize: 8, letterSpacing: "2px" },
  lineBtnName: { fontSize: 11, fontWeight: 600 },
  taglineBar: { padding: "8px 14px", borderLeft: "3px solid", backgroundColor: "#111", display: "flex", alignItems: "center" },
  tabs: { display: "flex", gap: 0, borderBottom: "1px solid #222", flexWrap: "wrap" },
  tab: { padding: "10px 14px", backgroundColor: "transparent", border: "none", borderBottom: "2px solid transparent", color: "#555", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer", letterSpacing: "0.5px" },
  tabActive: { borderBottom: "2px solid #27ae60" },
  sequenceLayout: { display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" },
  moveTree: { display: "flex", flexDirection: "column", gap: 6, width: 290, flexShrink: 0 },
  moveNode: { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 6, cursor: "pointer", transition: "border-color 0.2s, background 0.2s" },
  moveNodeNum: { width: 26, height: 26, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  moveNodeInfo: { display: "flex", flexDirection: "column", gap: 2 },
  moveNodeLabel: { fontSize: 13, fontWeight: 600, color: "#ccc" },
  moveNodeNote: { fontSize: 10, color: "#888", lineHeight: 1.4 },
  stepDetail: { flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 240 },
  stepDetailHeader: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  stepDetailLabel: { fontSize: 28, fontWeight: 700 },
  stepDetailNum: { fontSize: 11, color: "#555" },
  stepDetailNote: { fontSize: 14, color: "#bbb", lineHeight: 1.7, margin: 0 },
  philosophyBox: { padding: "14px 16px", backgroundColor: "#0d1a0d", border: "1px solid", borderRadius: 6 },
  philosophyTitle: { margin: "0 0 6px", fontSize: 9, color: "#3a6b3a", letterSpacing: "1.5px" },
  philosophyText: { margin: 0, fontSize: 12, color: "#5a8a5a", lineHeight: 1.7, fontStyle: "italic" },
  fenBox: { padding: "10px 14px", backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 4 },
  fenLabel: { display: "block", fontSize: 8, color: "#444", letterSpacing: "2px", marginBottom: 6 },
  fenText: { fontSize: 9, color: "#666", wordBreak: "break-all", lineHeight: 1.5 },
  completeBanner: { padding: "12px 16px", backgroundColor: "#0f2010", border: "1px solid #1e4d20", borderRadius: 6, fontSize: 13, color: "#27ae60" },
  assassinHeader: { padding: "14px 18px", backgroundColor: "#0f0a00", border: "1px solid #3d2800", borderRadius: 6 },
  assassinRule: { margin: 0, fontSize: 12, color: "#8a6a2a", lineHeight: 1.7, fontStyle: "italic" },
  checklistGrid: { display: "flex", flexDirection: "column", gap: 8 },
  checklistItem: { display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 6 },
  checklistBox: { width: 22, height: 22, border: "1px solid", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", flexShrink: 0 },
  checklistLabel: { fontSize: 13, color: "#ccc", fontWeight: 600 },
  checklistDesc: { fontSize: 10, color: "#666", marginTop: 2 },
  strikeSequence: { padding: "16px 18px", backgroundColor: "#0a0a12", border: "1px solid #1a1a2a", borderRadius: 6 },
  strikeTitle: { margin: "0 0 14px", fontSize: 9, color: "#5555aa", letterSpacing: "1.5px" },
  strikeStep: { display: "flex", gap: 14, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #141420" },
  strikeNum: { width: 22, height: 22, backgroundColor: "#c0392b", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0 },
  strikeMoveLabel: { fontSize: 13, color: "#bbb", fontWeight: 600 },
  strikeNote: { fontSize: 10, color: "#666", marginTop: 3 },
  tacticCard: { padding: "14px 16px", borderRadius: 8 },
  tacticHeader: { display: "flex", alignItems: "flex-start", gap: 12 },
  tacticIcon: { fontSize: 24, flexShrink: 0 },
  tacticName: { margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#ccc" },
  tacticDesc: { margin: 0, fontSize: 11, color: "#777" },
  tacticNote: { margin: "10px 0 0", fontSize: 12, color: "#7fb3d3", fontStyle: "italic", lineHeight: 1.6 },
  tacticReminder: { padding: "14px 16px", backgroundColor: "#1a0f00", border: "1px solid #3d2800", borderRadius: 6 },
  tacticReminderTitle: { margin: "0 0 6px", fontSize: 9, color: "#7a5500", letterSpacing: "1.5px" },
  tacticReminderText: { margin: 0, fontSize: 12, color: "#8a6a2a", lineHeight: 1.7 },
  sectionLabel: { margin: 0, fontSize: 9, letterSpacing: "2px", color: "#444" },
  responseGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  responseCard: { padding: "14px 16px", borderRadius: 6 },
  responseLabel: { fontSize: 12, color: "#bbb" },
  responseCoachBox: { padding: "16px 18px", backgroundColor: "#0a1520", border: "1px solid", borderRadius: 8 },
  responseCoachTitle: { margin: "0 0 8px", fontSize: 10, letterSpacing: "1px" },
  responseCoachText: { margin: 0, fontSize: 13, color: "#bbb", lineHeight: 1.8 },
  deviationCard: { backgroundColor: "#111", border: "1px solid #1e1e1e", borderRadius: 6, overflow: "hidden" },
  deviationTrigger: { padding: "10px 14px", backgroundColor: "#1a1000", borderBottom: "1px solid #1e1e1e", display: "flex", flexDirection: "column", gap: 4 },
  deviationTriggerText: { fontSize: 12, color: "#e67e22" },
  deviationResponse: { padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 },
  deviationResponseText: { fontSize: 12, color: "#bbb", lineHeight: 1.6 },
  deviationRule: { padding: "14px 16px", backgroundColor: "#0a1200", border: "1px solid #1e2a00", borderRadius: 6 },
  quizLayout: { display: "flex", flexDirection: "column", gap: 20 },
  quizLoadingBox: { padding: "24px", backgroundColor: "#111", border: "1px solid #222", borderRadius: 8, textAlign: "center" },
  quizLoadingText: { margin: 0, fontSize: 13, color: "#555", fontStyle: "italic" },
  quizStart: { display: "flex", flexDirection: "column", gap: 16 },
  quizIntro: { margin: 0, fontSize: 14, color: "#bbb", lineHeight: 1.7 },
  quizMeta: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  quizQuestion: { fontSize: 16, color: "#ccc", lineHeight: 1.6, margin: 0 },
  quizOptions: { display: "flex", flexDirection: "column", gap: 10 },
  quizOption: { padding: "14px 18px", borderRadius: 6, fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer", textAlign: "left" },
  quizFeedback: { display: "flex", flexDirection: "column", gap: 10, padding: "16px 18px", backgroundColor: "#111", border: "1px solid #222", borderRadius: 8 },
  quizCorrectNote: { margin: 0, fontSize: 12, color: "#999" },
  vladQuizNote: { margin: 0, fontSize: 12, color: "#c0392b", fontStyle: "italic" },
  quizEndScreen: { display: "flex", flexDirection: "column", gap: 20, alignItems: "flex-start" },
  quizScoreDisplay: { display: "flex", flexDirection: "column", gap: 4 },
  quizScoreBig: { fontSize: 48, fontWeight: 700, lineHeight: 1 },
  quizScoreLabel: { fontSize: 10, color: "#555", letterSpacing: "2px" },
  vladVerdictBox: { padding: "16px 18px", backgroundColor: "#0f0a00", border: "1px solid #3d2800", borderRadius: 8, width: "100%" },
  vladVerdictLabel: { margin: "0 0 8px", fontSize: 9, color: "#7a5500", letterSpacing: "1.5px" },
  vladVerdictText: { margin: 0, fontSize: 14, color: "#8a6a2a", lineHeight: 1.7, fontStyle: "italic" },
  loadingText: { margin: 0, fontSize: 12, color: "#555", fontStyle: "italic" },
  btn: { padding: "10px 22px", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" },
  btnGhost: { padding: "10px 22px", backgroundColor: "transparent", color: "#777", border: "1px solid #333", borderRadius: 6, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer", alignSelf: "flex-start" },
};
