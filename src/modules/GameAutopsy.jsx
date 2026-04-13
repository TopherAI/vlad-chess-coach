import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { askVlad } from "../coaches/vlad.jsx";
import { askFabiano } from "../coaches/fabiano.jsx";

/**
 * VLAD CHESS COACH: GAME AUTOPSY
 * Goal: 2% Daily Improvement through precision analysis.
 * Performance: Optimized for Apple/Vercel ecosystem.
 */

const GameAutopsy = () => {
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeCoach, setActiveCoach] = useState("vlad");

  const runAnalysis = async (pgn) => {
    setIsAnalyzing(true);
    try {
      // Direct call to personality modules
      const response = activeCoach === "vlad" 
        ? await askVlad(pgn) 
        : await askFabiano(pgn);
      setAnalysis(response);
    } catch (error) {
      console.error("Analysis Breach:", error);
      setAnalysis("Technical failure in the analysis room. Reset the board.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-black text-white min-h-screen">
      <Card className="p-6 bg-zinc-900 border-zinc-800">
        <h2 className="text-2xl font-bold mb-4 tracking-tighter uppercase">
          Post-Game Autopsy
        </h2>
        
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setActiveCoach("vlad")}
            className={`px-4 py-2 rounded text-xs font-bold ${activeCoach === 'vlad' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'}`}
          >
            VLAD (Tactical)
          </button>
          <button 
            onClick={() => setActiveCoach("fabiano")}
            className={`px-4 py-2 rounded text-xs font-bold ${activeCoach === 'fabiano' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'}`}
          >
            FABI (Positional)
          </button>
        </div>

        <div className="bg-black border border-zinc-800 p-4 rounded-md min-h-[200px] font-mono text-sm">
          {isAnalyzing ? (
            <div className="animate-pulse text-zinc-500 italic">Vlad is reviewing the footage...</div>
          ) : (
            <div className="whitespace-pre-wrap">{analysis || "Awaiting PGN input for breakdown."}</div>
          )}
        </div>
      </Card>

      <div className="text-[10px] text-zinc-600 uppercase tracking-widest text-center">
        TopherAI / Vlad-Chess-Coach / v1.0.4
      </div>
    </div>
  );
};

export default GameAutopsy;
