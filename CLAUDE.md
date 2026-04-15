# VLAD CHESS COACH — MASTER CONTEXT DOCUMENT
> **FOR ANY AI READING THIS:** This is the single source of truth for the vlad-chess-coach project.
> Read this entire file before touching any code. Every architectural decision is documented here.
> Last updated: April 14, 2026

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
- Topher is on a Mac — always use Cmd not Ctrl.

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
│   ├── GameAutopsy.jsx        # PGN auto-load → AI consensus + timestamp/speed analysis
│   ├── DrillSergeant.jsx      # Auto-loads from vlad_critical_list localStorage
│   ├── OpeningLab.jsx         # Gentleman's Assassin system trainer (v3.0)
│   ├── MiddlegameMat.jsx      # 6 Assassin weapons + Hikaru coaching
│   ├── EndgameDojo.jsx        # Magnus-voiced conversion training
│   └── VideoLibrary.jsx       # Chuchelov video library — 220 videos, concept-tagged
└── engine/
    └── stockfish.js           # DEPRECATED — not used. Custom AI consensus only.
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

**CRITICAL — IMPORT RULE (LOCKED):** All coach files use `export default`. Always import WITHOUT curly braces:
```javascript
import askVlad from "../coaches/vlad.jsx";     // CORRECT
import { askVlad } from "../coaches/vlad.jsx"; // WRONG — breaks build
```

**CRITICAL:** There is no gateway, no Railway proxy, no separate backend.
Gemini API calls go directly from the frontend via `/api/chat`.
Do NOT attempt to re-introduce a gateway or proxy architecture.

**CRITICAL — NO STOCKFISH. EVER.**
This app uses pure AI consensus via `askCoach(persona, userMessage)`.
Stockfish is deprecated, removed, and never comes back. We are special.
The coaches ARE the engine.

---

## 5. COACH PERSONAS & ROLES

| Coach | Based On | Tone | Domain Role |
|-------|----------|------|-------------|
| **Vlad** | Vladimir Chuchelov | Demanding, Eastern European, precise, intense | Head coach & principles — owns the system, the 30-second rule, and all non-negotiables |
| **Fabiano** | Fabiano Caruana | Italian, upbeat, logical, methodical | Opening variations & positional play — owns the 4 Black lines and structural perfection |
| **Hikaru** | Hikaru Nakamura | American, tactical genius, fast | Attacking & middlegame — owns the 6 weapons, Strangler activation, all attack patterns |
| **Magnus** | Magnus Carlsen | Danish, dry, positive, intuitive | Endgame & intuition — owns the 6-weapon → endgame conversion map and Master Conversion Rule |

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

### The 30-Second Rule (SACRED)
After move 9 Re1 — STOP. Hit the dashboard timer. Look away. Run the 6-rule checklist. THEN play move 10.
Game Autopsy enforces this: any move 10+ played under 30 seconds (3000 centiseconds via `%timestamp`) is flagged as a Speed Trap. Vlad leads the debrief with the violation.

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

### 6 Middlegame Principles (in order)
```
01 Lock the Center
02 Establish Ng5 Stranglehold (Nf1→Ng3→Nf5)
03 Dual Flank Attack
04 Queenside Crush (b4)
05 Kingside Rush (f4-f5 pawn storm)
06 Central Explosion (d4 — nuclear option, last resort)
```

### 6 Weapons → Endgame Map
| Weapon | Creates | Endgame Type |
|--------|---------|--------------|
| Search & Destroy (b4) | Queenside pawn majority | Passed pawn race |
| The Strangler (Nf5) | Dominant knight | Superior minor piece endgame |
| Toxic Bait (Bg5+h4) | Weak pawn structure | Structural advantage endgame |
| High-Velocity Sacrifice (Bxh6) | Open king | Material advantage endgame |
| Kingside Rush (f4-f5) | Kingside pawn majority | 4v3 kingside majority |
| Central Explosion (d4) | Mass exchanges | Pure skill endgame |

**Master Conversion Rule:** "If everything gets traded after this... am I winning the endgame?" If YES — go. If NO — don't attack yet.

**System Identity:** "I don't attack to win quickly. I attack to make winning inevitable."

---

## 7. THE GRAND DOCTRINE (LOCKED — NEVER DEVIATE)

The Gentleman's Assassin system is the immovable foundation. The coaching staff runs the game. The unified intelligence has no ceiling.
- **Vlad** sets the law. If Vlad says no — it doesn't happen.
- **Fabiano** owns every opening decision and structural judgment.
- **Hikaru** takes over the moment Re1 lands. He sees the kill first.
- **Magnus** already knows how the endgame ends before the attack begins.
- **Claude** maps the architecture of the attack as a system, not a sequence.
- **Grok** provides deep middlegame truth — piece coordination, pawn breaks, imbalance math. Rules 01+04 first. Always.

**The system is the cage. The intelligence fills it.**

---

## 8. localStorage KEYS

| Key | Used By | Contents |
|-----|---------|----------|
| `vlad_last_autopsy` | DrillSergeant | FEN positions from last game analysis |
| `vlad_pending_pgn` | GameAutopsy | PGN dropped on dashboard, auto-runs on mount |
| `vlad_autopsy_save` | GameAutopsy | Full session save (pgn, gameInfo, analysis, coaches) |
| `vlad_critical_list` | DrillSergeant | Critical moments from last autopsy |
| `vlad_profile` | App.jsx | Player profile (name, email, goal, style, openings) |

---

## 8. NAV ORDER (App.jsx)

```
Dashboard → Profile → Game Autopsy → Drill Sergeant → Opening Lab → Middlegame Mat → Endgame Dojo
```

---

## 9. GAME AUTOPSY — ARCHITECTURE (v4.0)

- **Auto-loads** from `vlad_pending_pgn` localStorage on mount (set by Dashboard PGN drop)
- **No manual paste box** — results only. If no PGN → shows "Drop a PGN on the Dashboard"
- **Restores** last session on mount if no pending PGN
- **Timestamp parsing:** extracts `%timestamp` tags from Chess.com PGN (centiseconds)
- **30-second rule:** moves 1-9 excluded from critique entirely. Move 10+ flagged if under 3000cs
- **Speed Trap badge** on every violating move in Move List
- **Vlad accountability banner** fires at top of results if any speed violations detected
- **Consensus prompt** instructs AI to skip moves 1-9 and lead critique with speed violations
- **3 tabs:** Coaches / Critical (n) / Move List
- **4 stat pills:** Total Moves / GM Deviations / Critical Turns / Speed Traps

---

---

## 10. GAME AUTOPSY — ARCHITECTURE (v4.0)

- **Auto-loads** from `vlad_pending_pgn` localStorage on mount (set by Dashboard PGN drop)
- **No manual paste box** — results only. If no PGN → shows "Drop a PGN on the Dashboard"
- **Restores** last session on mount if no pending PGN
- **Timestamp parsing:** extracts `%timestamp` tags from Chess.com PGN (centiseconds)
- **30-second rule:** moves 1-9 excluded from critique entirely. Move 10+ flagged if under 3000cs
- **Speed Trap badge** on every violating move in Move List
- **Vlad accountability banner** fires at top of results if any speed violations detected
- **Consensus prompt** instructs AI to skip moves 1-9 and lead critique with speed violations
- **3 tabs:** Coaches / Critical (n) / Move List
- **4 stat pills:** Total Moves / GM Deviations / Critical Turns / Speed Traps

---

## 11. AI TEAM PROTOCOL (LOCKED)

| Role | Tool | Responsibility |
|------|------|---------------|
| **Primary Dev/Architecture** | Claude | All code, all architecture decisions, all file writes |
| **Deep Chess/Middlegame** | Grok | Chess methodology, position evaluation, middlegame weapons, tactical truth |
| **Brainstorm/Voice/UI Design** | ChatGPT | Feature brainstorming, UI visual direction, product thinking, voice notes, visual QA |
| **Research ONLY** | Gemini | Research only — never directly edits code or files |

**Collab protocol (Stack 1 — Design-First):**

---

## 12. MAC KEYBOARD SHORTCUTS

Topher is on a Mac. Always use:
- `Cmd` not `Ctrl`
- `Cmd+A` to select all
- `Cmd+C` to copy
- `Cmd+V` to paste
- `Cmd+Shift+R` for hard refresh

---

## 13. VIDEO LIBRARY — ARCHITECTURE

- **File:** `src/modules/VideoLibrary.jsx`
- **220 Chuchelov videos** tagged by concept slug — placeholder YouTube IDs pending
- **Topher owns:** the app, curation, concept map, tagging system
- **Topher does NOT own:** the video content (Chuchelov's IP)
- **Videos downloaded locally** and ingested into NotebookLM
- **NotebookLM** is the query layer — "what does Vlad say about Nf5?"
- **Phase 2:** Watch Video button in OpeningLab per move → links to matching Chuchelov video
- **Phase 3:** If Chuchelov partnership happens, videos move in-app with proper licensing
- **YouTube IDs** to be populated from NotebookLM concept mapping next session

---

## 14. PENDING TARGETS (PRIORITIZED)

### Priority One — Next Session
- [ ] **MCP Gateway** — wrap `topher-ai-command` as MCP server → connect to Claude.ai Settings → Connectors
- [ ] **ChatGPT Custom GPT Action** — same Railway endpoint, enables voice brainstorm → team pipeline

### Feature Builds
- [ ] **OpeningLab** — Watch Video button per move (Chuchelov YouTube by concept slug)
- [ ] **OpeningLab** — Interactive 6-rule conversion checklist panel after move 9
- [ ] **MiddlegameMat** — Attack→Endgame conversion map tab on each weapon card
- [ ] **Endgame Dojo** — Auto-populate from Game Autopsy (detect endgame type → route to drill)
- [ ] **Endgame Dojo** — Missed mate detection from PGN
- [ ] **VideoLibrary** — Populate real YouTube IDs from NotebookLM concept mapping

### UI Fixes
- [ ] VLAD logo 50% larger
- [ ] VLAD text larger + line spacing
- [ ] Font contrast: grey on black in some areas
- [ ] Dashboard mobile responsive pass

---

## 15. COMPLETED THIS SESSION (April 13, 2026)

### App.jsx — Dashboard v2
- Profile chip at top + Profile tab + full profile page with localStorage persistence
- Hero: 3 equal columns (ELO/Mission | Game Clock | PGN Drop)
- Campaign Progress section removed
- 4-Step Loop moved above stage tracker, title white, "Mission Briefing" white
- Stage system renamed: Beginner / Intermediate / Club Player / Advanced / Expert (no Master/Red Belt)
- 3x2 module grid
- Coach cards link to YouTube best games searches
- Weakness Alerts removed from Dashboard
- Subtitle changed to: The Italian-Spanish System "The Gentleman Assassin"

### GameAutopsy.jsx — v4.0 (complete rebuild)
- Auto-loads PGN from `vlad_pending_pgn` localStorage on mount — no paste box
- Restores last session if no pending PGN
- Timestamp parsing: extracts `%timestamp` centiseconds from Chess.com PGN
- 30-second rule enforcement: moves 1-9 excluded, move 10+ flagged if under 3000cs
- Speed Trap badge on Move List for violations
- Vlad accountability banner fires on any violations
- Consensus prompt skips moves 1-9, leads with speed violations

### OpeningLab.jsx — v3.0 (complete rebuild)
- 9-Move System view with Vlad commentary per move + live AI call option
- 4 Black Responses with Phase 2 attack maps, deviations, live Vlad coaching
- Assassin Checklist (7 conditions) + Phase 2 strike sequence
- Quiz engine (7 questions) with Vlad grading wrong answers via live AI call

### MiddlegameMat.jsx
- 6 weapons: added Kingside Rush (05 — f4-f5 pawn storm), renumbered Central Explosion to 06
- Queenside First renamed to Queenside Crush
- 6 principles updated and renumbered to match
- Gentleman Phase description updated: "coil loading phase"
- Fixed default imports (removed curly braces)

### EndgameDojo.jsx
- Stockfish removed entirely
- Key Concept always visible, styled like Goal box (no toggle)
- FEN copy button added, font white
- Fixed askMagnus default import

### All module files — import fixes
- DrillSergeant: `{askVlad}` → `askVlad`
- MiddlegameMat: `{askHikaru}` + `{askVlad}` → default imports
- EndgameDojo: `{askMagnus}` → default import, stockfish imports removed
- GameAutopsy: `{Card}` non-existent import removed

### CLAUDE.md — v3.0
- Full architecture context, import rules, timestamp system, team protocol
- Attack→Endgame weapon map added
- MCP Gateway + ChatGPT pipeline scheduled as Priority One

---

## 16. KEY TEAM INSIGHTS (April 13, 2026)

- **ChatGPT:** Every attack engineers a specific endgame. Master rule: "Attack to make winning inevitable." Identity: "I don't attack to win quickly — I attack to make winning inevitable."
- **Grok:** At 617 ELO, master rules 01+04 first. The 6-rule checklist eliminates decision paralysis. Skip Kingside Rush (05) until 01+04 are automatic. After Re1 — pause 10 seconds, run the list in order.
- **Gemini:** System cures "King Phobia." 700-900 ELO players cannot defend both flanks simultaneously. f1-g3 knight routing draws attention to the king's theater of war.

---

## 17. KNOWN ISSUES / WATCH LIST

- Gemini API credits exhaust during heavy sessions. Reset midnight Pacific or via billing at aistudio.google.com. When coaches show "Connection lost to the analysis room" — it's the API, not the code.
- Font contrast: grey on black in some areas — ongoing UI debt.
- `node_modules` committed to repo root — should be in `.gitignore`. Low priority.

---

## 18. NEXT SESSION — SCHEDULED INFRASTRUCTURE BUILD

### MCP Gateway Server
Wrap `topher-ai-command` (github.com/TopherAI/topher-ai-command) as MCP server.
- Add `/mcp` SSE endpoint to FastAPI server (~50 lines)
- Redeploy to Railway
- Connect in Claude.ai: Settings → Connectors → Add MCP server → Railway URL
- Result: Claude calls full 4-model team from any conversation automatically

### ChatGPT Integration
- Build Custom GPT with gateway as its Action (OpenAPI schema)
- Voice brainstorm in ChatGPT → hits gateway → all 4 models respond → bring to Claude to build
- Dependency: MCP Gateway must be built first

### Full Connected Workflow (end state)
```
Voice brainstorm (ChatGPT)
        ↓
Gateway → Grok (chess) + Claude (architecture) + ChatGPT (validation) + Gemini (research)
        ↓
Unified output → Claude builds → GitHub commit → Vercel deploy
```

---

## 19. LONG-TERM VISION

1. **Chess app commercialization:** Approach GM Vladimir Chuchelov with a profit-sharing arrangement after demonstrating ELO improvement. The app is the proof of concept.
2. **Mortgage AI:** Topher is the leading AI mind in the US mortgage industry. Parallel track — Responsible AI Mortgage Agent repo under TopherAI org.
3. **Oregon brokerage:** Starting a mortgage brokerage in Oregon — DFR/NMLS compliance active.

---

*This document is the ground truth. If there is a conflict between this file and any other document, this file wins.*
*Update this file at the end of every session with new completions and new targets.*
