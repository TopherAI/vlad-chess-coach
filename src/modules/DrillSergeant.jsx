// Add this useEffect inside DrillSergeant, replacing the empty initialDrills check
useEffect(() => {
  if (initialDrills.length > 0) return;
  try {
    const raw = localStorage.getItem("vlad_last_autopsy");
    if (!raw) return;
    const saved = JSON.parse(raw);
    const moves = saved?.analysis?.moves ?? [];
    const fens  = saved?.analysis?.fens  ?? [];
    const worst = moves.filter(m => ["blunder", "mistake"].includes(m.classification));
    const built = worst
      .filter(m => m.bestMove && fens[m.moveIndex])
      .map((m, i) => ({
        id:             `autopsy-${i}`,
        source:         "autopsy",
        fen:            fens[m.moveIndex],
        solutionMove:   m.bestMove,
        playerMove:     m.actualMove,
        classification: m.classification,
        cpLoss:         m.cpLoss,
        moveNumber:     m.moveNumber,
        side:           m.side,
        weaknessTag:    m.moveNumber >= 8 && m.moveNumber <= 12
                          ? "Move 9 Speed Trap"
                          : m.cpLoss > 200 ? "Missing Forcing Moves" : null,
        attempted:      false,
        solved:         false,
      }));
    if (built.length > 0) setDrills(built);
  } catch { /* fail silently */ }
}, []);
