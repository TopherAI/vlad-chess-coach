// src/data/italianCage.js
// The Italian Cage — Complete Knowledge Base
// Source: Field Manual Opening (G/NotebookLM) + Field Manual Middle Game (Grok/Gemini)
// This file is imported by all 3 coaches as their opening doctrine

// ─── THE PHILOSOPHY ───────────────────────────────────────────────────────────

export const CAGE_PHILOSOPHY = {
name: “The Gentleman Assassin / Italian Cage (Giuoco Pianissimo)”,
coreMantra: “Construct the Cage Quietly. Execute Violently.”,
coiledSpring: {
setup: “Patiently maintain tension using the unbreakable c3-d3 pawn structure.”,
deception: “Feign a quiet positional game to induce opponent over-extension.”,
strike: “Trigger a violent central or flank explosion the moment Black commits.”
},
engineEval: “+0.10 to +0.25 at optimal play. The Giuoco Pianissimo is only quiet if played poorly.”,
architectureOfInevitability: [
“1. Build the Cage First — a4 (Perimeter), O-O (Vault), h3 (Shield), Re1 (Power). Never deviate.”,
“2. Run the Loop — Opponent’s Intent. CCT Scan. Lazy Piece. Pre-Move Biofeedback.”,
“3. Execute Without Hesitation — Wait for the trigger (b4, f5, or d4). Release the coiled spring.”
]
};

// ─── THE MOVE ORDER ───────────────────────────────────────────────────────────

export const CAGE_MOVE_ORDER = {
phase1_foundation: [
{ move: “1.e4 e5”, purpose: “Open center, claim space” },
{ move: “2.Nf3 Nc6”, purpose: “Develop knight, attack e5” },
{ move: “3.Bc4 Bc5”, purpose: “The MVP Bishop deployed — the a2-g8 diagonal sniper” },
{ move: “4.c3 Nf6”, purpose: “Prepares d4, restricts Black’s knights. The cornerstone.” },
{ move: “5.d3 d6”, purpose: “Solid base. No early d4 overcommitment. The c3/d3 wall.” }
],
phase2_perimeter: [
{ move: “6.a4!”, purpose: “THE PERIMETER MOVE. Creates permanent safe house on a2. Clamps queenside. Forces Black’s dark bishop to feel the crush. Non-negotiable.” }
],
phase3_vault: [
{ move: “7.O-O”, purpose: “Secure the Vault. King safety first. Aggressive plans only work from bulletproof king.” }
],
phase4_shield: [
{ move: “8.h3!”, purpose: “THE SHIELD. NEVER play Re1 first. Without h3, Black plays Bg4 and achieves a paralyzing pin. h3 must precede Nbd2.” }
],
phase5_power: [
{ move: “9.Re1”, purpose: “Power the Central Grid. Backs up the e-pawn (structural linchpin). Prepares violent d4 central explosion from position of absolute stability.” }
],
criticalRule: “NEVER play Re1 before h3. The pin Bg4 destroys the position. h3 is mandatory first.”
};

// ─── THE MOVE 10 DIAGNOSTIC CROSSROADS ───────────────────────────────────────

export const MOVE_10_BRANCH = {
instruction: “Do not guess. Use Node 1 (Opponent’s Intent) of the 4-Step Loop to read Black’s setup. Deploy the corresponding branch.”,
optionA: {
move: “10.Ba2”,
alias: “The Fortress”,
trigger: “Black plays …Na5 or prepares …c5”,
objective: “Preserves MVP Bishop. Dodges immediate threats.”,
riskProfile: “Low / Solid”,
result: “Bishop remains sniper on a2-g8 diagonal. Black’s Knight stranded on rim. Eval advantage maintained.”
},
optionB: {
move: “10.Nbd2”,
alias: “The Strangler”,
trigger: “Black castles early, plays passive”,
objective: “Route Knight to the f5 outpost via Nb1-d2-f1-g3-f5”,
riskProfile: “High Tension / Lethal”,
result: “Knight on f5 = ticking time bomb. Threatens g7, h6. Creates structural Swiss cheese in Black’s kingside.”
}
};

// ─── THE 5-TACTIC ARSENAL ─────────────────────────────────────────────────────

export const FIVE_TACTIC_ARSENAL = {
tactic1: {
name: “The Strangler”,
alias: “Knight Outpost (f5/Ng5)”,
targetArea: “Kingside”,
visualTrigger: “…h6 or Nf6 moves. No g6 pawn.”,
executionPace: “Slow Constriction (Eval +0.6)”,
execution: [
“1. Land the Outpost: Maneuver Knight to f5 via Nb1-d2-f1-g3-f5”,
“2. Reinforce: Support outpost immediately with Bg5 or Qd2”,
“3. Execute the Purge: Scan for Nhxg7+ sacrifices if Black ignores pressure”
],
engineInsight: “Parasitic infection staring at the king. Even without immediate tactical blow, eval climbs +0.6 to +1.0 instantly due to absolute paralysis.”,
coreRule: “It looks like a retreat. It is a methodical march to the most lethal outpost on the board.”
},
tactic2: {
name: “Queenside Crush”,
alias: “Pawn Push b4-a5”,
targetArea: “Queenside”,
visualTrigger: “Pinned or unprotected Black Bishop on c5. Weak queenside structure.”,
executionPace: “B4 A5 — Slow suffocating squeeze”,
execution: [
“1. Trigger the Crush: Identify pinned or unprotected Black Bishop on c5”,
“2. Execute the Advance: Push b-pawn (b4), followed by a-pawn (a5)”,
“3. Exploit the Weakness: Create structural damage, open lines for rook, force favorable exchanges”
],
engineInsight: “Not about immediate mate. Slow suffocating squeeze. Creates space through undermining Black’s structure — often leading to significant positional advantage.”
},
tactic3: {
name: “Toxic Bait”,
alias: “Bg5 Pin + h4”,
targetArea: “Kingside”,
visualTrigger: “Weakened h6 pawn shield. …h6 push.”,
executionPace: “Instant Demolition (NNUE flags +3.0)”,
targetLockChecklist: [
“Black’s Nf6 is fully pinned”,
“Clear diagonal path for Bg5 (no d3-d4 obstruction)”,
“Black impatiently plays …h6 to kick the Bishop”
],
coreConcept: “Use the opponent’s desire for freedom against them. Do not retreat. Turn their attack into a self-inflicted kingside rupture.”
},
tactic4: {
name: “High-Velocity Sacks”,
alias: “The Pianissimo Purge (Bxh6)”,
targetArea: “Kingside”,
visualTrigger: “Flank commitment (e.g. …Na5). Hanging h6 pawn.”,
executionPace: “Tactical Brawl — Positional collapse”,
targetLockChecklist: [
“Black King is castled (O-O)”,
“…h6 pawn is defended only once”,
“White Qd2 is aligned, with Knight on f5 or g3 ready to strike”
],
execution: “Bxh6! (sacrificing dark-squared bishop). Follow up with Qd2 and Ng5+.”,
coreConcept: “Calculated demolitions. Turn a quiet game into a horror movie instantly by shattering the pawn shield.”
},
tactic5: {
name: “Central Explosion”,
alias: “d4 Break”,
targetArea: “Center”,
visualTrigger: “Weakened a6/b7 structure. Black commits heavily to flank (e.g. …Na5) or neglects d4.”,
executionPace: “Structural Damage (Eval +1.0)”,
targetLockChecklist: [
“Italian Box completely built (O-O, Re1, h3 played)”,
“The e4-anchor pawn is fully defended”,
“Black commits heavily to flank or neglects d4”
],
coreConcept: “Deny liquidate and draw lines. The exact moment Black rotates away from the center, the coiled spring snaps. d4! blows open center while White is 3 tempos ahead.”
}
};

// ─── WEAPON SELECTION MATRIX ─────────────────────────────────────────────────

export const WEAPON_SELECTION_MATRIX = [
{ tactic: “The Strangler (f5-Outpost)”, trigger: “No g6 pawn / …h6 or Nf6 moves”, target: “Kingside”, pace: “Slow Constriction +0.6” },
{ tactic: “Queenside Crush”, trigger: “Weak queenside / Pinned or unprotected Bc5”, target: “Queenside”, pace: “b4-a5 squeeze” },
{ tactic: “Toxic Bait (Bg5 Pin)”, trigger: “…h6 push / Weakened h6 pawn shield”, target: “Kingside”, pace: “Instant Demolition +3.0” },
{ tactic: “High-Velocity Sacks (Bxh6)”, trigger: “Hanging h6 pawn / Flank commitment …Na5”, target: “Kingside”, pace: “Tactical Brawl” },
{ tactic: “Central Explosion (d4)”, trigger: “Flank commitment / Weakened a6-b7 structure”, target: “Center”, pace: “Structural Damage +1.0” }
];

// ─── THE 3-STEP PRE-MOVE MENTAL LOOP ─────────────────────────────────────────

export const PRE_MOVE_LOOP = {
step1: {
name: “Opponent’s Side (30 sec)”,
action: “Tactics & Opponent’s Intent. Scan for threats, checks, captures. What are they threatening? Think as Black.”
},
step2: {
name: “My Side (30 sec)”,
action: “CCT & Positional Plan. Formulate a plan. Identify the least active piece; improve its position. Think as White.”
},
step3: {
name: “Blunder Check (Look Away)”,
action: “The Final Verification. Visualize the board state one move ahead. Look away, then look back to spot obvious errors. Do not touch the piece until cleared.”
},
biofeedback: “Apple Watch ‘Outdoor Walk’ mode. 70-95 BPM = Green. 100+ BPM = Look Away Protocol. Stop. Breathe. Reset.”,
masterRoutine: “Read. React. Execute.”
};

// ─── KEY POSITIONS (FEN CODES) ────────────────────────────────────────────────

export const KEY_POSITIONS = {
cageStart: “r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQK2R b kQkq - 0 5”,
queensidePerimeter: “r1bqk2r/ppp2ppp/2np1n2/2b1p3/P1B1P3/2PP1N2/1P3PPP/RNBQK2R b kQKq - 0 6”,
vaultSecured: “r1bqk2r/ppp2ppp/3p1n2/41/4p3/P1B1P3/2PP1N2/RNBQ11RK1 b kq - 0 7”,
cageComplete: “Architecture of Inevitability achieved at Move 9. Black is suffocating.”,
strangler_tactic1: “FEN after Nf5 established — eval +0.6 to +1.0”,
purge_tactic4: “r1bq1rk1/ppp2p1p/2np1n2/2b1p1N1/P1B1P1P1/2PP4/1P1Q1PPP/RN3RK1 w - - 0 11”
};

// ─── COACH REFERENCE SUMMARY ─────────────────────────────────────────────────

export const COACH_REFERENCE = {
forVlad: “The cage is a military operation. Build the perimeter (a4), secure the vault (O-O), deploy the shield (h3), power the grid (Re1). Then wait for the enemy to commit. The moment they do — strike without mercy. This is preparation-first chess.”,
forFabiano: “The c3/d3 structure is the structural linchpin. It creates a closed center where piece activity and long-term pressure dominate over tactical complexity. The MVP Bishop on c4/a2 is a long-term positional weapon. Every piece trade must be evaluated against the positional advantage it preserves or destroys.”,
forMagnus: “The endgame is won in the opening. Build the cage properly and the position converts itself. The 5 tactics are not optional — they are the mathematical inevitability that flows from correct preparation. A knight on f5 that reaches g7 wins. No draws from winning cages.”
};

export default {
CAGE_PHILOSOPHY,
CAGE_MOVE_ORDER,
MOVE_10_BRANCH,
FIVE_TACTIC_ARSENAL,
WEAPON_SELECTION_MATRIX,
PRE_MOVE_LOOP,
KEY_POSITIONS,
COACH_REFERENCE
};
