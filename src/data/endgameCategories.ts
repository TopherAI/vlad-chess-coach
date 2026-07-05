// src/data/endgameCategories.ts
// CHESSai — Endgame Dojo categories. Ported verbatim (same ids, FENs,
// hints, Magnus prompts, unlock gating) from the native app's
// EndgameCategory.swift, so both apps drill the exact same content.

export type EndgameCategoryData = {
  id: string;
  title: string;
  desc: string;
  startFen: string;
  hint: string;
  magnusPrompt: string;
  priority: number;
  /** This category unlocks once the category with this id has this many perfect sessions. undefined = always unlocked. */
  unlockAfterId?: string;
  unlockAfterCount: number;
};

export type EndgameCategoryProgress = {
  attempts: number;
  perfectSessions: number;
};

export const endgameCategories: EndgameCategoryData[] = [
  {
    id: 'king-pawn',
    title: 'King + Pawn',
    desc: 'Opposition and outflanking fundamentals.',
    startFen: '8/3k4/8/3K4/3P4/8/8/8 b - - 0 1',
    hint: 'Foundation of all endgame play. King opposition is the fundamental skill — Black to move here is already in trouble if it steps to the wrong square.',
    magnusPrompt: "Give me specific King+Pawn endgame technique coaching. I'm at 593 ELO targeting 2000 ELO. What are the 2-3 most critical patterns to master, and what is the exact drill I should do today?",
    priority: 1,
    unlockAfterCount: 0,
  },
  {
    id: 'king-rook',
    title: 'King + Rook',
    desc: 'The box method and cutting off the king.',
    startFen: '4k3/8/2K5/8/8/8/8/7R w - - 0 1',
    hint: '60% of all endgames are rook endings. Use the box method: shrink the rectangle the enemy king is trapped in one side at a time, bring your king up, then deliver mate on the edge.',
    magnusPrompt: "Give me specific King+Rook endgame technique coaching — the box method, Lucena, and Philidor. I'm at 593 ELO targeting 2000 ELO. What is the most important pattern to fix right now?",
    priority: 2,
    unlockAfterId: 'king-pawn',
    unlockAfterCount: 3,
  },
  {
    id: 'ladder-mates',
    title: 'Ladder Mates',
    desc: 'Basic heavy piece coordination.',
    startFen: '8/8/8/4k3/8/8/R7/R6K w - - 0 1',
    hint: "Never give this up in a won position. Walk the rooks down the board one rank at a time — the king can never step into either rook's rank, so it gets marched straight to the edge.",
    magnusPrompt: "I've mastered Ladder Mates at 100%. What is the next level of complexity I should study in this theme? I'm at 593 ELO targeting 2000 ELO. What similar patterns build on this foundation?",
    priority: 3,
    unlockAfterCount: 0,
  },
  {
    id: 'two-bishops',
    title: 'King + 2 Bishops',
    desc: 'Herding the enemy king to the corner.',
    startFen: '4k3/8/8/8/4K3/8/8/2B2B2 w - - 0 1',
    hint: 'Rare but decisive when it occurs. Use the bishops together to build a diagonal barrier, then walk your king in to force the enemy king into any corner — not just a same-colored one, unlike the bishop+knight mate.',
    magnusPrompt: "I have zero experience with Two Bishop endgames. I'm at 593 ELO targeting 2000 ELO. Teach me the fundamental pattern for herding the enemy king to the corner step by step.",
    priority: 4,
    unlockAfterId: 'king-rook',
    unlockAfterCount: 3,
  },
  {
    id: 'king-bishop-knight',
    title: 'King + Bishop + Knight',
    desc: 'The hardest of the four basic mates.',
    startFen: '4k3/8/8/8/4K3/8/8/5BN1 w - - 0 1',
    hint: "One of the four basic checkmates, and by far the trickiest. Unlike the rook or two-bishop mate, you can only deliver this one in the corner matching your bishop's square color — here the bishop is light-squared, so the king must be forced to a8 or h1, not a1 or h8.",
    magnusPrompt: "I'm working on the King+Bishop+Knight vs King checkmate — the hardest of the four basic mates. I'm at 593 ELO targeting 2000 ELO. Walk me through the technique for forcing the king into the correct-colored corner.",
    priority: 5,
    unlockAfterId: 'two-bishops',
    unlockAfterCount: 3,
  },
];
