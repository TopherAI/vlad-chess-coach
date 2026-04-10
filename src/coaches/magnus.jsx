// src/coaches/magnus.js
// Magnus — Endgame conversion engine based on Magnus Carlsen
// Endgame technique, intuition training, reality checks

import { askMagnus } from '../api/gemini.js';

const ENDGAME_DEBRIEF_PROMPT = (pgn, result) => `
Analyze the endgame phase of this game for TopherBettis.
RESULT: ${result}

PGN:
${pgn}

Structure your analysis exactly like this:

## ENDGAME VERDICT

Did TopherBettis convert what should have been converted?
One brutal, honest paragraph. No sugarcoating.

## CONVERSION REPORT

At what move did the endgame begin?
Was the winning advantage maintained, increased, or squandered?
Grade: CONVERTED / DREW A WIN / LOST A WIN / DEFENDED WELL / LOST WHAT WAS LOSABLE

## TECHNIQUE BREAKDOWN

Identify the 2-3 most critical endgame moments.
For each: move number, what happened, what the correct technique was.

## MAGNUS RULE VIOLATED

Which endgame principle was broken?
Examples: king activation, opposition, pawn promotion timing, rook behind passed pawn, bishop vs knight assessment.

## THE CONVERSION DRILL

One specific endgame position type to drill 20 times before the next game.
Be specific: K+R vs K, K+P vs K, two bishops, rook endgame, etc.

## MAGNUS REALITY CHECK

One sentence. Ruthless. True. Memorable.
`;

const ENDGAME_POSITION_PROMPT = (fen, material) => `
TopherBettis has reached this endgame position.
FEN: ${fen}
Material: ${material}

Provide endgame guidance:

## POSITION ASSESSMENT

Is this won, drawn, or lost with correct play?
Be definitive. No "it depends."

## THE PLAN

Step by step — what is the winning/drawing/survival plan?
Maximum 5 steps. Be concrete.

## KEY TECHNIQUE

What specific endgame technique applies here?
Name it. Explain it in one sentence.

## FIRST MOVE

What is the single best move right now? Give it immediately.
`;

const INTUITION_DRILL_PROMPT = (position, context) => `
TopherBettis needs to build intuition for this type of position.
Position type: ${context}
FEN: ${position}

Build an intuition pattern:

## THE PATTERN

What is the core pattern TopherBettis must recognize instantly?

## THE TRIGGER

What visual cue on the board should trigger this pattern recognition?

## THE RESPONSE

When you see [trigger], you play [response]. No calculation needed.

## DRILL SET

Give 3 similar positions (describe them) where this same pattern applies.
`;

export async function debriefEndgame(pgn, result) {
const prompt = ENDGAME_DEBRIEF_PROMPT(pgn, result);
return await askMagnus(prompt, { pgn, result });
}

export async function evaluateEndgame(fen, material) {
const prompt = ENDGAME_POSITION_PROMPT(fen, material);
return await askMagnus(prompt, {});
}

export async function buildIntuitionPattern(position, context) {
const prompt = INTUITION_DRILL_PROMPT(position, context);
return await askMagnus(prompt, {});
}

export async function realityCheck(pgn, result, accuracy) {
const prompt = `
TopherBettis just played this game. Result: ${result}. Accuracy: ${accuracy}.
PGN: ${pgn}

Give a Magnus-style reality check in exactly 3 parts:

## WHAT ACTUALLY HAPPENED

One paragraph. Honest. No flattery.

## THE ONE THING TO FIX

The single most important thing to improve before the next game.
Not a list. One thing.

## MAGNUS'S VERDICT

One sentence. Deliver it like Magnus would.
`;
return await askMagnus(prompt, { pgn, result, accuracy });
}
export { askMagnus } from '../api/gemini.js';
