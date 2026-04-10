// src/memory/coachMemory.js
// Live weakness fingerprint system
// Reads and writes Coach-memory.json after every game

// ─── Default Memory Structure ─────────────────────────────────────────────────

export const DEFAULT_MEMORY = {
player: "TopherBettis",
currentElo: 609,
targetElo: 2000,
lastUpdated: null,
gamesAnalyzed: 0,

weaknesses: {
move9SpeedTrap: {
label: "Move 9 Speed Trap",
occurrences: 0,
lastSeen: null,
severity: "CRITICAL",
trend: "unknown",
notes: "Blunders queen to knight forks when center opens around move 9-10."
},
panicSimplification: {
label: "Panic Simplification",
occurrences: 0,
lastSeen: null,
severity: "HIGH",
trend: "unknown",
notes: "Releases tension too early under pressure. Coiled Spring released prematurely."
},
pawnPushingVsQueenSorties: {
label: "Pawn-Pushing vs Queen Sorties",
occurrences: 0,
lastSeen: null,
severity: "HIGH",
trend: "unknown",
notes: "Pushes pawns at opponent queen instead of developing and castling."
},
missingForcingMoves: {
label: "Missing Forcing Moves When Winning",
occurrences: 0,
lastSeen: null,
severity: "MEDIUM",
trend: "unknown",
notes: "Relaxes calculation when ahead. Misses CCT in winning positions."
}
},

strengths: {
endgameStamina: {
label: "Endgame Stamina",
confirmed: true,
notes: "Converts 60+ move marathons. Unusual and elite for 600 ELO."
},
passedPawnPromotion: {
label: "Passed Pawn Promotion",
confirmed: true,
notes: "GM-level patience. Ladder mates, box mates, K+R coordination."
},
tacticalAggression: {
label: "Tactical Aggression",
confirmed: true,
notes: "Excellent eye for knight sacrifices and king hunts."
},
fightersMindset: {
label: "Fighter's Mindset",
confirmed: true,
notes: "Never resigns early. Stays in the fight."
}
},

recentGames: [],

weeklyStats: {
gamesPlayed: 0,
wins: 0,
losses: 0,
draws: 0,
averageAccuracy: 0,
weaknessFrequency: {}
},

drillLog: [],

openingStats: {
italianCage: {
gamesPlayed: 0,
wins: 0,
losses: 0,
draws: 0,
coiledSpringExecuted: 0,
averageMoveOrderAccuracy: 0
}
}
};

// ─── Memory Operations ────────────────────────────────────────────────────────

/**

- Load memory from Coach-memory.json
- Falls back to DEFAULT_MEMORY if file is empty or malformed
- @param {string} jsonString - Raw contents of Coach-memory.json
- @returns {object} Memory object
  */
  export function loadMemory(jsonString) {
  try {
  const parsed = JSON.parse(jsonString);
  // Merge with defaults to ensure all keys exist
  return deepMerge(DEFAULT_MEMORY, parsed);
  } catch {
  console.warn('[coachMemory] Could not parse memory. Using defaults.');
  return { …DEFAULT_MEMORY };
  }
  }

/**

- Record a completed game and update weakness fingerprint
- @param {object} memory - Current memory object
- @param {object} gameData - { pgn, result, accuracy, date, weaknessesDetected[], openingExecuted }
- @returns {object} Updated memory object
  */
  export function recordGame(memory, gameData) {
  const updated = { …memory };
  const now = new Date().toISOString();

// Update game count
updated.gamesAnalyzed = (updated.gamesAnalyzed || 0) + 1;
updated.lastUpdated = now;

// Update weakness occurrences
if (gameData.weaknessesDetected && Array.isArray(gameData.weaknessesDetected)) {
gameData.weaknessesDetected.forEach(key => {
if (updated.weaknesses[key]) {
updated.weaknesses[key].occurrences += 1;
updated.weaknesses[key].lastSeen = now;
updated.weaknesses[key].trend = calculateTrend(
updated.weaknesses[key].occurrences,
updated.gamesAnalyzed
);
}
});
}

// Add to recent games (keep last 20)
const gameRecord = {
date: gameData.date || now,
result: gameData.result,
accuracy: gameData.accuracy,
weaknesses: gameData.weaknessesDetected || [],
pgn: gameData.pgn ? gameData.pgn.substring(0, 200) : null
};

updated.recentGames = [gameRecord, …(updated.recentGames || [])].slice(0, 20);

// Update weekly stats
updated.weeklyStats = updateWeeklyStats(updated.weeklyStats, gameData);

// Update opening stats
if (gameData.openingExecuted) {
updated.openingStats.italianCage.gamesPlayed += 1;
if (gameData.result === 'win') updated.openingStats.italianCage.wins += 1;
if (gameData.result === 'loss') updated.openingStats.italianCage.losses += 1;
if (gameData.result === 'draw') updated.openingStats.italianCage.draws += 1;
}

return updated;
}

/**

- Log a completed drill session
- @param {object} memory - Current memory object
- @param {object} drillData - { type, weakness, duration, completedReps, notes }
- @returns {object} Updated memory object
  */
  export function logDrill(memory, drillData) {
  const updated = { …memory };
  const drill = {
  date: new Date().toISOString(),
  …drillData
  };
  updated.drillLog = [drill, …(updated.drillLog || [])].slice(0, 50);
  return updated;
  }

/**

- Update ELO in memory
- @param {object} memory
- @param {number} newElo
- @returns {object} Updated memory
  */
  export function updateElo(memory, newElo) {
  return {
  …memory,
  currentElo: newElo,
  lastUpdated: new Date().toISOString()
  };
  }

/**

- Serialize memory object to JSON string for saving
- @param {object} memory
- @returns {string} JSON string
  */
  export function saveMemory(memory) {
  return JSON.stringify(memory, null, 2);
  }

/**

- Get the top N most frequent weaknesses
- @param {object} memory
- @param {number} n
- @returns {Array} Sorted weakness array
  */
  export function getTopWeaknesses(memory, n = 2) {
  return Object.entries(memory.weaknesses)
  .sort(([, a], [, b]) => b.occurrences - a.occurrences)
  .slice(0, n)
  .map(([key, value]) => ({ key, …value }));
  }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateTrend(occurrences, totalGames) {
if (totalGames === 0) return 'unknown';
const rate = occurrences / totalGames;
if (rate > 0.6) return 'frequent';
if (rate > 0.3) return 'occasional';
return 'rare';
}

function updateWeeklyStats(weeklyStats, gameData) {
const updated = { …weeklyStats };
updated.gamesPlayed = (updated.gamesPlayed || 0) + 1;
if (gameData.result === 'win') updated.wins = (updated.wins || 0) + 1;
if (gameData.result === 'loss') updated.losses = (updated.losses || 0) + 1;
if (gameData.result === 'draw') updated.draws = (updated.draws || 0) + 1;

if (gameData.accuracy) {
const acc = parseFloat(gameData.accuracy);
const prev = updated.averageAccuracy || 0;
const count = updated.gamesPlayed;
updated.averageAccuracy = Math.round(((prev * (count - 1)) + acc) / count * 10) / 10;
}

if (gameData.weaknessesDetected) {
gameData.weaknessesDetected.forEach(key => {
updated.weaknessFrequency = updated.weaknessFrequency || {};
updated.weaknessFrequency[key] = (updated.weaknessFrequency[key] || 0) + 1;
});
}

return updated;
}

function deepMerge(defaults, overrides) {
const result = { …defaults };
for (const key in overrides) {
if (
overrides[key] &&
typeof overrides[key] === 'object' &&
!Array.isArray(overrides[key])
) {
result[key] = deepMerge(defaults[key] || {}, overrides[key]);
} else {
result[key] = overrides[key];
}
}
return result;
}
