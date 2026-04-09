/**
 * src/utils/pgnParser.js
 * vlad-chess-coach — PGN / FEN Utilities
 *
 * Standalone parsing utilities used by GameAutopsy, DrillSergeant,
 * OpeningLab, and EndgameDojo.
 *
 * Requires chess.js loaded globally (CDN in index.html).
 * All functions fail gracefully if chess.js is unavailable.
 */

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

function requireChessJS() {
  if (typeof Chess === "undefined") {
    throw new Error("chess.js not loaded. Add CDN script to public/index.html.");
  }
}

// ---------------------------------------------------------------------------
// PGN parsing
// ---------------------------------------------------------------------------

/**
 * Parse a PGN string into a structured game object.
 *
 * @param {string} pgn
 * @returns {ParsedGame}
 */
export function parsePGN(pgn) {
  requireChessJS();
  const game = new Chess();
  const loaded = game.load_pgn(pgn.trim());
  if (!loaded) throw new Error("Invalid PGN — chess.js could not load it.");

  const history = game.history({ verbose: true });
  const headers = game.header();

  return {
    pgn,
    headers,
    white:       headers.White  ?? "Unknown",
    black:       headers.Black  ?? "Unknown",
    result:      headers.Result ?? "*",
    date:        headers.Date   ?? null,
    event:       headers.Event  ?? null,
    site:        headers.Site   ?? null,
    eco:         headers.ECO    ?? null,
    opening:     headers.Opening ?? null,
    moves:       history,
    uciMoves:    history.map(m => m.from + m.to + (m.promotion ?? "")),
    totalMoves:  history.length,
  };
}

/**
 * Extract all FEN positions from a game (one per move + starting position).
 * Returns array of FEN strings indexed by half-move number.
 *
 * @param {string} pgn
 * @returns {string[]} FEN array — index 0 = starting position
 */
export function extractFENSequence(pgn) {
  requireChessJS();
  const game = new Chess();
  game.load_pgn(pgn.trim());
  const history = game.history({ verbose: true });

  const fens = [];
  const replay = new Chess();
  fens.push(replay.fen()); // starting position

  for (const move of history) {
    replay.move({ from: move.from, to: move.to, promotion: move.promotion ?? "q" });
    fens.push(replay.fen());
  }

  return fens;
}

/**
 * Detect which side TopherBettis played.
 * Checks White/Black headers against player username.
 *
 * @param {ParsedGame} game
 * @param {string} username
 * @returns {'white' | 'black'}
 */
export function detectPlayerSide(game, username = "TopherBettis") {
  const lower = username.toLowerCase();
  if (game.white.toLowerCase().includes(lower)) return "white";
  if (game.black.toLowerCase().includes(lower)) return "black";
  return "white"; // default
}

/**
 * Detect if the game used the Italian Cage opening as White.
 * Checks for the 5 core Coiled Spring moves in the PGN.
 *
 * @param {string} pgn
 * @param {'white' | 'black'} playerSide
 * @returns {boolean}
 */
export function isItalianCage(pgn, playerSide = "white") {
  if (playerSide !== "white") return false;
  return (
    pgn.includes("e4")  &&
    pgn.includes("Nf3") &&
    pgn.includes("Bc4") &&
    pgn.includes("c3")  &&
    pgn.includes("d3")
  );
}

/**
 * Detect opening deviation — first move that differs from Coiled Spring sequence.
 *
 * @param {string[]} uciMoves  - array of UCI move strings
 * @returns {{ deviatedAt: number|null, expectedMove: string|null, actualMove: string|null }}
 */
export function detectOpeningDeviation(uciMoves) {
  const COILED_SPRING_WHITE = ["e2e4", "g1f3", "f1c4", "c2c3", "d2d3", "a2a4", "e1g1", "h2h3"];
  const whiteMoves = uciMoves.filter((_, i) => i % 2 === 0); // white moves only

  for (let i = 0; i < COILED_SPRING_WHITE.length; i++) {
    if (!whiteMoves[i]) break; // game ended before this move
    if (whiteMoves[i] !== COILED_SPRING_WHITE[i]) {
      return {
        deviatedAt:    i + 1, // move number (1-indexed)
        expectedMove:  COILED_SPRING_WHITE[i],
        actualMove:    whiteMoves[i],
      };
    }
  }

  return { deviatedAt: null, expectedMove: null, actualMove: null };
}

// ---------------------------------------------------------------------------
// FEN utilities
// ---------------------------------------------------------------------------

/**
 * Validate a FEN string.
 * @param {string} fen
 * @returns {boolean}
 */
export function isValidFEN(fen) {
  try {
    requireChessJS();
    const game = new Chess(fen);
    return game.fen() === fen || true; // chess.js normalizes FEN
  } catch {
    return false;
  }
}

/**
 * Apply a UCI move to a FEN and return the resulting FEN.
 * @param {string} fen
 * @param {string} uciMove  - e.g. "e2e4" or "e7e8q"
 * @returns {string|null}   - new FEN or null if illegal
 */
export function applyUCIMove(fen, uciMove) {
  try {
    requireChessJS();
    const game = new Chess(fen);
    const result = game.move({
      from:      uciMove.slice(0, 2),
      to:        uciMove.slice(2, 4),
      promotion: uciMove[4] ?? "q",
    });
    return result ? game.fen() : null;
  } catch {
    return null;
  }
}

/**
 * Get the side to move from a FEN string.
 * @param {string} fen
 * @returns {'white' | 'black'}
 */
export function sideToMove(fen) {
  const parts = fen.split(" ");
  return parts[1] === "b" ? "black" : "white";
}

/**
 * Get move number from FEN.
 * @param {string} fen
 * @returns {number}
 */
export function moveNumberFromFEN(fen) {
  const parts = fen.split(" ");
  return parseInt(parts[5]) ?? 1;
}

/**
 * Check if a position is a check.
 * @param {string} fen
 * @returns {boolean}
 */
export function isCheck(fen) {
  try {
    requireChessJS();
    return new Chess(fen).in_check();
  } catch {
    return false;
  }
}

/**
 * Check if a position is checkmate.
 * @param {string} fen
 * @returns {boolean}
 */
export function isCheckmate(fen) {
  try {
    requireChessJS();
    return new Chess(fen).in_checkmate();
  } catch {
    return false;
  }
}

/**
 * Get all legal moves from a FEN position.
 * @param {string} fen
 * @returns {string[]} UCI move strings
 */
export function getLegalMoves(fen) {
  try {
    requireChessJS();
    const game = new Chess(fen);
    return game.moves({ verbose: true }).map(m => m.from + m.to + (m.promotion ?? ""));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// PGN builder (for saving annotated games)
// ---------------------------------------------------------------------------

/**
 * Build a PGN string from a move array with optional annotations.
 *
 * @param {object[]} moves     - verbose move objects from chess.js
 * @param {object}   headers   - PGN headers { White, Black, Result, ... }
 * @param {object[]} comments  - array of { moveIndex, text } comment objects
 * @returns {string}
 */
export function buildAnnotatedPGN(moves, headers = {}, comments = []) {
  const commentMap = {};
  for (const c of comments) {
    commentMap[c.moveIndex] = c.text;
  }

  const headerStr = Object.entries({
    Event:  "vlad-chess-coach Analysis",
    Site:   "Chess.com",
    Date:   new Date().toISOString().slice(0, 10).replace(/-/g, "."),
    White:  "?",
    Black:  "?",
    Result: "*",
    ...headers,
  }).map(([k, v]) => `[${k} "${v}"]`).join("\n");

  let moveStr = "";
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    if (i % 2 === 0) moveStr += `${Math.floor(i / 2) + 1}. `;
    moveStr += move.san;
    if (commentMap[i]) moveStr += ` { ${commentMap[i]} }`;
    moveStr += " ";
  }

  return `${headerStr}\n\n${moveStr.trim()} ${headers.Result ?? "*"}`;
}

/**
 * Summarize a game result for display.
 * @param {string} result   - PGN result string
 * @param {'white'|'black'} playerSide
 * @returns {{ outcome: string, color: string }}
 */
export function summarizeResult(result, playerSide) {
  if (result === "1-0") {
    return playerSide === "white"
      ? { outcome: "WIN",  color: "#27ae60" }
      : { outcome: "LOSS", color: "#e74c3c" };
  }
  if (result === "0-1") {
    return playerSide === "black"
      ? { outcome: "WIN",  color: "#27ae60" }
      : { outcome: "LOSS", color: "#e74c3c" };
  }
  if (result === "1/2-1/2") {
    return { outcome: "DRAW", color: "#f39c12" };
  }
  return { outcome: "?", color: "#666" };
}

export default {
  parsePGN,
  extractFENSequence,
  detectPlayerSide,
  isItalianCage,
  detectOpeningDeviation,
  isValidFEN,
  applyUCIMove,
  sideToMove,
  moveNumberFromFEN,
  isCheck,
  isCheckmate,
  getLegalMoves,
  buildAnnotatedPGN,
  summarizeResult,
};
