import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { BookOpen, Target, RotateCcw, CheckCircle2, XCircle, ChevronRight, Play, Activity, Trophy, Star, Flame, LogOut, Zap, BrainCircuit, Download, User as UserIcon, X, Clock, Palette } from 'lucide-react';
import Markdown from 'react-markdown';
import { auth, db, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { getAICoachTip, sendMessageToCaruana, analyzePgnAndExpandRepertoire } from './gemini';

const repertoire = [
  {
    id: 'italian',
    name: 'Mirror Italian (Guioco Pianissimo)',
    description: 'e4 Nf3 Bc4 c3 d3 a4 O-O h3 Re1',
    moves: ["e4","e5","Nf3","Nc6","Bc4","Bc5","c3","Nf6","d3","d6","a4","a6","O-O","O-O","h3","h6","Re1"],
    attempts: 52, perfectSessions: 52
  },
  {
    id: 'four-knights',
    name: 'Four Knights (Gentleman Assassin)',
    description: 'e4 Nf3 Bc4 d3 c3 a4 O-O h3 Re1',
    moves: ["e4","e5","Nf3","Nc6","Bc4","Nf6","d3","Bc5","c3","d6","a4","a6","O-O","O-O","h3","h6","Re1"],
    attempts: 45, perfectSessions: 45
  },
  {
    id: 'petrov',
    name: 'Petrov (The Refusal)',
    description: 'e4 Nf3 Bc4 d3 Nxe5 Bb3 Bf4 O-O Re1 a4 h3',
    moves: ["e4","e5","Nf3","Nf6","Bc4","Nxe4","d3","Nf6","Nxe5","d5","Bb3","Bd6","Bf4","O-O","O-O","Re8","Re1","a6","a4","h6","h3"],
    attempts: 25, perfectSessions: 25
  },
  {
    id: 'duras-gambit',
    name: 'Dúras Gambit (Blunder)',
    description: 'e4 exf5 Nf3 Bc4 d3 c3 a4 O-O h3 Re1',
    moves: ["e4","f5","exf5","Nf6","Nf3","e6","Bc4","d6","d3","Be7","c3","O-O","a4","a6","O-O","Nc6","h3","Kh8","Re1"],
    attempts: 25, perfectSessions: 25
  },
  {
    id: 'sicilian',
    name: 'Sicilian (Bowdler Bypass)',
    description: 'e4 Nf3 Bc4 c3 d3 O-O h3 a4 Re1',
    moves: ["e4","c5","Nf3","d6","Bc4","e6","c3","Nf6","d3","Be7","O-O","O-O","a4","a6","h3","Nc6","Re1"],
    attempts: 40, perfectSessions: 40
  },
  {
    id: 'french',
    name: 'French (Two Horses)',
    description: 'KIA: e4 d3 Nd2 Ngf3 g3 Bg2 O-O Re1 c3',
    moves: ["e4","e6","d3","d5","Nd2","c5","Ngf3","Nc6","g3","Bd6","Bg2","Nge7","O-O","O-O","Re1","a6","c3"],
  },
  {
    id: 'caro-kann',
    name: 'Caro-Kann (Two Horses II)',
    description: 'KIA: e4 d3 Nd2 Ngf3 g3 Bg2 O-O Re1 c3',
    moves: ["e4","c6","d3","d5","Nd2","e5","Ngf3","Bd6","g3","Nf6","Bg2","O-O","O-O","Re8","Re1","Nbd7","c3"],
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian Defense',
    description: 'e4 exd5 Nf3 Bc4 d3 c3 O-O h3 Re1',
    moves: ["e4","d5","exd5","Qxd5","Nf3","Nf6","Bc4","e6","d3","Qd6","c3","Be7","O-O","O-O","h3","a6","Re1"],
  }
];

const getBelt = (sessions) => {
  if (sessions < 20) return { name: 'White Belt', color: 'text-gray-100', bg: 'bg-gray-100', border: 'border-gray-300', hex: '#9ca3af' };
  if (sessions < 40) return { name: 'Blue Belt', color: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-600', hex: '#3b82f6' };
  if (sessions < 60) return { name: 'Purple Belt', color: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-600', hex: '#a855f7' };
  if (sessions < 80) return { name: 'Brown Belt', color: 'text-amber-700', bg: 'bg-amber-700', border: 'border-amber-800', hex: '#b45309' };
  if (sessions < 100) return { name: 'Black Belt', color: 'text-gray-900', bg: 'bg-gray-900', border: 'border-gray-500', hex: '#1f2937' };
  if (sessions < 1000) return { name: 'Red Belt', color: 'text-red-600', bg: 'bg-red-600', border: 'border-red-700', hex: '#dc2626' };
  return { name: 'Coral Belt', color: 'text-red-500', bg: 'bg-gradient-to-r from-red-600 to-gray-900', border: 'border-red-700', hex: '#ef4444' };
};

const getEloTitle = (rating) => {
  if (rating < 1200) return 'Beginner';
  if (rating < 1600) return 'Intermediate';
  if (rating < 2000) return 'Advanced';
  if (rating < 2200) return 'Expert';
  return 'Master';
};

const getEloColor = (rating) => {
  if (rating < 1200) return 'text-gray-100';
  if (rating < 1600) return 'text-blue-500';
  if (rating < 2000) return 'text-purple-500';
  if (rating < 2200) return 'text-amber-700';
  return 'text-gray-900';
};

const formatTitle = (name) => {
  const match = name.match(/^(.*?)\s*\((.*)\)$/);
  return match ? match[1] : name;
};

const formatSubtitle = (name, description) => {
  const match = name.match(/^(.*?)\s*\((.*)\)$/);
  return match ? match[2] : description;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [repertoireState, setRepertoireState] = useState(() => {
    const saved = localStorage.getItem('opening_lab_repertoire');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = repertoire.map(defaultOp => {
          const savedOp = parsed.find(p => p.id === defaultOp.id);
          return savedOp ? {
            ...savedOp,
            name: defaultOp.name,
            description: defaultOp.description,
            moves: defaultOp.moves,
            attempts: Math.max(defaultOp.attempts || 0, savedOp.attempts || 0),
            perfectSessions: Math.max(defaultOp.perfectSessions || 0, savedOp.perfectSessions || 0)
          } : { ...defaultOp };
        });
        const customLines = parsed.filter(p => !repertoire.some(d => d.id === p.id));
        return [...merged, ...customLines];
      } catch (e) { return repertoire; }
    }
    return repertoire;
  });
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('opening_lab_streak') || '1'));
  const [aiCoachTip, setAiCoachTip] = useState(null);
  const [isGettingTip, setIsGettingTip] = useState(false);
  const [game, setGame] = useState(new Chess());
  const [currentOpening, setCurrentOpening] = useState(repertoire[0]);
  const [moveIndex, setMoveIndex] = useState(0);
  const [feedback, setFeedback] = useState({ type: 'idle', message: 'Make your first move.' });
  const [arrows, setArrows] = useState([]);
  const [currentErrors, setCurrentErrors] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [trainingMode, setTrainingMode] = useState('single');
  const [activeLines, setActiveLines] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('opening_lab_theme') || 'dark');
  const [importPgn, setImportPgn] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [chatHistory, setChatHistory] = useState([{ role: 'model', parts: [{ text: "I'm Fabiano Caruana. What questions do you have about this position?" }] }]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatHistory]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;
    const userMessage = chatInput;
    setChatInput('');
    const newHistory = [...chatHistory, { role: 'user', parts: [{ text: userMessage }] }];
    setChatHistory(newHistory);
    setIsChatting(true);
    const response = await sendMessageToCaruana(newHistory.slice(1), userMessage, game.fen(), currentOpening.name);
    setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
    setIsChatting(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('opening_lab_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    const userRef = doc(db, 'users', user.uid);
    const repertoireRef = collection(db, `users/${user.uid}/repertoire`);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStreak(data.streak || 1);
        const today = new Date().toDateString();
        if (data.lastLogin !== today) {
          let s = data.streak || 0;
          if (data.lastLogin) {
            const last = new Date(data.lastLogin);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            s = last.toDateString() === yesterday.toDateString() ? s + 1 : 1;
          } else { s = 1; }
          setDoc(userRef, { lastLogin: today, streak: s }, { merge: true });
        }
      } else {
        setDoc(userRef, { uid: user.uid, rating: 1200, streak: 1, lastLogin: new Date().toDateString() });
      }
    });
    const unsubRep = onSnapshot(repertoireRef, (snapshot) => {
      const savedOps = snapshot.docs.map(d => d.data());
      setRepertoireState(prev => {
        const merged = repertoire.map(defaultOp => {
          const savedOp = savedOps.find(p => p.id === defaultOp.id);
          const attempts = Math.max(defaultOp.attempts || 0, savedOp?.attempts || 0);
          const perfectSessions = Math.max(defaultOp.perfectSessions || 0, savedOp?.perfectSessions || 0);
          return savedOp ? { ...savedOp, name: defaultOp.name, description: defaultOp.description, moves: defaultOp.moves, attempts, perfectSessions } : { ...defaultOp, attempts, perfectSessions };
        });
        const customLines = savedOps.filter(p => !repertoire.some(d => d.id === p.id));
        return [...merged, ...customLines];
      });
    });
    return () => { unsubUser(); unsubRep(); };
  }, [user, isAuthReady]);

  useEffect(() => { localStorage.setItem('opening_lab_repertoire', JSON.stringify(repertoireState)); }, [repertoireState]);
  useEffect(() => { localStorage.setItem('opening_lab_streak', streak.toString()); }, [streak]);

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }, []);

  const resetTrainer = useCallback((opening, mode = 'single') => {
    setGame(new Chess()); setMoveIndex(0);
    setFeedback({ type: 'idle', message: 'Make your first move.' });
    setArrows([]); setCurrentErrors(0); setSessionCompleted(false);
    setAiCoachTip(null); setTrainingMode(mode);
    setTimeLimit(30); setTimeLeft(30); setIsTimerRunning(false);
    if (mode === 'all') {
      setActiveLines(repertoireState);
      if (repertoireState.length > 0) setCurrentOpening(repertoireState[0]);
    } else {
      const targetId = opening ? opening.id : currentOpening.id;
      const freshOp = repertoireState.find(r => r.id === targetId) || opening || currentOpening;
      setCurrentOpening(freshOp); setActiveLines([freshOp]);
    }
  }, [currentOpening, repertoireState]);

  const completeSession = useCallback(() => {
    if (sessionCompleted) return;
    setSessionCompleted(true); setIsTimerRunning(false);
    const isPerfect = currentErrors === 0 && timeLeft > 0;
    setFeedback({ type: 'completed', message: isPerfect ? 'Perfect session! +1 to mastery.' : 'Line completed! Try for a perfect run next time.' });
    setRepertoireState(prev => {
      const newRep = [...prev];
      activeLines.forEach(line => {
        const index = newRep.findIndex(op => op.id === line.id);
        if (index !== -1) {
          const updated = { ...newRep[index], attempts: (newRep[index].attempts || 0) + 1, perfectSessions: (newRep[index].perfectSessions || 0) + (isPerfect ? 1 : 0) };
          newRep[index] = updated;
          if (user) {
            const opRef = doc(db, `users/${user.uid}/repertoire`, updated.id);
            const dataToSave = { ...updated };
            if (dataToSave.theory === undefined) delete dataToSave.theory;
            setDoc(opRef, dataToSave, { merge: true });
          }
        }
      });
      return newRep;
    });
  }, [sessionCompleted, currentErrors, activeLines, user, timeLeft]);

  useEffect(() => {
    let timer;
    if (isTimerRunning && timeLeft > 0 && !sessionCompleted) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !sessionCompleted) {
      setIsTimerRunning(false); setCurrentErrors(prev => prev + 1);
      setFeedback({ type: 'error', message: 'Time is up!' }); playBeep(); completeSession();
      setTimeout(() => { setTimeLimit(30); setTimeLeft(30); }, 2000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft, sessionCompleted, completeSession, playBeep]);

  useEffect(() => {
    if (!user) return;
    if (repertoireState.length > 0 && activeLines.length === 0) resetTrainer(repertoireState[0], 'single');
  }, [user, repertoireState.length]);

  useEffect(() => {
    if (moveIndex > 0 && moveIndex % 2 !== 0 && !sessionCompleted) {
      const possibleBlackMoves = Array.from(new Set(activeLines.map(line => line.moves[moveIndex]).filter(Boolean)));
      if (possibleBlackMoves.length > 0) {
        const timer = setTimeout(() => {
          const chosenMove = possibleBlackMoves[Math.floor(Math.random() * possibleBlackMoves.length)];
          const nextLines = activeLines.filter(line => line.moves[moveIndex] === chosenMove);
          const gameCopy = new Chess(game.fen());
          gameCopy.move(chosenMove);
          setGame(gameCopy); setMoveIndex(moveIndex + 1); setActiveLines(nextLines);
          if (nextLines.length === 1) setCurrentOpening(nextLines[0]);
          setFeedback({ type: 'idle', message: 'Your turn.' });
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [moveIndex, activeLines, game, sessionCompleted]);

  useEffect(() => {
    if (moveIndex > 0 && !sessionCompleted) {
      const hasMoreMoves = activeLines.some(line => line.moves.length > moveIndex);
      if (!hasMoreMoves) completeSession();
    }
  }, [moveIndex, activeLines, sessionCompleted, completeSession]);

  function onDrop(sourceSquare, targetSquare, piece) {
    if (feedback.type === 'completed' || timeLeft === 0 || moveIndex % 2 !== 0) return false;
    const gameCopy = new Chess(game.fen());
    let moveAttempt;
    try { moveAttempt = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: piece[1]?.toLowerCase() ?? 'q' }); } catch (e) { return false; }
    if (!moveAttempt) return false;
    const validLines = activeLines.filter(line => line.moves[moveIndex] === moveAttempt.san);
    if (validLines.length > 0) {
      setGame(gameCopy); setMoveIndex(moveIndex + 1); setActiveLines(validLines);
      if (validLines.length === 1) setCurrentOpening(validLines[0]);
      setFeedback({ type: 'success', message: 'Correct move!' }); setArrows([]);
      return true;
    } else {
      setCurrentErrors(prev => prev + 1);
      setFeedback({ type: 'error', message: 'Incorrect move. Try again.' });
      return false;
    }
  }

  function showHint() {
    if (moveIndex % 2 !== 0) return;
    const expectedMove = activeLines[0]?.moves[moveIndex];
    if (!expectedMove) return;
    const tempGame = new Chess(game.fen());
    const moveObj = tempGame.move(expectedMove);
    if (moveObj) { setArrows([[moveObj.from, moveObj.to]]); setFeedback({ type: 'idle', message: `Hint: Play ${expectedMove}` }); }
  }

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const newVariation = await analyzePgnAndExpandRepertoire(importPgn);
      if (newVariation) {
        const newLine = { id: `imported-${Date.now()}`, name: newVariation.name, description: newVariation.description, moves: newVariation.moves, attempts: 0, perfectSessions: 0 };
        const updatedRep = [...repertoireState, newLine];
        setRepertoireState(updatedRep);
        if (user) await setDoc(doc(db, `users/${user.uid}/repertoire`, newLine.id), newLine);
        setShowImportModal(false); setImportPgn(''); resetTrainer(newLine, 'single');
      } else { alert("Failed to analyze PGN."); }
    } catch (e) { alert("Failed to analyze PGN."); } finally { setIsImporting(false); }
  };

  const handleGetTip = async () => {
    setIsGettingTip(true);
    const tip = await getAICoachTip(currentOpening.name, currentOpening.moves.slice(0, moveIndex));
    setAiCoachTip(tip); setIsGettingTip(false);
  };

  // if (!isAuthReady) return <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-main)]">Loading...</div>;

  const totalPercentComplete = repertoireState.reduce((sum, op) => sum + Math.min(100, op.perfectSessions || 0), 0) / repertoireState.length;
  const elo = Math.floor(1000 + (totalPercentComplete / 100) * 1500);
  const eloTitle = getEloTitle(elo);
  const eloColor = getEloColor(elo);
  const mastery = Math.round(totalPercentComplete);
  const currentBelt = getBelt(currentOpening.perfectSessions || 0);
  const highestPerfectSessions = Math.max(0, ...repertoireState.map(op => op.perfectSessions || 0));
  const highestBelt = getBelt(highestPerfectSessions);

  if (false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-main)] font-sans p-4">
        <div className="bg-[var(--color-card-bg)] p-8 rounded-2xl border border-[var(--color-border)] max-w-md w-full text-center">
          <div className="text-3xl font-extrabold tracking-[2px] mb-2">OPENING<span className={eloColor}>LAB</span></div>
          <p className="text-[var(--color-text-dim)] mb-8">Master your repertoire with spaced repetition and AI analysis.</p>
          <button onClick={loginWithGoogle} className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors">
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans relative transition-colors duration-500 bg-[var(--color-bg)] text-[var(--color-text-main)]">
      {theme === 'dark' && (
        <div className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1516483638261-f40af5ee22dd?q=80&w=2000&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}
      <div className="relative z-10 flex flex-row flex-grow text-[var(--color-text-main)] h-screen overflow-hidden">
        <aside className="w-[60px] lg:w-[220px] flex-shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-sm py-6 px-3 justify-between transition-all duration-300">
          <div className="flex flex-col gap-8">
            <div className="text-lg font-extrabold tracking-[2px] hidden lg:block text-center mb-2">OPENING<span className={eloColor}>LAB</span></div>
            <div className="text-lg font-extrabold tracking-[2px] lg:hidden text-center mb-2">O<span className={eloColor}>L</span></div>
            <div className="flex flex-col gap-6 text-xs font-semibold uppercase text-[var(--color-text-dim)]">
              <div className="flex items-center gap-3 justify-center lg:justify-start px-2">
                <Activity className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0" />
                <span className="hidden lg:flex flex-col">Elo <span className={`text-[10px] ${eloColor}`}>{elo} ({eloTitle})</span></span>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start px-2">
                <Target className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0" />
                <span className="hidden lg:flex flex-col">Mastery <span className="text-[var(--color-text-main)] text-[10px]">{mastery}%</span></span>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start px-2">
                <Flame className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0" />
                <span className="hidden lg:flex flex-col">Streak <span className="text-[var(--color-text-main)] text-[10px]">{streak} {streak === 1 ? 'Day' : 'Days'}</span></span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex items-center gap-3 p-3 lg:px-4 rounded-xl hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] w-full justify-center lg:justify-start">
              <Palette className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:inline text-xs font-bold uppercase">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-3 p-3 lg:px-4 rounded-xl hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] w-full justify-center lg:justify-start">
              {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-5 h-5 rounded flex-shrink-0" referrerPolicy="no-referrer" /> : <UserIcon className="w-5 h-5 flex-shrink-0" />}
              <span className="hidden lg:inline text-xs font-bold uppercase">Profile</span>
            </button>
            <button onClick={logout} className="flex items-center gap-3 p-3 lg:px-4 rounded-xl hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] w-full justify-center lg:justify-start">
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:inline text-xs font-bold uppercase">Sign Out</span>
            </button>
          </div>
        </aside>

        <main className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 p-4 lg:p-8 flex-grow overflow-y-auto w-full">
          <div className="flex flex-col gap-4 items-stretch">
            <div className="bg-[var(--color-card-bg)] rounded-xl border border-[var(--color-border)] p-6 flex flex-col items-center justify-start relative flex-grow overflow-hidden w-full">
              <div className="w-full flex flex-col items-center relative z-10 h-full">
                <div className="w-full mb-6 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-1">{formatTitle(currentOpening.name)}</h2>
                    <p className={`text-sm ${currentBelt.color}`}>{formatSubtitle(currentOpening.name, currentOpening.description)}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex items-center gap-2 bg-[var(--color-muted-bg)] border border-[var(--color-surface-hover)] rounded px-3 py-1.5 mr-2">
                      <Clock className={`w-4 h-4 ${timeLeft <= 10 && isTimerRunning ? 'text-red-500 animate-pulse' : 'text-[var(--color-accent)]'}`} />
                      <div className={`font-mono font-bold text-lg ${timeLeft <= 10 && isTimerRunning ? 'text-red-500' : 'text-[var(--color-text-main)]'}`}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </div>
                      <select value={timeLimit} onChange={e => { const v = Number(e.target.value); setTimeLimit(v); setTimeLeft(v); setIsTimerRunning(false); }}
                        className="bg-transparent text-xs text-[var(--color-text-dim)] outline-none cursor-pointer ml-1" disabled={isTimerRunning && !sessionCompleted}>
                        <option value={30}>30s</option><option value={60}>1m</option><option value={180}>3m</option><option value={300}>5m</option>
                      </select>
                      <div className="flex items-center gap-1 ml-2 border-l border-[var(--color-surface-border)] pl-2">
                        <button onClick={() => setIsTimerRunning(!isTimerRunning)} disabled={sessionCompleted || timeLeft === 0}
                          className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-dim)] transition-colors">
                          {isTimerRunning
                            ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                            : <Play className="w-3.5 h-3.5" fill="currentColor" />}
                        </button>
                        <button onClick={() => { setTimeLeft(timeLimit); setIsTimerRunning(false); }} disabled={isTimerRunning && !sessionCompleted}
                          className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-dim)] transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                        </button>
                      </div>
                    </div>
                    <button onClick={() => resetTrainer()} className="p-2 rounded bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-border)] text-sm transition-colors" title="Restart Line">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="w-full flex items-start justify-center gap-4 flex-grow">
                  <div className="hidden lg:flex flex-col w-[160px] xl:w-[180px] bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-md shadow-lg overflow-hidden flex-shrink-0">
                    <div className="p-2 lg:p-3 bg-[var(--color-surface-hover)] border-b border-[var(--color-surface-border)] font-bold text-xs uppercase tracking-wider text-[var(--color-text-dim)] flex items-center justify-between">
                      <span>List</span><span className="text-[10px]">{moveIndex}/{currentOpening.moves.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-1.5 lg:p-2 flex flex-col">
                      {Array.from({ length: Math.ceil(currentOpening.moves.length / 2) }).map((_, i) => {
                        const whiteMove = currentOpening.moves[i * 2];
                        const blackMove = currentOpening.moves[i * 2 + 1];
                        const isWhiteActive = moveIndex === i * 2 + 1;
                        const isWhiteNext = moveIndex === i * 2;
                        return (
                          <div key={i} className="flex text-[13px] py-1 border-b border-[var(--color-surface-border)]/30 hover:bg-[var(--color-surface-hover)] transition-colors rounded items-center">
                            <div className="w-6 text-[var(--color-text-dim)] text-right pr-1.5 text-[11px] font-mono">{i + 1}.</div>
                            <div className={`flex-1 pl-1 text-left font-semibold ${isWhiteNext ? 'text-white opacity-100' : isWhiteActive ? 'text-[var(--color-accent)] opacity-100' : i * 2 > moveIndex ? 'text-[var(--color-text-main)] opacity-30' : 'text-[var(--color-text-main)] opacity-100'}`}>
                              {whiteMove || ''}
                            </div>
                            <div className={`flex-1 pl-1 text-left font-semibold ${moveIndex > i * 2 + 1 ? 'text-[var(--color-text-dim)] opacity-100' : 'opacity-0'}`}>
                              {moveIndex > i * 2 + 1 ? (blackMove || '') : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="aspect-square max-h-[70vh] lg:max-h-[82vh] w-auto max-w-full rounded-md overflow-hidden border-4 border-[var(--color-border)] shadow-2xl relative flex-shrink flex-1 flex justify-center mx-auto">
                    <div className="w-full h-full">
                      <Chessboard
                        position={game.fen()}
                        onPieceDrop={onDrop}
                        boardOrientation="white"
                        customDarkSquareStyle={{ backgroundColor: currentBelt.hex }}
                        customLightSquareStyle={{ backgroundColor: 'var(--color-board-light)' }}
                        customArrows={arrows}
                        animationDuration={200}
                      />
                      {sessionCompleted && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
                          <span className="text-white text-4xl md:text-6xl font-black drop-shadow-lg tracking-wider">
                            {currentErrors === 0 ? 'PERFECT' : 'TRY AGAIN'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`mt-6 w-full p-4 rounded-lg border flex items-center justify-between transition-colors ${
                  feedback.type === 'success' ? 'bg-[rgba(118,150,86,0.1)] border-[var(--color-accent)] text-[var(--color-accent)]' :
                  feedback.type === 'error' ? 'bg-red-950/30 border-red-900/50 text-red-400' :
                  feedback.type === 'completed' ? 'bg-blue-950/30 border-blue-900/50 text-blue-400' :
                  'bg-[rgba(255,255,255,0.03)] border-[var(--color-border)] text-[var(--color-text-dim)]'
                }`}>
                  <div className="flex items-center gap-3">
                    {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                    {feedback.type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0" />}
                    {feedback.type === 'completed' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                    {feedback.type === 'idle' && <ChevronRight className="w-5 h-5 flex-shrink-0" />}
                    <span className="font-medium text-base">{feedback.message}</span>
                  </div>
                  <button onClick={handleGetTip} disabled={isGettingTip || sessionCompleted}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-surface-border)] text-xs font-bold text-yellow-500 transition-colors disabled:opacity-50">
                    <Zap className="w-3.5 h-3.5" />
                    {isGettingTip ? 'Thinking...' : 'AI Coach Tip'}
                  </button>
                </div>

                {aiCoachTip && (
                  <div className="mt-3 w-full p-3 rounded bg-yellow-950/20 border border-yellow-900/30 text-yellow-200/80 text-sm italic flex items-start gap-2">
                    <Zap className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-600" />
                    {aiCoachTip}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[var(--color-card-bg)] rounded-xl border border-[var(--color-border)] p-0 flex flex-col relative overflow-hidden h-[450px]">
              <div className="flex justify-between items-center bg-[var(--color-surface)] border-b border-[var(--color-surface-border)] px-4 py-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-blue-200 border border-blue-400 font-bold text-xs shadow-sm">FC</div>
                  <div className="text-sm uppercase text-[var(--color-text-main)] tracking-[1.5px] font-bold">Fabiano AI</div>
                </div>
                {isChatting && <div className="text-xs font-medium text-blue-400 animate-pulse flex items-center gap-2"><Activity className="w-4 h-4" /> Analyzing Position...</div>}
              </div>
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-0 flex flex-col">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex w-full p-4 border-b border-[var(--color-surface-border)] ${msg.role === 'user' ? 'bg-[rgba(255,255,255,0.02)]' : 'bg-[rgba(118,150,86,0.05)]'}`}>
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mr-4 mt-0.5"
                      style={{ backgroundColor: msg.role === 'user' ? '#3b3d41' : '#1e3a8a', color: msg.role === 'user' ? '#fff' : '#bfdbfe', border: msg.role === 'user' ? '1px solid #555' : '1px solid #60a5fa' }}>
                      {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <span className="font-bold text-xs">FC</span>}
                    </div>
                    <div className="flex-1 text-base text-[var(--color-text-main)] leading-relaxed pt-1">
                      {msg.role === 'model' ? <div className="markdown-body"><Markdown>{msg.parts[0].text}</Markdown></div> : msg.parts[0].text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleChatSubmit} className="p-4 border-t border-[var(--color-surface-border)] bg-[var(--color-surface)] flex gap-3 flex-shrink-0">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask Fabiano a question..." disabled={isChatting}
                  className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full px-5 py-3 text-base text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-[var(--color-text-dim)]" />
                <button type="submit" disabled={isChatting || !chatInput.trim()}
                  className="w-12 h-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white disabled:opacity-50 hover:bg-opacity-80 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-col gap-4 h-full">
            <div className="bg-[var(--color-card-bg)] rounded-xl border border-[var(--color-border)] p-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5"><Trophy className="w-32 h-32" /></div>
              <div className="text-xs uppercase text-[var(--color-text-dim)] tracking-[1px] mb-4 font-bold flex items-center gap-2 relative z-10">
                <Trophy className={`w-5 h-5 ${currentBelt.color}`} /> Path to Mastery — {currentBelt.name}
              </div>
              <div className="mb-4 flex justify-between items-end relative z-10">
                <div className="text-4xl font-extrabold text-[var(--color-text-main)]">
                  {currentOpening.perfectSessions || 0}<span className="text-xl text-[var(--color-text-dim)] font-normal">/100</span>
                </div>
                <div className="text-sm text-[var(--color-text-dim)] mb-1 font-medium">{currentOpening.attempts || 0} Attempts</div>
              </div>
              <div className="w-full h-3 bg-[var(--color-surface-hover)] rounded-full overflow-hidden relative z-10 border border-[var(--color-surface-border)]">
                <div className={`h-full ${currentBelt.bg} transition-all duration-700 ease-out`} style={{ width: `${Math.min(100, ((currentOpening.perfectSessions || 0) / 100) * 100)}%` }} />
              </div>
              {(currentOpening.perfectSessions || 0) >= 100 && (
                <div className="mt-4 text-sm text-[var(--color-gold)] font-bold flex items-center gap-1 relative z-10 animate-pulse">
                  <Star className="w-4 h-4" /> Unconscious Competence Achieved!
                </div>
              )}
            </div>

            <div className="bg-[var(--color-card-bg)] rounded-xl border border-[var(--color-border)] p-6 flex flex-col flex-grow min-h-[500px]">
              <div className="flex justify-between items-center mb-4">
                <div className="text-xs uppercase text-[var(--color-text-dim)] tracking-[1px] font-bold">Your Repertoire</div>
                <div className="flex gap-2">
                  <button onClick={() => resetTrainer(undefined, 'all')} className="text-xs bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-border)] px-3 py-1.5 rounded text-[var(--color-text-main)] font-bold transition-colors">Random Drill</button>
                  <button onClick={() => setShowImportModal(true)} className="text-xs hover:opacity-80 px-3 py-1.5 rounded text-white font-bold transition-colors flex items-center gap-1 uppercase tracking-wider" style={{ backgroundColor: highestBelt.hex }}>
                    <Download className="w-4 h-4" /> Import
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto pr-2">
                {[...repertoireState].sort((a, b) => (b.perfectSessions || 0) - (a.perfectSessions || 0)).map(op => {
                  const opBelt = getBelt(op.perfectSessions || 0);
                  const isCustom = !repertoire.some(d => d.id === op.id);
                  return (
                    <div key={op.id} className="relative group">
                      <button onClick={() => resetTrainer(op, 'single')}
                        className={`w-full text-left p-4 rounded-lg border-l-[4px] transition-all duration-200 cursor-pointer ${trainingMode === 'single' && currentOpening.id === op.id ? 'bg-[rgba(118,150,86,0.1)] border-l-[var(--color-accent)]' : 'bg-[rgba(255,255,255,0.03)] border-l-transparent hover:bg-[rgba(255,255,255,0.05)]'}`}>
                        <div className="text-base font-semibold mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-3 pr-6">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${opBelt.bg} border ${opBelt.border}`} />
                            <span className="truncate">{formatTitle(op.name)}</span>
                          </span>
                          {(op.perfectSessions || 0) >= 100 && <span className="text-[10px] bg-[var(--color-gold)] text-black px-2 py-0.5 rounded ml-2 font-bold flex-shrink-0"><Flame className="w-3 h-3 inline pb-0.5" /> MAX</span>}
                        </div>
                        <div className={`text-xs font-semibold line-clamp-2 pr-6 ${opBelt.color}`}>{formatSubtitle(op.name, op.description)}</div>
                      </button>
                      {isCustom && (
                        <button onClick={async (e) => {
                          e.stopPropagation();
                          if (user) {
                            const { deleteDoc, doc: firestoreDoc } = await import('firebase/firestore');
                            deleteDoc(firestoreDoc(db, `users/${user.uid}/repertoire`, op.id));
                          }
                          setRepertoireState(prev => prev.filter(r => r.id !== op.id));
                          if (currentOpening.id === op.id) resetTrainer(repertoire[0], 'single');
                        }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[var(--color-surface-hover)] hover:bg-red-900/50 text-[var(--color-text-dim)] hover:text-red-400 rounded-md opacity-0 group-hover:opacity-100 transition-all z-20">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        {showImportModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => !isImporting && setShowImportModal(false)}>
            <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-[var(--color-text-main)] mb-2">Import Game & Analyze</h3>
              <p className="text-sm text-[var(--color-text-dim)] mb-4">Paste a PGN to analyze the first 12 moves and add new variations to your repertoire.</p>
              <textarea className="w-full h-40 bg-[var(--color-muted-bg)] border border-[var(--color-surface-hover)] rounded p-3 text-sm text-[var(--color-text-main)] font-mono mb-4 focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="Paste PGN here..." value={importPgn} onChange={e => setImportPgn(e.target.value)} disabled={isImporting} />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowImportModal(false)} disabled={isImporting} className="px-4 py-2 rounded text-sm font-bold text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] transition-colors">Cancel</button>
                <button onClick={handleImport} disabled={isImporting || !importPgn.trim()} className="px-4 py-2 rounded text-sm font-bold bg-[var(--color-accent)] text-white hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isImporting ? <Activity className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                  {isImporting ? 'Analyzing...' : 'Analyze & Import'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showProfileModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowProfileModal(false)}>
            <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl p-6 max-w-md w-full relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-[var(--color-text-dim)] hover:text-[var(--color-text-main)]"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-4 mb-6">
                {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-full border-2 border-[var(--color-accent)]" referrerPolicy="no-referrer" /> : <div className="w-16 h-16 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center border-2 border-[var(--color-accent)]"><UserIcon className="w-8 h-8 text-gray-400" /></div>}
                <div>
                  <h3 className="text-xl font-bold text-[var(--color-text-main)]">{user?.displayName || 'Chess Player'}</h3>
                  <p className="text-sm text-[var(--color-text-dim)]">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[var(--color-muted-bg)] p-4 rounded-lg border border-[var(--color-surface-hover)] text-center">
                  <div className="text-[10px] uppercase text-[var(--color-text-dim)] font-bold mb-1">Elo Rating</div>
                  <div className="text-2xl font-bold text-[var(--color-accent)]">{elo}</div>
                  <div className={`text-xs mt-1 ${eloColor}`}>{eloTitle}</div>
                </div>
                <div className="bg-[var(--color-muted-bg)] p-4 rounded-lg border border-[var(--color-surface-hover)] text-center">
                  <div className="text-[10px] uppercase text-[var(--color-text-dim)] font-bold mb-1">Mastery</div>
                  <div className="text-2xl font-bold text-[var(--color-accent)]">{mastery}%</div>
                  <div className="text-xs text-[var(--color-text-dim)] mt-1">{repertoireState.length} Openings</div>
                </div>
              </div>
              <div className="bg-[var(--color-muted-bg)] p-4 rounded-lg border border-[var(--color-surface-hover)]">
                <div className="text-[11px] uppercase text-[var(--color-text-dim)] font-bold mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-[var(--color-gold)]" /> Top Openings</div>
                <div className="flex flex-col gap-2">
                  {[...repertoireState].sort((a, b) => (b.perfectSessions || 0) - (a.perfectSessions || 0)).slice(0, 3).map(op => (
                    <div key={op.id} className="flex justify-between items-center text-sm">
                      <span className="text-[var(--color-text-main)] truncate pr-4">{formatTitle(op.name)}</span>
                      <span className="font-bold text-[var(--color-text-main)] flex-shrink-0">{op.perfectSessions || 0} / 100</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
