[slides-README.md](https://github.com/user-attachments/files/26585107/slides-README.md)
# Slides — Asset Index

## Location: `public/assets/slides/`

Individual slide PNGs extracted from G's field manual PPTXs.
Displayed inline by `VideoLibrary.jsx` when a specific tactic or concept is detected.

---

## Naming Convention

```
{concept-slug}_{slide-number}.png
```

Examples:
- `strangler-maneuver_01.png`
- `strangler-maneuver_02.png`
- `d4-break_01.png`
- `move9-trap_01.png`

---

## Concept Slug Reference

| Slug | Concept | Source Manual |
|------|---------|---------------|
| `italian-cage` | Full system overview | italian-cage-overview.pdf |
| `coiled-spring` | 9-move setup | coiled-spring-setup.pdf |
| `strangler-maneuver` | Knight maneuver Nbd2→f5 | strangler-maneuver.pdf |
| `queenside-expansion` | b4 push | queenside-expansion.pdf |
| `toxic-baiting` | Bg5 pins | toxic-baiting.pdf |
| `bxh6-sacrifice` | Bxh6 king exposure | bxh6-sacrifice.pdf |
| `d4-break` | Central explosion | d4-break.pdf |
| `endgame-kp` | K+P technique | endgame-kp.pdf |
| `endgame-kr` | Lucena / Philidor | endgame-kr.pdf |
| `two-bishops` | Bishop pair endgame | two-bishops.pdf |
| `move9-trap` | Speed trap awareness | move9-trap.pdf |
| `4-step-loop` | Mental loop card | 4-step-loop.pdf |

---

## Slide Trigger Flow

```
GameAutopsy detects blunder on move 9
  → Vlad debrief output contains "Move 9 Speed Trap"
    → VideoLibrary.jsx matches keyword → slug: "move9-trap"
      → Loads move9-trap_01.png, move9-trap_02.png ...
        → Slide carousel displayed alongside Vlad audio
          → YouTube GM example queued
```

---

## Extraction Pipeline

PPTXs from G → extract individual slides as PNGs → drop here.

Recommended tool (via Claude Code):
```bash
# LibreOffice CLI batch export
libreoffice --headless --convert-to png *.pptx --outdir ./slides/
```

---

## Status

🔲 Awaiting G's PPTX exports
🔲 Slide extraction pipeline (LibreOffice or python-pptx)
🔲 Carousel renderer in `VideoLibrary.jsx`
