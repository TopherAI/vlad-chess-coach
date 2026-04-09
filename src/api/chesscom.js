/**
 * src/api/chesscom.js
 * vlad-chess-coach — Chess.com Public API Integration
 *
 * Fetches games, stats, and performance data for TopherBettis.
 * Uses Chess.com's public REST API (no auth required).
 *
 * API docs: https://www.chess.com/news/view/published-data-api
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL   = "https://api.chess.com/pub";
const PLAYER     = "TopherBettis";
const USER_AGENT = "vlad-chess-coach/1.0 (github.com/TopherAI/vlad-chess-coach)";

// Chess.com requires a User-Agent header
const HEADERS = {
  "User-Agent": USER_AGENT,
};

// Time controls we care about (Vlad prescribes 15|10)
const TARGET_TIME_CONTROLS = ["900+10", "600", "600+5", "900", "1800"];

// ---------------------------------------------------------------------------
// Core fetch utility
// ---------------------------------------------------------------------------

async function chesscomFetch(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, { headers: HEADERS });

  if (!response.ok) {
    throw new Error(`Chess.com API error ${response.status}: ${url}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Player profile
// ---------------------------------------------------------------------------

/**
 * Get TopherBettis player profile.
 * @returns {Promise<PlayerProfile>}
 */
export async function getProfile(username = PLAYER) {
  const data = await chesscomFetch(`/player/${username}`);
  return {
    username:   data.username,
    url:        data.url,
    name:       data.name ?? username,
    avatar:     data.avatar ?? null,
    country:    data.country ?? null,
    joined:     data.joined ? new Date(data.joined * 1000).toISOString() : null,
    lastOnline: data.last_online ? new Date(data.last_online * 1000).toISOString() : null,
    isStreamer: data.is_streamer ?? false,
    verified:   data.verified ?? false,
    title:      data.title ?? null,
  };
}

// ---------------------------------------------------------------------------
// Player stats
// ---------------------------------------------------------------------------

/**
 * Get current ratings across all time controls.
 * Returns structured stats including rapid, blitz, bullet, daily.
 * @returns {Promise<PlayerStats>}
 */
export async function getStats(username = PLAYER) {
  const data = await chesscomFetch(`/player/${username}/stats`);

  const parseRating = (section) => {
    if (!section) return null;
    return {
      last:  section.last?.rating  ?? null,
      best:  section.best?.rating  ?? null,
      win:   section.record?.win   ?? 0,
      loss:  section.record?.loss  ?? 0,
      draw:  section.record?.draw  ?? 0,
      total: (section.record?.win ?? 0) + (section.record?.loss ?? 0) + (section.record?.draw ?? 0),
    };
  };

  return {
    rapid:       parseRating(data.chess_rapid),
    blitz:       parseRating(data.chess_blitz),
    bullet:      parseRating(data.chess_bullet),
    daily:       parseRating(data.chess_daily),
    tactics: {
      highest: data.tactics?.highest?.rating ?? null,
      lowest:  data.tactics?.lowest?.rating  ?? null,
    },
    puzzle_rush: {
      best: data.puzzle_rush?.best?.score ?? null,
    },
  };
}

// ---------------------------------------------------------------------------
// Game archives
// ---------------------------------------------------------------------------

/**
 * Get list of monthly archive URLs for a player.
 * @returns {Promise<string[]>} Array of archive URLs, most recent first
 */
export async function getArchiveList(username = PLAYER) {
  const data = await chesscomFetch(`/player/${username}/games/archives`);
  return (data.archives ?? []).reverse(); // most recent first
}

/**
 * Get all games from a specific month archive.
 * @param {string} archiveUrl  - URL from getArchiveList()
 * @returns {Promise<Game[]>}
 */
export async function getGamesFromArchive(archiveUrl) {
  const response = await fetch(archiveUrl, { headers: HEADERS });
  if (!response.ok) throw new Error(`Archive fetch failed: ${archiveUrl}`);
  const data = await response.json();
  return data.games ?? [];
}

/**
 * Get the N most recent games for a player.
 * Traverses monthly archives until enough games are collected.
 *
 * @param {number} count     - Number of games to return (default 20)
 * @param {string} username
 * @returns {Promise<Game[]>}
 */
export async function getRecentGames(count = 20, username = PLAYER) {
  const archives = await getArchiveList(username);
  const games = [];

  for (const archiveUrl of archives) {
    if (games.length >= count) break;
    const monthGames = await getGamesFromArchive(archiveUrl);
    games.push(...monthGames.reverse()); // most recent first within month
  }

  return games.slice(0, count).map(normalizeGame(username));
}

/**
 * Get games from the current month only.
 * @returns {Promise<Game[]>}
 */
export async function getCurrentMonthGames(username = PLAYER) {
  const now = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const data = await chesscomFetch(`/player/${username}/games/${year}/${month}`);
  return (data.games ?? []).reverse().map(normalizeGame(username));
}

// ---------------------------------------------------------------------------
// Game normalizer
// ---------------------------------------------------------------------------

/**
 * Normalize a raw Chess.com game object into a clean structure.
 * Also detects which side the player was on and the result.
 */
function normalizeGame(username) {
  return (game) => {
    const lowerUser = username.toLowerCase();
    const isWhite   = game.white?.username?.toLowerCase() === lowerUser;
    const playerSide   = isWhite ? "white" : "black";
    const playerData   = isWhite ? game.white : game.black;
    const opponentData = isWhite ? game.black : game.white;

    const result = playerData?.result ?? "unknown";
    const won    = result === "win";
    const drew   = ["agreed", "repetition", "stalemate", "insufficient", "50move", "timevsinsufficient"].includes(result);
    const lost   = !won && !drew;

    return {
      uuid:            game.uuid,
      url:             game.url,
      pgn:             game.pgn ?? null,
      fen:             game.fen ?? null,
      timeControl:     game.time_control ?? null,
      timeClass:       game.time_class ?? null,
      rated:           game.rated ?? false,
      rules:           game.rules ?? "chess",
      endTime:         game.end_time ? new Date(game.end_time * 1000).toISOString() : null,
      playerSide,
      playerRating:    playerData?.rating   ?? null,
      opponentRating:  opponentData?.rating ?? null,
      opponentUsername: opponentData?.username ?? "Unknown",
      result,
      won,
      drew,
      lost,
      accuracies: {
        player:   (isWhite ? game.accuracies?.white : game.accuracies?.black) ?? null,
        opponent: (isWhite ? game.accuracies?.black : game.accuracies?.white) ?? null,
      },
    };
  };
}

// ---------------------------------------------------------------------------
// Performance analytics
// ---------------------------------------------------------------------------

/**
 * Compute win/loss/draw stats and rating trend from a game array.
 * @param {Game[]} games
 * @returns {PerformanceStats}
 */
export function computePerformance(games) {
  if (!games.length) return null;

  const wins   = games.filter(g => g.won).length;
  const draws  = games.filter(g => g.drew).length;
  const losses = games.filter(g => g.lost).length;
  const total  = games.length;

  // Rating trend — first vs last rating in sample
  const ratings = games
    .filter(g => g.playerRating)
    .map(g => g.playerRating);
  const ratingTrend = ratings.length >= 2
    ? ratings[0] - ratings[ratings.length - 1]
    : 0;

  // Average accuracy
  const accuracies = games
    .map(g => g.accuracies.player)
    .filter(a => a !== null);
  const avgAccuracy = accuracies.length
    ? Math.round(accuracies.reduce((s, a) => s + a, 0) / accuracies.length)
    : null;

  // Time control breakdown
  const byTimeControl = {};
  games.forEach(g => {
    const tc = g.timeClass ?? "unknown";
    if (!byTimeControl[tc]) byTimeControl[tc] = { wins: 0, losses: 0, draws: 0 };
    if (g.won)   byTimeControl[tc].wins++;
    if (g.lost)  byTimeControl[tc].losses++;
    if (g.drew)  byTimeControl[tc].draws++;
  });

  return {
    total,
    wins,
    draws,
    losses,
    winRate:     Math.round((wins / total) * 100),
    ratingTrend,
    avgAccuracy,
    byTimeControl,
    currentRating: ratings[0] ?? null,
  };
}

/**
 * Filter games to target time controls only (Vlad's 15|10 prescription).
 * @param {Game[]} games
 * @returns {Game[]}
 */
export function filterTargetTimeControls(games) {
  return games.filter(g =>
    TARGET_TIME_CONTROLS.includes(g.timeControl) ||
    g.timeClass === "rapid"
  );
}

// ---------------------------------------------------------------------------
// Opening detection
// ---------------------------------------------------------------------------

/**
 * Extract the opening from a PGN string.
 * Reads the ECO header if present, falls back to first moves.
 * @param {string} pgn
 * @returns {{ eco: string|null, name: string|null, firstMoves: string }}
 */
export function extractOpening(pgn) {
  if (!pgn) return { eco: null, name: null, firstMoves: "" };

  const ecoMatch  = pgn.match(/\[ECO "([^"]+)"\]/);
  const nameMatch = pgn.match(/\[Opening "([^"]+)"\]/);

  // Extract first 5 moves as a signature
  const movesSection = pgn.replace(/\[.*?\]/gs, "").trim();
  const tokens = movesSection.split(/\s+/).filter(t => !t.match(/^\d+\./) && !t.match(/[01]-[01]|1\/2/));
  const firstMoves = tokens.slice(0, 10).join(" ");

  return {
    eco:        ecoMatch?.[1]  ?? null,
    name:       nameMatch?.[1] ?? null,
    firstMoves,
  };
}

/**
 * Detect if the player used the Italian Cage setup in a game.
 * @param {Game} game
 * @param {string} playerSide - 'white' | 'black'
 * @returns {boolean}
 */
export function isItalianCage(game, playerSide = "white") {
  if (!game.pgn || playerSide !== "white") return false;
  const pgn = game.pgn;
  // Check for core Italian Cage moves
  return (
    pgn.includes("e4") &&
    pgn.includes("Nf3") &&
    pgn.includes("Bc4") &&
    pgn.includes("c3") &&
    pgn.includes("d3")
  );
}

// ---------------------------------------------------------------------------
// Leaderboard / streak data
// ---------------------------------------------------------------------------

/**
 * Compute current win/loss streak from recent games.
 * @param {Game[]} games  - ordered most recent first
 * @returns {{ type: 'win'|'loss'|'draw', count: number }}
 */
export function getCurrentStreak(games) {
  if (!games.length) return { type: null, count: 0 };

  const first = games[0];
  const type  = first.won ? "win" : first.lost ? "loss" : "draw";
  let count   = 0;

  for (const game of games) {
    const matches =
      (type === "win"  && game.won)  ||
      (type === "loss" && game.lost) ||
      (type === "draw" && game.drew);
    if (!matches) break;
    count++;
  }

  return { type, count };
}

// ---------------------------------------------------------------------------
// Export summary for Vlad debrief injection
// ---------------------------------------------------------------------------

/**
 * Build a Vlad-ready context string from recent performance.
 * Gets injected into the Vlad prompt alongside game analysis.
 * @param {PerformanceStats} perf
 * @param {{ type: string, count: number }} streak
 * @returns {string}
 */
export function buildPerformanceContext(perf, streak) {
  if (!perf) return "No recent game data available.";
  return `
RECENT PERFORMANCE (${perf.total} games)
Win rate: ${perf.winRate}% (${perf.wins}W / ${perf.losses}L / ${perf.draws}D)
Rating trend: ${perf.ratingTrend >= 0 ? "+" : ""}${perf.ratingTrend} points
Average accuracy: ${perf.avgAccuracy ?? "N/A"}%
Current streak: ${streak.count} ${streak.type ?? ""}${streak.count > 1 ? "s" : ""}
Current rating: ${perf.currentRating ?? "unknown"}
  `.trim();
}

export default {
  getProfile,
  getStats,
  getRecentGames,
  getCurrentMonthGames,
  getArchiveList,
  computePerformance,
  filterTargetTimeControls,
  extractOpening,
  isItalianCage,
  getCurrentStreak,
  buildPerformanceContext,
};
