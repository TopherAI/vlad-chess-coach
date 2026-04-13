import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import askVlad from "../coaches/vlad.jsx";
import askFabiano from "../coaches/fabiano.jsx";
import askHikaru from "../coaches/hikaru.jsx";
import askMagnus from "../coaches/magnus.jsx";

const GameAutopsy = () => {
  const [pgn, setPgn] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeCoach, setActiveCoach] = useState("vlad");

  const runAnalysis = async () => {
    if (!pgn.trim()) return;
    setIsAnalyzing(true);
    try {
      const coaches = {
        vlad: askVlad,
        fabiano: askFabiano,
        hikaru: askHikaru,
        magnus: askMagnus
      };
      const response = await coaches[activeCoach](pgn);
      setAnalysis(response);
    } catch (error) {
      console.error("Analysis failure:", error);
      setAnalysis("Build breach. Verify personality module exports.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-black text-white min-h-screen font-sans">
      <Card className="p-6 bg-zinc-900 border-zinc-800 shadow-2xl rounded-none">
        <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-6 text-white">Post-Game Autopsy</h2>
        
        <div className="space-y-4 mb-6">
          <textarea
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            placeholder="Paste PGN here for tactical breakdown..."
            className="w-full h-32 bg-black border border-zinc-800 p-3 font-mono text-sm text-zinc-300 focus:outline-none focus:border-white transition-all"
          />
          
          <div className="grid grid-cols-2 gap-2">
            {['vlad', 'fabiano', 'hikaru', 'magnus'].map((coach) => (
              <button 
                key={coach}
                onClick={() => setActiveCoach(coach)}
                className={`py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  activeCoach === coach ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                }`}
              >
                {coach}
              </button>
            ))}
          </div>

          <button
            onClick={runAnalysis}
            disabled={isAnalyzing || !pgn.trim()}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 font-black uppercase tracking-widest transition-all"
          >
            {isAnalyzing ? "Analyzing Failure Points..." : "Commence Autopsy"}
          </button>
        </div>

        <div className="bg-black border border-zinc-800 p-5 rounded-none min-h-[300px] font-mono text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {analysis || "Awaiting target PGN for mission debrief."}
        </div>
      </Card>
    </div>
  );
};

export default GameAutopsy;
