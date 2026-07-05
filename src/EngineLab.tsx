// src/EngineLab.tsx
// CHESSai — Caruana Lab: pulls real recent games from Chess.com, replays
// them, and runs real Stockfish analysis per position. LCZero/Maia/Syzygy
// are honestly labeled as not built — no fabricated engine output. Ported
// from EngineLabView.swift.

import React, { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { SafeChessboard, type Theme } from './App';
import { useChessGames, type ChessComGame } from './data/chessGameStore';
import { useStockfish } from './useStockfish';

const USERNAME = 'TopherBettis';

function resultLabel(result: string): string {
  if (result === 'win') return 'Won';
  if (['checkmated', 'resigned', 'timeout', 'abandoned'].includes(result)) return 'Lost';
  if (['agreed', 'repetition', 'stalemate', 'insufficient', '50move', 'timevsinsufficient'].includes(result)) return 'Draw';
  return result;
}

export function EngineLab({ theme, onAutopsyRequested }: { theme: Theme; onAutopsyRequested: (game: ChessComGame) => void }) {
  const { games, isLoading, errorMessage, reload } = useChessGames();
  const [activeGame, setActiveGame] = useState<ChessComGame | null>(null);
  const dark = theme === 'dark';

  if (activeGame) {
    return <GameReview theme={theme} game={activeGame} onBack={() => setActiveGame(null)} onAutopsyRequested={onAutopsyRequested} />;
  }

  return (
    <section className="flex h-full w-full flex-col gap-4 overflow-hidden p-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-black uppercase tracking-tight ${dark ? 'text-white' : 'text-zinc-950'}`}>Engine Lab</h2>
        <button
          onClick={() => reload()}
          className={`rounded-md border px-3 py-1.5 text-xs font-bold uppercase ${dark ? 'border-white/20 text-white hover:bg-white/10' : 'border-black/20 text-black hover:bg-black/5'}`}
        >
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className={`mb-2 text-xs font-bold uppercase tracking-wider ${dark ? 'text-white/50' : 'text-black/50'}`}>
          Recent Chess.com Games — {USERNAME}
        </div>
        {isLoading && <div className={`text-sm ${dark ? 'text-white/60' : 'text-black/60'}`}>Loading…</div>}
        {errorMessage && <div className="text-sm text-red-500">{errorMessage}</div>}
        {!isLoading && !errorMessage && games.length === 0 && (
          <div className={`text-sm ${dark ? 'text-white/60' : 'text-black/60'}`}>No games found for this month yet.</div>
        )}
        <div className="grid gap-2">
          {games.map((game) => {
            const isWhite = game.playerSide === 'white';
            return (
              <button
                key={game.url}
                onClick={() => setActiveGame(game)}
                className={`flex items-center justify-between rounded-xl border p-3 text-left ${dark ? 'border-white/10 bg-white/[0.06] hover:bg-white/10' : 'border-black/10 bg-white/80 hover:bg-black/5'}`}
              >
                <div>
                  <div className={`text-sm font-bold ${dark ? 'text-white' : 'text-zinc-950'}`}>vs {game.opponentUsername}</div>
                  <div className={`text-xs ${dark ? 'text-white/50' : 'text-black/50'}`}>
                    {isWhite ? 'White' : 'Black'} · {game.timeClass ?? ''} · {resultLabel(game.result)}
                  </div>
                </div>
                {game.playerRating != null && (
                  <span className={`text-xs font-black ${dark ? 'text-white' : 'text-zinc-950'}`}>{game.playerRating}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className={`mt-6 mb-2 text-xs font-bold uppercase tracking-wider ${dark ? 'text-white/50' : 'text-black/50'}`}>Engine Status</div>
        <div className="grid gap-1 text-sm">
          <div className="text-green-500">✓ Stockfish — tactical truth</div>
          <div className={dark ? 'text-white/40' : 'text-black/40'}>○ LCZero — strategic truth (not built)</div>
          <div className={dark ? 'text-white/40' : 'text-black/40'}>○ Maia — human training truth (not built)</div>
          <div className={dark ? 'text-white/40' : 'text-black/40'}>○ Syzygy — endgame truth (not built)</div>
        </div>
      </div>
    </section>
  );
}

function GameReview({
  theme,
  game,
  onBack,
  onAutopsyRequested,
}: {
  theme: Theme;
  game: ChessComGame;
  onBack: () => void;
  onAutopsyRequested: (game: ChessComGame) => void;
}) {
  const dark = theme === 'dark';
  const { isReady, analyze, bestMove, evaluationCentipawns, isThinking } = useStockfish();

  const sanMoves = useMemo(() => {
    if (!game.pgn) return [];
    try {
      const parser = new Chess();
      parser.loadPgn(game.pgn);
      return parser.history();
    } catch {
      return [];
    }
  }, [game.pgn]);

  const [moveIndex, setMoveIndex] = useState(sanMoves.length);

  const displayFen = useMemo(() => {
    const replay = new Chess();
    for (let i = 0; i < Math.min(moveIndex, sanMoves.length); i++) {
      try {
        replay.move(sanMoves[i]);
      } catch {
        break;
      }
    }
    return replay.fen();
  }, [moveIndex, sanMoves]);

  return (
    <section className="flex h-full w-full flex-col items-center gap-3 overflow-y-auto p-6">
      <button onClick={onBack} className={`self-start text-xs font-bold uppercase tracking-wider ${dark ? 'text-white/60 hover:text-white' : 'text-black/50 hover:text-black'}`}>
        ← Engine Lab
      </button>
      <div className={`text-sm font-bold ${dark ? 'text-white' : 'text-zinc-950'}`}>vs {game.opponentUsername}</div>

      <div className={`w-full max-w-[min(100%,60vh)] aspect-square overflow-hidden rounded-md border ${dark ? 'border-white/20' : 'border-black/20'}`}>
        <SafeChessboard position={displayFen} arePiecesDraggable={false} areArrowsAllowed={false} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setMoveIndex((i) => Math.max(0, i - 1))} className={`rounded-md border px-3 py-1.5 text-xs font-bold ${dark ? 'border-white/20 text-white' : 'border-black/20 text-black'}`}>
          ◀
        </button>
        <span className={`font-mono text-xs ${dark ? 'text-white/60' : 'text-black/60'}`}>
          {moveIndex}/{sanMoves.length}
        </span>
        <button
          onClick={() => setMoveIndex((i) => Math.min(sanMoves.length, i + 1))}
          className={`rounded-md border px-3 py-1.5 text-xs font-bold ${dark ? 'border-white/20 text-white' : 'border-black/20 text-black'}`}
        >
          ▶
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => analyze(displayFen)}
          disabled={!isReady || isThinking}
          className={`rounded-md border px-3 py-2 text-xs font-bold uppercase disabled:opacity-50 ${dark ? 'border-white/20 text-white hover:bg-white/10' : 'border-black/20 text-black hover:bg-black/5'}`}
        >
          {isThinking ? 'Analyzing…' : 'Analyze this position'}
        </button>
        <button
          onClick={() => onAutopsyRequested(game)}
          className={`rounded-md border px-3 py-2 text-xs font-bold uppercase ${dark ? 'border-white/20 text-white hover:bg-white/10' : 'border-black/20 text-black hover:bg-black/5'}`}
        >
          Autopsy This Game
        </button>
      </div>

      {!isReady && <div className={`text-xs ${dark ? 'text-white/50' : 'text-black/50'}`}>Engine loading…</div>}
      {bestMove && <div className={`text-sm font-bold ${dark ? 'text-white' : 'text-zinc-950'}`}>Stockfish suggests: {bestMove}</div>}
      {evaluationCentipawns != null && (
        <div className={`text-xs ${dark ? 'text-white/50' : 'text-black/50'}`}>
          Evaluation: {evaluationCentipawns > 0 ? '+' : ''}
          {(evaluationCentipawns / 100).toFixed(2)}
        </div>
      )}
    </section>
  );
}
