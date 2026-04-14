/**
 * src/modules/MiddlegameMat.jsx
 * vlad-chess-coach — Middlegame Mat Module
 *
 * The 5 Assassin Weapons + Hikaru tactical coaching
 * Principles: locked center -> Ng5 stranglehold -> dual flank -> queenside first -> central explosion
 */

import { useState, useCallback } from "react";
import askHikaru from "../coaches/hikaru.jsx";
import askVlad from "../coaches/vlad.jsx";

// ---------------------------------------------------------------------------
// The 5 Assassin Weapons
// ---------------------------------------------------------------------------

const WEAPONS = [
  {
    id: "search",
    icon: "🎯",
    name: "Search and Destroy",
    subtitle: "b4 Push",
    color: "#e67e22",
    trigger: "Black's Bc5 is blocked by d6 or unprotected. Queenside space available.",
    execution: [
      "Push b4 to cramp queenside and hunt the bishop.",
      "Follow with a4-b5 to lock the queenside permanently.",
      "Redirect attention to the kingside once queenside bind is achieved.",
    ],
    principle: "Creates a permanent bind. The bishop has nowhere to go.",
    hikaruNote: "This is just free space. If they let you play b4, you take it every time. No thinking required.",
  },
  {
    id: "strangler",
    icon: "🐍",
    name: "The Strangler",
    subtitle: "Ng5 / Nf5 Outpost",
    color: "#c0392b",
    trigger: "Black has a hole on f5 or g7. No g6 pawn or h6 has been played. Ng3 square is clear.",
    execution: [
      "Nf1 -> Ng3 (loading the spring).",
      "Ng3 -> Nf5 (the strangler lands on f5).",
      "Knight on f5 paralyzes Black's entire defensive setup.",
      "Setup Nxg7 or Bxh6 sacrifices from here.",
    ],
    principle: "The knight on f5 is worth more than a rook. It suffocates.",
    hikaruNote: "Once that knight lands on f5 it's basically over. They have to spend every move dealing with it.",
  },
  {
    id: "toxic",
    icon: "☠️",
    name: "Toxic Bait",
    subtitle: "Bg5 Pin + h4",
    color: "#8e44ad",
    trigger: "Black's Nf6 is pinned by Bg5. They impatiently play h6 to kick the bishop.",
    execution: [
      "Do NOT retreat the bishop when they play h6.",
      "Play h4 immediately.",
      "If hxg5, play hxg5 -- the h-file rips open.",
      "Rook to h1, queen to d2. Attack down the h-file.",
    ],
    principle: "They walked into it. The pawn trade opens the h-file for free.",
    hikaruNote: "This is the classic trap and people fall for it constantly at every level. The bishop is bait. h4 is the hook.",
  },
  {
    id: "sacrifice",
    icon: "💥",
    name: "High-Velocity Sacrifice",
    subtitle: "Bxh6 Shatter",
    color: "#c0392b",
    trigger: "Black is castled kingside. h6 defended once. Qd2 aligned. Knight on f5.",
    execution: [
      "Bxh6 -- violently sacrifice the bishop.",
      "gxh6 is forced (if they decline, h7 falls anyway).",
      "Qd2-h6 battery assembled.",
      "Ng5 follows. Rook to e3 or f1-f3 swing.",
      "Mate threats on h7 and g7 simultaneously.",
    ],
    principle: "The pawn shield is gone. Now it's a race and we're already winning.",
    hikaruNote: "When you have the knight on f5 and queen on d2, Bxh6 is almost always just winning. Calculate it once and play it.",
  },
  {
    id: "explosion",
    icon: "🌋",
    name: "Central Explosion",
    subtitle: "d4 Release",
    color: "#27ae60",
    trigger: "Cage is complete. Black commits heavily to a flank. Center is locked.",
    execution: [
      "Wait until Black overcommits on one flank.",
      "d4 -- snap the coiled spring.",
      "exd4 or cxd4 opens the center immediately.",
      "We are 3 tempos ahead in development.",
      "All pieces activate simultaneously.",
    ],
    principle: "The spring was coiled for 9 moves. d4 releases everything at once.",
    hikaruNote: "This is why you build the cage. Every quiet move was preparation for this one explosion.",
  },
];

// ---------------------------------------------------------------------------
// Middlegame Principles
// ---------------------------------------------------------------------------

const PRINCIPLES = [
  {
    id: "center",
    num: "01",
    title: "Lock the Center",
    color: "#2980b9",
    desc: "Before attacking, stabilize the center. A locked center forces the fight to the flanks -- where our preparation is deeper.",
    rule: "Do not push d4 until all 7 Assassin checklist conditions are met.",
  },
  {
    id: "ng5",
    num: "02",
    title: "Establish Ng5 Stranglehold",
    color: "#c0392b",
    desc: "The Nf1->Ng3->Nf5 route is the engine of the Gentleman's Assassin. The knight on f5 is the anchor of every attack.",
    rule: "Clear the Ng3 square first. Never rush -- load the spring methodically.",
  },
  {
    id: "flank",
    num: "03",
    title: "Dual Flank Attack",
    color: "#e67e22",
    desc: "Attack on both flanks simultaneously. Start queenside with b4 to fix Black's bishop, then pivot kingside with the Strangler.",
    rule: "Queenside bind first. Kingside attack second. Never both at once -- exhaust them.",
  },
  {
    id: "queenside",
    num: "04",
    title: "Queenside First",
    color: "#27ae60",
    desc: "The b4 push cramps Black's queenside and fixes their pieces before we attack the king. It forces defensive moves that lose tempo.",
    rule: "If b4 is available, play it before starting the kingside attack.",
  },
  {
    id: "explosion",
    num: "05",
    title: "Central Explosion as Finisher",
    color: "#f39c12",
    desc: "If Black's defense is perfect on both flanks, d4 blows the center open. We are always 3 tempos ahead when this fires.",
    rule: "d4 is the nuclear option. Use it when all else is prepared -- never as desperation.",
  },
];

// ---------------------------------------------------------------------------
// Gentleman Phase
// ---------------------------------------------------------------------------

const GENTLEMAN_PHASE = [
  { move: "Nf1", note: "Knight begins the march. Cage is complete. Now we pivot." },
  { move: "Nf1->d2", note: "Knight reroutes through d2 -- or goes directly to g3 depending on pawn structure." },
  { move: "Nd2->f1", note: "Alternative route. Knight heads to g3 via f1." },
  { move: "Nf1->g3", note: "Knight reaches g3. The spring is loaded. f5 is one move away." },
  { move: "Ng3->f5", note: "THE STRANGLER LANDS. Knight on f5. Black suffocates." },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MiddlegameMat() {
  const [activeTab, setActiveTab]         = useState("principles");
  const [activeWeapon, setActiveWeapon]   = useState(WEAPONS[0]);
  const [hikaruTake, setHikaruTake]       = useState({});
  const [vladTake, setVladTake]           = useState({});
  const [loadingHikaru, setLoadingHikaru] = useState(null);
  const [loadingVlad, setLoadingVlad]     = useState(null);
  const [gentlemanStep, setGentlemanStep] = useState(0);

  const getHikaruRead = useCallback(async (weapon) => {
    if (hikaruTake[weapon.id]) return;
    setLoadingHikaru(weapon.id);
    try {
      const prompt = `TopherBettis (609 ELO, target 2000) is playing the Italian Cage. They want to deploy the "${weapon.name}" weapon (${weapon.subtitle}). Trigger condition: ${weapon.trigger}. In Hikaru's voice: confirm whether the conditions look right, and give the exact first move to play. 2-3 sentences, fast and direct.`;
      const resp = await askHikaru(prompt);
      setHikaruTake(prev => ({ ...prev, [weapon.id]: resp }));
    } catch {
      setHikaruTake(prev => ({ ...prev, [weapon.id]: "Trust the pattern. Play the move." }));
    } finally {
      setLoadingHikaru(null);
    }
  }, [hikaruTake]);

  const getVladRead = useCallback(async (weapon) => {
    if (vladTake[weapon.id]) return;
    setLoadingVlad(weapon.id);
    try {
      const prompt = `TopherBettis is about to deploy the "${weapon.name}" weapon in the Italian Cage. In Vlad's philosophical voice: why does this weapon matter in the journey from 609 to 2000? What is the deeper principle behind it? 2 sentences maximum.`;
      const resp = await askVlad(prompt);
      setVladTake(prev => ({ ...prev, [weapon.id]: resp }));
    } catch {
      setVladTake(prev => ({ ...prev, [weapon.id]: "Every weapon is a lesson. The position teaches you when to strike." }));
    } finally {
      setLoadingVlad(null);
    }
  }, [vladTake]);

  const handleWeaponSelect = useCallback((weapon) => {
    setActiveWeapon(weapon);
    getHikaruRead(weapon);
    getVladRead(weapon);
  }, [getHikaruRead, getVladRead]);

  const tabs = [
    { id: "principles", label: "PRINCIPLES" },
    { id: "gentleman",  label: "GENTLEMAN PHASE" },
    { id: "weapons",    label: "5 WEAPONS" },
  ];

  return (
    <div style={styles.root}>

      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>⚔️</span>
          <div>
            <h1 style={styles.headerTitle}>Middlegame Mat</h1>
            <p style={styles.headerSub}>GENTLEMAN'S ASSASSIN -- ATTACK PHASE</p>
          </div>
        </div>
        <div style={styles.coachBadge}>
          <span style={styles.coachEmoji}>⚡</span>
          <div>
            <div style={styles.coachName}>Hikaru</div>
            <div style={styles.coachRole}>Tactics Coach</div>
          </div>
        </div>
      </div>

      <div style={styles.phaseBanner}>
        <div style={styles.phaseStep}>
          <span style={{ ...styles.phaseLabel, color: "#27ae60" }}>PHASE 1</span>
          <span style={styles.phaseText}>Opening -- Build the Cage (9 moves)</span>
        </div>
        <span style={styles.phaseArrow}>→</span>
        <div style={styles.phaseStep}>
          <span style={{ ...styles.phaseLabel, color: "#f39c12" }}>PHASE 2</span>
          <span style={styles.phaseText}>Gentleman -- Load the Spring (Nf1-g3-f5)</span>
        </div>
        <span style={styles.phaseArrow}>→</span>
        <div style={styles.phaseStep}>
          <span style={{ ...styles.phaseLabel, color: "#c0392b" }}>PHASE 3</span>
          <span style={styles.phaseText}>Assassin -- Deploy the Weapon</span>
        </div>
      </div>

      <div style={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "principles" && (
        <div style={styles.principlesList}>
          <div style={styles.principlesIntro}>
            <p style={styles.principlesIntroText}>
              The cage is built. Now the real game begins. These 5 principles govern every middlegame
              decision -- in order of priority. Execute them sequentially.
            </p>
          </div>
          {PRINCIPLES.map((p) => (
            <div key={p.id} style={{ ...styles.principleCard, borderLeft: `4px solid ${p.color}` }}>
              <div style={styles.principleHeader}>
                <span style={{ ...styles.principleNum, color: p.color }}>{p.num}</span>
                <h3 style={styles.principleTitle}>{p.title}</h3>
              </div>
              <p style={styles.principleDesc}>{p.desc}</p>
              <div style={styles.principleRule}>
                <span style={styles.principleRuleLabel}>RULE</span>
                <span style={styles.principleRuleText}>{p.rule}</span>
              </div>
            </div>
          ))}
          <div style={styles.hikaruQuote}>
            <span style={styles.hikaruQuoteIcon}>⚡</span>
            <p style={styles.hikaruQuoteText}>
              "The whole point of the Italian Cage is that by move 9 you're just better.
              The middlegame isn't about finding the right plan -- it's about executing the plan
              you already decided on move 1."
            </p>
            <span style={styles.hikaruQuoteAttrib}>-- Hikaru</span>
          </div>
        </div>
      )}

      {activeTab === "gentleman" && (
        <div style={styles.gentlemanLayout}>
          <div style={styles.gentlemanIntro}>
            <p style={styles.gentlemanIntroText}>
              The cage is complete. Now begins the Gentleman Phase --
              quietly rerouting the knight from f1 toward g3 and then f5.
              Black sees nothing dangerous. The spring loads in silence.
            </p>
          </div>
          <div style={styles.gentlemanSteps}>
            {GENTLEMAN_PHASE.map((step, i) => (
              <div
                key={i}
                style={{
                  ...styles.gentlemanStep,
                  border: `1px solid ${gentlemanStep === i ? "#f39c12" : "#1e1e1e"}`,
                  backgroundColor: gentlemanStep === i ? "#1a1200" : "#0a0a0a",
                  cursor: "pointer",
                }}
                onClick={() => setGentlemanStep(i)}
              >
                <div style={{ ...styles.gentlemanStepNum, backgroundColor: gentlemanStep === i ? "#f39c12" : "#1a1a1a" }}>
                  {i + 1}
                </div>
                <div style={styles.gentlemanStepInfo}>
                  <span style={{ ...styles.gentlemanStepMove, color: gentlemanStep === i ? "#f39c12" : "#ccc" }}>
                    {step.move}
                  </span>
                  <span style={styles.gentlemanStepNote}>{step.note}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={styles.gentlemanCallout}>
            <div style={styles.gentlemanCalloutHeader}>
              <span style={{ color: "#c0392b", fontSize: 20 }}>🐍</span>
              <span style={{ ...styles.gentlemanCalloutTitle, color: "#c0392b" }}>THE STRANGLER IS SET</span>
            </div>
            <p style={styles.gentlemanCalloutText}>
              Knight on f5. Black's position is paralyzed. Now choose your weapon.
            </p>
            <button style={styles.btn} onClick={() => setActiveTab("weapons")}>
              Choose Your Weapon →
            </button>
          </div>
        </div>
      )}

      {activeTab === "weapons" && (
        <div style={styles.weaponsLayout}>
          <div style={styles.weaponSelector}>
            {WEAPONS.map(w => (
              <button
                key={w.id}
                style={{
                  ...styles.weaponBtn,
                  border: `1px solid ${activeWeapon.id === w.id ? w.color : "#222"}`,
                  backgroundColor: activeWeapon.id === w.id ? `${w.color}15` : "#0a0a0a",
                }}
                onClick={() => handleWeaponSelect(w)}
              >
                <span style={styles.weaponBtnIcon}>{w.icon}</span>
                <div>
                  <div style={{ ...styles.weaponBtnName, color: activeWeapon.id === w.id ? w.color : "#888" }}>
                    {w.name}
                  </div>
                  <div style={styles.weaponBtnSub}>{w.subtitle}</div>
                </div>
              </button>
            ))}
          </div>

          <div style={styles.weaponDetail}>
            <div style={{ ...styles.weaponDetailHeader, borderBottom: `2px solid ${activeWeapon.color}33` }}>
              <span style={styles.weaponDetailIcon}>{activeWeapon.icon}</span>
              <div>
                <h2 style={{ ...styles.weaponDetailName, color: activeWeapon.color }}>{activeWeapon.name}</h2>
                <p style={styles.weaponDetailSubtitle}>{activeWeapon.subtitle}</p>
              </div>
            </div>
            <div style={styles.weaponTriggerBox}>
              <span style={styles.weaponTriggerLabel}>TRIGGER CONDITIONS</span>
              <p style={styles.weaponTriggerText}>{activeWeapon.trigger}</p>
            </div>
            <div style={styles.weaponExecution}>
              <span style={styles.weaponExecutionLabel}>EXECUTION</span>
              {activeWeapon.execution.map((step, i) => (
                <div key={i} style={styles.weaponExecutionStep}>
                  <div style={{ ...styles.weaponExecutionNum, backgroundColor: activeWeapon.color }}>{i + 1}</div>
                  <span style={styles.weaponExecutionText}>{step}</span>
                </div>
              ))}
            </div>
            <div style={{ ...styles.weaponPrinciple, borderColor: `${activeWeapon.color}44` }}>
              <span style={styles.weaponPrincipleLabel}>PRINCIPLE</span>
              <p style={styles.weaponPrincipleText}>{activeWeapon.principle}</p>
            </div>
            <div style={styles.coachBox}>
              <div style={styles.coachBoxHeader}>
                <span style={styles.coachBoxIcon}>⚡</span>
                <span style={{ ...styles.coachBoxName, color: "#f39c12" }}>Hikaru</span>
                <span style={styles.coachBoxRole}>Tactical Read</span>
              </div>
              {loadingHikaru === activeWeapon.id ? (
                <p style={styles.loadingText}>Hikaru is calculating...</p>
              ) : hikaruTake[activeWeapon.id] ? (
                <p style={styles.coachBoxText}>{hikaruTake[activeWeapon.id]}</p>
              ) : (
                <p style={styles.coachBoxPlaceholder}>"{activeWeapon.hikaruNote}"</p>
              )}
            </div>
            <div style={{ ...styles.coachBox, borderColor: "#c0392b33" }}>
              <div style={styles.coachBoxHeader}>
                <span style={styles.coachBoxIcon}>🎖️</span>
                <span style={{ ...styles.coachBoxName, color: "#c0392b" }}>Vlad</span>
                <span style={styles.coachBoxRole}>Philosophical Take</span>
              </div>
              {loadingVlad === activeWeapon.id ? (
                <p style={styles.loadingText}>Vlad is reflecting...</p>
              ) : vladTake[activeWeapon.id] ? (
                <p style={styles.coachBoxText}>{vladTake[activeWeapon.id]}</p>
              ) : (
                <p style={styles.coachBoxPlaceholder}>Select a weapon to hear from Vlad.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  root: { display: "flex", flexDirection: "column", gap: 20, padding: "28px 32px", minHeight: "100vh", backgroundColor: "#0d0d0d", color: "#e8e8e8", fontFamily: "'IBM Plex Mono', 'Courier New', monospace", maxWidth: 960, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #222", paddingBottom: 20, flexWrap: "wrap", gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  headerIcon: { fontSize: 36 },
  headerTitle: { margin: 0, fontSize: 26, fontWeight: 700, color: "#fff" },
  headerSub: { margin: "2px 0 0", fontSize: 12, color: "#666" },
  coachBadge: { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", backgroundColor: "#1a1200", border: "1px solid #f39c1244", borderRadius: 8 },
  coachEmoji: { fontSize: 24 },
  coachName: { fontSize: 14, fontWeight: 700, color: "#f39c12" },
  coachRole: { fontSize: 10, color: "#666", marginTop: 2 },
  phaseBanner: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 16px", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: 6 },
  phaseStep: { display: "flex", flexDirection: "column", gap: 2 },
  phaseLabel: { fontSize: 9, fontWeight: 700, letterSpacing: "1.5px" },
  phaseText: { fontSize: 11, color: "#888" },
  phaseArrow: { fontSize: 18, color: "#333", flexShrink: 0 },
  tabs: { display: "flex", gap: 0, borderBottom: "1px solid #222" },
  tab: { padding: "10px 20px", backgroundColor: "transparent", border: "none", borderBottom: "2px solid transparent", color: "#555", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer", letterSpacing: "0.5px" },
  tabActive: { color: "#f39c12", borderBottom: "2px solid #f39c12" },
  principlesList: { display: "flex", flexDirection: "column", gap: 14 },
  principlesIntro: { padding: "14px 16px", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: 6 },
  principlesIntroText: { margin: 0, fontSize: 13, color: "#888", lineHeight: 1.7 },
  principleCard: { padding: "16px 18px", backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 6, display: "flex", flexDirection: "column", gap: 10 },
  principleHeader: { display: "flex", alignItems: "center", gap: 12 },
  principleNum: { fontSize: 22, fontWeight: 700, lineHeight: 1, minWidth: 36 },
  principleTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: "#ccc" },
  principleDesc: { margin: 0, fontSize: 13, color: "#888", lineHeight: 1.7 },
  principleRule: { display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 12px", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: 4 },
  principleRuleLabel: { fontSize: 8, color: "#555", letterSpacing: "1.5px", flexShrink: 0, marginTop: 3 },
  principleRuleText: { fontSize: 11, color: "#aaa", lineHeight: 1.6 },
  hikaruQuote: { display: "flex", flexDirection: "column", gap: 8, padding: "16px 18px", backgroundColor: "#1a1200", border: "1px solid #f39c1233", borderRadius: 6 },
  hikaruQuoteIcon: { fontSize: 20 },
  hikaruQuoteText: { margin: 0, fontSize: 13, color: "#f39c12", lineHeight: 1.8, fontStyle: "italic" },
  hikaruQuoteAttrib: { fontSize: 11, color: "#8a6a2a", alignSelf: "flex-end" },
  gentlemanLayout: { display: "flex", flexDirection: "column", gap: 16 },
  gentlemanIntro: { padding: "14px 16px", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: 6 },
  gentlemanIntroText: { margin: 0, fontSize: 13, color: "#888", lineHeight: 1.7 },
  gentlemanSteps: { display: "flex", flexDirection: "column", gap: 4 },
  gentlemanStep: { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 6, transition: "all 0.15s" },
  gentlemanStepNum: { width: 28, height: 28, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 },
  gentlemanStepInfo: { display: "flex", flexDirection: "column", gap: 3, flex: 1 },
  gentlemanStepMove: { fontSize: 15, fontWeight: 700 },
  gentlemanStepNote: { fontSize: 11, color: "#666", lineHeight: 1.5 },
  gentlemanCallout: { padding: "18px 20px", backgroundColor: "#1a0808", border: "1px solid #c0392b44", borderRadius: 8, display: "flex", flexDirection: "column", gap: 12 },
  gentlemanCalloutHeader: { display: "flex", alignItems: "center", gap: 10 },
  gentlemanCalloutTitle: { fontSize: 13, fontWeight: 700, letterSpacing: "0.5px" },
  gentlemanCalloutText: { margin: 0, fontSize: 13, color: "#aaa", lineHeight: 1.7 },
  weaponsLayout: { display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" },
  weaponSelector: { display: "flex", flexDirection: "column", gap: 6, width: 220, flexShrink: 0 },
  weaponBtn: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", transition: "all 0.15s", textAlign: "left" },
  weaponBtnIcon: { fontSize: 20, flexShrink: 0 },
  weaponBtnName: { fontSize: 12, fontWeight: 700 },
  weaponBtnSub: { fontSize: 10, color: "#555", marginTop: 2 },
  weaponDetail: { flex: 1, display: "flex", flexDirection: "column", gap: 14, minWidth: 280 },
  weaponDetailHeader: { display: "flex", alignItems: "center", gap: 14, paddingBottom: 14 },
  weaponDetailIcon: { fontSize: 36 },
  weaponDetailName: { margin: 0, fontSize: 22, fontWeight: 700 },
  weaponDetailSubtitle: { margin: "2px 0 0", fontSize: 12, color: "#666" },
  weaponTriggerBox: { padding: "12px 14px", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: 6 },
  weaponTriggerLabel: { display: "block", fontSize: 8, color: "#555", letterSpacing: "1.5px", marginBottom: 6 },
  weaponTriggerText: { margin: 0, fontSize: 12, color: "#aaa", lineHeight: 1.6 },
  weaponExecution: { display: "flex", flexDirection: "column", gap: 8 },
  weaponExecutionLabel: { fontSize: 8, color: "#555", letterSpacing: "1.5px" },
  weaponExecutionStep: { display: "flex", alignItems: "flex-start", gap: 10 },
  weaponExecutionNum: { width: 20, height: 20, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0, marginTop: 1 },
  weaponExecutionText: { fontSize: 12, color: "#bbb", lineHeight: 1.6 },
  weaponPrinciple: { padding: "12px 14px", backgroundColor: "#0d0d0d", border: "1px solid", borderRadius: 6 },
  weaponPrincipleLabel: { display: "block", fontSize: 8, color: "#555", letterSpacing: "1.5px", marginBottom: 6 },
  weaponPrincipleText: { margin: 0, fontSize: 13, color: "#aaa", fontStyle: "italic", lineHeight: 1.6 },
  coachBox: { padding: "14px 16px", backgroundColor: "#111", border: "1px solid #f39c1233", borderRadius: 8 },
  coachBoxHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  coachBoxIcon: { fontSize: 18 },
  coachBoxName: { fontSize: 14, fontWeight: 700 },
  coachBoxRole: { fontSize: 10, color: "#555", marginLeft: 4 },
  coachBoxText: { margin: 0, fontSize: 13, color: "#bbb", lineHeight: 1.8 },
  coachBoxPlaceholder: { margin: 0, fontSize: 12, color: "#555", fontStyle: "italic", lineHeight: 1.7 },
  loadingText: { margin: 0, fontSize: 12, color: "#555", fontStyle: "italic" },
  btn: { padding: "10px 22px", backgroundColor: "#c0392b", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" },
};
