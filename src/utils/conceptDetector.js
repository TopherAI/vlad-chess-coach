/**
 * src/utils/conceptDetector.js
 * vlad-chess-coach — Concept Detector
 *
 * Bridges GameAutopsy debrief text → VideoLibrary concept triggers.
 * Also maps concepts to weakness fingerprint tags for coachMemory.js.
 *
 * Usage:
 *   import { detectFromDebrief, mapToWeakness } from './utils/conceptDetector.js';
 *
 *   const debrief = "You blundered on move 9 — the speed trap struck again...";
 *   const concepts = detectFromDebrief(debrief);
 *   // → ["move9-trap", "4-step-loop"]
 */

import { CONCEPT_MAP } from "../modules/VideoLibrary.jsx";

// ---------------------------------------------------------------------------
// Weakness fingerprint tags (mirrors VLAD.md weakness list)
// ---------------------------------------------------------------------------

export const WEAKNESS_TAGS = {
  "move9-trap":           { id: "w1", label: "Move 9 Speed Trap",       severity: "critical" },
  "panic-simplification": { id: "w2", label: "Panic Simplification",    severity: "high"     },
  "queen-sortie":         { id: "w3", label: "Queen Sortie Response",   severity: "high"     },
  "forcing-moves":        { id: "w4", label: "Missing Forcing Moves",   severity: "medium"   },
};

// Concept → weakness mapping
const CONCEPT_TO_WEAKNESS = {
  "move9-trap":           "w1",
  "panic-simplification": "w2",
  "queen-sortie":         "w3",
  "forcing-moves":        "w4",
};

// ---------------------------------------------------------------------------
// Core detection
// ---------------------------------------------------------------------------

/**
 * Detect concept slugs from a debrief/coaching text string.
 * Returns slugs sorted by priority (1 = most critical).
 *
 * @param {string} text  - Vlad/Fabiano/Magnus debrief output
 * @returns {string[]}   - Array of concept slugs
 */
export function detectFromDebrief(text) {
  if (!text || typeof text !== "string") return [];
  const lower = text.toLowerCase();
  const found = new Map();

  for (const [keyword, concept] of Object.entries(CONCEPT_MAP)) {
    if (lower.includes(keyword)) {
      const existing = found.get(concept.slug);
      if (!existing || existing.priority > concept.priority) {
        found.set(concept.slug, concept);
      }
    }
  }

  return Array.from(found.entries())
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([slug]) => slug);
}

/**
 * Detect concepts from all 3 coach outputs combined.
 * Deduplicates and prioritizes across Vlad + Fabiano + Magnus.
 *
 * @param {{ vlad: string, fabiano: string, magnus: string }} coachOutputs
 * @returns {string[]}
 */
export function detectFromAllCoaches(coachOutputs) {
  const combined = [
    coachOutputs.vlad    ?? "",
    coachOutputs.fabiano ?? "",
    coachOutputs.magnus  ?? "",
  ].join(" ");
  return detectFromDebrief(combined);
}

/**
 * Map detected concept slugs to weakness fingerprint IDs.
 * Used to update coachMemory.js after each game.
 *
 * @param {string[]} slugs
 * @returns {string[]} weakness IDs (e.g. ["w1", "w3"])
 */
export function mapToWeaknesses(slugs) {
  return [...new Set(
    slugs
      .map(slug => CONCEPT_TO_WEAKNESS[slug])
      .filter(Boolean)
  )];
}

/**
 * Build a full trigger payload for VideoLibrary from a game debrief.
 * Includes concepts, weakness tags, and priority ordering.
 *
 * @param {{ vlad: string, fabiano: string, magnus: string }} coachOutputs
 * @returns {TriggerPayload}
 */
export function buildTriggerPayload(coachOutputs) {
  const concepts   = detectFromAllCoaches(coachOutputs);
  const weaknesses = mapToWeaknesses(concepts);

  return {
    concepts,      // slugs for VideoLibrary
    weaknesses,    // IDs for coachMemory
    topConcept:    concepts[0] ?? null,
    hasWeakness:   weaknesses.length > 0,
    timestamp:     new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Move-level concept detection
// ---------------------------------------------------------------------------

/**
 * Detect concepts from a single move classification event.
 * Called per-move during GameAutopsy analysis.
 *
 * @param {{ classification: string, moveNumber: number, cpLoss: number }} move
 * @returns {string[]} concept slugs
 */
export function detectFromMove(move) {
  const slugs = [];

  // Move 9 speed trap
  if (
    move.moveNumber >= 8 &&
    move.moveNumber <= 12 &&
    ["blunder", "mistake"].includes(move.classification)
  ) {
    slugs.push("move9-trap");
  }

  // Missing forcing moves (massive blunder in winning position)
  if (move.cpLoss > 200 && move.classification === "blunder") {
    slugs.push("forcing-moves");
  }

  // General blunder → 4-step loop reminder
  if (move.classification === "blunder") {
    slugs.push("4-step-loop");
  }

  return [...new Set(slugs)];
}

export default {
  detectFromDebrief,
  detectFromAllCoaches,
  mapToWeaknesses,
  buildTriggerPayload,
  detectFromMove,
};
