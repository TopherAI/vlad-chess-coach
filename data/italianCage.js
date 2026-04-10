// src/data/italianCage.js
// The Italian Cage — Complete Knowledge Base for VLAD
// Source: Gentleman’s Assassin Super Plan v3.0 + NotebookLM synthesis + Drill Sergeant FENs
// Imported by all coach personas (Opening Lab, Drill Sergeant, Game Autopsy)

export const CAGE_PHILOSOPHY = {
  name: "Gentleman's Assassin / Italian Cage (Giuoco Pianissimo)",
  coreMantra: "Construct the Cage Quietly. Execute Violently.",
  coiledSpring: {
    setup: "Patiently maintain tension with the unbreakable c3-d3 pawn structure.",
    deception: "Feign a quiet positional game to induce opponent over-extension.",
    strike: "Trigger a violent central (d4) or flank (f5 / b4 / Bxh6) explosion the moment Black commits.",
  },
  engineEval: "+0.10 to +0.25 at optimal play. The position looks passive but is a coiled spring.",
  architectureOfInevitability: [
    "1. Build the Cage First — a4 (Perimeter), O-O (Vault), h3 (Shield), Re1 (Power). Prophylaxis before aggression.",
    "2. Run the 4-Step Master Mental Loop before every move after move 9.",
    "3. Execute Without Hesitation — Wait for the trigger (Strangler Knight on f5, Queenside Crush b4, Toxic Bait, High-Velocity Sacks, or Central Explosion d4).",
  ],
};

// ─── RESOLVED CANONICAL MOVE ORDERS (AI Council v3.0) ───────────────────────

export const CAGE_MOVE_ORDER = {
  phase1_foundation: [
    { move: "1.e4 e5 2.Nf3 Nc6 3.Bc4", purpose: "Claim center, develop MVP Bishop on a2-g8 diagonal" },
    // Giuoco Pianissimo (Line 1)
    { move: "3...Bc5 4
