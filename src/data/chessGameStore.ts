// src/data/chessGameStore.ts
// CHESSai — single shared fetch of this month's Chess.com games, used by
// both Engine Lab and Autopsy so they show the same real games instead of
// each independently hitting the API. Mirrors ChessGameStore.swift's
// shared-singleton pattern on iOS, in plain-hook form (no Context provider
// exists in this app yet, so a module-level cache + subscriber set is the
// smallest addition that gives both panels the same data).

import { useCallback, useEffect, useState } from 'react';
import { getCurrentMonthGames } from '../api/chesscom';

export type ChessComGame = {
  uuid?: string;
  url: string;
  pgn: string | null;
  fen: string | null;
  timeControl: string | null;
  timeClass: string | null;
  rated: boolean;
  endTime: string | null;
  playerSide: 'white' | 'black';
  playerRating: number | null;
  opponentRating: number | null;
  opponentUsername: string;
  result: string;
  won: boolean;
  drew: boolean;
  lost: boolean;
};

let cachedGames: ChessComGame[] | null = null;
let cachedError: string | null = null;
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

async function loadGames(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      cachedGames = (await getCurrentMonthGames()) as ChessComGame[];
      cachedError = null;
    } catch (e: any) {
      cachedError = e?.message || 'Failed to load Chess.com games.';
    } finally {
      inFlight = null;
      notify();
    }
  })();
  return inFlight;
}

export function useChessGames() {
  const [, bump] = useState(0);

  useEffect(() => {
    const listener = () => bump((n) => n + 1);
    listeners.add(listener);
    if (cachedGames === null && cachedError === null && !inFlight) {
      loadGames();
    }
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const reload = useCallback(() => loadGames(), []);

  return {
    games: cachedGames ?? [],
    isLoading: cachedGames === null && cachedError === null,
    errorMessage: cachedError,
    reload,
  };
}
