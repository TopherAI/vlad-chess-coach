/**
 * src/engine/stockfish.js
 * vlad-chess-coach — Stockfish WASM Engine Wrapper
 */

const STOCKFISH_CDN = '/stockfish.js';

const DEFAULTS = {
  depth: 15,
  multiPV: 3,
  moveTime: 8000,
  threads: 1,
};

const EVAL_LABELS = {
  WINNING:    100,
  ADVANTAGE:  50,
  EQUAL:      20,
  SLIGHT_ADV: 50,
};

let _engine = null;
let _engineReady = false;
let _engineQueue = [];

function getEngine() {
  return new Promise((resolve, reject) => {
    if (_engineReady && _engine) {
      resolve(_engine);
      return;
    }

    _engineQueue.push({ resolve, reject });

    if (_engine) return;

    try {
      _engine = new Worker(STOCKFISH_CDN);
    } catch (err) {
      try {
        const blob = new Blob(
          [`importScripts('${STOCKFISH_CDN}');`],
          { type: 'application/javascript' }
        );
        _engine = new Worker(URL.createObjectURL(blob));
      } catch (fallbackErr) {
        const error = new Error(
          'Stockfish Worker failed to load.\n' + fallbackErr.message
        );
        _engineQueue.forEach(({ reject }) => reject(error));
        _engineQueue = [];
        _engine = null;
        return;
      }
    }

    _engine.onmessage = (event) => {
      const msg = typeof event.data === 'string' ? event.data : null;
      if (!msg) return;

      if (msg.includes('uciok')) {
        _engineReady = true;
        _engine.postMessage('isready');
      }

      if (msg.includes('readyok')) {
        _engineQueue.forEach(({ resolve }) => resolve(_engine));
        _engineQueue = [];
      }
    };

    _engine.onerror = (err) => {
      console.error('Stockfish load error:', err);
      const error = new Error('Stockfish Worker error: ' + err.message);
      _engineQueue.forEach(({ reject }) => reject(error));
      _engineQueue = [];
      _engine = null;
      _engineReady = false;
    };

    _engine.postMessage('uci');
  });
}

export function terminateEngine() {
  if (_engine) {
    _engine.postMessage('quit');
    _engine.terminate();
    _engine = null;
    _engineReady = false;
    _engineQueue = [];
  }
}

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
    }, moveTime + 2000);

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
        const sortedLines = Object.values(lines).sort((a, b) => a.multiPV - b.multiPV);
        resolve(buildAnalysisResult(fen, bestMove, sortedLines, depth));
      }
    };

    engine.postMessage(`setoption name MultiPV value ${multiPV}`);
    engine.postMessage(`position fen ${fen}`);
    engine.postMessage(`go depth ${depth} movetime ${moveTime}`);
  });
}

export async function getBestMove(fen, depth = 12) {
  const engine = await getEngine();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('getBestMove timed out'));
    }, 12000);

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

export async function analyzeGame(moves, options = {}) {
  const depth      = options.depth      ?? 12;
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
  console.warn('chess.js not found — applyMove() is a no-op.');
  return fen;
}

export function buildVladContext(gameAnalysis, playerSide) {
  const { summary } = gameAnalysis;

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
