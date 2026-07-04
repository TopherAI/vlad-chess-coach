/**
 * src/useStockfish.js
 * CHESSai — real Stockfish engine hook, backed by the WASM build in
 * public/stockfish.js (glued via public/stockfish-worker.js).
 *
 * Replaces the Opal export's stub (isReady always false, findBestMove
 * a no-op) with an actual UCI Web Worker.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_ELO = 400;
const MAX_ELO = 3000;
const MOVETIME_MS = 800;

export function useStockfish() {
  const workerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);

  useEffect(() => {
    const worker = new Worker('/stockfish-worker.js');
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const line = typeof e.data === 'string' ? e.data : '';
      if (line === 'uciok') {
        worker.postMessage('isready');
      } else if (line === 'readyok') {
        setIsReady(true);
      } else if (line.startsWith('bestmove')) {
        const move = line.split(' ')[1];
        setBestMove(move && move !== '(none)' ? move : null);
      } else if (line.startsWith('error:')) {
        console.error('Stockfish worker:', line);
      }
    };
    worker.onerror = (err) => {
      console.error('Stockfish worker crashed:', err);
      setIsReady(false);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const findBestMove = useCallback((fen, elo) => {
    const worker = workerRef.current;
    if (!worker || !isReady) return;

    setBestMove(null);
    const clampedElo = Math.max(MIN_ELO, Math.min(MAX_ELO, elo ?? MIN_ELO));
    worker.postMessage('setoption name UCI_LimitStrength value true');
    worker.postMessage(`setoption name UCI_Elo value ${clampedElo}`);
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go movetime ${MOVETIME_MS}`);
  }, [isReady]);

  return { isReady, findBestMove, bestMove };
}
