[CLAUDE.md](https://github.com/user-attachments/files/26696784/CLAUDE.md)
# VLAD CHESS COACH — MASTER CONTEXT DOCUMENT
> **FOR ANY AI READING THIS:** This is the single source of truth for the vlad-chess-coach project.
> Read this entire file before touching any code. Every architectural decision is documented here.
> Last updated: April 13, 2026

---

## 1. PROJECT IDENTITY

| Field | Value |
|-------|-------|
| **App** | Vlad Chess Coach |
| **Live URL** | https://vlad-chess-coach.vercel.app |
| **Repo** | https://github.com/TopherAI/vlad-chess-coach |
| **Owner** | TopherBettis (Topher) — ELO 617, target 2000 |
| **Mission** | AI chess coaching app built around the Gentleman's Assassin opening system |

---

## 2. STACK & DEPLOYMENT

```
React + Vite
Vercel (auto-deploy on push to main)
GitHub web interface only — NO terminal, NO local clone
```

**Workflow rule (LOCKED):** GitHub web interface only.
- Click folder → click file → click pencil → edit → commit
- Never use `/blob/` in URLs when giving navigation instructions. Always say: click the folder, click the file, click the pencil.
- Always give complete file paths (e.g. `src/modules/OpeningLab.jsx`), never just filenames.

---

## 3. FILE MAP

```
src/
├── App.jsx                    # Shell + nav + Dashboard + ELO fetch from chess.com
├── api/
│   └── gemini.js              # SOLE API utility — askCoach(persona, userMessage)
├── coaches/
│   ├── vlad.jsx               # Demanding Eastern European — Vladimir Chuchelov
│   ├── fabiano.jsx            # Italian upbeat logical — Fabiano Caruana
│   ├── magnus.jsx             # Danish dry positive — Magnus Carlsen
│   └── hikaru.jsx             # American tactical genius — Hikaru Nakamura
├── modules/
│   ├── GameAutopsy.jsx        # PGN upload → AI consensus analysis
│   ├── DrillSergeant.jsx      # Auto-loads from vlad_last_autopsy localStorage
│   ├── OpeningLab.jsx         # Gentleman's Assassin system trainer (v3.0)
│   ├── MiddlegameMat.jsx      # 5 Assassin weapons + Hikaru coaching
│   ├── EndgameDojo.jsx        # Magnus-voiced conversion training
│   └── (MiddlegameMat.jsx)    # Between Opening Lab and Endgame Dojo in nav
└── engine/
    └── stockfish.js           # Saves FEN per move for DrillSergeant
```

---

## 4. THE ONLY API CALL — READ THIS FIRST

**File:** `src/api/gemini.js`
**Signature:** `askCoach(persona, userMessage)`
**Transport:** POST to `/api/chat`
**Returns:** `data.text` (string)

```javascript
// How every coach file uses it:
import { askCoach } from "../api/gemini.js";
const askVlad = (msg) => askCoach(VLAD_PERSONA_STRING, msg);
export default askVlad;
```

**CRITICAL:** There is no gateway, no Railway proxy, no separate backend.
Gemini API calls go directly from the frontend via `/api/chat`.
Do NOT attempt to re-introduce a gateway or proxy architecture.

---

## 5. COACH PERSONAS

| Coach | Based On | Tone | Primary Role |
|-------|----------|------|--------------|
| **Vlad** | Vladimir Chuchelov | Demanding, Eastern European, precise, intense | Week review, long-term plan, opening system |
| **Fabiano** | Fabiano Caruana | Italian, upbeat, logical, methodical | Positional perfection, structure |
| **Magnus** | Magnus Carlsen | Danish, dry, positive, intuitive | Endgame conversion, reality checks |
| **Hikaru** | Hikaru Nakamura | American, tactical genius, fast | Middlegame tactics, 5 weapons, attack patterns |

**Vlad persona is the primary teacher in OpeningLab.** He is demanding, precise, and Eastern European. 2-3 sentences max per commentary. Never soft.

---

## 6. THE GENTLEMAN'S ASSASSIN OPENING SYSTEM

### The 9-Move Universal Cage (White)
```
1. e4    — Central control. Non-negotiable.
2. Nf3   — Develop with tempo. Attacks e5.
3. Bc4   — Italian Bishop. Target f7.
4. c3    — Bunker. Prepares d4.
5. d3    — THE Pianissimo move. Don't tip your hand.
6. a4    — Prophylaxis vs Na5. Creates Ba2 escape hatch.
7. O-O   — Castle. Always by move 7.
8. h3    — SACRED. Stops Bg4. Enables Be3.
9. Re1   — Cage complete. Central support.
```

### 4 Black Response Lines
| Line | Trigger | Subtitle | Key Weapon |
|------|---------|----------|------------|
| Giuoco Piano | 3...Bc5 | Closed center | Full Gentleman Assassin |
| Sicilian ...e6/d6 | 1...c5 then e6/d6 | Ba2 sniper | Ng3→Nh5→Nf5 |
| Dragon Sicilian | 1...c5 then g6 | Exchange win | axb5 + Nf5 crusher |
| Two Knights | 2...Nf6 | d3 refusal | Fold into cage |

### Phase 2 Attack (all lines)
```
Nbd2 → Nf1 → Ng3 → Ba2 → Nh5/Nf5 → Re3 → d4 break
```
This is called "The Strangler Sequence."

---

## 7. localStorage KEYS

| Key | Used By | Contents |
|-----|---------|----------|
| `vlad_last_autopsy` | DrillSergeant | FEN positions from last game analysis |
| `vlad_pending_pgn` | GameAutopsy | PGN dropped on dashboard, passed to autopsy |

---

## 8. NAV ORDER (App.jsx)

```
Dashboard → Game Autopsy → Drill Sergeant → Opening Lab → Middlegame Mat → Endgame Dojo
```

---

## 9. DASHBOARD — KEY FEATURES

- **ELO:** Live-fetched from `https://api.chess.com/pub/player/topherbettis/stats` (rapid rating). Falls back to 617.
- **Progress bar:** 400→2000 campaign progress. ELO marker sits above the bar.
- **Belt system:** White 400-600 → Blue 600-1000 → Purple 1000-1400 → Brown 1400-1800 → Black 1800-2000 → Red 2000+
- **4-Step Mental Loop:** Displayed on dashboard. Execute before every move.
- **Game Clock:** 30s/1m/2m/5m dropdown timer. Next to PGN drop zone.
- **Weakness Alerts:** 4 active alerts shown on dashboard.

---

## 10. AI TEAM PROTOCOL (LOCKED)

| Role | Tool | Responsibility |
|------|------|---------------|
| **Primary Dev/Architecture** | Claude | All code, all architecture decisions, all file writes |
| **Analysis/Strategy** | Grok | Strategic analysis, position evaluation |
| **Research ONLY** | Gemini | Research only — never directly edits code or files |
| **Validation** | ChatGPT | Code review and validation |

**CRITICAL RULE:** All Gemini output must be validated by Claude or ChatGPT before touching GitHub.
**CRITICAL RULE:** No nicknames for LLMs. Always full names.

---

## 11. HANDOFF FORMAT (LOCKED — NEVER CHANGE)

Every code delivery must follow this exact format:

1. **"Switch to [App]"** + file path in its own copy box
2. **Complete file content** in one copy box (never partial, never diffs)
3. **Commit message** in its own copy box starting with `feat:` or `fix:`

At the end of every session:
- Save memory checkpoint
- Create GitHub issue: "Session Checkpoint — Resume Here" in the relevant repo

---

## 12. MAC KEYBOARD SHORTCUTS

Topher is on a Mac. Always use:
- `Cmd` not `Ctrl`
- `Cmd+A` to select all
- `Cmd+C` to copy
- `Cmd+V` to paste
- `Cmd+Shift+R` for hard refresh

---

## 13. PENDING TARGETS (PRIORITIZED)

### UI Fixes
- [ ] VLAD logo 50% larger
- [ ] VLAD text larger + line spacing to match text below
- [ ] Coaching Team: swap Magnus & Hikaru positions
- [ ] ELO marker on progress bar: not center-justified, sits above the red dot

### Live Data
- [ ] ELO live from chess.com — verify accuracy on dashboard
- [ ] Campaign progress driven by live chess.com ELO

### Feature Builds
- [ ] **OpeningLab v3.0** ✅ COMPLETED THIS SESSION — Gentleman's Assassin 9-move system, 4 Black responses, Phase 2 attack maps, Vlad commentary, quiz engine
- [ ] **Magnus wired into OpeningLab** — Opening Lab currently uses askVlad/askFabiano/askMagnus but Magnus not wired into the new system view
- [ ] **Coach Engine: Vlad** — Week review & long-term plan feature
- [ ] **Coach Engine: Fabiano** — Positional perfection module
- [ ] **Engine Protocol:** Remove Stockfish. Use chess.com for move lists. Critical tab uses custom AI consensus (Vlad, Fabiano, Magnus, Hikaru) for personalized best moves based on tailored game plan.

### Progression System
- [ ] Warrior Belt System fully implemented (dashboard shows it — verify all 6 belts render correctly)

---

## 14. COMPLETED THIS SESSION (April 13, 2026)

### OpeningLab.jsx v3.0
Complete rebuild of `src/modules/OpeningLab.jsx`. New features:
- **9-Move System view** — Universal cage sequence with Vlad commentary per move (hardcoded + live AI call option). Mark-as-studied progress tracking.
- **4 Black Responses view** — Giuoco Piano, Sicilian e6/d6, Dragon Sicilian, Two Knights. Each has: Phase 2 attack map (Nbd2→Nf1→Ng3→Ba2→Nf5), deviations if/then cards, live Vlad coaching call.
- **Assassin Checklist** — 7-condition pre-attack checklist + Phase 2 strike sequence.
- **Quiz** — 7 questions on the system. Vlad grades wrong answers via live AI call.
- All existing functionality preserved. Mobile responsive. IBM Plex Mono font consistent with app.

---

## 15. KNOWN ISSUES / WATCH LIST

- Gemini API credits exhaust during heavy sessions. Reset midnight Pacific or via billing at aistudio.google.com.
- Font contrast: grey on black in some areas — ongoing UI debt.
- Vercel Git repo connection not yet confirmed (Production Checklist shows 0/5). Verify auto-deploy is wired.
- `node_modules` committed to repo (visible in GitHub root). Should be in `.gitignore`. Low priority.

---

## 16. LONG-TERM VISION

1. **Chess app commercialization:** Approach GM Vladimir Chuchelov with a profit-sharing arrangement after demonstrating ELO improvement. The app is the proof of concept.
2. **Mortgage AI:** Topher is the leading AI mind in the US mortgage industry. Parallel track — Responsible AI Mortgage Agent repo under TopherAI org.
3. **Oregon brokerage:** Starting a mortgage brokerage in Oregon — DFR/NMLS compliance active.

---

*This document is the ground truth. If there is a conflict between this file and any other document, this file wins.*
*Update this file at the end of every session with new completions and new targets.*
