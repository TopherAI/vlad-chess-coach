01 /**
02  * src/modules/GameAutopsy.jsx
03  * vlad-chess-coach — Game Autopsy Terminal
04  * MISSION: AI Consensus Protocol & Manual PGN Analysis
05  */
06 
07 import { useState, useCallback, useRef, useEffect } from "react";
08 import askVlad from "../coaches/vlad.jsx";
09 import askFabiano from "../coaches/fabiano.jsx";
10 import askHikaru from "../coaches/hikaru.jsx";
11 import askMagnus from "../coaches/magnus.jsx";
12 
13 const STORAGE_KEY = "vlad_last_autopsy";
14 
15 export default function GameAutopsy() {
16   const [phase, setPhase] = useState("idle");
17   const [pgn, setPgn] = useState("");
18   const [coaches, setCoaches] = useState({ vlad: null, fabiano: null, hikaru: null, magnus: null });
19   const [loading, setLoading] = useState(false);
20   const runBtnRef = useRef(null);
21 
22   useEffect(() => {
23     const saved = localStorage.getItem(STORAGE_KEY);
24     if (saved) {
25       try {
26         const data = JSON.parse(saved);
27         setPgn(data.pgn || "");
28         setCoaches(data.coaches || {});
29         setPhase("done");
30       } catch (e) { console.error("Cache clear"); }
31     }
32   }, []);
33 
34   const handleKeyDown = (e) => {
35     if (e.key === "Enter" && !e.shiftKey) {
36       e.preventDefault();
37       if (pgn.trim() && phase === "idle") runAutopsy();
38     }
39   };
40 
41   const runAutopsy = useCallback(async () => {
42     if (!pgn.trim()) return;
43     setPhase("coaching");
44     setLoading(true);
45 
46     try {
47       const stats = { accuracy: 75, playerSide: "white" };
48       const game = { white: "TopherBettis", black: "Opponent", result: "1-0", pgn };
49 
50       const [v, f, h, m] = await Promise.all([
51         askVlad(stats, game),
52         askFabiano(stats, game),
53         askHikaru(stats, game),
54         askMagnus(stats, game)
55       ]);
56 
57       const results = { vlad: v, fabiano: f, hikaru: h, magnus: m };
58       setCoaches(results);
59       localStorage.setItem(STORAGE_KEY, JSON.stringify({ pgn, coaches: results }));
60       setPhase("done");
61     } catch (err) {
62       console.error("Autopsy Failed:", err);
63       setPhase("idle");
64     } finally {
65       setLoading(false);
66     }
67   }, [pgn]);
68 
69   return (
70     <div style={styles.root}>
71       <h1 style={styles.title}>🔬 Game Autopsy</h1>
72       {phase === "idle" && (
73         <div style={styles.inputArea}>
74           <textarea
75             style={styles.pgnInput}
76             value={pgn}
77             onChange={(e) => setPgn(e.target.value)}
78             onKeyDown={handleKeyDown}
79             placeholder="Paste PGN and hit [Enter]..."
80             rows={10}
81           />
82           <button ref={runBtnRef} style={styles.btn} onClick={runAutopsy}>Analyze</button>
83         </div>
84       )}
85       {loading && <p style={styles.loading}>Coaching team assembling consensus...</p>}
86       {phase === "done" && (
87         <div style={styles.results}>
88           {['vlad', 'fabiano', 'hikaru', 'magnus'].map(key => (
89             <div key={key} style={styles.card}>
90               <h3 style={styles.coachHeader}>{key.toUpperCase()}</h3>
91               <p style={styles.coachText}>{coaches[key]}</p>
92             </div>
93           ))}
94           <button style={styles.btnSmall} onClick={() => setPhase("idle")}>＋ New Analysis</button>
95         </div>
96       )}
97     </div>
98   );
99 }
100 
101 const styles = {
102   root: { padding: 40, maxWidth: 850, margin: "0 auto", backgroundColor: "#0d0d0d", color: "#e8e8e8", minHeight: "100vh", fontFamily: "monospace" },
103   title: { fontSize: 28, borderBottom: "1px solid #222", paddingBottom: 20, marginBottom: 30 },
104   inputArea: { display: "flex", flexDirection: "column", gap: 16 },
105   pgnInput: { width: "100%", backgroundColor: "#111", border: "1px solid #333", color: "#ccc", padding: 16, borderRadius: 8, outline: "none", resize: "none" },
106   btn: { padding: "14px 28px", backgroundColor: "#c0392b", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer", alignSelf: "flex-start" },
107   btnSmall: { marginTop: 20, padding: "10px 20px", backgroundColor: "#333", border: "none", color: "#eee", cursor: "pointer", borderRadius: 4 },
108   loading: { color: "#f39c12", paddingTop: 40, textAlign: "center" },
109   results: { display: "flex", flexDirection: "column", gap: 16 },
110   card: { backgroundColor: "#111", border: "1px solid #222", padding: 20, borderRadius: 8 },
111   coachHeader: { margin: "0 0 10px 0", fontSize: 16, color: "#aaa" },
112   coachText: { margin: 0, lineHeight: 1.6, fontSize: 14 }
113 };
