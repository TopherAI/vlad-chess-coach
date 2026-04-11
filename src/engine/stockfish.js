// Inside analyzeGame, add fenBefore to each result push:
results.push({
  moveIndex:      i,
  moveNumber:     Math.floor(i / 2) + 1,
  side:           i % 2 === 0 ? 'white' : 'black',
  actualMove,
  bestMove,
  evalBefore,
  evalAfter,
  cpLoss,
  classification,
  label:          getEvalLabel(evalAfter),
  fen:            fenBefore,   // ← ADD THIS
});
