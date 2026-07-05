/**
 * src/useStockfish.js
 * CHESSai — real Stockfish engine hook, backed by the WASM build in
 * public/stockfish.js (glued via public/stockfish-worker.js).
 *
 * Replaces the Opal export's stub (isReady always false, findBestMove
 * a no-op) with an actual UCI Web Worker.
 *
 * findBestMove() (ELO-limited) powers the Opening/Middlegame trainers.
 * analyze()/evaluatePosition() (full-strength) power Endgame Dojo's
 * training opponent, Engine Lab's position analysis, and Autopsy's
 * sequential mistake scan — the same three real-engine use cases
 * StockfishBridge.swift covers on iOS, against the same stockfish.js
 * WASM build.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_ELO = 400;
const MAX_ELO = 3000;
const MOVETIME_MS = 800;

export function useStockfish() {
  const workerRef = useRef(null);
  const isReadyRef = useRef(false);
  const pendingRef = useRef(null); // { resolve } for evaluatePosition()
  const [isReady, setIsReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);
  const [evaluationCentipawns, setEvaluationCentipawns] = useState(null);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const worker = new Worker('/stockfish-worker.js');
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const line = typeof e.data === 'string' ? e.data : '';
      if (line === 'uciok') {
        worker.postMessage('isready');
      } else if (line === 'readyok') {
        isReadyRef.current = true;
        setIsReady(true);
      } else if (line.startsWith('info') && line.includes('score cp')) {
        const match = line.match(/score cp (-?\d+)/);
        if (match) setEvaluationCentipawns(parseInt(match[1], 10));
      } else if (line.startsWith('bestmove')) {
        const move = line.split(' ')[1];
        const resolved = move && move !== '(none)' ? move : null;
        setBestMove(resolved);
        setIsThinking(false);
        if (pendingRef.current) {
          const { resolve } = pendingRef.current;
          pendingRef.current = null;
          resolve({ bestMove: resolved, evalCentipawns: evaluationCentipawns });
        }
      } else if (line.startsWith('error:')) {
        console.error('Stockfish worker:', line);
        setIsThinking(false);
      }
    };
    worker.onerror = (err) => {
      console.error('Stockfish worker crashed:', err);
      isReadyRef.current = false;
      setIsReady(false);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findBestMove = useCallback((fen, elo) => {
    const worker = workerRef.current;
    if (!worker || !isReadyRef.current) return;

    setBestMove(null);
    const clampedElo = Math.max(MIN_ELO, Math.min(MAX_ELO, elo ?? MIN_ELO));
    worker.postMessage('setoption name UCI_LimitStrength value true');
    worker.postMessage(`setoption name UCI_Elo value ${clampedElo}`);
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go movetime ${MOVETIME_MS}`);
  }, []);

  /// Fire-and-forget full-strength analysis — bestMove/evaluationCentipawns
  /// update via state as UCI info/bestmove lines arrive. Used where the
  /// caller just watches the hook's state (Engine Lab's "Analyze this
  /// position" button).
  const analyze = useCallback((fen, movetimeMs = 800) => {
    const worker = workerRef.current;
    if (!worker || !isReadyRef.current) return;
    setIsThinking(true);
    setBestMove(null);
    setEvaluationCentipawns(null);
    worker.postMessage('setoption name UCI_LimitStrength value false');
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go movetime ${movetimeMs}`);
  }, []);

  /// Waits for the engine's UCI handshake to complete. Used by batch callers
  /// (Autopsy) that need to know analysis can actually start before looping
  /// through a game's positions.
  const waitUntilReady = useCallback(async (timeoutMs = 5000) => {
    let waited = 0;
    while (!isReadyRef.current && waited < timeoutMs) {
      await new Promise((r) => setTimeout(r, 100));
      waited += 100;
    }
    return isReadyRef.current;
  }, []);

  /// Sequential, awaitable single-position evaluation for batch use (Autopsy
  /// analyzing a whole game move-by-move; Endgame Dojo's training opponent
  /// picking its reply). Not meant to be called concurrently with itself or
  /// with analyze() — this is a single local engine instance, one analysis
  /// at a time, same as a human would use it.
  const evaluatePosition = useCallback((fen, movetimeMs = 300) => {
    const worker = workerRef.current;
    if (!worker || !isReadyRef.current) return Promise.resolve({ bestMove: null, evalCentipawns: null });
    return new Promise((resolve) => {
      if (pendingRef.current) {
        // A stale pending call never resolved (shouldn't happen in normal
        // sequential use) — resolve it empty rather than leak/deadlock it.
        pendingRef.current.resolve({ bestMove: null, evalCentipawns: null });
      }
      pendingRef.current = { resolve };
      setEvaluationCentipawns(null);
      worker.postMessage('setoption name UCI_LimitStrength value false');
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go movetime ${movetimeMs}`);
    });
  }, []);

  return { isReady, findBestMove, bestMove, analyze, evaluatePosition, waitUntilReady, evaluationCentipawns, isThinking };
}
