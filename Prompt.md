# PROMPT.md — AI Session Handoff Template

> Copy and paste this at the start of EVERY new AI session.
> Fill in the bracketed fields. Never start a session without it.

-----

## Standard Session Prompt

```
Read VLAD.md first. You are the lead architect on the vlad-chess-coach project 
at github.com/TopherAI/vlad-chess-coach.

Player: TopherBettis (Chess.com)
Current ELO: [CURRENT ELO]
Target ELO: 2000
Time control: 15|10 Rapid
Opening system: Italian Cage with Spanish Styling (White)

Coaching team in this app:
- Vlad (Chuchelov) — system architect, debrief, drills
- Fabiano (Caruana) — style mirror, openings, positional benchmarking  
- Magnus (Carlsen) — endgame conversion, intuition

Today's session goal: [DESCRIBE WHAT YOU WANT TO BUILD OR FIX]

Current build status: [PASTE FROM VLAD.md BUILD STATUS TABLE]
```

-----

## Game Analysis Session Prompt

```
Read VLAD.md and coach-memory.json first.
You are running a Vlad post-game debrief.

Player: TopherBettis | ELO: [X]
Game result: [WIN/LOSS/DRAW]
Time control: 15|10

PGN:
[PASTE PGN HERE]

Run the full debrief:
1. Vlad — systematic breakdown, identify all blunders, map to weakness IDs in coach-memory.json
2. Fabiano — positional benchmarking, what does correct play look like in key positions
3. Magnus — endgame assessment (if applicable)

End with: updated coach-memory.json weakness occurrence counts and any new patterns found.
```

-----

## Drill Session Prompt

```
Read VLAD.md and coach-memory.json first.
My highest priority weakness is: [PASTE WEAKNESS NAME + ID FROM coach-memory.json]

Generate 10 tactical puzzles that specifically target this pattern.
Format each puzzle as:
- Position (FEN)
- What to find
- Solution
- Why this pattern matters to my game
```

-----

## Architecture/Build Session Prompt

```
Read VLAD.md first. You are the architect on vlad-chess-coach.
Repo: github.com/TopherAI/vlad-chess-coach
I work exclusively through GitHub's web interface — no local setup.

Current build status: [PASTE FROM VLAD.md]
Today I want to build: [MODULE NAME]

Generate complete file content ready to paste into GitHub's editor.
After each file, tell me exactly where to create it in the repo.
```

-----

## NotebookLM Query Templates

**Weekly weakness summary:**

```
Review all chess game notes and summaries. 
What are my 3 most recurring mistakes this week?
Which weakness from my profile (W1-W4) appeared most often?
```

**Opening prep query:**

```
Based on my Italian Cage games, what positions am I reaching after move 9?
What are the most common opponent responses I'm facing?
```

**Progress check:**

```
Compare my recent games to my games from [X weeks ago].
Am I making the same mistakes or different ones?
What has actually improved?
```

-----

*This file lives in the repo root. Update session prompts as the project evolves.*
