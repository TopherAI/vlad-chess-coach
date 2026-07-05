// src/Autopsy.tsx
// CHESSai — Autopsy: real diagnosis of your actual Chess.com games. Three
// real pieces, no fabrication, ported from AutopsyView.swift:
// 1. Doctrine check — compares real games against the canonical 9-move
//    cage from data/repertoire.ts (the same source Opening Blueprint uses,
//    not a separately hardcoded copy). Instant, runs across all games.
// 2. Phase classification — move count + real material count.
// 3. Mistake detection — sequential real Stockfish evaluation before/after
//    each move, flagging genuine eval swings. Slow, so it only runs on one
//    game at a time.

import React, { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { CAGE_MOVES } from './data/repertoire';
import { useChessGames, type ChessComGame } from './data/chessGameStore';
import { useStockfish } from './useStockfish';
import type { Theme } from './App';

const USERNAME = 'TopherBettis';
const MAX_PLIES_ANALYZED = 60;
const MISTAKE_THRESHOLD_CP = 150;

type DoctrineResult = { deviatedAtMove: number | null; expectedMove: string | null; actualMove: string | null };
type GamePhase = 'Opening' | 'Middlegame' | 'Endgame';
type Mistake = { moveNumber: number; mover: 'White' | 'Black'; san: string; phase: GamePhase; evalSwing: number };

const clean = (san: string) => san.replace(/[+#]/g, '');

function checkDoctrine(sanMoves: string[]): DoctrineResult {
  const whiteMoves = sanMoves.filter((_, i) => i % 2 === 0);
  for (let i = 0; i < CAGE_MOVES.length; i++) {
    if (i >= whiteMoves.length) break;
    const actual = clean(whiteMoves[i]);
    const expected = CAGE_MOVES[i];
    if (actual !== expected) {
      return { deviatedAtMove: i + 1, expectedMove: expected, actualMove: actual };
    }
  }
  return { deviatedAtMove: null, expectedMove: null, actualMove: null };
}

function parseSanMoves(pgn: string): string[] | null {
  try {
    const parser = new Chess();
    parser.loadPgn(pgn);
    const history = parser.history();
    return history.length > 0 ? history : null;
  } catch {
    return null;
  }
}

const MATERIAL_VALUES: Record<string, number> = { n: 3, b: 3, r: 5, q: 9 };

function nonPawnMaterial(game: Chess): number {
  return game
    .board()
    .flat()
    .reduce((sum, piece) => sum + (piece ? MATERIAL_VALUES[piece.type] ?? 0 : 0), 0);
}

function classifyPhase(ply: number, game: Chess): GamePhase {
  if (ply < 18) return 'Opening'; // matches the cage's own "complete at move 9" doctrine
  return nonPawnMaterial(game) <= 12 ? 'Endgame' : 'Middlegame';
}

export function Autopsy({
  theme,
  pendingGame,
  onConsumedPendingGame,
}: {
  theme: Theme;
  pendingGame: ChessComGame | null;
  onConsumedPendingGame: () => void;
}) {
  const dark = theme === 'dark';
  const { games, isLoading, reload } = useChessGames();
  const { waitUntilReady, evaluatePosition } = useStockfish();

  const [pgnText, setPgnText] = useState('');
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [currentGameUrl, setCurrentGameUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [doctrineResult, setDoctrineResult] = useState<DoctrineResult | null>(null);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [phaseCounts, setPhaseCounts] = useState<Record<GamePhase, number>>({} as any);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [perspectiveLabel, setPerspectiveLabel] = useState<string | null>(null);

  const aggregate = useMemo(() => {
    const asWhite = games.filter((g) => g.playerSide === 'white' && g.pgn);
    let compliant = 0;
    const deviationsByMove: Record<number, number> = {};
    for (const g of asWhite) {
      const sanMoves = g.pgn ? parseSanMoves(g.pgn) : null;
      if (!sanMoves) continue;
      const result = checkDoctrine(sanMoves);
      if (result.deviatedAtMove === null) compliant++;
      else deviationsByMove[result.deviatedAtMove] = (deviationsByMove[result.deviatedAtMove] ?? 0) + 1;
    }
    return { gamesChecked: games.length, gamesAsWhite: asWhite.length, cageCompliantCount: compliant, deviationsByMove };
  }, [games]);

  const runAnalysis = async (pgn: string) => {
    setErrorMessage(null);
    setDoctrineResult(null);
    setMistakes([]);
    setPhaseCounts({} as any);

    const sanMoves = parseSanMoves(pgn);
    if (!sanMoves) {
      setErrorMessage("Couldn't parse that PGN — check it's a full game with move text.");
      return;
    }

    let white = 'White';
    let black = 'Black';
    const whiteMatch = pgn.match(/\[White "([^"]+)"\]/);
    const blackMatch = pgn.match(/\[Black "([^"]+)"\]/);
    if (whiteMatch) white = whiteMatch[1];
    if (blackMatch) black = blackMatch[1];

    if (white.toLowerCase() === USERNAME.toLowerCase()) {
      setPerspectiveLabel('You played White');
    } else if (black.toLowerCase() === USERNAME.toLowerCase()) {
      setPerspectiveLabel("You played Black (doctrine check is always White's cage, shown for reference)");
    } else {
      setPerspectiveLabel(`${white} vs ${black}`);
    }

    setDoctrineResult(checkDoctrine(sanMoves));

    setIsAnalyzing(true);
    setProgress(0);
    const ready = await waitUntilReady();
    if (!ready) {
      setErrorMessage("Engine didn't become ready in time.");
      setIsAnalyzing(false);
      return;
    }

    const game = new Chess();
    const counts: Record<GamePhase, number> = { Opening: 0, Middlegame: 0, Endgame: 0 };
    let previousEval: number | null = null;
    const found: Mistake[] = [];
    const pliesToAnalyze = Math.min(sanMoves.length, MAX_PLIES_ANALYZED);

    for (let i = 0; i < pliesToAnalyze; i++) {
      setProgress(i / pliesToAnalyze);
      const san = sanMoves[i];
      const phase = classifyPhase(i, game);
      counts[phase]++;

      try {
        game.move(san);
      } catch {
        continue;
      }

      const { evalCentipawns } = await evaluatePosition(game.fen(), 250);
      if (evalCentipawns == null) {
        previousEval = null;
        continue;
      }

      // UCI `score cp` from this stockfish.js build is treated as White's
      // perspective throughout — same assumption StockfishBridge.swift
      // makes against the identical WASM build.
      if (previousEval != null) {
        const moverWasWhite = i % 2 === 0;
        const delta = moverWasWhite ? evalCentipawns - previousEval : previousEval - evalCentipawns;
        if (delta <= -MISTAKE_THRESHOLD_CP) {
          found.push({ moveNumber: Math.floor(i / 2) + 1, mover: moverWasWhite ? 'White' : 'Black', san, phase, evalSwing: -delta });
        }
      }
      previousEval = evalCentipawns;
    }

    setMistakes(found);
    setPhaseCounts(counts);
    setProgress(1);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    if (!pendingGame) return;
    onConsumedPendingGame();
    setCurrentGameUrl(pendingGame.url);
    setPgnText(pendingGame.pgn ?? '');
    if (pendingGame.pgn) void runAnalysis(pendingGame.pgn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingGame]);

  const prescriptions = useMemo(() => {
    const result: string[] = [];
    if (doctrineResult && doctrineResult.deviatedAtMove !== null) {
      result.push(
        `Review the Opening Blueprint cage — you left the system at move ${doctrineResult.deviatedAtMove} (played ${doctrineResult.actualMove}, cage calls for ${doctrineResult.expectedMove}). Drill the Italian line in the Opening tab.`
      );
    }
    if ((phaseCounts.Middlegame ?? 0) > 0 && mistakes.some((m) => m.phase === 'Middlegame')) {
      result.push('Middlegame mistakes found — run the Strangler or Central Explosion scenarios in the Middlegame tab.');
    }
    if (mistakes.some((m) => m.phase === 'Endgame')) {
      result.push('Endgame conversion slipped — drill King+Pawn and King+Rook in the Endgame tab.');
    }
    if (result.length === 0 && doctrineResult?.deviatedAtMove === null) {
      result.push('Clean game — cage held and no flagged mistakes in the analyzed window. Keep going.');
    }
    return result;
  }, [doctrineResult, phaseCounts, mistakes]);

  const worstDeviation = Object.entries(aggregate.deviationsByMove).sort((a, b) => b[1] - a[1])[0];

  return (
    <section className="flex h-full w-full flex-col gap-4 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-black uppercase tracking-tight ${dark ? 'text-white' : 'text-zinc-950'}`}>Autopsy</h2>
        <button onClick={() => reload()} className={`rounded-md border px-3 py-1.5 text-xs font-bold uppercase ${dark ? 'border-white/20 text-white hover:bg-white/10' : 'border-black/20 text-black hover:bg-black/5'}`}>
          Refresh
        </button>
      </div>

      {aggregate.gamesAsWhite > 0 && (
        <div className={`rounded-xl border p-4 ${dark ? 'border-white/10 bg-white/[0.06]' : 'border-black/10 bg-black/5'}`}>
          <div className={`font-bold ${dark ? 'text-white' : 'text-zinc-950'}`}>Across Your Current Games</div>
          <div className={`text-sm ${dark ? 'text-white/80' : 'text-black/80'}`}>
            Cage held in {aggregate.cageCompliantCount} of {aggregate.gamesAsWhite} games played as White.
          </div>
          {worstDeviation && (
            <div className={`text-xs ${dark ? 'text-white/50' : 'text-black/50'}`}>
              Most common deviation point: move {worstDeviation[0]} ({worstDeviation[1]} game{worstDeviation[1] === 1 ? '' : 's'}).
            </div>
          )}
        </div>
      )}

      <div>
        <div className={`mb-2 text-xs font-bold uppercase tracking-wider ${dark ? 'text-white/50' : 'text-black/50'}`}>Recent Games</div>
        {isLoading && <div className={`text-sm ${dark ? 'text-white/60' : 'text-black/60'}`}>Loading…</div>}
        {!isLoading && games.length === 0 && <div className={`text-sm ${dark ? 'text-white/60' : 'text-black/60'}`}>No games found for this month yet.</div>}
        <div className="grid gap-1">
          {games.map((game) => {
            const isWhite = game.playerSide === 'white';
            const compliance = isWhite && game.pgn ? checkDoctrine(parseSanMoves(game.pgn) ?? []) : null;
            return (
              <button
                key={game.url}
                onClick={() => {
                  setCurrentGameUrl(game.url);
                  setPgnText(game.pgn ?? '');
                  if (game.pgn) void runAnalysis(game.pgn);
                }}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${dark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'}`}
              >
                <span className={dark ? 'text-white' : 'text-zinc-950'}>
                  vs {game.opponentUsername} <span className={dark ? 'text-white/40' : 'text-black/40'}>· {isWhite ? 'White' : 'Black'}</span>
                </span>
                <span className="flex items-center gap-2">
                  {compliance && (compliance.deviatedAtMove === null ? <span className="text-green-500">✓</span> : <span className="text-orange-500">⚠</span>)}
                  {currentGameUrl === game.url && isAnalyzing && <span className={dark ? 'text-white/40' : 'text-black/40'}>…</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={() => setShowManualPaste((s) => !s)} className={`self-start text-xs font-bold underline ${dark ? 'text-white/60' : 'text-black/50'}`}>
        {showManualPaste ? 'Hide manual paste' : 'Or paste a PGN manually'}
      </button>
      {showManualPaste && (
        <div className="flex flex-col gap-2">
          <p className={`text-xs ${dark ? 'text-white/50' : 'text-black/50'}`}>Paste a PGN from anywhere — not just your recent Chess.com games.</p>
          <textarea
            value={pgnText}
            onChange={(e) => setPgnText(e.target.value)}
            className={`h-32 rounded-md border p-2 font-mono text-xs ${dark ? 'border-white/20 bg-black/40 text-white' : 'border-black/20 bg-white text-black'}`}
          />
          <button
            onClick={() => {
              setCurrentGameUrl(null);
              void runAnalysis(pgnText);
            }}
            disabled={!pgnText || isAnalyzing}
            className={`self-start rounded-md border px-3 py-2 text-xs font-bold uppercase disabled:opacity-50 ${dark ? 'border-white/20 text-white hover:bg-white/10' : 'border-black/20 text-black hover:bg-black/5'}`}
          >
            {isAnalyzing ? 'Analyzing…' : 'Analyze Pasted Game'}
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div>
          <div className={`h-1 w-full rounded-full ${dark ? 'bg-white/10' : 'bg-black/10'}`}>
            <div className="h-1 rounded-full bg-blue-500" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className={`mt-1 text-xs ${dark ? 'text-white/40' : 'text-black/40'}`}>
            Running real Stockfish evaluation move-by-move — capped at 60 plies to keep this reasonable in-browser.
          </p>
        </div>
      )}

      {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      {perspectiveLabel && <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-zinc-950'}`}>{perspectiveLabel}</p>}

      {doctrineResult && (
        <div className={`rounded-xl border p-4 ${dark ? 'border-white/10 bg-white/[0.04]' : 'border-black/10 bg-black/5'}`}>
          <div className={`font-bold ${dark ? 'text-white' : 'text-zinc-950'}`}>Gentleman's Assassin Doctrine</div>
          {doctrineResult.deviatedAtMove === null ? (
            <div className="text-green-500">✓ Cage held — no deviation in the first 9 moves.</div>
          ) : (
            <div className="text-orange-500">
              ⚠ Deviated at move {doctrineResult.deviatedAtMove}: played {doctrineResult.actualMove}, cage calls for {doctrineResult.expectedMove}.
            </div>
          )}
        </div>
      )}

      {Object.keys(phaseCounts).length > 0 && (
        <div className={`rounded-xl border p-4 ${dark ? 'border-white/10 bg-white/[0.04]' : 'border-black/10 bg-black/5'}`}>
          <div className={`font-bold ${dark ? 'text-white' : 'text-zinc-950'}`}>Plies Analyzed by Phase</div>
          {(['Opening', 'Middlegame', 'Endgame'] as GamePhase[]).map((phase) => (
            <div key={phase} className={`text-xs ${dark ? 'text-white/70' : 'text-black/70'}`}>
              {phase}: {phaseCounts[phase] ?? 0}
            </div>
          ))}
        </div>
      )}

      {mistakes.length > 0 && (
        <div className={`rounded-xl border p-4 ${dark ? 'border-white/10 bg-white/[0.04]' : 'border-black/10 bg-black/5'}`}>
          <div className={`mb-2 font-bold ${dark ? 'text-white' : 'text-zinc-950'}`}>Mistakes Found (Stockfish-verified)</div>
          {mistakes.map((m, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className={`font-mono ${dark ? 'text-white/80' : 'text-black/80'}`}>
                {m.moveNumber}. {m.mover} {m.san}
              </span>
              <span className={dark ? 'text-white/40' : 'text-black/40'}>
                {m.phase} · -{m.evalSwing}cp
              </span>
            </div>
          ))}
        </div>
      )}

      {prescriptions.length > 0 && !isAnalyzing && doctrineResult && (
        <div className={`rounded-xl border p-4 ${dark ? 'border-white/10 bg-white/10' : 'border-black/10 bg-black/10'}`}>
          <div className={`mb-2 font-bold ${dark ? 'text-white' : 'text-zinc-950'}`}>Drill Prescription</div>
          {prescriptions.map((p, i) => (
            <p key={i} className={`text-sm ${dark ? 'text-white/80' : 'text-black/80'}`}>
              › {p}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
