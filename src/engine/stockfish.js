/**
 * src/engine/stockfish.js
 * vlad-chess-coach — Stockfish WASM Engine Wrapper
 *
 * Loads Stockfish via CDN Worker, exposes a clean promise-based API.
 * Used by GameAutopsy, DrillSergeant, and EndgameDojo.
 *
 * Usage:
 *   import { analyzePosition, getBestMove, getMultiPV } from './engine/stockfish.js';
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STOCKFISH_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';

const DEFAULTS = {
  depth: 18,          // Analysis depth (18 = strong, fast enough for UI)
  multiPV: 3,         // Number of alternate lines
  moveTime: 2000,     // Max ms per move (fallback if depth not reached)
  threads: 1,         // Web Workers are single-threaded; Stockfish.js handles internally
};

// Evaluation thresholds for narrative labels (centipawns)
const EVAL_LABELS = {
  WINNING:    100,    // +1.0 or better
  ADVANTAGE:  50,     // +0.5 to +1.0
  EQUAL:      20,     // -0.2 to +0.2 (dead equal)
  SLIGHT_ADV: 50,     // 0.2 to 0.5
};

// ---------------------------------------------------------------------------
// Engine Singleton
// ---------------------------------------------------------------------------

let _engine = null;
let _engineReady = false;
let _engineQueue = [];   // pending resolve/reject while engine initializes

/**
 * Initialize (or return cached) Stockfish Worker instance.
 * @returns {Promise<Worker>}
 */
function getEngine() {
  return new Promise((resolve, reject) => {
    if (_engineReady && _engine) {
      resolve(_engine);
      return;
    }

    _engineQueue.push({ resolve, reject });

    if (_engine) return; // already loading, just queued

    try {
      _engine = new Worker(STOCKFISH_CDN);
    } catch (err) {
      // Some environments block CDN workers — fall back to importScripts blob
      try {
        const blob = new Blob(
          [`importScripts('${STOCKFISH_CDN}');`],
          { type: 'application/javascript' }
        );
        _engine = new Worker(URL.createObjectURL(blob));
      } catch (fallbackErr) {
        const error = new Error(
          'Stockfish Worker failed to load. Check CDN or use a local stockfish.js file.\n' +
          fallbackErr.message
        );
        _engineQueue.forEach(({ reject }) => reject(error));
        _engineQueue = [];
        _engine = null;
        return;
      }
    }

    _engine.onmessage = (event) => {
      if (event.data === 'uciok' || event.data.includes('Stockfish')) {
        // Engine is ready after 'uciok'
        if (event.data === 'uciok') {
          _engineReady = true;
          _engine.postMessage('isready');
        }
      }
      if (event.data === 'readyok') {
        _engineQueue.forEach(({ resolve }) => resolve(_engine));
        _engineQueue = [];
      }
    };

    _engine.onerror = (err) => {
      const error = new Error('Stockfish Worker error: ' + err.message);
      _engineQueue.forEach(({ reject }) => reject(error));
      _engineQueue = [];
      _engine = null;
      _engineReady = false;
    };

    // Kick off UCI handshake
    _engine.postMessage('uci');
  });
}

/**
 * Terminate the engine instance (call on component unmount to free memory).
 */
export function terminateEngine() {
  if (_engine) {
    _engine.postMessage('quit');
    _engine.terminate();
    _engine = null;
    _engineReady = false;
    _engineQueue = [];
  }
}

// ---------------------------------------------------------------------------
// Core Analysis
// ---------------------------------------------------------------------------

/**
 * Run Stockfish analysis on a FEN position.
 *
 * @param {string} fen         - FEN string of position to analyze
 * @param {object} options
 * @param {number} options.depth    - Search depth (default 18)
 * @param {number} options.multiPV  - Number of lines (default 3)
 * @param {number} options.moveTime - Max ms (default 2000)
 * @param {function} options.onInfo - Optional callback for live 'info' lines
 *
 * @returns {Promise<AnalysisResult>}
 */
export async function analyzePosition(fen, options = {}) {
  const depth    = options.depth    ?? DEFAULTS.depth;
  const multiPV  = options.multiPV  ?? DEFAULTS.multiPV;
  const moveTime = options.moveTime ?? DEFAULTS.moveTime;
  const onInfo   = options.onInfo   ?? null;

  const engine = await getEngine();

  return new Promise((resolve, reject) => {
    const lines = {};   // keyed by multipv index
    let finished = false;

    const timeout = setTimeout(() => {
      if (!finished) {
        engine.onmessage = null;
        reject(new Error(`Stockfish timed out after ${moveTime + 1000}ms on FEN: ${fen}`));
      }
    }, moveTime + 1000);

    engine.onmessage = (event) => {
      const msg = event.data;

      if (typeof msg !== 'string') return;

      // Live info streaming
      if (msg.startsWith('info') && msg.includes('score')) {
        const parsed = parseInfoLine(msg);
        if (parsed) {
          lines[parsed.multiPV] = parsed;
          if (onInfo) onInfo(parsed);
        }
      }

      // Final bestmove signal
      if (msg.startsWith('bestmove')) {
        clearTimeout(timeout);
        finished = true;

        const bestMove = parseBestMove(msg);
        const sortedLines = Object.values(lines)
          .sort((a, b) => a.multiPV - b.multiPV);

        resolve(buildAnalysisResult(fen, bestMove, sortedLines, depth));
      }
    };

    // Send position + go command
    engine.postMessage(`setoption name MultiPV value ${multiPV}`);
    engine.postMessage(`position fen ${fen}`);
    engine.postMessage(`go depth ${depth} movetime ${moveTime}`);
  });
}

/**
 * Get only the best move for a position (lightweight — no full analysis).
 *
 * @param {string} fen
 * @param {number} depth
 * @returns {Promise<string>} UCI move string, e.g. "e2e4"
 */
export async function getBestMove(fen, depth = 12) {
  const engine = await getEngine();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('getBestMove timed out'));
    }, 5000);

    engine.onmessage = (event) => {
      if (typeof event.data === 'string' && event.data.startsWith('bestmove')) {
        clearTimeout(timeout);
        resolve(parseBestMove(event.data));
      }
    };

    engine.postMessage('setoption name MultiPV value 1');
    engine.postMessage(`position fen ${fen}`);
    engine.postMessage(`go depth ${depth}`);
  });
}

/**
 * Analyze a full game from PGN move list.
 * Returns per-move evaluations + blunder/mistake/inaccuracy classification.
 *
 * @param {string[]} moves  - Array of UCI moves, e.g. ["e2e4", "e7e5", ...]
 * @param {object}   options
 * @param {number}   options.depth       - Analysis depth per move (default 14 for speed)
 * @param {function} options.onProgress  - Called with (moveIndex, total) for UI progress bar
 *
 * @returns {Promise<GameAnalysis>}
 */
export async function analyzeGame(moves, options = {}) {
  const depth      = options.depth      ?? 14;
  const onProgress = options.onProgress ?? null;

  const results = [];
  let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // starting FEN

  for (let i = 0; i < moves.length; i++) {
    const result = await analyzePosition(fen, { depth, multiPV: 1 });
    const bestMove = result.bestMove;
    const actualMove = moves[i];
    const evalBefore = result.lines[0]?.cp ?? 0;

    // Advance position
    fen = applyMove(fen, actualMove);

    const evalAfter = (await analyzePosition(fen, { depth, multiPV: 1 })).lines[0]?.cp ?? 0;

    const cpLoss = Math.abs(evalBefore) - Math.abs(evalAfter);
    const classification = classifyMove(cpLoss, bestMove, actualMove);

    results.push({
      moveIndex:      i,
      moveNumber:     Math.floor(i / 2) + 1,
      side:           i % 2 === 0 ? 'white' : 'black',
      actualMove,
      bestMove,
      evalBefore,
      evalAfter,
      cpLoss,
      classification,   // 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'
      label:            getEvalLabel(evalAfter),
    });

    if (onProgress) onProgress(i + 1, moves.length);
  }

  return buildGameAnalysis(moves, results);
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

/**
 * Parse a Stockfish 'info' line into structured data.
 * Example: "info depth 18 seldepth 25 multipv 1 score cp 43 nodes 123456 pv e2e4 e7e5"
 */
function parseInfoLine(line) {
  const tokens = line.split(' ');
  const get = (key) => {
    const idx = tokens.indexOf(key);
    return idx !== -1 ? tokens[idx + 1] : null;
  };

  const depthVal   = parseInt(get('depth'))   || 0;
  const multiPVVal = parseInt(get('multipv')) || 1;
  const scoreType  = tokens.includes('cp')   ? 'cp'   :
                     tokens.includes('mate') ? 'mate' : null;

  if (!scoreType) return null;

  const scoreVal = parseInt(get(scoreType)) || 0;

  // Extract PV line
  const pvIdx = tokens.indexOf('pv');
  const pv    = pvIdx !== -1 ? tokens.slice(pvIdx + 1) : [];

  return {
    depth:   depthVal,
    multiPV: multiPVVal,
    cp:      scoreType === 'cp'   ? scoreVal : null,
    mate:    scoreType === 'mate' ? scoreVal : null,
    pv,
    // Human-readable eval string: "+0.43" or "M5"
    evalString: scoreType === 'mate'
      ? `M${Math.abs(scoreVal)}`
      : formatCP(scoreVal),
  };
}

/** Parse "bestmove e2e4 ponder d7d5" → "e2e4" */
function parseBestMove(line) {
  const parts = line.split(' ');
  return parts[1] ?? null;
}

// ---------------------------------------------------------------------------
// Move classification
// ---------------------------------------------------------------------------

/**
 * Classify a move by centipawn loss vs best move.
 * Thresholds from standard chess analysis conventions.
 */
function classifyMove(cpLoss, bestMove, actualMove) {
  if (actualMove === bestMove) return 'best';
  if (cpLoss <= 10)  return 'excellent';
  if (cpLoss <= 25)  return 'good';
  if (cpLoss <= 50)  return 'inaccuracy';
  if (cpLoss <= 100) return 'mistake';
  return 'blunder';
}

const CLASSIFICATION_COLORS = {
  best:       '#76b9f5',  // blue
  excellent:  '#2ecc71',  // green
  good:       '#a8e6cf',  // light green
  inaccuracy: '#f39c12',  // orange
  mistake:    '#e67e22',  // dark orange
  blunder:    '#e74c3c',  // red
};

export function getClassificationColor(classification) {
  return CLASSIFICATION_COLORS[classification] ?? '#aaaaaa';
}

// ---------------------------------------------------------------------------
// Result builders
// ---------------------------------------------------------------------------

function buildAnalysisResult(fen, bestMove, lines, depth) {
  const topLine = lines[0] ?? {};
  return {
    fen,
    bestMove,
    depth,
    lines,
    cp:         topLine.cp   ?? null,
    mate:       topLine.mate ?? null,
    evalString: topLine.evalString ?? '0.00',
    label:      getEvalLabel(topLine.cp ?? 0),
  };
}

function buildGameAnalysis(moves, moveResults) {
  const blunders    = moveResults.filter(m => m.classification === 'blunder');
  const mistakes    = moveResults.filter(m => m.classification === 'mistake');
  const inaccuracies = moveResults.filter(m => m.classification === 'inaccuracy');

  // Accuracy approximation: 100 - weighted error rate
  const totalMoves  = moveResults.length;
  const weightedErr = (blunders.length * 3 + mistakes.length * 2 + inaccuracies.length) / totalMoves;
  const accuracy    = Math.max(0, Math.min(100, Math.round(100 - weightedErr * 10)));

  return {
    moves: moveResults,
    summary: {
      totalMoves,
      blunders:     blunders.length,
      mistakes:     mistakes.length,
      inaccuracies: inaccuracies.length,
      accuracy,
      // Worst blunders sorted by cp loss for Vlad debrief
      worstMoves: moveResults
        .filter(m => ['blunder','mistake'].includes(m.classification))
        .sort((a, b) => b.cpLoss - a.cpLoss)
        .slice(0, 5),
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format centipawns as "+1.23" or "-0.45" */
function formatCP(cp) {
  const pawns = cp / 100;
  return (pawns >= 0 ? '+' : '') + pawns.toFixed(2);
}

/** Get human label for a centipawn value (from White's perspective) */
function getEvalLabel(cp) {
  if (cp === null) return 'Unknown';
  const abs = Math.abs(cp);
  const side = cp > 0 ? 'White' : cp < 0 ? 'Black' : null;
  if (abs <= EVAL_LABELS.EQUAL)     return 'Equal';
  if (abs <= EVAL_LABELS.SLIGHT_ADV) return side ? `${side} slightly better` : 'Slight advantage';
  if (abs <= EVAL_LABELS.WINNING)   return side ? `${side} better` : 'Advantage';
  return side ? `${side} winning` : 'Winning';
}

/**
 * Minimal FEN position updater — applies a UCI move to a FEN string.
 * NOTE: This is a lightweight helper. For full legality checking,
 * wire in chess.js (already likely in your dependency tree via GameAutopsy).
 *
 * For now: relies on chess.js being available globally OR imported by caller.
 * GameAutopsy will import chess.js and pass pre-updated FENs directly
 * to analyzeGame() instead of using this helper.
 */
function applyMove(fen, uciMove) {
  // If chess.js is globally available (loaded via CDN in index.html)
  if (typeof Chess !== 'undefined') {
    const game = new Chess(fen);
    game.move({
      from: uciMove.slice(0, 2),
      to:   uciMove.slice(2, 4),
      promotion: uciMove[4] ?? 'q',
    });
    return game.fen();
  }
  // Fallback: caller is responsible for FEN progression
  console.warn('chess.js not found — applyMove() is a no-op. Pass FEN array to analyzeGame().');
  return fen;
}

// ---------------------------------------------------------------------------
// Export summary for GameAutopsy / Vlad debrief integration
// ---------------------------------------------------------------------------

/**
 * Generate a Vlad-ready summary string from game analysis results.
 * This gets injected into the Vlad prompt as context.
 *
 * @param {GameAnalysis} gameAnalysis
 * @param {string} playerSide - 'white' | 'black'
 * @returns {string}
 */
export function buildVladContext(gameAnalysis, playerSide) {
  const { summary, moves } = gameAnalysis;
  const playerMoves = moves.filter(m => m.side === playerSide);

  const worstStr = summary.worstMoves
    .map(m => `Move ${m.moveNumber} (${m.actualMove}): ${m.classification.toUpperCase()} — CP loss: ${m.cpLoss}, best was ${m.bestMove}`)
    .join('\n');

  return `
GAME ANALYSIS SUMMARY — ${playerSide.toUpperCase()}
Accuracy: ${summary.accuracy}%
Blunders: ${summary.blunders} | Mistakes: ${summary.mistakes} | Inaccuracies: ${summary.inaccuracies}
Total moves analyzed: ${summary.totalMoves}

CRITICAL MOMENTS (worst moves):
${worstStr || 'No major errors found.'}
`.trim();
}

export default {
  analyzePosition,
  getBestMove,
  analyzeGame,
  terminateEngine,
  getClassificationColor,
  buildVladContext,
};
