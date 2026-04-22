// vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@modules": path.resolve(__dirname, "./src/modules"),
        "@coaches": path.resolve(__dirname, "./src/coaches"),
        "@api": path.resolve(__dirname, "./src/api"),
        "@engine": path.resolve(__dirname, "./src/engine"),
        "@memory": path.resolve(__dirname, "./src/memory"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@data": path.resolve(__dirname, "./data"),
      },
    },
    server: {
      port: 5173,
      open: true,
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless",
      },
      proxy: {
        "/chesscom-api": {
          target: "https://api.chess.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/chesscom-api/, "/pub"),
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            chessjs: [],
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ["stockfish", "stockfish.wasm"],
    },
    publicDir: "public",
  };
});
