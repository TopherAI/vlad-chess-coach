// src/EndgameDojo.tsx
// CHESSai — Endgame Dojo. Categories unlock progressively (matching the
// native EndgameView.swift). Drilling means playing the real position out
// against real Stockfish at a short think time — Stockfish plays Black
// (the side you're converting against) so "win" is a genuine
// game.isGameOver() checkmate, not a scripted outcome. Ported from
// EndgameView.swift / EndgameDrillViewModel.

import React, { useCallback, useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { BrainCircuit, Lock, RotateCcw } from 'lucide-react';
import { SafeChessboard, type Theme } from './App';
import { endgameCategories, type EndgameCategoryProgress } from './data/endgameCategories';
import { useStockfish } from './useStockfish';
import { askCoach } from './gemini';

const STORAGE_KEY = 'chessai_endgame_drills'; // must match App.tsx's STORAGE_KEYS.ENDGAME_DRILLS

type ProgressMap = Record<string, EndgameCategoryProgress>;

function loadProgress(): ProgressMap {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: ProgressMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/// Applies a UCI move string ("e2e4", "e7e8q") to a chess.js game.
function applyUciMove(game: Chess, uci: string): boolean {
  if (!uci || uci.length < 4) return false;
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  try {
    const move = game.move({ from, to, promotion });
    return move !== null;
  } catch {
    return false;
  }
}

export function EndgameDojo({ theme }: { theme: Theme }) {
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const isUnlocked = useCallback(
    (categoryId: string) => {
      const category = endgameCategories.find((c) => c.id === categoryId)!;
      if (!category.unlockAfterId) return true;
      const required = progress[category.unlockAfterId]?.perfectSessions ?? 0;
      return required >= category.unlockAfterCount;
    },
    [progress]
  );

  if (activeCategoryId) {
    const category = endgameCategories.find((c) => c.id === activeCategoryId)!;
    return (
      <EndgameDrill
        theme={theme}
        category={category}
        progress={progress[category.id] ?? { attempts: 0, perfectSessions: 0 }}
        onBack={() => setActiveCategoryId(null)}
        onProgressUpdate={(updated) => {
          setProgress((prev) => {
            const next = { ...prev, [category.id]: updated };
            saveProgress(next);
            return next;
          });
        }}
      />
    );
  }

  return (
    <section className="flex h-full w-full flex-col overflow-hidden p-6">
      <h2 className={`mb-4 text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
        Endgame Dojo
      </h2>
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid gap-3">
          {[...endgameCategories].sort((a, b) => a.priority - b.priority).map((category) => {
            const unlocked = isUnlocked(category.id);
            const catProgress = progress[category.id] ?? { attempts: 0, perfectSessions: 0 };
            const requiredTitle = endgameCategories.find((c) => c.id === category.unlockAfterId)?.title ?? '';
            return (
              <button
                key={category.id}
                disabled={!unlocked}
                onClick={() => unlocked && setActiveCategoryId(category.id)}
                className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                  unlocked
                    ? theme === 'dark'
                      ? 'border-white/10 bg-white/[0.06] hover:bg-white/10'
                      : 'border-black/10 bg-white/80 hover:bg-black/5'
                    : 'cursor-not-allowed border-white/5 bg-black/10 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {unlocked ? (
                    <span className="text-lg">🏁</span>
                  ) : (
                    <Lock className={`h-4 w-4 ${theme === 'dark' ? 'text-white/50' : 'text-black/40'}`} />
                  )}
                  <div>
                    <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>{category.title}</div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                      {unlocked ? category.desc : `Unlocks after ${category.unlockAfterCount} perfect ${requiredTitle} sessions`}
                    </div>
                  </div>
                </div>
                {unlocked && (
                  <span className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
                    {catProgress.perfectSessions}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function EndgameDrill({
  theme,
  category,
  progress,
  onBack,
  onProgressUpdate,
}: {
  theme: Theme;
  category: (typeof endgameCategories)[number];
  progress: EndgameCategoryProgress;
  onBack: () => void;
  onProgressUpdate: (p: EndgameCategoryProgress) => void;
}) {
  const [game, setGame] = useState(() => new Chess(category.startFen));
  const [status, setStatus] = useState<'playing' | 'completed' | 'stalled'>('playing');
  const [showHint, setShowHint] = useState(false);
  const [magnusReply, setMagnusReply] = useState<string | null>(null);
  const [isAskingMagnus, setIsAskingMagnus] = useState(false);
  const { isReady, evaluatePosition } = useStockfish();

  // Tracks the current position synchronously (unlike `game` state, which
  // only updates on next render) so a stale Stockfish reply arriving after
  // a Restart can detect the position moved on and discard itself instead
  // of clobbering the fresh board.
  const gameRef = React.useRef(game);
  const updateGame = useCallback((g: Chess) => {
    gameRef.current = g;
    setGame(g);
  }, []);

  const checkGameOver = useCallback((g: Chess): 'playing' | 'completed' | 'stalled' => {
    if (g.isCheckmate()) return 'completed';
    if (g.isStalemate() || g.isDraw()) return 'stalled';
    return 'playing';
  }, []);

  const maybePlayOpponent = useCallback(
    async (g: Chess) => {
      const outcome = checkGameOver(g);
      if (outcome !== 'playing' || g.turn() !== 'b' || !isReady) {
        if (outcome !== 'playing') setStatus(outcome);
        return;
      }
      const fenAtRequest = g.fen();
      const { bestMove } = await evaluatePosition(fenAtRequest, 400);
      if (gameRef.current.fen() !== fenAtRequest || !bestMove) return; // position moved on (e.g. Restart) or no move found
      const next = new Chess(fenAtRequest);
      if (applyUciMove(next, bestMove)) {
        updateGame(next);
        setStatus(checkGameOver(next));
      }
    },
    [checkGameOver, evaluatePosition, isReady, updateGame]
  );

  const start = useCallback(() => {
    const fresh = new Chess(category.startFen);
    updateGame(fresh);
    setStatus('playing');
    setShowHint(false);
    setMagnusReply(null);
    void maybePlayOpponent(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.startFen]);

  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id, isReady]);

  useEffect(() => {
    if (status === 'completed') {
      onProgressUpdate({ attempts: progress.attempts + 1, perfectSessions: progress.perfectSessions + 1 });
    } else if (status === 'stalled') {
      onProgressUpdate({ attempts: progress.attempts + 1, perfectSessions: progress.perfectSessions });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    if (status !== 'playing') return false;
    const gameCopy = new Chess(game.fen());
    let move;
    try {
      move = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: piece[1]?.toLowerCase() ?? 'q' });
    } catch {
      return false;
    }
    if (!move) return false;
    updateGame(gameCopy);
    const outcome = checkGameOver(gameCopy);
    if (outcome !== 'playing') {
      setStatus(outcome);
    } else {
      void maybePlayOpponent(gameCopy);
    }
    return true;
  };

  const askMagnus = async () => {
    setIsAskingMagnus(true);
    const reply = await askCoach('Magnus Carlsen, dry and precise', category.magnusPrompt);
    setMagnusReply(reply);
    setIsAskingMagnus(false);
  };

  const dark = theme === 'dark';

  return (
    <section className="flex h-full w-full flex-col items-center gap-3 overflow-y-auto p-6">
      <button onClick={onBack} className={`self-start text-xs font-bold uppercase tracking-wider ${dark ? 'text-white/60 hover:text-white' : 'text-black/50 hover:text-black'}`}>
        ← Endgame Dojo
      </button>
      <div className="text-center">
        <div className={`text-xl font-black ${dark ? 'text-white' : 'text-zinc-950'}`}>{category.title}</div>
        <div className={`text-sm ${dark ? 'text-white/60' : 'text-black/60'}`}>{category.desc}</div>
        <div className={`text-xs ${dark ? 'text-white/40' : 'text-black/40'}`}>
          {progress.perfectSessions} perfect · {progress.attempts} attempts
        </div>
      </div>

      <div className={`w-full max-w-[min(100%,60vh)] aspect-square overflow-hidden rounded-md border ${dark ? 'border-white/20' : 'border-black/20'}`}>
        <SafeChessboard position={game.fen()} onPieceDrop={onDrop} areArrowsAllowed={false} />
      </div>

      <div className="flex gap-2">
        <button onClick={start} className={`rounded-md border px-3 py-2 text-xs font-bold uppercase ${dark ? 'border-white/20 text-white hover:bg-white/10' : 'border-black/20 text-black hover:bg-black/5'}`}>
          <RotateCcw className="mr-1 inline h-3 w-3" /> Restart
        </button>
        <button onClick={() => setShowHint((s) => !s)} className={`rounded-md border px-3 py-2 text-xs font-bold uppercase ${dark ? 'border-white/20 text-white hover:bg-white/10' : 'border-black/20 text-black hover:bg-black/5'}`}>
          {showHint ? 'Hide Hint' : 'Show Hint'}
        </button>
        <button
          onClick={askMagnus}
          disabled={isAskingMagnus}
          className={`rounded-md border px-3 py-2 text-xs font-bold uppercase disabled:opacity-50 ${dark ? 'border-white/20 text-blue-400 hover:bg-white/10' : 'border-black/20 text-blue-600 hover:bg-black/5'}`}
        >
          <BrainCircuit className="mr-1 inline h-3 w-3" /> {isAskingMagnus ? 'Magnus…' : 'Ask Magnus'}
        </button>
      </div>

      {showHint && <p className={`max-w-lg text-center text-sm ${dark ? 'text-white/70' : 'text-black/70'}`}>{category.hint}</p>}
      {magnusReply && <p className="max-w-lg text-center text-sm font-semibold text-blue-400">{magnusReply}</p>}

      {status === 'completed' && <p className="font-bold text-green-500">Converted! Checkmate delivered. +1 mastery.</p>}
      {status === 'stalled' && <p className="font-bold text-orange-500">Position stalled or drawn — try again with a cleaner technique.</p>}
    </section>
  );
}
