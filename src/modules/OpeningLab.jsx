/**
 * src/modules/OpeningLab.jsx
 * vlad-chess-coach — Opening Lab Module (v2.0 Gentleman's Assassin)
 *
 * UPGRADE LOG (v2.0):
 *   - Added all 4 repertoire lines with line selector
 *   - Fixed COILED_SPRING move order (a4 removed, h3 corrected, Re1 UCI fixed)
 *   - Added ASSASSIN ACTIVATION checklist tab
 *   - Added Script Deviation handler per line
 *   - Added Sicilian + Petrov black responses
 *   - Wired gentlemans-assassin.json terminal FENs
 *   - All existing coach integrations (askFabiano, askVlad) preserved
 */

import { useState, useCallback } from "react";
import { askFabiano } from "../coaches/fabiano.jsx";
import { askVlad } from "../coaches/vlad.jsx";

// ---------------------------------------------------------------------------
// Data — 4 Repertoire Lines (Gentleman's Assassin Super Plan v2.0)
// ---------------------------------------------------------------------------

const LINES = [
  {
    id: "line1",
    code: "LINE 1",
    name: "Giuoco Pianissimo",
    subtitle: "The Anchor",
    color: "#c0392b",
    tagline: "Build the fortress. Wait. Strike.",
    terminalFen: "r1bqr1k1/bpp2pp1/p1np1n1p/4p3/4P3/1BPP1N1P/PP1N1PP1/R1BQR1K1 w - - 1 11",
    moves: [
      { move: "e2e4",  label: "1. e4",    note: "Control the center. Non-negotiable." },
      { move: "g1f3",  label: "2. Nf3",   note: "Develop, attack e5 with tempo." },
      { move: "f1c4",  label: "3. Bc4",   note: "Italian Bishop. Target f7 — Black's eternal weakness." },
      { move: "d2d3",  label: "4. d3",    note: "THE Pianissimo move. Build slow. Don't tip your hand." },
      { move: "c2c3",  label: "5. c3",    note: "Prepares d4. Creates the c3-d3 bunker." },
      { move: "e1g1",  label: "6. O-O",   note: "Castle. King safe. Always by move 7." },
      { move: "h2h3",  label: "7. h3",    note: "SACRED. Stops Bg4 pin. Enables Be3. Non-negotiable." },
      { move: "f1e1",  label: "8. Re1",   note: "Rook to e-file. Supports e4. Cage is forming." },
      { move: "b1d2",  label: "9. Nbd2",  note: "Develop without blocking structure. Loading the spring." },
      { move: "d2f1",  label: "10. Nf1",  note: "Knight loaded on f1. Assassin is coiled. Ready." },
    ],
    responses: [
      { id: "bc5",   label: "3...Bc5 (Giuoco Piano)",    fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
      { id: "nf6",   label: "3...Nf6 (Two Knights)",     fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
      { id: "be7",   label: "3...Be7 (Hungarian)",       fen: "r1bqk1nr/ppppbppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
      { id: "d6",    label: "3...d6 (Classical setup)",  fen: "r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4" },
    ],
    deviations: [
      { trigger: "Black plays ...d5 early", response: "exd5 — open lines favor our better development and Bc4 pressure." },
      { trigger: "Black plays ...Be6 (trade offer)", response: "Bxe6 fxe6 (doubled pawns long-term target) OR Bb3 and continue the maneuver." },
      { trigger: "Black plays ...Ng4 before h3", response: "h3 immediately. They lose a tempo retreating. This is why h3 is sacred." },
      { trigger: "Black plays ...Na5 (bishop attack)", response: "Ba2 — bishop retreats, stays on diagonal. Then a4 for space." },
      { trigger: "Black plays ...f5 (early aggression)", response: "Castle. Let them overextend. The f5 pawn becomes a target later." },
    ],
  },
  {
    id: "line2",
    code: "LINE 2",
    name: "Two Knights — d3 System",
    subtitle: "The Misdirect",
    color: "#e67e22",
    tagline: "They prep for Ng5. We play d3.",
    terminalFen: "r1bq1rk1/pp2bppp/2np1n2/2p1p3/P3P3/2PP1N2/BP1N1PPP/R1BQR1K1 b - - 0 10",
    moves: [
      { move: "e2e4",  label: "1. e4",    note: "Same face. Same calm." },
      { move: "g1f3",  label: "2. Nf3",   note: "Develop. Attack e5." },
      { move: "f1c4",  label: "3. Bc4",   note: "Italian Bishop. Black plays Nf6 instead of Bc5." },
      { move: "d2d3",  label: "4. d3",    note: "Gentleman's move. True Pianissimo. Refuse all sharp lines." },
      { move: "e1g1",  label: "5. O-O",   note: "Castle immediately. King safe before any complications." },
      { move: "f1e1",  label: "6. Re1",   note: "Rook to e-file. Standard Italian placement." },
      { move: "d3d6",  label: "7. d6",    note: "Black plays d6. We continue development." },
      { move: "a2a4",  label: "7. a4",    note: "Prophylaxis against Na5 queenside expansion." },
      { move: "c4a2",  label: "8. Ba2",   note: "Bishop retreats. Stays on diagonal. Knight on rim is dim." },
      { move: "c2c3",  label: "9. c3",    note: "Solidify center. Complete the cage." },
      { move: "b1d2",  label: "10. Nbd2", note: "Last development move. Cage complete. Spring loaded." },
    ],
    responses: [
      { id: "bc5t",  label: "...Bc5 (transposes to Line 1)", fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5" },
      { id: "d5",    label: "...d5 (counterattack)",         fen: "r1bqkb1r/ppp2ppp/2n2n2/3pp3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq d6 0 5" },
      { id: "na5",   label: "...Na5 (bishop attack)",        fen: "r1bqkb1r/pppp1ppp/5n2/n3p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 2 5" },
      { id: "be7t",  label: "...Be7 (solid setup)",          fen: "r1bqk2r/ppppbppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5" },
    ],
    deviations: [
      { trigger: "Black plays ...Bc5 (transposition)", response: "Welcome it. We're in Line 1 territory. Same cage applies." },
      { trigger: "Black plays ...d5 early", response: "exd5 Nxd5. Open position favors our development lead and bishop pair." },
      { trigger: "Black plays ...Na5 (bishop attack)", response: "a4 + Ba2. Bishop retreats to a2, stays on the long diagonal. Knight on the rim is dim." },
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
      { move: "e2e4",  label: "1. e4",    note: "Black plays c5. The Sicilian. Stay calm." },
      { move: "g1f3",  label: "2. Nf3",   note: "Develop. Don't play 2.d4 — that's their world." },
      { move: "f1c4",  label: "3. Bc4",   note: "Anti-Sicilian. Avoids Najdorf, Dragon, all of it." },
      { move: "d2d3",  label: "4. d3",    note: "Cage structure. Mirror Line 1." },
      { move: "c2c3",  label: "5. c3",    note: "Prepare d4 if needed. Solidify." },
      { move: "e1g1",  label: "6. O-O",   note: "Castle fast. King safe before action." },
      { move: "f1e1",  label: "7. Re1",   note: "Rook to e-file. Standard." },
      { move: "b1d2",  label: "8. Nbd2",  note: "Development. Same pattern as Lines 1 and 2." },
< truncated lines 109-681 >
// Styles (preserved from v1, extended)
// ---------------------------------------------------------------------------

const styles = {
  root: {
    display: "flex", flexDirection: "column", gap: 20,
    padding: "28px 32px", minHeight: "100vh",
    backgroundColor: "#0d0d0d", color: "#e8e8e8",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    maxWidth: 960, margin: "0 auto",
  },
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
  moveNodeNum: { width: 26, height: 26, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, transition: "background 0.2s" },
  moveNodeInfo: { display: "flex", flexDirection: "column", gap: 2 },
  moveNodeLabel: { fontSize: 13, fontWeight: 600, color: "#ccc" },
  moveNodeNote: { fontSize: 10, color: "#555", lineHeight: 1.4 },

  stepDetail: { flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 240 },
  stepDetailHeader: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  stepDetailLabel: { fontSize: 28, fontWeight: 700 },
  stepDetailNum: { fontSize: 11, color: "#555" },
  stepDetailNote: { fontSize: 14, color: "#aaa", lineHeight: 1.7, margin: 0 },
  philosophyBox: { padding: "14px 16px", backgroundColor: "#0d1a0d", border: "1px solid", borderRadius: 6 },
  philosophyTitle: { margin: "0 0 6px", fontSize: 9, color: "#3a6b3a", letterSpacing: "1.5px" },
  philosophyText: { margin: 0, fontSize: 12, color: "#5a8a5a", lineHeight: 1.7, fontStyle: "italic" },
  fenBox: { padding: "10px 14px", backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 4 },
  fenLabel: { display: "block", fontSize: 8, color: "#444", letterSpacing: "2px", marginBottom: 6 },
  fenText: { fontSize: 9, color: "#555", wordBreak: "break-all", lineHeight: 1.5 },
  completeBanner: { padding: "12px 16px", backgroundColor: "#0f2010", border: "1px solid #1e4d20", borderRadius: 6, fontSize: 13, color: "#27ae60" },

  assassinHeader: { padding: "14px 18px", backgroundColor: "#0f0a00", border: "1px solid #3d2800", borderRadius: 6 },
  assassinRule: { margin: 0, fontSize: 12, color: "#8a6a2a", lineHeight: 1.7, fontStyle: "italic" },
  checklistGrid: { display: "flex", flexDirection: "column", gap: 8 },
  checklistItem: { display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 6, transition: "all 0.15s" },
  checklistBox: { width: 22, height: 22, border: "1px solid", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", flexShrink: 0, transition: "all 0.15s" },
  checklistLabel: { fontSize: 13, color: "#ccc", fontWeight: 600 },
  checklistDesc: { fontSize: 10, color: "#555", marginTop: 2 },
  strikeSequence: { padding: "16px 18px", backgroundColor: "#0a0a12", border: "1px solid #1a1a2a", borderRadius: 6 },
  strikeTitle: { margin: "0 0 14px", fontSize: 9, color: "#5555aa", letterSpacing: "1.5px" },
  strikeStep: { display: "flex", gap: 14, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #141420" },
  strikeNum: { width: 22, height: 22, backgroundColor: "#c0392b", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0 },
  strikeMoveLabel: { fontSize: 13, color: "#aaa", fontWeight: 600 },
  strikeNote: { fontSize: 10, color: "#555", marginTop: 3 },

  tacticCard: { padding: "14px 16px", borderRadius: 8, transition: "border-color 0.2s, background 0.2s" },
  tacticHeader: { display: "flex", alignItems: "flex-start", gap: 12 },
  tacticIcon: { fontSize: 24, flexShrink: 0 },
  tacticName: { margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#ccc" },
  tacticDesc: { margin: 0, fontSize: 11, color: "#666" },
  tacticNote: { margin: "10px 0 0", fontSize: 12, color: "#7fb3d3", fontStyle: "italic", lineHeight: 1.6 },
  tacticReminder: { padding: "14px 16px", backgroundColor: "#1a0f00", border: "1px solid #3d2800", borderRadius: 6 },
  tacticReminderTitle: { margin: "0 0 6px", fontSize: 9, color: "#7a5500", letterSpacing: "1.5px" },
  tacticReminderText: { margin: 0, fontSize: 12, color: "#8a6a2a", lineHeight: 1.7 },

  sectionLabel: { margin: 0, fontSize: 9, letterSpacing: "2px", color: "#444" },
  responseGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  responseCard: { padding: "14px 16px", borderRadius: 6, transition: "border-color 0.2s, background 0.2s" },
  responseLabel: { fontSize: 12, color: "#aaa" },
  responseCoachBox: { padding: "16px 18px", backgroundColor: "#0a1520", border: "1px solid", borderRadius: 8 },
  responseCoachTitle: { margin: "0 0 8px", fontSize: 10, letterSpacing: "1px" },
  responseCoachText: { margin: 0, fontSize: 13, color: "#aaa", lineHeight: 1.8 },

  deviationCard: { backgroundColor: "#111", border: "1px solid #1e1e1e", borderRadius: 6, overflow: "hidden" },
  deviationTrigger: { padding: "10px 14px", backgroundColor: "#1a1000", borderBottom: "1px solid #1e1e1e", display: "flex", flexDirection: "column", gap: 4 },
  deviationTriggerText: { fontSize: 12, color: "#e67e22" },
  deviationResponse: { padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 },
  deviationResponseText: { fontSize: 12, color: "#aaa", lineHeight: 1.6 },
  deviationRule: { padding: "14px 16px", backgroundColor: "#0a1200", border: "1px solid #1e2a00", borderRadius: 6 },

  quizLayout: { display: "flex", flexDirection: "column", gap: 20 },
  quizStart: { display: "flex", flexDirection: "column", gap: 16 },
  quizIntro: { margin: 0, fontSize: 14, color: "#aaa", lineHeight: 1.7 },
  quizQuestion: { fontSize: 16, color: "#ccc", lineHeight: 1.6, margin: 0 },
  quizOptions: { display: "flex", flexDirection: "column", gap: 10 },
  quizOption: { padding: "14px 18px", borderRadius: 6, fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer", textAlign: "left", transition: "all 0.2s" },
  quizFeedback: { display: "flex", flexDirection: "column", gap: 10, padding: "16px 18px", backgroundColor: "#111", border: "1px solid #222", borderRadius: 8 },
  quizCorrectNote: { margin: 0, fontSize: 12, color: "#888" },
  vladQuizNote: { margin: 0, fontSize: 12, color: "#c0392b", fontStyle: "italic" },

  loadingText: { margin: 0, fontSize: 12, color: "#555", fontStyle: "italic" },
  btn: { padding: "10px 22px", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" },
  btnGhost: { padding: "10px 22px", backgroundColor: "transparent", color: "#666", border: "1px solid #333", borderRadius: 6, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer", alignSelf: "flex-start" },
};
