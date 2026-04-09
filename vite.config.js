// vite.config.js
// vlad-chess-coach — Vite Build Configuration
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
    open: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
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
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
  },

  // ── Optimizations ─────────────────────────────────────────────────────────
  optimizeDeps: {
    exclude: ["stockfish", "stockfish.wasm"],
  },

  // ── Public assets ─────────────────────────────────────────────────────────
  publicDir: "public",
});
