// src/modules/GameAutopsy.jsx
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import askVlad from "../coaches/vlad.jsx";
import askFabiano from "../coaches/fabiano.jsx";

const GameAutopsy = () => {
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeCoach, setActiveCoach] = useState("vlad");

  const runAnalysis = async (pgn) => {
    if (!pgn) return;
    setIsAnalyzing(true);
    try {
      const response = activeCoach === "vlad" 
        ? await askVlad(pgn) 
        : await askFabiano(pgn);
      setAnalysis(response);
    } catch (error) {
      console.error("Analysis failure:", error);
      setAnalysis("Build breach. Check personality module exports.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-black text-white min-h-screen">
      <Card className="p-6 bg-zinc-900 border-zinc-800 shadow-2xl">
        <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-6">Post-Game Autopsy</h2>
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setActiveCoach("vlad")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeCoach === 'vlad' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}
          >
            Deploy Vlad
          </button>
          <button 
            onClick={() => setActiveCoach("fabiano")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeCoach === 'fabiano' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}
          >
            Deploy Fabiano
          </button>
        </div>
        <div className="bg-black border border-zinc-800 p-5 rounded-sm min-h-[300px] font-mono text-sm text-zinc-3
