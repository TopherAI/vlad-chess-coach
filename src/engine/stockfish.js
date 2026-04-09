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
  depth: 15,          // Reduced for faster analysis (was 18)
  multiPV: 3,         // Number of alternate lines
  moveTime: 8000,     // Increased to 8s for complex positions (was 2000)
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
 * @param {number} options.depth    - Search depth (default 15)
 * @param {number} options.multiPV  - Number of lines (default 3)
 * @param {number} options.moveTime - Max ms (default 8000)
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
    const lines = {};
    let finished = false;

    const timeout = setTimeout(() => {
      if (!finished) {
        engine.onmessage = null;
        reject(new Error(`Stockfish timed out after ${moveTime + 2000}ms on FEN: ${fen}`));
      }
    }, moveTime + 2000);  // increased buffer from 1000 to 2000

    engine.onmessage = (event) => {
      const msg = event.data;

      if (typeof msg !== 'string') return;

      if (msg.startsWith('info') && msg.includes('score')) {
        const parsed = parseInfoLine(msg);
        if (parsed) {
          lines[parsed.multiPV] = parsed;
          if (onInfo) onInfo(parsed);
        }
      }

      if (msg.startsWith('bestmove')) {
        clearTimeout(timeout);
        finished = true;

        const bestMove = parseBestMove(msg);
        const sortedLines = Object.values(lines)
          .sort((a, b) => a.multiPV - b.multiPV);

        resolve(buildAnalysisResult(fen, bestMove, sortedLines, depth));
      }
    };

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
    }, 12000);  // increased from 5000 to 12000

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
 * @param {number}   options.depth       - Analysis depth per move (default 12 for speed)
 * @param {function} options.onProgress  - Called with (moveIndex, total) for UI progress bar
 *
 * @returns {Promise<GameAnalysis>}
 */
export async function analyzeGame(moves, options = {}) {
  const depth      = options.depth      ?? 12;  // reduced from 14 for full game speed
  const onProgress = options.onProgress ?? null;

  const results = [];
  let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  for (let i = 0; i < moves.length; i++) {
    const result = await analyzePosition(fen, { depth, multiPV: 1 });
    const bestMove = result.bestMove;
    const actualMove = moves[i];
    const evalBefore = result.lines[0]?.cp ?? 0;

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
      classification,
      label:          getEvalLabel(evalAfter),
    });

    if (onProgress) onProgress(i + 1, moves.length);
  }

  return buildGameAnalysis(moves, results);
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

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

  const pvIdx = tokens.indexOf('pv');
  const pv    = pvIdx !== -1 ? tokens.slice(pvIdx + 1) : [];

  return {
    depth:   depthVal,
    multiPV: multiPVVal,
    cp:      scoreType === 'cp'   ? scoreVal : null,
    mate:    scoreType === 'mate' ? scoreVal : null,
    pv,
    evalString: scoreType === 'mate'
      ? `M${Math.abs(scoreVal)}`
      : formatCP(scoreVal),
  };
}

function parseBestMove(line) {
  const parts = line.split(' ');
  return parts[1] ?? null;
}

// ---------------------------------------------------------------------------
// Move classification
// ---------------------------------------------------------------------------

function classifyMove(cpLoss, bestMove, actualMove) {
  if (actualMove === bestMove) return 'best';
  if (cpLoss <= 10)  return 'excellent';
  if (cpLoss <= 25)  return 'good';
  if (cpLoss <= 50)  return 'inaccuracy';
  if (cpLoss <= 100) return 'mistake';
  return 'blunder';
}

const CLASSIFICATION_COLORS = {
  best:       '#76b9f5',
  excellent:  '#2ecc71',
  good:       '#a8e6cf',
  inaccuracy: '#f39c12',
  mistake:    '#e67e22',
  blunder:    '#e74c3c',
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
  const blunders     = moveResults.filter(m => m.classification === 'blunder');
  const mistakes     = moveResults.filter(m => m.classification === 'mistake');
  const inaccuracies = moveResults.filter(m => m.classification === 'inaccuracy');

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

function formatCP(cp) {
  const pawns = cp / 100;
  return (pawns >= 0 ? '+' : '') + pawns.toFixed(2);
}

function getEvalLabel(cp) {
  if (cp === null) return 'Unknown';
  const abs = Math.abs(cp);
  const side = cp > 0 ? 'White' : cp < 0 ? 'Black' : null;
  if (abs <= EVAL_LABELS.EQUAL)      return 'Equal';
  if (abs <= EVAL_LABELS.SLIGHT_ADV) return side ? `${side} slightly better` : 'Slight advantage';
  if (abs <= EVAL_LABELS.WINNING)    return side ? `${side} better` : 'Advantage';
  return side ? `${side} winning` : 'Winning';
}

function applyMove(fen, uciMove) {
  if (typeof Chess !== 'undefined') {
    const game = new Chess(fen);
    game.move({
      from: uciMove.slice(0, 2),
      to:   uciMove.slice(2, 4),
      promotion: uciMove[4] ?? 'q',
    });
    return game.fen();
  }
  console.warn('chess.js not found — applyMove() is a no-op. Pass FEN array to analyzeGame().');
  return fen;
}

// ---------------------------------------------------------------------------
// Export summary for GameAutopsy / Vlad debrief integration
// ---------------------------------------------------------------------------

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
