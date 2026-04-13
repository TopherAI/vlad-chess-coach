import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import askVlad from "../coaches/vlad.jsx";
import askFabiano from "../coaches/fabiano.jsx";

/**
 * VLAD CHESS COACH: GAME AUTOPSY
 * Focus: 2% Daily Improvement through precision post-game analysis.
 * Integrity Check: Imports verified against default exports in coaches/ directory.
 */

const GameAutopsy = () => {
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeCoach, setActiveCoach] = useState("vlad");

  const runAnalysis = async (pgn) => {
    if (!pgn) return;
    setIsAnalyzing(true);
    try {
      // Gateway verified: Using default imports as function calls
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
    <div className="flex flex-col gap-4 p-4 bg-black text-white min-h-screen font-sans">
      <Card className="p-6 bg-zinc-900 border-zinc-800 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black tracking-tighter uppercase italic">
            Post-Game Autopsy
          </h2>
          <div className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
            Phase: Opening Lab Integration
          </div>
        </div>
        
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setActiveCoach("vlad")}
            className={`flex-1 py-3 rounded-none text-xs font-bold uppercase tracking-widest transition-all ${
              activeCoach === 'vlad' 
                ? 'bg-white text-black scale-105' 
                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
            }`}
          >
            Deploy Vlad
          </button>
          <button 
            onClick={() => setActiveCoach("fabiano")}
            className={`flex-1 py-3 rounded-none text-xs font-bold uppercase tracking-widest transition-all ${
              activeCoach === 'fabiano' 
                ? 'bg-white text-black scale-105' 
                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
            }`}
          >
            Deploy Fabiano
          </button>
        </div>

        <div className="relative bg-black border border-zinc-800 p-5 rounded-sm min-h-[300px]">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <div className="text-zinc-500 text-xs font-mono animate-pulse uppercase tracking-widest">
                Reviewing footage...
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-300">
              {analysis || "Awaiting PGN input for tactical breakdown."}
            </div>
          )}
        </div>
      </Card>

      <div className="mt-4 p-4 border border-zinc-900 rounded bg-zinc-950/50">
        <h4 className="text-[10px] text-zinc-600 font-bold uppercase mb-2 tracking-widest">System Comms</h4>
        <p className="text-xs text-zinc-500 italic">"Precision beats power, and timing beats speed."</p>
      </div>
    </div>
  );
};

export default GameAutopsy;
