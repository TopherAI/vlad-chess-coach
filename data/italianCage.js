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
    { move: "3...Bc5 4.c3 Nf6 5.d3 d6", purpose: "Cornerstone of the cage. Solid c3/d3 wall. Prepares future d4." },
    // Two Knights (Line 2)
    { move: "3...Nf6 4.d3", purpose: "Protects e4, stays consistent with Pianissimo cage (more solid than 4.c3 here)." },
    // Sicilian Bypass (Line 3)
    { move: "1.e4 c5 2.Nf3 Nc6/e6 3.Bc4", purpose: "Avoids early ...e6 blocking the diagonal. Italian-style hybrid." },
    // Petrov Refusal (Line 4)
    { move: "1.e4 e5 2.Nf3 Nf6 3.d3", purpose: "Steers into familiar Italian cage. Avoids drawish 3.Nxe5 or sharp 3.d4." },
  ],
  phase2_perimeter: [
    { move: "a4!", purpose: "THE PERIMETER MOVE. Creates permanent safe house on a2 for MVP Bishop. Clamps queenside. Non-negotiable before O-O in most lines." },
  ],
  phase3_vault: [
    { move: "O-O", purpose: "Secure the king only after perimeter (a4) is set." },
  ],
  phase4_shield: [
    { move: "h3!", purpose: "THE SHIELD. Mandatory before Nbd2 or Re1 to prevent ...Bg4 pin. h3 must precede knight tour." },
  ],
  phase5_power: [
    { move: "Re1", purpose: "Powers the e-file and supports e4. Prepares d4 explosion from absolute stability." },
  ],
  criticalRule: "Order is sacred: a4 (if needed) → O-O → h3 → Re1 → Nbd2 → Nf1. NEVER play Re1 or Nbd2 before h3.",
};

// ─── MOVE 10 DIAGNOSTIC CROSSROADS ───────────────────────────────────────────

export const MOVE_10_BRANCH = {
  instruction: "Use Node 1 of the 4-Step Loop (Opponent’s Intent). Read Black’s setup before choosing.",
  optionA: {
    move: "10.Ba2 (or Bb3)",
    alias: "The Fortress",
    trigger: "Black plays …Na5, …c5, or queenside expansion",
    objective: "Preserves MVP Bishop on the long diagonal. Dodges threats.",
    riskProfile: "Low / Solid",
  },
  optionB: {
    move: "10.Nbd2",
    alias: "The Strangler",
    trigger: "Black castles early or plays passively",
    objective: "Route knight: Nbd2 → Nf1 → Ng3 → Nf5 (the assassin outpost)",
    riskProfile: "High Tension / Lethal",
  },
};

// ─── DRILL SERGEANT FENs (10 Escalating Positions) ───────────────────────────

export const DRILL_SERGEANT_FENS = [
  {
    id: 1,
    phase: "Anchor (Giuoco Pianissimo)",
    fen: "r1bqr1k1/bpp2pp1/p1np1n1p/4p3/4P3/1BPP1N1P/PP1N1PP1/R1BQR1K1 w - - 1 11",
    goal: "Start Nd2-f1-g3-f5 without breaking the cage. MVP Bishop safe on a2.",
    coachNote: "Pure cage locked. Begin the knight tour.",
  },
  {
    id: 2,
    phase: "Anchor (Two Knights)",
    fen: "r1bq1rk1/pp2bppp/2np1n2/2p1p3/P3P3/2PP1N2/BP1N1PPP/R1BQR1K1 b - - 0 10",
    goal: "Queenside cramp with a4 achieved. Start knight journey.",
    coachNote: "Center stable. Navigate Nd2-f1-g3-f5 safely.",
  },
  {
    id: 3,
    phase: "Anchor (Petrov Refusal)",
    fen: "r1bqr1k1/1pp2pp1/2n2n1p/p1bpp3/P3P3/2PP1N1P/1P1NBPP1/R1BQR1K1 w - - 1 11",
    goal: "Pivot the knight into the cage setup.",
    coachNote: "You refused their drawish Petrov. Prove superiority.",
  },
  {
    id: 4,
    phase: "Early Pivot",
    fen: "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/P1B1P3/2PP1N2/1P1N1PPP/R1BQ1RK1 b - - 2 8",
    goal: "Visualize remaining steps: Re1, Nf1, Ng3, Nf5.",
    coachNote: "Nbd2 played early. Watch for central breaks.",
  },
  // Phase 2: Migration
  {
    id: 5,
    phase: "Queenside Cramp + Knight Ready",
    fen: "r1bq1rk1/1pp2ppp/p1np1n2/2b1p3/P1B1P3/2PP1N2/1P1N1PPP/R1BQ1RK1 w - - 0 1",
    goal: "Harass with b4 if possible, then continue knight route.",
    coachNote: "Black played ...a6. Distract then route.",
  },
  {
    id: 6,
    phase: "f1 Relay",
    fen: "r1bqr1k1/bpp2pp1/p1np1n1p/4p3/4P3/1BPP1N1P/PP3PP1/R1BQRNK1 w - - 0 12",
    goal: "Knight on f1. Cage intact. Spring coiled.",
    coachNote: "Looks passive — it is not.",
  },
  {
    id: 7,
    phase: "g3 Launchpad",
    fen: "r1bqr1k1/bpp2pp1/p1np1n1p/4p3/4P3/1BPP1NNP/PP3PP1/R1BQR1K1 w - - 0 13",
    goal: "One move from f5. Scan for ...d5 or ...g6.",
    coachNote: "Knight on g3. Prepare the infection.",
  },
  // Phase 3: Strangler Outpost
  {
    id: 8,
    phase: "f5 Infection (The Strangler)",
    fen: "r1bqr1k1/bpp2pp1/p1np1n1p/4pN2/4P3/1BPP1N1P/PP3PP1/R1BQR1K1 b - - 0 14",
    goal: "Knight landed on f5. Transition to Assassin Phase.",
    coachNote: "Parasitic infection planted. Kingside claustrophobic.",
  },
  {
    id: 9,
    phase: "Tactical Follow-Up",
    fen: "r1bq1rk1/ppp2p1p/2np1n2/2b1p1N1/P1B1P3/2PP4/1P3PPP/R1BQ1RK1 w - - 0 1",
    goal: "Exploit weakened kingside (...h6). Look for sacs.",
    coachNote: "Aggressive knight posted. Greek Gift or high-velocity ideas.",
  },
  {
    id: 10,
    phase: "Pianissimo Purge (Bxh6!)",
    fen: "r1bqr1k1/bpp2pp1/p1np1n1p/4pN2/4P3/1BPP3P/PP1Q1PP1/R1B1R1K1 w - - 0 15",
    goal: "Violently sacrifice Bxh6 with Nf5 + Qd2 aligned.",
    coachNote: "Climax of the 5-Tactic Arsenal. Shatter the shield.",
  },
];

// ─── THE 5-TACTIC ARSENAL (Unchanged but reinforced) ───────────────────────

export const FIVE_TACTIC_ARSENAL = { /* your original FIVE_TACTIC_ARSENAL object here — keep as-is */ };

// ─── PHASE 1 TRIAGE QUIZ (Direct from Super Plan) ───────────────────────────

export const PHASE1_TRIAGE_QUIZ = [
  { q: "When Black plays the Petrov (1.e4 e5 2.Nf3 Nf6), what is your mandated 3rd move?", a: "3.d3" },
  { q: "Against the Sicilian (1.e4 c5), what is the exact order of your 2nd and 3rd moves?", a: "2.Nf3 followed by 3.Bc4" },
  { q: "If Black plays the Two Knights (3...Nf6), what is your mandated 4th move?", a: "4.d3" },
  { q: "In the main Giuoco Pianissimo (3...Bc5), what is your 4th move?", a: "4.c3" },
  { q: "In the canonical Italian Box, what is your critical 6th move to neutralize ...Na5?", a: "6.a4" },
  { q: "Which must be played first: castling (O-O) or pushing the a-pawn (a4)?", a: "a4 must be played before castling" },
  { q: "After perimeter and castling, what is your strict 8th move?", a: "8.h3" },
  { q: "Why must h3 be played before Nbd2?", a: "To prevent the ...Bg4 pin" },
  { q: "What is your mandated 9th move to support the center?", a: "9.Re1" },
  { q: "Under what exact condition do you retreat the light-squared bishop to Ba2?", a: "Only when Black commits to ...Na5 or similar queenside expansion" },
];

// ─── 4-STEP MASTER MENTAL LOOP + PRE-MOVE CHECK ─────────────────────────────

export const MASTER_MENTAL_LOOP = {
  step1: "Opponent’s Intent (Anti-Blunder + Ghost Check)",
  step2: "CCT Scan (Check, Capture, Threat)",
  step3: "Lazy Piece Upgrade (e.g., route Nbd2-f1-g3-f5)",
  step4: "Pre-Move Check (Visualize, look away, biofeedback)",
};

// Keep your existing PRE_MOVE_LOOP, WEAPON_SELECTION_MATRIX, KEY_POSITIONS, COACH_REFERENCE as they are (or merge any updates).

export default {
  CAGE_PHILOSOPHY,
  CAGE_MOVE_ORDER,
  MOVE_10_BRANCH,
  DRILL_SERGEANT_FENS,
  FIVE_TACTIC_ARSENAL,
  PHASE1_TRIAGE_QUIZ,
  MASTER_MENTAL_LOOP,
  // ... add your other exports: WEAPON_SELECTION_MATRIX, PRE_MOVE_LOOP, KEY_POSITIONS, COACH_REFERENCE
};
