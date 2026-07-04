// public/stockfish-worker.js
// UCI glue between the main thread and the Stockfish WASM build in
// public/stockfish.js. Served verbatim by Vite (public/ files aren't
// bundled), which avoids the usual Vite/WASM/Worker bundling headaches.
//
// public/stockfish.js is the niklasf/stockfish.wasm Emscripten build.
// Its top-level `Stockfish` value is `Module.ready`, a Promise that
// resolves to the engine module (postMessage/addMessageListener) — not a
// callable factory. See public/stockfish.js's closing lines.
importScripts('/stockfish.js');

Stockfish.then((engine) => {
  engine.addMessageListener((line) => self.postMessage(line));
  self.onmessage = (e) => engine.postMessage(e.data);
  engine.postMessage('uci');
}).catch((err) => {
  self.postMessage('error: stockfish engine failed to initialize: ' + err);
});
