// src/coaches/fabiano.js
// Fabiano — Positional analysis engine based on Fabiano Caruana
// Opening prep, style mirroring, structural benchmarking

import { askFabiano } from '../api/gemini.js';

const OPENING_ANALYSIS_PROMPT = (pgn, result) => `
Analyze this game for TopherBettis from a positional and opening preparation standpoint.
RESULT: ${result}

PGN:
${pgn}

Structure your analysis exactly like this:

## OPENING REPORT

How was the Italian Cage with Spanish Styling executed?

- Move order accuracy (was the Coiled Spring setup followed correctly?)
- Where did preparation end and improvisation begin?
- What did the opponent do and how should it be prepared against next time?

## PAWN STRUCTURE ASSESSMENT

Grade the pawn structure at moves 10, 20, and end of game.
What was gained or lost structurally?

## PIECE ACTIVITY SCORE

Rate each piece (1-10) at the peak moment of the game.
Which pieces were active? Which were lazy?

## LONG-TERM vs SHORT-TERM COMPENSATION

Were any trades made that gave up long-term advantage for short-term gain?
Identify the exact move and explain the positional cost.

## FABIANO'S BENCHMARK

What would a 2000 ELO player have done differently?
Give 2-3 specific move improvements with explanations.

## OPENING LAB PRESCRIPTION

One specific opening line to drill before the next game.
Give the exact move sequence to memorize.
`;

const POSITION_EVAL_PROMPT = (fen, moveNumber) => `
Evaluate this position for TopherBettis at move ${moveNumber}.
FEN: ${fen}

Provide a positional assessment:

## STATIC EVALUATION

- Pawn structure: strengths and weaknesses
- Piece coordination score
- King safety assessment
- Open file and diagonal control

## STRATEGIC PLAN

What is the correct long-term plan for the side to move?
Give the top 2 candidate moves with positional justification.

## CARUANA PRINCIPLE

What positional principle applies most here?
One sentence. Make it memorable.
`;

const REPERTOIRE_DRILL_PROMPT = (opponentSetup) => `
TopherBettis plays the Italian Cage with Spanish Styling as White.
The opponent played: ${opponentSetup}

Build a preparation response:

## OPPONENT THREAT ASSESSMENT

What is the opponent trying to achieve with this setup?

## ITALIAN CAGE RESPONSE

How should TopherBettis respond while maintaining the Coiled Spring structure?
Give the exact move sequence.

## THE COILED SPRING CHECKLIST

Verify each step of the setup:

1. e4 e5 2. Nf3 Nc6 3. Bc4 → ✓/✗
1. c3 → ✓/✗
1. d3 → ✓/✗
1. a4 → ✓/✗
1. O-O → ✓/✗
1. h3 → ✓/✗
1. Re1 → ✓/✗

## PREPARATION LINE

The exact 5-10 move preparation line to drill.
`;

export async function analyzeOpening(pgn, result) {
const prompt = OPENING_ANALYSIS_PROMPT(pgn, result);
return await askFabiano(prompt, { pgn, result });
}

export async function evaluatePosition(fen, moveNumber) {
const prompt = POSITION_EVAL_PROMPT(fen, moveNumber);
return await askFabiano(prompt, {});
}

export async function buildRepertoireResponse(opponentSetup) {
const prompt = REPERTOIRE_DRILL_PROMPT(opponentSetup);
return await askFabiano(prompt, {});
}

export async function benchmarkVs2000(pgn, result) {
const prompt = `
TopherBettis (609 ELO, target 2000) played this game (${result}).
PGN: ${pgn}

Compare every significant decision to what a 2000 ELO player would do.
Format:

- Move [N]: TopherBettis played [X]. A 2000 would play [Y]. Reason: [one sentence].

List only the 5 most instructive deviations. No filler.
`;
return await askFabiano(prompt, { pgn, result });
}
export { askFabiano } from '../api/gemini.js';
