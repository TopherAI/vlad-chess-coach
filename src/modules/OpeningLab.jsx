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
186     { question: "Why refuse 3.Nxe5 in the Petrov?", options: ["It loses material", "It leads to drawish simplified positions", "It is illegal", "It weakens our king"], correct: 1, explanation: "3.Nxe5 leads to
