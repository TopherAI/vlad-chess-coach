# ♟️ VLAD Chess Coach

> *“Secure the perimeter. Control the midfield. Convert the endgame. No excuses.”*

**An AI-powered GM coaching system built to take TopherBettis from 609 → 2000 ELO.**  
Powered by Gemini 1.5 Pro · Stockfish · Chess.com API · NotebookLM

-----

## The Coaching Team

|Coach        |Real-World Basis  |Role in the System                                       |
|-------------|------------------|---------------------------------------------------------|
|🎖️ **Vlad**   |Vladimir Chuchelov|System architect · Post-game debrief · Drill prescription|
|♟️ **Fabiano**|Fabiano Caruana   |Style mirror · Opening prep · Positional benchmarking    |
|👑 **Magnus** |Magnus Carlsen    |Endgame god · Intuition training · Reality checks        |

Vlad runs the system. Fabiano shows you what correct looks like. Magnus finishes the job.

-----

## The Opening System

**Italian Cage with Spanish Attacking DNA**

```
1.e4 e5 2.Nf3 Nc6 3.Bc4 (Italian)
+ Nc3, d3, Be3 Cage Structure (solid, never tactically blown up early)
+ Spanish-style kingside pressure (long-term squeeze, piece activity)
```

Caruana approved. Chuchelov built. Magnus would play it.

-----

## The Path: 609 → 2000

|Phase                 |ELO Range  |Primary Focus                                                |
|----------------------|-----------|-------------------------------------------------------------|
|**Phase 1: Triage**   |609 → 1000 |Stop hanging pieces. Pre-move checklist. Every. Single. Move.|
|**Phase 2: Structure**|1000 → 1400|Piece activity. Pawn structure. Build your repertoire.       |
|**Phase 3: Weaponize**|1400 → 1800|Deep opening prep. Endgame technique. 500+ tactical patterns.|
|**Phase 4: Mastery**  |1800 → 2000|Candidate moves. Time management. Tournament psychology.     |

-----

## App Modules

### 🔬 Game Autopsy

Upload any PGN. Stockfish annotates every blunder. All three coaches weigh in.

- Vlad runs the debrief
- Fabiano benchmarks the correct positional approach
- Magnus grades the endgame (or lack thereof)

### 🎯 Drill Sergeant

Tactical puzzles generated from **your actual blunder positions** — not random puzzles.  
Fix the exact patterns you keep missing.

### 📚 Opening Lab

Deep Italian Cage preparation. Know your plan by move 6. Every time.

### 👑 Endgame Dojo

Magnus mode. Convert what should be converted. No more draws from winning positions.

### 📈 Progress Tracker

Rating journey. Weakness fingerprint over time. Hard numbers. Honest trends.

-----

## Tech Stack

|Layer            |Technology          |
|-----------------|--------------------|
|AI Coach Brain   |Gemini 1.5 Pro      |
|Chess Engine     |Stockfish (WASM)    |
|Game Data        |Chess.com Public API|
|Historical Corpus|NotebookLM          |
|Frontend         |React + GitHub Pages|
|Persistent Memory|`coach-memory.json` |
|Project Bible    |`VLAD.md`           |

-----

## Vlad’s Five Doctrines

1. **“Secure the perimeter”** — Check for hanging pieces before every move. Non-negotiable.
1. **“Control the midfield”** — Center control is field position. Own it.
1. **“Tap or snap”** — Recognize losing positions early. Don’t bleed out.
1. **“Mission debrief”** — Every game gets a post-game breakdown. No exceptions.
1. **“Reps build reflexes”** — Tactics aren’t about thinking. They’re about patterns trained through volume.

-----

## Repository Structure

```
vlad-chess-coach/
├── VLAD.md                  # Project bible — read this first every session
├── PROMPT.md                # AI session handoff template
├── coach-memory.json        # Your persistent weakness fingerprint
├── README.md                # You are here
│
├── src/
│   ├── coaches/
│   │   ├── vlad.js          # Chuchelov system prompt + debrief logic
│   │   ├── fabiano.js       # Caruana style mirror prompt
│   │   └── magnus.js        # Carlsen endgame + intuition prompt
│   │
│   ├── modules/
│   │   ├── GameAutopsy.jsx  # PGN upload + full coach analysis
│   │   ├── DrillSergeant.jsx # Puzzle engine from blunder positions
│   │   ├── OpeningLab.jsx   # Italian Cage prep
│   │   └── EndgameDojo.jsx  # Magnus endgame training
│   │
│   ├── engine/
│   │   └── stockfish.js     # Stockfish WASM wrapper
│   │
│   ├── api/
│   │   ├── chesscom.js      # Chess.com API integration
│   │   └── gemini.js        # Gemini 1.5 Pro wrapper
│   │
│   └── memory/
│       └── coachMemory.js   # Read/write coach-memory.json
│
└── public/
    └── index.html
```

-----

## AI Team Roles

|AI                |Assigned Role             |
|------------------|--------------------------|
|**Claude**        |Architect + lead coder    |
|**Gemini 1.5 Pro**|Live coach brain (runtime)|
|**NotebookLM**    |Historical game corpus    |
