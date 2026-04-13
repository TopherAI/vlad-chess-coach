001 /**
002  * src/modules/OpeningLab.jsx
003  * vlad-chess-coach — Opening Lab Module (v2.2 Gentleman's Assassin)
004  * Standard: Braceless default imports for Vercel stability.
005  */
006 
007 import { useState, useCallback, useEffect } from "react";
008 import askFabiano from "../coaches/fabiano.jsx";
009 import askVlad from "../coaches/vlad.jsx";
010 import askMagnus from "../coaches/magnus.jsx";
011 
012 const LINES = [
013   {
014     id: "line1",
015     code: "LINE 1",
016     name: "Giuoco Pianissimo",
017     subtitle: "The Gentleman Assassin",
018     color: "#c0392b",
019     tagline: "Build like a Gentleman. Attack like an Assassin.",
020     terminalFen: "r1bqr1k1/bpp2pp1/p1np1n1p/4p3/4P3/1BPP1N1P/PP1N1PP1/R1BQR1K1 w - - 1 11",
021     moves: [
022       { move: "e2e4", label: "1. e4",  note: "Control the center. Non-negotiable." },
023       { move: "g1f3", label: "2. Nf3", note: "Develop, attack e5 with tempo." },
024       { move: "f1c4", label: "3. Bc4", note: "Italian Bishop. Target f7 — Black's eternal weakness." },
025       { move: "c2c3", label: "4. c3",  note: "Prepares d4. Creates the c3-d3 bunker." },
026       { move: "d2d3", label: "5. d3",  note: "THE Pianissimo move. Build slow. Don't tip your hand." },
027       { move: "a2a4", label: "6. a4",  note: "Prophylaxis vs Na5. Creates a2 escape hatch for bishop." },
028       { move: "e1g1", label: "7. O-O", note: "Castle. King safe. Always by move 7." },
029       { move: "h2h3", label: "8. h3",  note: "SACRED. Stops Bg4 pin. Enables Be3. Non-negotiable." },
030       { move: "f1e1", label: "9. Re1", note: "Rook to e-file. Supports e4. Cage is complete." },
031     ],
032     responses: [
033       { id: "bc5", label: "3...Bc5 (Giuoco Piano)",  fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
034       { id: "nf6", label: "3...Nf6 (Two Knights)",   fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
035       { id: "be7", label: "3...Be7 (Hungarian)",      fen: "r1bqk1nr/ppppbppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
036       { id: "d6",  label: "3...d6 (Classical)",       fen: "r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4" },
037     ],
038     deviations: [
039       { trigger: "Black plays ...d5 early", response: "exd5 — open lines favor our better development and Bc4 pressure." },
040       { trigger: "Black plays ...Be6 (trade offer)", response: "Bxe6 fxe6 (doubled pawns long-term target) OR Bb3 and continue." },
041       { trigger: "Black plays ...Ng4 before h3", response: "h3 immediately. They lose a tempo retreating. This is why h3 is sacred." },
042       { trigger: "Black plays ...Na5 (bishop attack)", response: "Ba2 — bishop retreats to safe house, stays on diagonal." },
043       { trigger: "Black plays ...f5 (early aggression)", response: "Castle. Let them overextend. The f5 pawn becomes a target later." },
044     ],
045   },
046   {
047     id: "line2",
048     code: "LINE 2",
049     name: "Two Knights — d3 System",
050     subtitle: "The Misdirect",
051     color: "#e67e22",
052     tagline: "They prep for Ng5. We play c3/d3.",
053     terminalFen: "r1bq1rk1/pp2bppp/2np1n2/2p1p3/P3P3/2PP1N2/BP1N1PPP/R1BQR1K1 b - - 0 10",
054     moves: [
055       { move: "e2e4", label: "1. e4",  note: "Same face. Same calm." },
056       { move: "g1f3", label: "2. Nf3", note: "Develop. Attack e5." },
057       { move: "f1c4", label: "3. Bc4", note: "Italian Bishop. Black plays Nf6 instead of Bc5." },
058       { move: "c2c3", label: "4. c3",  note: "Bunker first. Same as Line 1 — cage structure identical." },
059       { move: "d2d3", label: "5. d3",  note: "Gentleman's move. Refuse all sharp lines." },
060       { move: "a2a4", label: "6. a4",  note: "Neutralizes Na5 queenside expansion immediately." },
061       { move: "e1g1", label: "7. O-O", note: "Castle. King safe before complications." },
062       { move: "h2h3", label: "8. h3",  note: "Mandatory prophylactic. Stop Bg4." },
063       { move: "f1e1", label: "9. Re1", note: "Cage completion. Rook to e-file." },
064     ],
065     responses: [
066       { id: "bc5t", label: "...Bc5 (transposes to Line 1)", fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5" },
067       { id: "d5",   label: "...d5 (counterattack)",          fen: "r1bqkb1r/ppp2ppp/2n2n2/3pp3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq d6 0 5" },
068       { id: "na5",  label: "...Na5 (bishop attack)",         fen: "r1bqkb1r/pppp1ppp/5n2/n3p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 2 5" },
069       { id: "be7t", label: "...Be7 (solid setup)",           fen: "r1bqk2r/ppppbppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5" },
070     ],
071     deviations: [
072       { trigger: "Black plays ...Bc5 (transposition)", response: "Welcome it. We are in Line 1 territory. Same cage applies." },
073       { trigger: "Black plays ...d5 early", response: "exd5 Nxd5. Open position favors our development lead." },
074       { trigger: "Black plays ...Na5 (bishop attack)", response: "a4 already played. Ba2. Bishop stays on the long diagonal." },
075       { trigger: "Black plays ...Ng4 (attack d3)", response: "h3 immediately. Ng4 without preparation loses tempo." },
076     ],
077   },
078   {
079     id: "line3",
080     code: "LINE 3",
081     name: "Sicilian — Bc4 Bypass",
082     subtitle: "The Bypass",
083     color: "#8e44ad",
084     tagline: "Skip the theory jungle entirely.",
085     terminalFen: "r1b2rk1/ppq1bppp/2nppn2/8/4P3/1BPPBN2/PP1N1PPP/R2QR1K1 b - - 0 11",
086     moves: [
087       { move: "e2e4", label: "1. e4",  note: "Black plays c5. The Sicilian. Stay calm." },
088       { move: "g1f3", label: "2. Nf3", note: "Develop. Do not play 2.d4 — that is their world." },
089       { move: "f1c4", label: "3. Bc4", note: "Anti-Sicilian. Avoids Najdorf, Dragon, all of it." },
090       { move: "d2d3", label: "4. d3",  note: "Cage structure. Mirror Line 1." },
091       { move: "c2c3", label: "5. c3",  note: "Prepare d4 if needed. Solidify." },
092       { move: "e1g1", label: "6. O-O", note: "Castle fast. King safe before action." },
093       { move: "h2h3", label: "7. h3",  note: "Sacred shield. Stop Bg4 pin." },
094       { move: "f1e1", label: "8. Re1", note: "Rook to e-file. Cage complete." },
095     ],
096     responses: [
097       { id: "e6",  label: "...e6 (French-like)",      fen: "rnbqkbnr/pp1p1ppp/4p3/2p5/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4" },
098       { id: "e5",  label: "...e5 (Grand Prix style)",  fen: "rnbqkbnr/pp1p1ppp/8/2p1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq e6 0 4" },
099       { id: "nc6", label: "...Nc6 (Classical)",        fen: "r1bqkbnr/pp1ppppp/2n5/2p5/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3" },
100       { id: "d6s", label: "...d6 (Scheveningen-ish)",  fen: "rnbqkbnr/pp2pppp/3p4/2p5/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4" },
101     ],
102     deviations: [
103       { trigger: "Black plays ...d5 (central break)", response: "Do not panic. exd5 and recapture. Our development advantage holds." },
104       { trigger: "Black goes queenside with ...a6 ...b5", response: "Watch for ...d5 break. Queenside expansion a3-b4 if they commit." },
105       { trigger: "Black castles kingside", response: "Same Nf1-g3-f5 knight routing. Standard Assassin activation." },
106       { trigger: "Black keeps king in center", response: "Use d4 break earlier to open files against the uncastled king." },
107     ],
108   },
109   {
110     id: "line4",
111     code: "LINE 4",
112     name: "Petrov — d3 Refusal",
113     subtitle: "The Refusal",
114     color: "#27ae60",
115     tagline: "Refuse the draw. Force the cage.",
116     terminalFen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5",
117     moves: [
118       { move: "e2e4", label: "1. e4",  note: "Black plays e5. Standard." },
119       { move: "g1f3", label: "2. Nf3", note: "Develop. Black plays Nf6 — the Petrov." },
120       { move: "d2d3", label: "3. d3",  note: "Rejects drawish 3.Nxe5. Forces Black into Italian cage structure." },
121       { move: "f1c4", label: "4. Bc4", note: "Italian bishop. Now we are in familiar territory." },
122       { move: "a2a4", label: "5. a4",  note: "Prophylaxis. Secure the bishop escape hatch early." },
123       { move: "e1g1", label: "6. O-O", note: "Castle. King safe." },
124       { move: "h2h3", label: "7. h3",  note: "Sacred shield. Stop Bg4." },
125       { move: "f1e1", label: "8. Re1", note: "Cage complete. Ready for Assassin phase." },
126     ],
127     responses: [
128       { id: "nc6p",  label: "...Nc6 (transposes to Line 1)", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5" },
129       { id: "d6p",   label: "...d6 (Philidor-like)",          fen: "rnbqkb1r/pppp1ppp/3p1n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5" },
130       { id: "bc5p",  label: "...Bc5 (active bishop)",        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5" },
131       { id: "exd3p", label: "...d5 (central counter)",       fen: "rnbqkb1r/ppp2ppp/5n2/3pp3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq d6 0 5" },
132     ],
133     deviations: [
134       { trigger: "Black plays ...Nxe4 (grabbing the pawn)", response: "d4. Open the center immediately. Our development advantage is decisive." },
135       { trigger: "Black plays ...d5 (central counter)", response: "exd5. Recapture and continue development. Standard procedure." },
136       { trigger: "Black plays ...Nc6 (transposition)", response: "Welcome it. We are in Line 1 territory now." },
137       { trigger: "Black plays ...Bc5 (active bishop)", response: "Mirror their energy. Continue cage construction. h3 before Nbd2." },
138     ],
139   },
140 ];
141 
142 const ASSASSIN_CHECKLIST = [
143   { id: 1, condition: "Knight on f1", note: "Rerouting for the Ng3 to Nf5 maneuver." },
144   { id: 2, condition: "h3 is played", note: "Secured against Bg4 pin." },
145   { id: 3, condition: "Bishop secure on b3 or a2", note: "Retreated safely, still eyeing f7." },
146   { id: 4, condition: "Rook on e1", note: "Central support and future Re3 swing." },
147   { id: 5, condition: "King castled", note: "King safety confirmed." },
148   { id: 6, condition: "Zero hanging pieces", note: "No loose pieces before attacking." },
149   { id: 7, condition: "Ng3 square is clear", note: "Path open for the knight maneuver." },
150 ];
151 
152 const STRIKE_SEQUENCE = [
153   { move: "Nf1 to Ng3", note: "Load the spring. Knight begins the march." },
154   { move: "Bb3 or Ba2", note: "Bishop secured in the safe house." },
155   { move: "Be3 or Bg5", note: "Second bishop activates. Pin or control." },
156   { move: "Qe2", note: "Queen supports e4, prepares Re3 battery." },
157   { move: "Ng3 to Nf5", note: "The Strangler lands. Black suffocates." },
158   { move: "Re1 to Re3", note: "Rook swings. Attack begins in earnest." },
159   { move: "d4 break", note: "Release the coiled spring. Center explodes." },
160 ];
161 
162 const FALLBACK_QUESTIONS = {
163   line1: [
164     { question: "After 1.e4 e5 2.Nf3 Nc6 3.Bc4 — what is the correct 4th move?", options: ["4. d4", "4. c3", "4. O-O", "4. Ng5"], correct: 1, explanation: "4.c3 — bunker first. Creates the c3-d3 foundation. d3 follows on move 5." },
165     { question: "After c3, what is move 5?", options: ["5. d4", "5. d3", "5. O-O", "5. a4"], correct: 1, explanation: "5.d3 — THE Pianissimo move. c3 then d3. Build the cage slow." },
166     { question: "After d3, what comes next?", options: ["O-O", "h3", "a4", "Nbd2"], correct: 2, explanation: "6.a4 — prophylaxis vs Na5. Creates the a2 escape hatch before castling." },
167     { question: "Black plays ...Na5 attacking your Bc4. Correct response?", options: ["Bxf7+", "Bb3", "Ba2", "d4"], correct: 2, explanation: "Ba2 — the safe house built by a4. Bishop stays on the a2-g8 diagonal." },
168     { question: "What is the LAST move that completes the cage?", options: ["h3", "O-O", "a4", "Re1"], correct: 3, explanation: "9.Re1 — rook to e-file. When Re1 lands, the cage is complete. Execute." },
169   ],
170   line2: [
171     { question: "Black plays Nf6 (Two Knights). What is our 4th move?", options: ["4. Ng5", "4. d4", "4. c3", "4. O-O"], correct: 2, explanation: "4.c3 — same bunker as Line 1. Cage structure is identical. d3 follows on move 5." },
172     { question: "After c3, what is move 5?", options: ["a4", "O-O", "d3", "h3"], correct: 2, explanation: "5.d3 — the Gentleman's move. c3 then d3. Same sequence as Line 1." },
173     { question: "After d3, what comes next?", options: ["O-O", "h3", "a4", "Nbd2"], correct: 2, explanation: "6.a4 — neutralizes ...Na5 immediately. Bishop escape hatch secured before castling." },
174     { question: "When does h3 get played in Line 2?", options: ["Move 5", "Move 6", "Move 8", "Move 9"], correct: 2, explanation: "Move 8. After O-O. Sacred sequence: a4 → O-O → h3. Never before castling." },
175     { question: "What does the Misdirect name refer to?", options: ["Misdirecting your king", "Black expects Ng5, we play c3/d3 instead", "Hiding the bishop", "A queenside feint"], correct: 1, explanation: "They prep for Ng5. We play c3 then d3. They prepared for the wrong opponent." },
176   ],
177   line3: [
178     { question: "Black plays 1...c5 (Sicilian). Our 2nd move?", options: ["2. d4", "2. Nc3", "2. Nf3", "2. Bc4"], correct: 2, explanation: "2.Nf3 first — then Bc4. Prevents ...e6 blocking the diagonal." },
179     { question: "Why does Bc4 work against the Sicilian?", options: ["It attacks c6", "It avoids all Sicilian theory", "It controls d5", "It prepares d4"], correct: 1, explanation: "The Bc4 Bypass skips the Najdorf, Dragon, Scheveningen — all of it." },
180     { question: "Black plays ...d5. Correct response?", options: ["Panic and retreat", "exd5 and recapture", "c4", "d4"], correct: 1, explanation: "exd5 and recapture. Our development advantage holds. Do not panic." },
181     { question: "What does c3 accomplish in Line 3?", options: ["Protects the bishop", "Prepares d4 and solidifies", "Attacks b4", "Supports e4 only"], correct: 1, explanation: "c3 prepares d4 if needed and solidifies the center structure." },
182     { question: "What is the final move that completes the cage in Line 3?", options: ["h3", "O-O", "c3", "Re1"], correct: 3, explanation: "Re1 — rook to e-file. Cage complete. Assassin ready." },
183   ],
184   line4: [
185     { question: "Black plays 2...Nf6 (Petrov). Our 3rd move?", options: ["3. Nxe5", "3. d4", "3. d3", "3. Nc3"], correct: 2, explanation: "3.d3 — rejects the drawish Nxe5 line. Forces Black into our cage." },
186     { question: "Why refuse 3.Nxe5 in the Petrov?", options: ["It loses material", "It leads to drawish simplified positions", "It is illegal", "It weakens our king"], correct: 1, explanation: "3.Nxe5 leads to early simplification and dull draws. We play 3.d3 instead." },
187     { question: "Black plays ...Nxe4 grabbing the pawn. Response?", options: ["Recapture immediately", "d4 — open the center", "Ignore it", "O-O first"], correct: 1, explanation: "d4. Open the center immediately. Our development advantage is decisive." },
188     { question: "After 3.d3, what move comes next?", options: ["h3", "O-O", "Bc4", "a4"], correct: 2, explanation: "4.Bc4 — Italian bishop. We are now in familiar territory." },
189     { question: "What does the Refusal name mean in Line 4?", options: ["Refusing to castle", "Refusing the draw with d3 instead of Nxe5", "Refusing Black's pawn", "Refusing to open the center"], correct: 1, explanation: "We refuse the draw. 3.d3 forces Black into our cage instead of equal simplification." },
190   ],
191 };
192 
193 async function generateQuizQuestions(line) {
194   const prompt = `You are generating a chess quiz for TopherBettis (ELO 609) who is studying the Gentleman's Assassin opening system.
195 
200 Rules:
201 - Each question tests move order, purpose of a specific move, or response to Black's play
202 - 4 options each, exactly 1 correct answer
203 - Keep it practical — things that matter at ELO 609-2000
204 - Explanations should be sharp and memorable, like Vlad would say them
205 
206 Respond with ONLY a JSON array, no markdown, no backticks, no preamble:
207 [
208   {
209     "question": "...",
210     "options": ["...", "...", "...", "..."],
211     "correct": 0,
212     "explanation": "..."
213   }
214 ]`;
215 
216   const raw = await askMagnus(prompt);
217   const clean = raw.replace(/```json|```/g, "").trim();
218   const parsed = JSON.parse(clean);
219   if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Bad response");
220   return parsed.slice(0, 5);
221 }
222 
223 export default function OpeningLab() {
224   const [activeLine, setActiveLine] = useState(LINES[0]);
225   const [activeTab, setActiveTab] = useState("sequence");
226   const [selectedMove, setSelectedMove] = useState(0);
227   const [studiedMoves, setStudiedMoves] = useState({});
228   const [checklist, setChecklist] = useState({});
229   const [selectedResponse, setSelectedResponse] = useState(null);
230   const [responseCoaching, setResponseCoaching] = useState({});
231   const [magnusCoaching, setMagnusCoaching] = useState({});
232   const [loadingResponse, setLoadingResponse] = useState(null);
233   const [loadingMagnus, setLoadingMagnus] = useState(null);
234 
235   const [quizQuestions, setQuizQuestions] = useState([]);
236   const [quizLoading, setQuizLoading] = useState(false);
237   const [quizStarted, setQuizStarted] = useState(false);
238   const [quizIndex, setQuizIndex] = useState(0);
239   const [quizAnswer, setQuizAnswer] = useState(null);
240   const [quizScore, setQuizScore] = useState(0);
241   const [quizDone, setQuizDone] = useState(false);
242   const [vladFeedback, setVladFeedback] = useState("");
243   const [loadingVlad, setLoadingVlad] = useState(false);
244 
245   const currentLine = activeLine;
246   const totalStudied = Object.values(studiedMoves).filter(Boolean).length;
247   const totalMoves = LINES.reduce((acc, l) => acc + l.moves.length, 0);
248   const progressPct = Math.round((totalStudied / totalMoves) * 100);
249 
250   const toggleStudied = (key) => setStudiedMoves(prev => ({ ...prev, [key]: !prev[key] }));
251   const toggleChecklist = (id) => setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
252   const checklistComplete = ASSASSIN_CHECKLIST.every(item => checklist[item.id]);
253 
254   const loadQuestions = useCallback(async (line) => {
255     setQuizLoading(true);
256     setQuizQuestions([]);
257     setQuizStarted(false);
258     setQuizIndex(0);
259     setQuizAnswer(null);
260     setQuizScore(0);
261     setQuizDone(false);
262     setVladFeedback("");
263     try {
264       const questions = await generateQuizQuestions(line);
265       setQuizQuestions(questions);
266     } catch {
267       setQuizQuestions(FALLBACK_QUESTIONS[line.id] || FALLBACK_QUESTIONS.line1);
268     }
269     setQuizLoading(false);
270   }, []);
271 
272   useEffect(() => {
273     if (activeTab === "quiz") {
274       loadQuestions(currentLine);
275     }
276   }, [activeTab, currentLine.id, loadQuestions]);
277 
278   const handleResponseClick = useCallback(async (response) => {
279     setSelectedResponse(response.id);
280     const needsFabiano = !responseCoaching[response.id];
281     const needsMagnus = !magnusCoaching[response.id];
282     if (!needsFabiano && !needsMagnus) return;
283 
284     if (needsFabiano) setLoadingResponse(response.id);
285     if (needsMagnus) setLoadingMagnus(response.id);
286 
287     const fabianoPrompt = `You are Fabiano Caruana — precise, analytical. Black has just played ${response.label}. In 2-3 sentences: explain the threat this move creates, and the exact response within the Gentleman's Assassin system.`;
288     const magnusPrompt = `You are Magnus Carlsen — intuitive, blunt. Black has just played ${response.label}. In 1-2 sentences: give a raw intuitive read on this position.`;
289 
290     const [fabianoResult, magnusResult] = await Promise.all([
291       needsFabiano
292         ? askFabiano(fabianoPrompt).catch(() => "Fabiano is unavailable. Trust the system.")
293         : Promise.resolve(responseCoaching[response.id]),
294       needsMagnus
295         ? askMagnus(magnusPrompt).catch(() => "Feel the position. The cage is solid.")
296         : Promise.resolve(magnusCoaching[response.id]),
297     ]);
298 
299     setResponseCoaching(prev => ({ ...prev, [response.id]: fabianoResult }));
300     setMagnusCoaching(prev => ({ ...prev, [response.id]: magnusResult }));
301     setLoadingResponse(null);
302     setLoadingMagnus(null);
303   }, [responseCoaching, magnusCoaching]);
304 
305   const handleQuizAnswer = useCallback(async (idx) => {
306     const q = quizQuestions[quizIndex];
307     setQuizAnswer(idx);
308     if (idx === q.correct) {
309       setQuizScore(prev => prev + 1);
310       setVladFeedback("");
311     } else {
312       setLoadingVlad(true);
313       try {
314         const prompt = `Vlad correction: Answered wrong. Q: "${q.question}". Correct is "${q.options[q.correct]}". 1-2 sentences correction.`;
315         const feedback = await askVlad(prompt);
316         setVladFeedback(feedback);
317       } catch {
318         setVladFeedback("Nyet. The cage must be built in order. Patience before power.");
319       }
320       setLoadingVlad(false);
321     }
322   }, [quizIndex, quizQuestions]);
323 
324   const nextQuestion = () => {
325     const isLast = quizIndex === quizQuestions.length - 1;
326     if (isLast) {
327       setQuizDone(true);
328     } else {
329       setQuizIndex(prev => prev + 1);
330       setQuizAnswer(null);
331       setVladFeedback("");
332     }
333   };
334 
335   const getVladVerdict = (score, total) => {
336     const pct = score / total;
337     if (pct === 1)   return "Perfect. The cage is in your hands. Now execute.";
338     if (pct >= 0.8)  return "Strong. One weakness. Find it. Fix it before next game.";
339     if (pct >= 0.6)  return "Acceptable. But acceptable loses games. Drill the failures.";
340     if (pct >= 0.4)  return "The cage is leaking. Review the sequence. Again.";
341     return "You are building on sand. Back to the beginning. Every move. Every purpose.";
342   };
343 
344   const tabs = [
345     { id: "sequence",   label: "MOVE SEQUENCE" },
346     { id: "assassin",   label: "ASSASSIN" },
347     { id: "responses",  label: "RESPONSES" },
348     { id: "deviations", label: "DEVIATIONS" },
349     { id: "quiz",       label: "QUIZ" },
350   ];
351 
352   return (
353     <div style={styles.root}>
354 
355       {/* Header */}
356       <div style={styles.header}>
357         <div style={styles.headerLeft}>
358           <span style={styles.headerIcon}>🗡️</span>
359           <div>
360             <h1 style={styles.headerTitle}>Opening Lab</h1>
361             <p style={styles.headerSub}>GENTLEMAN'S ASSASSIN — v2.2</p>
362           </div>
363         </div>
364         <div style={styles.progressChip}>
365           <span style={styles.progressNum}>{progressPct}%</span>
366           <span style={styles.progressLabel}>STUDIED</span>
367         </div>
368       </div>
369 
370       {/* Progress Bar */}
371       <div style={styles.progressBar}>
372         <div style={{ ...styles.progressFill, width: `${progressPct}%`, backgroundColor: currentLine.color }} />
373       </div>
374 
375       {/* Line Selector */}
376       <div style={styles.lineSelector}>
377         {LINES.map(line => (
378           <button
379             key={line.id}
380             style={{
381               ...styles.lineBtn,
382               borderColor: activeLine.id === line.id ? line.color : "#333",
383               color: activeLine.id === line.id ? line.color : "#555",
384               backgroundColor: activeLine.id === line.id ? `${line.color}15` : "transparent",
385             }}
386             onClick={() => {
387               setActiveLine(line);
388               setActiveTab("sequence");
389               setSelectedMove(0);
390               setSelectedResponse(null);
391             }}
392           >
393             <span style={styles.lineBtnCode}>{line.code}</span>
394             <span style={styles.lineBtnName}>{line.name}</span>
395           </button>
396         ))}
397       </div>
398 
399       {/* Tagline */}
400       <div style={{ ...styles.taglineBar, borderLeftColor: currentLine.color }}>
401         <span style={{ fontSize: 12, color: currentLine.color, fontStyle: "italic" }}>
402           "{currentLine.tagline}"
403         </span>
404       </div>
405 
406       {/* Tabs */}
407       <div style={styles.tabs}>
408         {tabs.map(tab => (
409           <button
410             key={tab.id}
411             style={{
412               ...styles.tab,
413               ...(activeTab === tab.id
414                 ? { ...styles.tabActive, color: currentLine.color, borderBottomColor: currentLine.color }
415                 : {}),
416             }}
417             onClick={() => setActiveTab(tab.id)}
418           >
419             {tab.label}
420           </button>
421         ))}
422       </div>
423 
424       {/* ── MOVE SEQUENCE ── */}
425       {activeTab === "sequence" && (
426         <div style={styles.sequenceLayout}>
427           <div style={styles.moveTree}>
428             {currentLine.moves.map((m, i) => {
429               const key = `${currentLine.id}-${i}`;
430               const isStudied = studiedMoves[key];
431               const isActive = selectedMove === i;
432               return (
433                 <div
434                   key={i}
435                   style={{
436                     ...styles.moveNode,
437                     border: `1px solid ${isActive ? currentLine.color : isStudied ? "#1e4d20" : "#1e1e1e"}`,
438                     backgroundColor: isActive ? `${currentLine.color}15` : isStudied ? "#0a1200" : "#0a0a0a",
439                   }}
440                   onClick={() => setSelectedMove(i)}
441                 >
442                   <div style={{
443                     ...styles.moveNodeNum,
444                     backgroundColor: isStudied ? "#27ae60" : isActive ? currentLine.color : "#1a1a1a",
445                     color: "#fff",
446                   }}>
447                     {isStudied ? "✓" : i + 1}
448                   </div>
449                   <div style={styles.moveNodeInfo}>
450                     <span style={styles.moveNodeLabel}>{m.label}</span>
451                     <span style={styles.moveNodeNote}>{m.note}</span>
452                   </div>
453                 </div>
454               );
455             })}
456           </div>
457 
458           <div style={styles.stepDetail}>
459             {(() => {
460               const m = currentLine.moves[selectedMove];
461               const key = `${currentLine.id}-${selectedMove}`;
462               return (
463                 <>
464                   <div style={styles.stepDetailHeader}>
465                     <span style={{ ...styles.stepDetailLabel, color: currentLine.color }}>{m.label}</span>
466                     <span style={styles.stepDetailNum}>Move {selectedMove + 1} of {currentLine.moves.length}</span>
467                   </div>
468                   <p style={styles.stepDetailNote}>{m.note}</p>
469                   <div style={{ ...styles.philosophyBox, borderColor: `${currentLine.color}44` }}>
470                     <p style={styles.philosophyTitle}>CAGE PHILOSOPHY</p>
471                     <p style={styles.philosophyText}>
472                       Construct the cage quietly for 9 moves. Execute violently when Black flinches.
473                       Every move has a purpose. Every tempo is a loaded spring.
474                     </p>
475                   </div>
476                   <div style={styles.fenBox}>
477                     <span style={styles.fenLabel}>TERMINAL FEN</span>
478                     <span style={styles.fenText}>{currentLine.terminalFen}</span>
479                   </div>
480                   <button
481                     style={{ ...styles.btn, backgroundColor: studiedMoves[key] ? "#1e4d20" : currentLine.color }}
482                     onClick={() => toggleStudied(key)}
483                   >
484                     {studiedMoves[key] ? "✓ Studied" : "Mark Studied"}
485                   </button>
486                   {currentLine.moves.every((_, i) => studiedMoves[`${currentLine.id}-${i}`]) && (
487                     <div style={styles.completeBanner}>
488                       ✓ {currentLine.name} complete. The cage is built. Activate the Assassin.
489                     </div>
490                   )}
491                 </>
492               );
493             })()}
494           </div>
495         </div>
496       )}
497 
498       {/* ── ASSASSIN ── */}
499       {activeTab === "assassin" && (
500         <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
501           <div style={styles.assassinHeader}>
502             <p style={styles.assassinRule}>
503               "The assassin does not strike until all conditions are perfect.
504               Premature aggression is the mark of a beginner. Patience is the mark of a killer."
505               — Vlad
506             </p>
507           </div>
508           <div style={styles.checklistGrid}>
509             {ASSASSIN_CHECKLIST.map(item => (
510               <div
511                 key={item.id}
512                 style={{
513                   ...styles.checklistItem,
514                   border: `1px solid ${checklist[item.id] ? "#1e4d20" : "#1e1e1e"}`,
515                   backgroundColor: checklist[item.id] ? "#0a1200" : "#0a0a0a",
516                   cursor: "pointer",
517                 }}
518                 onClick={() => toggleChecklist(item.id)}
519               >
520                 <div style={{
521                   ...styles.checklistBox,
522                   borderColor: checklist[item.id] ? "#27ae60" : "#333",
523                   backgroundColor: checklist[item.id] ? "#27ae60" : "transparent",
524                 }}>
525                   {checklist[item.id] ? "✓" : ""}
526                 </div>
527                 <div>
528                   <div style={styles.checklistLabel}>{item.condition}</div>
529                   <div style={styles.checklistDesc}>{item.note}</div>
530                 </div>
531               </div>
532             ))}
533           </div>
534           {checklistComplete && (
535             <div style={styles.completeBanner}>
536               ⚡ ALL CONDITIONS MET. The assassin is cleared to strike. Execute the sequence below.
537             </div>
538           )}
539           <div style={styles.strikeSequence}>
540             <p style={styles.strikeTitle}>STRIKE SEQUENCE</p>
541             {STRIKE_SEQUENCE.map((step, i) => (
542               <div key={i} style={{ ...styles.strikeStep, borderBottomColor: i === STRIKE_SEQUENCE.length - 1 ? "transparent" : "#141420" }}>
543                 <div style={styles.strikeNum}>{i + 1}</div>
544                 <div>
545                   <div style={styles.strikeMoveLabel}>{step.move}</div>
546                   <div style={styles.strikeNote}>{step.note}</div>
547                 </div>
548               </div>
549             ))}
550           </div>
551         </div>
552       )}
553 
554       {/* ── RESPONSES ── */}
555       {activeTab === "responses" && (
556         <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
557           <p style={styles.sectionLabel}>BLACK'S RESPONSES — {currentLine.name.toUpperCase()}</p>
558           <div style={styles.responseGrid}>
559             {currentLine.responses.map(r => (
560               <div
561                 key={r.id}
562                 style={{
563                   ...styles.responseCard,
564                   border: `1px solid ${selectedResponse === r.id ? currentLine.color : "#1e1e1e"}`,
565                   backgroundColor: selectedResponse === r.id ? `${currentLine.color}10` : "#0a0a0a",
566                   cursor: "pointer",
567                 }}
568                 onClick={() => handleResponseClick(r)}
569               >
570                 <div style={styles.responseLabel}>{r.label}</div>
571               </div>
572             ))}
573           </div>
574           {selectedResponse && (
575             <>
576               <div style={{ ...styles.responseCoachBox, borderColor: `${currentLine.color}44` }}>
577                 <p style={{ ...styles.responseCoachTitle, color: currentLine.color }}>FABIANO ANALYSIS</p>
578                 {loadingResponse === selectedResponse ? (
579                   <p style={styles.loadingText}>Fabiano is calculating...</p>
580                 ) : (
581                   <p style={styles.responseCoachText}>{responseCoaching[selectedResponse]}</p>
582                 )}
583               </div>
584               <div style={{ ...styles.responseCoachBox, borderColor: "#27ae6044" }}>
585                 <p style={{ ...styles.responseCoachTitle, color: "#27ae60" }}>MAGNUS — INTUITION</p>
586                 {loadingMagnus === selectedResponse ? (
587                   <p style={styles.loadingText}>Magnus is feeling the position...</p>
588                 ) : (
589                   <p style={styles.responseCoachText}>{magnusCoaching[selectedResponse]}</p>
590                 )}
591               </div>
592             </>
593           )}
594         </div>
595       )}
596 
597       {/* ── DEVIATIONS ── */}
598       {activeTab === "deviations" && (
599         <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
600           <p style={styles.sectionLabel}>WHEN BLACK BREAKS THE SCRIPT — {currentLine.name.toUpperCase()}</p>
601           {currentLine.deviations.map((d, i) => (
602             <div key={i} style={styles.deviationCard}>
603               <div style={styles.deviationTrigger}>
604                 <span style={{ fontSize: 8, color: "#7a5500", letterSpacing: "1.5px" }}>TRIGGER</span>
605                 <span style={styles.deviationTriggerText}>{d.trigger}</span>
606               </div>
607               <div style={styles.deviationResponse}>
608                 <span style={{ fontSize: 8, color: "#3a6b3a", letterSpacing: "1.5px" }}>RESPONSE</span>
609                 <span style={styles.deviationResponseText}>{d.response}</span>
610               </div>
611             </div>
612           ))}
613           <div style={styles.deviationRule}>
614             <p style={{ margin: 0, fontSize: 12, color: "#5a8a5a", lineHeight: 1.7, fontStyle: "italic" }}>
615               Every deviation from theory gives us a development advantage. Stay calm. Run the loop.
616             </p>
617           </div>
618         </div>
619       )}
620 
621       {/* ── QUIZ ── */}
622       {activeTab === "quiz" && (
623         <div style={styles.quizLayout}>
624 
625           {quizLoading && (
626             <div style={styles.quizLoadingBox}>
627               <p style={styles.quizLoadingText}>⚙ Generating questions for {currentLine.name}...</p>
628             </div>
629           )}
630 
631           {!quizLoading && !quizStarted && !quizDone && quizQuestions.length > 0 && (
632             <div style={styles.quizStart}>
633               <p style={styles.quizIntro}>
634                 {quizQuestions.length} questions on <span style={{ color: currentLine.color }}>{currentLine.name}</span>.
635               </p>
636               <div style={{ display: "flex", gap: 10 }}>
637                 <button style={{ ...styles.btn, backgroundColor: currentLine.color }} onClick={() => setQuizStarted(true)}>
638                   Start Quiz
639                 </button>
640               </div>
641             </div>
642           )}
643 
644           {!quizLoading && quizStarted && !quizDone && quizQuestions.length > 0 && (() => {
645             const q = quizQuestions[quizIndex];
646             return (
647               <>
648                 <div style={styles.quizMeta}>
649                   <span style={{ fontSize: 9, color: "#555", letterSpacing: "1.5px" }}>
650                     QUESTION {quizIndex + 1} OF {quizQuestions.length}
651                   </span>
652                 </div>
653                 <p style={styles.quizQuestion}>{q.question}</p>
654                 <div style={styles.quizOptions}>
655                   {q.options.map((opt, i) => {
656                     let bg = "#111", border = "#222", color = "#bbb";
657                     if (quizAnswer !== null) {
658                       if (i === q.correct) { bg = "#0f2010"; border = "#27ae60"; color = "#27ae60"; }
659                       else if (i === quizAnswer) { bg = "#1a0000"; border = "#c0392b"; color = "#c0392b"; }
660                     }
661                     return (
662                       <button
663                         key={i}
664                         style={{ ...styles.quizOption, backgroundColor: bg, border: `1px solid ${border}`, color }}
665                         onClick={() => quizAnswer === null && handleQuizAnswer(i)}
666                         disabled={quizAnswer !== null}
667                       >
668                         {opt}
669                       </button>
670                     );
671                   })}
672                 </div>
673                 {quizAnswer !== null && (
674                   <div style={styles.quizFeedback}>
675                     <p style={{ ...styles.quizCorrectNote, color: quizAnswer === q.correct ? "#27ae60" : "#c0392b" }}>
676                       {q.explanation}
677                     </p>
678                     {vladFeedback && <p style={styles.vladQuizNote}>"{vladFeedback}"</p>}
679                     <button style={{ ...styles.btn, backgroundColor: currentLine.color }} onClick={nextQuestion}>
680                       {quizIndex === quizQuestions.length - 1 ? "See Results" : "Next Question"}
681                     </button>
682                   </div>
683                 )}
684               </>
685             );
686           })()}
687 
688           {!quizLoading && quizDone && (
689             <div style={styles.quizEndScreen}>
690               <div style={styles.quizScoreDisplay}>
691                 <span style={{ ...styles.quizScoreBig, color: currentLine.color }}>
692                   {quizScore}/{quizQuestions.length}
</span>
                <span style={styles.quizScoreLabel}>FINAL SCORE</span>
              </div>
              <p style={styles.vladVerdictText}>"{getVladVerdict(quizScore, quizQuestions.length)}"</p>
              <button style={{ ...styles.btn, backgroundColor: currentLine.color }} onClick={() => loadQuestions(currentLine)}>
                ↺ New Quiz
              </button>
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
  strikeSequence: { padding: "16px 18px", backgroundColor: "#0a0a12
