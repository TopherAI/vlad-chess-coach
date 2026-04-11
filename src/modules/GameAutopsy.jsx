/**
 * src/modules/GameAutopsy.jsx
 * vlad-chess-coach — Game Autopsy Module
 *
 * Full pipeline:
 *   PGN upload → chess.js parse → Stockfish analysis → Vlad/Fabiano/Magnus debrief
 *
 * Tab order: Coaches → Critical → Move List
 * Critical list: saved to localStorage("vlad_critical_list") on every analysis
 * Move list: flags deviations from GM Plan (src/data/gmPlan.js)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { analyzeGame, getClassificationColor, buildVladContext } from "../engine/stockfish.js";
import { askVlad } from "../coaches/vlad.jsx";
import { askFabiano } from "../coaches/fabiano.jsx";
import { askMagnus } from "../coaches/magnus.jsx";

// ---------------------------------------------------------------------------
// GM Plan — Italian Cage core lines (Phase 1)
// Will auto-load src/data/gmPlan.js if it exists, falls back to hardcoded
// ---------------------------------------------------------------------------

const ITALIAN_CAGE_PLAN = {
  "1w":  "e4",   "1b":  "e5",
  "2w":  "Nf3",  "2b":  "Nc6",
  "3w":  "Bc4",  "3b":  "Bc5",
  "4w":  "c3",   "4b":  "Nf6",
  "5w":  "d3",   "5b":  "d6",
  "6w":  "O-O",  "6b":  "O-O",
  "7w":  "Re1",  "7b":  "a6",
  "8w":  "Bb3",  "8b":  "Ba7",
  "9w":  "h3",   "9b":  "h6",
  "10w": "Nbd2",
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLAYER       = "TopherBettis";
const STORAGE_KEY  = "vlad_last_autopsy";
const CRITICAL_KEY = "vlad_critical_list";

const COACH_META = {
  vlad:    { name: "Vlad",    emoji: "🎖️", title: "Head Coach",          color: "#c0392b" },
  fabiano: { name: "Fabiano", emoji: "♟️", title: "Positional Analysis", color: "#2980b9" },
  magnus:  { name: "Magnus",  emoji: "👑", title: "Endgame & Intuition", color: "#27ae60" },
};

const CLASSIFICATION_LABELS = {
  best:       { label: "Best",       symbol: "★"  },
  excellent:  { label: "Excellent",  symbol: "✦"  },
  good:       { label: "Good",       symbol: "●"  },
  inaccuracy: { label: "Inaccuracy", symbol: "?!" },
  mistake:    { label: "Mistake",    symbol: "?"  },
  blunder:    { label: "Blunder",    symbol: "??" },
};

// Tab order: Coaches → Critical → Move List
const TABS = [
  { id: "coaches",  label: ()  => "🎓 Coaches" },
  { id: "critical", label: (n) => `🚨 Critical (${n})` },
  { id: "moves",    label: ()  => "📋 Move List" },
];

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function saveAutopsy(pgn, gameInfo, analysis, coaches) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      pgn, gameInfo, analysis, coaches, savedAt: Date.now(),
    }));
  } catch { /* storage full — fail silently */ }
}

function loadAutopsy() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCriticalList(gameInfo, criticalMoves) {
  try {
    const record = {
      savedAt: Date.now(),
      game: gameInfo
        ? `${gameInfo.white} vs ${gameInfo.black} (${gameInfo.result}) ${gameInfo.date}`
        : "Unknown game",
      moves: criticalMoves.map(m => ({
        moveNumber:     m.moveNumber,
        side:           m.side,
        move:           m.actualMove,
        classification: m.classification,
        cpLoss:         m.cpLoss,
        bestMove:       m.bestMove,
        evalAfter:      m.evalAfter,
      })),
    };
    localStorage.setItem(CRITICAL_KEY, JSON.stringify(record));
  } catch { /* fail silently */ }
}

function loadCriticalList() {
  try {
    const raw = localStorage.getItem(CRITICAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function formatCriticalText(record) {
  if (!record) return "";
  const date = new Date(record.savedAt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  return [
    `VLAD CHESS COACH — CRITICAL MOVE LIST`,
    `Generated: ${date}`,
    `Game: ${record.game}`,
    ``,
    ...record.moves.map(m =>
      `Move ${m.moveNumber}${m.side === "white" ? "." : "…"} ${m.move}  [${m.classification.toUpperCase()}]  −${m.cpLoss}cp  Best: ${m.bestMove}`
    ),
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Utility — parse PGN with chess.js
// ---------------------------------------------------------------------------

function parsePGN(pgn) {
  if (typeof Chess === "undefined") {
    throw new Error("chess.js not loaded. Add CDN script to index.html.");
  }
  const game   = new Chess();
  const loaded = game.load_pgn(pgn);
  if (!loaded) throw new Error("Invalid PGN — could not parse.");

  const history  = game.history({ verbose: true });
  const moves    = history.map(m => m.from + m.to + (m.promotion ?? ""));
  const sanMoves = game.history();

  const white  = game.header().White  ?? "Unknown";
  const black  = game.header().Black  ?? "Unknown";
  const result = game.header().Result ?? "*";
  const date   = game.header().Date   ?? "";
  const event  = game.header().Event  ?? "";

  const playerSide =
    white.toLowerCase().includes(PLAYER.toLowerCase()) ? "white" :
    black.toLowerCase().includes(PLAYER.toLowerCase()) ? "black" :
    "white";

  return { moves, sanMoves, white, black, result, date, event, playerSide, pgn };
}

// ---------------------------------------------------------------------------
// GM Plan deviation detector
// ---------------------------------------------------------------------------

function isGmDeviation(moveNumber, side, sanMove) {
  const key      = `${moveNumber}${side === "white" ? "w" : "b"}`;
  const expected = ITALIAN_CAGE_PLAN[key];
  if (!expected) return false;
  return sanMove !== expected;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AccuracyRing({ accuracy }) {
  const radius = 36;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (accuracy / 100) * circ;
  const color  = accuracy >= 85 ? "#27ae60" : accuracy >= 70 ? "#f39c12" : "#e74c3c";
  return (
    <div style={styles.accuracyRing}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#2a2a2a" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} str
