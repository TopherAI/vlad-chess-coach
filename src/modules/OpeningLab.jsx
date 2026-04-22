import { useState, useEffect, useCallback, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useCoach } from '../lib/useCoach'

const REPERTOIRE = [
  { id: 'mirror-italian', name: 'Mirror Italian', subtitle: 'Guioco Pianissimo', color: '#a855f7',
    moves: ['e4','Nf3','Bc4','c3','d3','a4','O-O','h3','Re1'],
    ucis: ['e2e4','g1f3','f1c4','c2c3','d2d3','a2a4','e1g1','h2h3','f1e1'] },
  { id: 'four-knights', name: 'Four Knights', subtitle: "Gentleman's Assassin", color: '#a855f7',
    moves: ['e4','Nf3','Bc4','Nc3','O-O','d3','a4','h3','Re1'],
    ucis: ['e2e4','g1f3','f1c4','b1c3','e1g1','d2d3','a2a4','h2h3','f1e1'] },
  { id: 'petrov', name: 'Petrov', subtitle: 'The Refusal', color: '#a855f7',
    moves: ['e4','Nf3','Bc4','d3','c3','a4','O-O','h3','Re1'],
    ucis: ['e2e4','g1f3','f1c4','d2d3','c2c3','a2a4','e1g1','h2h3','f1e1'] },
  { id: 'duras-gambit', name: 'Dúras Gambit', subtitle: 'Blunder', color: '#3b82f6',
    moves: ['e4','Nf3','Bc4','d3','c3','O-O','a4','h3','Re1'],
    ucis: ['e2e4','g1f3','f1c4','d2d3','c2c3','e1g1','a2a4','h2h3','f1e1'] },
  { id: 'sicilian', name: 'Sicilian', subtitle: 'Bowdler Bypass', color: '#a855f7',
    moves: ['e4','Nf3','Bc4','c3','d3','O-O','h3','a4','Re1'],
    ucis: ['e2e4','g1f3','f1c4','c2c3','d2d3','e1g1','h2h3','a2a4','f1e1'] },
  { id: 'french', name: 'French', subtitle: 'Two Horses', color: '#6b7280',
    moves: ['e4','d3','Nd2','Ngf3','g3','Bg2','O-O','Re1','c3'],
    ucis: ['e2e4','d2d3','b1d2','g1f3','g2g3','f1g2','e1g1','f1e1','c2c3'] },
  { id: 'caro-kann', name: 'Caro-Kann', subtitle: 'Two Horses II', color: '#6b7280',
    moves: ['e4','d3','Nd2','Ngf3','g3','Bg2','O-O','Re1','c3'],
    ucis: ['e2e4','d2d3','b1d2','g1f3','g2g3','f1g2','e1g1','f1e1','c2c3'] },
  { id: 'scandinavian', name: 'Scandinavian', subtitle: 'Center Grab', color: '#6b7280',
    moves: ['e4','Nf3','Bc4','d3','c3','O-O','h3','Re1'],
    ucis: ['e2e4','g1f3','f1c4','d2d3','c2c3','e1g1','h2h3','f1e1'] },
]

const BELTS = [
  { min: 86, label: 'Black Belt',  light: '#374151', dark: '#111827' },
  { min: 71, label: 'Brown Belt',  light: '#d97706', dark: '#7c2d12' },
  { min: 56, label: 'Blue Belt',   light: '#60a5fa', dark: '#1d4ed8' },
  { min: 41, label: 'Purple Belt', light: '#c084fc', dark: '#7c3aed' },
  { min: 26, label: 'Orange Belt', light: '#fb923c', dark: '#c2410c' },
  { min: 11, label: 'Yellow Belt', light: '#fde047', dark: '#a16207' },
  { min: 0,  label: 'White Belt',  light: '#e5e7eb', dark: '#9ca3af' },
]

const getBelt = (m) => BELTS.find(b => m >= b.min)
const lsKey   = (id) => `vlad_openinglab_mastery_${id}`

const iconBtn = {
  background: 'var(--vcc-surface)', border: '1px solid var(--vcc-border)',
  color: 'var(--vcc-text)', borderRadius: '8px', padding: '0.4rem 0.65rem',
  cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
}
const primaryBtn = {
  background: 'var(--vcc-accent)', border: 'none', color: '#000',
  borderRadius: '8px', padding: '0.5rem 1.25rem', cursor: 'pointer',
  fontWeight: 700, fontFamily: 'Syne, sans-serif', fontSize: '0.9rem',
}
const secondaryBtn = {
  background: 'var(--vcc-surface)', border: '1px solid var(--vcc-border)',
  color: 'var(--vcc-text)', borderRadius: '8px', padding: '0.5rem 1rem',
  cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: '0.9rem',
}

export function OpeningLab() {
  const [line, setLine]           = useState(REPERTOIRE[0])
  const [moveIdx, setMoveIdx]     = useState(0)
  const [masteryMap, setMasteryMap] = useState(() => {
    const m = {}
    REPERTOIRE.forEach(l => { m[l.id] = parseInt(localStorage.getItem(lsKey(l.id)) || '0') })
    return m
  })
  const [timerDur, setTimerDur]   = useState(30)
  const [timeLeft, setTimeLeft]   = useState(30)
  const [running, setRunning]     = useState(false)
  const [attempts, setAttempts]   = useState(0)
  const [tip, setTip]             = useState('')
  const [loadingTip, setLoadingTip] = useState(false)
  const timerRef = useRef(null)
  const { askCoach } = useCoach()

  const mastery  = masteryMap[line.id] || 0
  const belt     = getBelt(mastery)
  const position = moveIdx === 0 ? 'start' : buildFen(line, moveIdx)

  const buildFen = useCallback((l, idx) => {
    const chess = new Chess()
    l.ucis.slice(0, idx).forEach(uci => {
      try { chess.move({ from: uci.slice(0,2), to: uci.slice(2,4), promotion: uci[4] }) } catch {}
    })
    return chess.fen()
  }, [])

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); setRunning(false); return 0 } return t - 1 })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [running])

  const selectLine = (l) => { setLine(l); setMoveIdx(0); setRunning(false); setTimeLeft(timerDur); setTip('') }
  const resetBoard = () => { setMoveIdx(0); setRunning(false); setTimeLeft(timerDur) }
  const startDrill = () => { setMoveIdx(0); setTimeLeft(timerDur); setRunning(true); setAttempts(a => a + 1) }

  const markStudied = () => {
    const next = Math.min(100, mastery + 2)
    setMasteryMap(m => ({ ...m, [line.id]: next }))
    localStorage.setItem(lsKey(line.id), String(next))
    if (moveIdx < line.moves.length) setMoveIdx(i => i + 1)
  }

  const askVlad = async () => {
    setLoadingTip(true)
    const move = line.moves[moveIdx] || line.moves.at(-1)
    const res = await askCoach('vlad', `In 2 sentences, explain why ${move} is the right move in the ${line.name} (${line.subtitle}) system.`)
    setTip(res)
    setLoadingTip(false)
  }

  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  return (
    <div style={{ display:'flex', height:'100%', background:'var(--vcc-bg)', color:'var(--vcc-text)', fontFamily:'Syne, sans-serif', overflow:'hidden' }}>

      {/* CENTER */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'1.5rem', gap:'1rem', minWidth:0 }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h2 style={{ margin:0, fontSize:'1.5rem', fontWeight:700 }}>{line.name}</h2>
            <p  style={{ margin:0, color:'#a855f7', fontSize:'0.85rem' }}>{line.subtitle}</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'var(--vcc-surface)', border:'1px solid var(--vcc-border)', borderRadius:'8px', padding:'0.4rem 0.75rem' }}>
              <span>⏱</span>
              <span style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:700, color: timeLeft <= 5 ? '#ef4444' : 'var(--vcc-text)' }}>
                {fmt(timeLeft)}
              </span>
              <select value={timerDur} onChange={e => { setTimerDur(+e.target.value); setTimeLeft(+e.target.value) }}
                style={{ background:'transparent', border:'none', color:'var(--vcc-text)', fontSize:'0.8rem', cursor:'pointer' }}>
                {[15,30,60,120].map(s => <option key={s} value={s} style={{ background:'#1a1917' }}>{s}s</option>)}
              </select>
            </div>
            <button onClick={resetBoard} style={iconBtn} title="Reset">↺</button>
          </div>
        </div>

        <div style={{ display:'flex', gap:'1rem', flex:1, minHeight:0 }}>

          <div style={{ width:'160px', background:'var(--vcc-surface)', border:'1px solid var(--vcc-border)', borderRadius:'12px', padding:'0.75rem', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.75rem', fontSize:'0.7rem', color:'#6b7280', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              <span>List</span><span>{moveIdx}/{line.moves.length}</span>
            </div>
            {line.moves.map((mv, i) => (
              <div key={i} onClick={() => setMoveIdx(i + 1)}
                style={{
                  padding:'0.35rem 0.5rem', borderRadius:'6px', cursor:'pointer',
                  fontSize:'0.9rem', fontFamily:'JetBrains Mono, monospace',
                  color: moveIdx > i ? 'var(--vcc-accent)' : 'var(--vcc-text)',
                  background: moveIdx === i + 1 ? 'rgba(168,85,247,0.12)' : 'transparent',
                  fontWeight: moveIdx === i + 1 ? 700 : 400,
                }}>
                {i + 1}. {mv}
              </div>
            ))}
          </div>

          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:'100%', maxWidth:'520px', aspectRatio:'1/1' }}>
              <Chessboard
                position={position}
                arePiecesDraggable={false}
                areArrowsAllowed={false}
                customDarkSquareStyle={{ backgroundColor: belt.dark }}
                customLightSquareStyle={{ backgroundColor: belt.light }}
              />
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={startDrill}  style={primaryBtn}>▶ Drill</button>
          <button onClick={markStudied} style={secondaryBtn}>Mark as Studied →</button>
          <button onClick={askVlad}     style={secondaryBtn} disabled={loadingTip}>
            {loadingTip ? 'Asking Vlad…' : '💬 Ask Vlad'}
          </button>
          {tip && <p style={{ margin:0, flex:1, fontSize:'0.85rem', color:'#a855f7', fontStyle:'italic' }}>"{tip}"</p>}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width:'280px', borderLeft:'1px solid var(--vcc-border)', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.5rem', overflowY:'auto' }}>

        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
            <span>🏆</span>
            <span style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.1em', color:'#6b7280', textTransform:'uppercase' }}>
              Path to Mastery — {belt.label}
            </span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'0.5rem' }}>
            <div>
              <span style={{ fontSize:'2rem', fontWeight:700 }}>{mastery}</span>
              <span style={{ color:'#6b7280' }}>/100</span>
            </div>
            <span style={{ fontSize:'0.8rem', color:'#6b7280' }}>{attempts} Attempts</span>
          </div>
          <div style={{ height:'6px', background:'var(--vcc-border)', borderRadius:'3px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${mastery}%`, background: belt.dark, borderRadius:'3px', transition:'width 0.4s ease' }} />
          </div>
        </div>

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
            <span style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.08em', color:'#6b7280', textTransform:'uppercase' }}>Your Repertoire</span>
            <button onClick={startDrill} style={{ ...secondaryBtn, fontSize:'0.75rem', padding:'0.3rem 0.6rem' }}>Drill All</button>
          </div>
          {REPERTOIRE.map(l => {
            const m = masteryMap[l.id] || 0
            const b = getBelt(m)
            return (
              <div key={l.id} onClick={() => selectLine(l)}
                style={{
                  padding:'0.75rem', borderRadius:'8px', cursor:'pointer', marginBottom:'0.25rem',
                  display:'flex', alignItems:'center', gap:'0.75rem',
                  background: line.id === l.id ? 'rgba(168,85,247,0.1)' : 'transparent',
                  border: line.id === l.id ? '1px solid rgba(168,85,247,0.3)' : '1px solid transparent',
                }}>
                <div style={{ width:'10px', height:'10px', borderRadius:'50%', background: b.dark, border:`2px solid ${b.light}`, flexShrink:0 }} />
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{l.name}</div>
                  <div style={{ fontSize:'0.75rem', color: l.color }}>{l.subtitle}</div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
