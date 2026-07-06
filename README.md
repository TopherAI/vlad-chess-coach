# CHESSai-web

Web companion to the native [CHESSai](https://github.com/TopherAI/CHESSai) iOS app — an AI chess coaching app built around the Gentleman's Assassin opening system.

See `CLAUDE.md` for full project context, architecture, and history. Formerly "Vlad Chess Coach" — see `CLAUDE.md` §21 for the identity rename, and `archive/pre-chessai-port/` for historical pre-port docs.

## Stack

React + Vite + TypeScript, chess.js, real Stockfish (WASM), Chess.com public API. Deployed on Vercel, AI calls routed through the [TopherAI ai-gateway](https://github.com/TopherAI/ai-gateway).

## Development

```bash
npm install
npm run dev
```
