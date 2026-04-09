# Field Manuals — Asset Index

## Location: `public/assets/field-manuals/`

This directory stores G's (NotebookLM/Gemini) field manuals — PDFs and PPTXs
displayed inline inside the app when Vlad references a specific concept.

---

## Manifest

| File | Topic | Triggers On | Format |
|------|-------|-------------|--------|
| `italian-cage-overview.pdf` | Full Italian Cage system | Opening detected | PDF |
| `coiled-spring-setup.pdf` | 9-move Coiled Spring sequence | Moves 1-9 | PDF |
| `strangler-maneuver.pdf` | Nbd2→f1→g3→f5 knight maneuver | Tactic: Strangler | PDF |
| `queenside-expansion.pdf` | b4 push execution | Tactic: Expansion | PDF |
| `toxic-baiting.pdf` | Bg5 pin sequences | Tactic: Toxic Bait | PDF |
| `bxh6-sacrifice.pdf` | High-velocity sacrifice patterns | Tactic: Sacrifice | PDF |
| `d4-break.pdf` | Central explosion timing | Tactic: d4 break | PDF |
| `endgame-kp.pdf` | King + Pawn technique | Endgame: K+P | PDF |
| `endgame-kr.pdf` | Rook endgame — Lucena/Philidor | Endgame: K+R | PDF |
| `two-bishops.pdf` | Two-bishop endgame mastery | Endgame: Bishops | PDF |
| `move9-trap.pdf` | Move 9 Speed Trap awareness drill | Weakness #1 | PDF |
| `4-step-loop.pdf` | Master Mental Loop reference card | Any blunder | PDF |

---

## How It Works

1. **Vlad debrief fires** after game analysis
2. **Tactic/concept detected** in the debrief output (keyword matching in `VideoLibrary.jsx`)
3. **Matching field manual** is loaded inline via `<iframe>` or PDF.js renderer
4. **Vlad commentary** plays alongside the manual

---

## Adding New Manuals

1. Drop PDF or PPTX into this folder
2. Add entry to manifest above
3. Add trigger keyword to `src/modules/VideoLibrary.jsx` `CONCEPT_MAP`

---

## Status

🔲 Awaiting G's (NotebookLM) field manual exports
🔲 PDF.js renderer to be wired in `VideoLibrary.jsx`
🔲 Slide PNG extraction pipeline (`public/assets/slides/`)
