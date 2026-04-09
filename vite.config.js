// vite.config.js
// vlad-chess-coach — Vite Build Configuration
//
// Run with Claude Code:
//   npm install
//   npm run dev      → localhost:5173
//   npm run build    → dist/
//   npm run preview  → preview production build

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],

  // ── Path aliases ──────────────────────────────────────────────────────────
  resolve: {
    alias: {
      "@":        path.resolve(__dirname, "./src"),
      "@modules": path.resolve(__dirname, "./src/modules"),
      "@coaches": path.resolve(__dirname, "./src/coaches"),
      "@api":     path.resolve(__dirname, "./src/api"),
      "@engine":  path.resolve(__dirname, "./src/engine"),
      "@memory":  path.resolve(__dirname, "./src/memory"),
      "@utils":   path.resolve(__dirname, "./src/utils"),
      "@data":    path.resolve(__dirname, "./data"),
    },
  },

  // ── Dev server ────────────────────────────────────────────────────────────
  server: {
    port: 5173,
    open: true,   // auto-open browser on npm run dev
    // Proxy Chess.com API to avoid CORS in dev
    proxy: {
      "/chesscom-api": {
        target: "https://api.chess.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/chesscom-api/, "/pub"),
      },
    },
  },

  // ── Build ─────────────────────────────────────────────────────────────────
  build: {
    outDir:    "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        // Split vendor chunks for faster loads
        manualChunks: {
          react:    ["react", "react-dom"],
          chessjs:  [],   // loaded via CDN — no bundle needed
        },
      },
    },
  },

  // ── Optimizations ─────────────────────────────────────────────────────────
  optimizeDeps: {
    // chess.js and chessboard.js load via CDN globals
    // Stockfish loads as a Web Worker — no bundling
    exclude: ["stockfish"],
  },

  // ── Public assets ─────────────────────────────────────────────────────────
  publicDir: "public",

  // ── Env variables ─────────────────────────────────────────────────────────
  // Access in app via: import.meta.env.VITE_*
  // Required env vars (create .env file):
  //   VITE_GEMINI_API_KEY=your_key_here
  //   VITE_YOUTUBE_API_KEY=your_key_here
});
