/**
 * src/modules/VideoLibrary.jsx
 * vlad-chess-coach — Video Library Module
 *
 * GM Vlad Chuchelov's 220 videos tagged by concept.
 * Triggered by GameAutopsy debrief output — tactic detected → video queued.
 * YouTube Data API pulls GM example games by concept.
 *
 * Full vision:
 *   Vlad debriefs → G's slide appears → Vlad video plays → YouTube GM example queues
 *
 * Dependencies:
 *   YouTube Data API key in environment (set in .env as VITE_YOUTUBE_API_KEY)
 *   Field manuals in public/assets/field-manuals/
 *   Slide PNGs in public/assets/slides/
 */

import { useState, useCallback, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const YOUTUBE_API_KEY = import.meta?.env?.VITE_YOUTUBE_API_KEY ?? "";
const VLAD_CHANNEL_ID = "UCVladChuchelovChannel"; // Replace with real channel ID when confirmed
const YOUTUBE_SEARCH  = "https://www.googleapis.com/youtube/v3/search";

// ---------------------------------------------------------------------------
// Concept map — keyword → concept slug → video tags + slide assets
// ---------------------------------------------------------------------------

export const CONCEPT_MAP = {
  // Opening concepts
  "move 9 speed trap":       { slug: "move9-trap",          category: "weakness",  priority: 1 },
  "speed trap":               { slug: "move9-trap",          category: "weakness",  priority: 1 },
  "queen blunder":            { slug: "move9-trap",          category: "weakness",  priority: 1 },
  "panic simplification":     { slug: "panic-simplification",category: "weakness",  priority: 2 },
  "release tension":          { slug: "panic-simplification",category: "weakness",  priority: 2 },
  "queen sortie":             { slug: "queen-sortie",        category: "weakness",  priority: 2 },
  "forcing move":             { slug: "forcing-moves",       category: "tactics",   priority: 2 },
  "cct":                      { slug: "4-step-loop",         category: "mindset",   priority: 3 },
  "italian cage":             { slug: "italian-cage",        category: "opening",   priority: 1 },
  "coiled spring":            { slug: "coiled-spring",       category: "opening",   priority: 1 },
  "strangler":                { slug: "strangler-maneuver",  category: "tactic",    priority: 1 },
  "nbd2":                     { slug: "strangler-maneuver",  category: "tactic",    priority: 1 },
  "bg5":                      { slug: "toxic-baiting",       category: "tactic",    priority: 2 },
  "toxic":                    { slug: "toxic-baiting",       category: "tactic",    priority: 2 },
  "bxh6":                     { slug: "bxh6-sacrifice",      category: "tactic",    priority: 1 },
  "sacrifice":                { slug: "bxh6-sacrifice",      category: "tactic",    priority: 2 },
  "d4 break":                 { slug: "d4-break",            category: "tactic",    priority: 2 },
  "central explosion":        { slug: "d4-break",            category: "tactic",    priority: 2 },
  "queenside expansion":      { slug: "queenside-expansion", category: "tactic",    priority: 2 },
  "b4":                       { slug: "queenside-expansion", category: "tactic",    priority: 3 },
  // Endgame concepts
  "king and pawn":            { slug: "endgame-kp",          category: "endgame",   priority: 2 },
  "passed pawn":              { slug: "endgame-kp",          category: "endgame",   priority: 2 },
  "opposition":               { slug: "endgame-kp",          category: "endgame",   priority: 2 },
  "rook endgame":             { slug: "endgame-kr",          category: "endgame",   priority: 2 },
  "lucena":                   { slug: "endgame-kr",          category: "endgame",   priority: 1 },
  "philidor":                 { slug: "endgame-kr",          category: "endgame",   priority: 1 },
  "two bishops":              { slug: "two-bishops",         category: "endgame",   priority: 2 },
  "bishop pair":              { slug: "two-bishops",         category: "endgame",   priority: 2 },
  "ladder mate":              { slug: "ladder-mate",         category: "endgame",   priority: 1 },
};

// ---------------------------------------------------------------------------
// GM Vlad video library
// 220 videos tagged by concept slug.
// Populate with real YouTube video IDs from GM Vlad's channel.
// ---------------------------------------------------------------------------

export const VLAD_VIDEOS = [
  // ── Italian Cage / Opening ──
  { id: "vlad-001", youtubeId: "PLACEHOLDER_001", title: "Italian Cage Setup — Full System",          slug: "italian-cage",        duration: "18:32", tags: ["opening", "italian", "cage"] },
  { id: "vlad-002", youtubeId: "PLACEHOLDER_002", title: "The Coiled Spring — 9 Move Setup",          slug: "coiled-spring",       duration: "12:45", tags: ["opening", "coiled-spring"] },
  { id: "vlad-003", youtubeId: "PLACEHOLDER_003", title: "The Strangler — Knight to f5",              slug: "strangler-maneuver",  duration: "15:20", tags: ["tactic", "knight", "f5"] },
  { id: "vlad-004", youtubeId: "PLACEHOLDER_004", title: "Queenside Expansion — b4 Timing",           slug: "queenside-expansion", duration: "11:05", tags: ["tactic", "b4", "queenside"] },
  { id: "vlad-005", youtubeId: "PLACEHOLDER_005", title: "Toxic Baiting with Bg5",                    slug: "toxic-baiting",       duration: "09:50", tags: ["tactic", "bishop", "pin"] },
  { id: "vlad-006", youtubeId: "PLACEHOLDER_006", title: "Bxh6 — The King Exposure Sacrifice",        slug: "bxh6-sacrifice",      duration: "14:15", tags: ["tactic", "sacrifice", "attack"] },
  { id: "vlad-007", youtubeId: "PLACEHOLDER_007", title: "The d4 Break — Central Explosion Timing",  slug: "d4-break",            duration: "13:40", tags: ["tactic", "d4", "center"] },
  // ── Weaknesses ──
  { id: "vlad-008", youtubeId: "PLACEHOLDER_008", title: "The Move 9 Danger Zone",                    slug: "move9-trap",          duration: "10:22", tags: ["weakness", "speed", "blunder"] },
  { id: "vlad-009", youtubeId: "PLACEHOLDER_009", title: "Holding Tension — Don't Release Early",     slug: "panic-simplification",duration: "08:45", tags: ["weakness", "psychology"] },
  { id: "vlad-010", youtubeId: "PLACEHOLDER_010", title: "Queen Sorties — How to Respond",            slug: "queen-sortie",        duration: "11:30", tags: ["weakness", "queen", "defense"] },
  { id: "vlad-011", youtubeId: "PLACEHOLDER_011", title: "CCT — Never Skip the Check",                slug: "4-step-loop",         duration: "07:15", tags: ["mindset", "cct", "calculation"] },
  { id: "vlad-012", youtubeId: "PLACEHOLDER_012", title: "Forcing Moves in Winning Positions",        slug: "forcing-moves",       duration: "13:55", tags: ["tactics", "calculation"] },
  // ── Endgames ──
  { id: "vlad-013", youtubeId: "PLACEHOLDER_013", title: "King and Pawn — Opposition Mastery",        slug: "endgame-kp",          duration: "16:10", tags: ["endgame", "king", "pawn"] },
  { id: "vlad-014", youtubeId: "PLACEHOLDER_014", title: "Lucena Position — Step by Step",            slug: "endgame-kr",          duration: "19:25", tags: ["endgame", "rook", "lucena"] },
  { id: "vlad-015", youtubeId: "PLACEHOLDER_015", title: "Philidor Defense — Drawing Technique",      slug: "endgame-kr",          duration: "14:50", tags: ["endgame", "rook", "philidor"] },
  { id: "vlad-016", youtubeId: "PLACEHOLDER_016", title: "Two Bishops — Converting the Advantage",   slug: "two-bishops",         duration: "17:35", tags: ["endgame", "bishop", "conversion"] },
  { id: "vlad-017", youtubeId: "PLACEHOLDER_017", title: "Ladder Mate — Queen and Rook Technique",   slug: "ladder-mate",         duration: "08:20", tags: ["endgame", "mate", "ladder"] },
  // Slots 018–220 populated when GM Vlad's channel is confirmed and attributed
];

// ---------------------------------------------------------------------------
// YouTube GM example search queries by concept
// ---------------------------------------------------------------------------

const GM_SEARCH_QUERIES = {
  "italian-cage":         "Italian Game Giuoco Piano grandmaster game",
  "coiled-spring":        "Italian Game c3 d3 setup grandmaster",
  "strangler-maneuver":   "Knight f5 Italian Game attack grandmaster",
  "bxh6-sacrifice":       "Bxh6 sacrifice kingside attack grandmaster",
  "d4-break":             "d4 central break Italian Game grandmaster",
  "endgame-kr":           "Lucena Philidor rook endgame grandmaster technique",
  "endgame-kp":           "King pawn endgame opposition grandmaster",
  "two-bishops":          "Two bishops endgame conversion grandmaster",
  "move9-trap":           "Queen safety Italian Game middlegame",
  "forcing-moves":        "Forcing moves calculation grandmaster game",
};

// ---------------------------------------------------------------------------
// Concept detection from debrief text
// ---------------------------------------------------------------------------

/**
 * Detect concepts from a Vlad debrief string.
 * Returns sorted array of concept slugs by priority.
 * @param {string} debriefText
 * @returns {string[]} concept slugs
 */
export function detectConcepts(debriefText) {
  if (!debriefText) return [];
  const lower = debriefText.toLowerCase();
  const found = new Map();

  for (const [keyword, concept] of Object.entries(CONCEPT_MAP)) {
    if (lower.includes(keyword)) {
      if (!found.has(concept.slug) || found.get(concept.slug).priority > concept.priority) {
        found.set(concept.slug, concept);
      }
    }
  }

  return Array.from(found.entries())
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([slug]) => slug);
}

/**
 * Get Vlad videos matching a concept slug.
 * @param {string} slug
 * @returns {VladVideo[]}
 */
export function getVideosBySlug(slug) {
  return VLAD_VIDEOS.filter(v => v.slug === slug);
}

/**
 * Get slide PNG paths for a concept slug.
 * @param {string} slug
 * @param {number} maxSlides
 * @returns {string[]}
 */
export function getSlidesBySlug(slug, maxSlides = 5) {
  // Slides follow naming: public/assets/slides/{slug}_01.png
  return Array.from({ length: maxSlides }, (_, i) =>
    `/assets/slides/${slug}_${String(i + 1).padStart(2, "0")}.png`
  );
}

// ---------------------------------------------------------------------------
// YouTube search
// ---------------------------------------------------------------------------

/**
 * Search YouTube for GM example games by concept slug.
 * @param {string} slug
 * @returns {Promise<YouTubeResult[]>}
 */
export async function searchGMExamples(slug) {
  const query = GM_SEARCH_QUERIES[slug];
  if (!query || !YOUTUBE_API_KEY) return [];

  const url = new URL(YOUTUBE_SEARCH);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "3");
  url.searchParams.set("order", "relevance");
  url.searchParams.set("videoDuration", "medium");
  url.searchParams.set("key", YOUTUBE_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("YouTube API request failed");

  const data = await response.json();
  return (data.items ?? []).map(item => ({
    videoId:     item.id.videoId,
    title:       item.snippet.title,
    channel:     item.snippet.channelTitle,
    thumbnail:   item.snippet.thumbnails?.medium?.url ?? null,
    publishedAt: item.snippet.publishedAt,
    url:         `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConceptChip({ slug, isActive, onClick }) {
  const concept = Object.values(CONCEPT_MAP).find(c => c.slug === slug);
  const categoryColors = {
    weakness: "#e74c3c",
    tactic:   "#f39c12",
    opening:  "#2980b9",
    endgame:  "#27ae60",
    mindset:  "#9b59b6",
  };
  const color = categoryColors[concept?.category] ?? "#666";

  return (
    <button
      style={{
        ...styles.conceptChip,
        backgroundColor: isActive ? color + "22" : "transparent",
        border: `1px solid ${isActive ? color : "#333"}`,
        color: isActive ? color : "#555",
      }}
      onClick={onClick}
    >
      {slug.replace(/-/g, " ")}
    </button>
  );
}

function VladVideoCard({ video, isActive, onClick }) {
  const isPlaceholder = video.youtubeId.startsWith("PLACEHOLDER");
  return (
    <div
      style={{
        ...styles.videoCard,
        border: `1px solid ${isActive ? "#c0392b" : "#222"}`,
        backgroundColor: isActive ? "#1a0808" : "#111",
        cursor: isPlaceholder ? "default" : "pointer",
        opacity: isPlaceholder ? 0.5 : 1,
      }}
      onClick={!isPlaceholder ? onClick : undefined}
    >
      <div style={styles.videoThumb}>
        {isPlaceholder ? (
          <div style={styles.videoThumbPlaceholder}>🎬</div>
        ) : (
          <img
            src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
            alt={video.title}
            style={styles.videoThumbImg}
          />
        )}
        <span style={styles.videoDuration}>{video.duration}</span>
      </div>
      <div style={styles.videoInfo}>
        <p style={styles.videoTitle}>{video.title}</p>
        {isPlaceholder && <p style={styles.videoPlaceholder}>Awaiting GM Vlad video ID</p>}
      </div>
    </div>
  );
}

function SlideCarousel({ slug }) {
  const [current, setCurrent] = useState(0);
  const slides = getSlidesBySlug(slug, 3);

  return (
    <div style={styles.carousel}>
      <div style={styles.carouselMain}>
        <div style={styles.carouselSlide}>
          <img
            src={slides[current]}
            alt={`${slug} slide ${current + 1}`}
            style={styles.carouselImg}
            onError={e => { e.target.style.display = "none"; }}
          />
          <div style={styles.carouselOverlay}>
            <span style={styles.carouselSlug}>{slug.replace(/-/g, " ").toUpperCase()}</span>
            <span style={styles.carouselNum}>{current + 1} / {slides.length}</span>
          </div>
        </div>
      </div>
      <div style={styles.carouselDots}>
        {slides.map((_, i) => (
          <button
            key={i}
            style={{ ...styles.carouselDot, backgroundColor: i === current ? "#c0392b" : "#333" }}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </div>
  );
}

function GMExampleCard({ video }) {
  return (
    <a href={video.url} target="_blank" rel="noopener noreferrer" style={styles.gmCard}>
      {video.thumbnail && (
        <img src={video.thumbnail} alt={video.title} style={styles.gmThumb} />
      )}
      <div style={styles.gmInfo}>
        <p style={styles.gmTitle}>{video.title}</p>
        <p style={styles.gmChannel}>{video.channel}</p>
      </div>
      <span style={styles.gmArrow}>↗</span>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function VideoLibrary({ autoTriggerConcepts = [] }) {
  const [activeConcepts, setActiveConcepts] = useState(autoTriggerConcepts);
  const [activeSlug, setActiveSlug]         = useState(autoTriggerConcepts[0] ?? null);
  const [activeVideo, setActiveVideo]       = useState(null);
  const [gmExamples, setGmExamples]         = useState([]);
  const [gmLoading, setGmLoading]           = useState(false);
  const [activeTab, setActiveTab]           = useState("vlad"); // vlad | slides | gm
  const [searchQuery, setSearchQuery]       = useState("");

  // Auto-trigger from GameAutopsy debrief
  useEffect(() => {
    if (autoTriggerConcepts.length > 0) {
      setActiveConcepts(autoTriggerConcepts);
      setActiveSlug(autoTriggerConcepts[0]);
    }
  }, [autoTriggerConcepts]);

  // Load GM examples when slug changes
  useEffect(() => {
    if (!activeSlug) return;
    setGmLoading(true);
    searchGMExamples(activeSlug)
      .then(setGmExamples)
      .catch(() => setGmExamples([]))
      .finally(() => setGmLoading(false));
  }, [activeSlug]);

  // All available slugs for manual browsing
  const allSlugs = [...new Set(VLAD_VIDEOS.map(v => v.slug))];

  // Filter videos by active slug + search
  const filteredVideos = VLAD_VIDEOS.filter(v => {
    const matchSlug   = !activeSlug || v.slug === activeSlug;
    const matchSearch = !searchQuery || v.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSlug && matchSearch;
  });

  const handleSlugSelect = useCallback((slug) => {
    setActiveSlug(prev => prev === slug ? null : slug);
    setActiveVideo(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={styles.root}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🎬</span>
          <div>
            <h1 style={styles.headerTitle}>Video Library</h1>
            <p style={styles.headerSub}>GM Vlad · {VLAD_VIDEOS.length} videos · Tagged by concept</p>
          </div>
        </div>
        {autoTriggerConcepts.length > 0 && (
          <div style={styles.triggerBadge}>
            ⚡ Auto-triggered from debrief
          </div>
        )}
      </div>

      {/* Vision reminder */}
      <div style={styles.visionBox}>
        <p style={styles.visionText}>
          🎖️ Vlad debriefs → 📄 G's slide appears → 🎬 Vlad video plays → 📺 YouTube GM example queues
        </p>
      </div>

      {/* Concept chips */}
      <div style={styles.conceptRow}>
        <span style={styles.conceptLabel}>CONCEPTS</span>
        <div style={styles.conceptChips}>
          {allSlugs.map(slug => (
            <ConceptChip
              key={slug}
              slug={slug}
              isActive={activeSlug === slug}
              onClick={() => handleSlugSelect(slug)}
            />
          ))}
        </div>
      </div>

      {/* Search */}
      <input
        style={styles.searchInput}
        placeholder="Search videos…"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: "vlad",   label: `🎬 Vlad Videos (${filteredVideos.length})` },
          { key: "slides", label: "📄 Field Manual Slides" },
          { key: "gm",     label: `📺 GM Examples${gmExamples.length > 0 ? ` (${gmExamples.length})` : ""}` },
        ].map(tab => (
          <button
            key={tab.key}
            style={{ ...styles.tab, ...(activeTab === tab.key ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Vlad Videos Tab ── */}
      {activeTab === "vlad" && (
        <div style={styles.videoGrid}>
          {filteredVideos.length === 0 ? (
            <p style={styles.emptyText}>No videos found for this concept yet.</p>
          ) : (
            filteredVideos.map(video => (
              <VladVideoCard
                key={video.id}
                video={video}
                isActive={activeVideo?.id === video.id}
                onClick={() => setActiveVideo(video)}
              />
            ))
          )}
        </div>
      )}

      {/* Active video player */}
      {activeTab === "vlad" && activeVideo && !activeVideo.youtubeId.startsWith("PLACEHOLDER") && (
        <div style={styles.playerWrap}>
          <iframe
            style={styles.player}
            src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={activeVideo.title}
          />
        </div>
      )}

      {/* ── Slides Tab ── */}
      {activeTab === "slides" && (
        <div style={styles.slidesSection}>
          {activeSlug ? (
            <>
              <p style={styles.slidesTitle}>
                {activeSlug.replace(/-/g, " ").toUpperCase()} — SLIDES
              </p>
              <SlideCarousel slug={activeSlug} />
              <p style={styles.slidesNote}>
                📁 Source: <code>public/assets/slides/{activeSlug}_XX.png</code>
              </p>
            </>
          ) : (
            <p style={styles.emptyText}>Select a concept above to view slides.</p>
          )}
        </div>
      )}

      {/* ── GM Examples Tab ── */}
      {activeTab === "gm" && (
        <div style={styles.gmSection}>
          {!YOUTUBE_API_KEY ? (
            <div style={styles.apiWarning}>
              <p style={styles.apiWarningTitle}>⚠️ YouTube API Key Required</p>
              <p style={styles.apiWarningText}>
                Add <code>VITE_YOUTUBE_API_KEY</code> to your <code>.env</code> file
                to enable GM example search.
              </p>
            </div>
          ) : gmLoading ? (
            <p style={styles.emptyText}>Searching YouTube…</p>
          ) : gmExamples.length === 0 ? (
            <p style={styles.emptyText}>No GM examples found. Select a concept above.</p>
          ) : (
            <div style={styles.gmList}>
              {gmExamples.map((video, i) => (
                <GMExampleCard key={i} video={video} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    padding: "28px 32px",
    minHeight: "100vh",
    backgroundColor: "#0d0d0d",
    color: "#e8e8e8",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    maxWidth: 1000,
    margin: "0 auto",
  },

  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "1px solid #222", paddingBottom: 20, flexWrap: "wrap", gap: 12,
  },
  headerLeft:  { display: "flex", alignItems: "center", gap: 14 },
  headerIcon:  { fontSize: 36 },
  headerTitle: { margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#fff" },
  headerSub:   { margin: "2px 0 0", fontSize: 12, color: "#666", letterSpacing: "0.5px" },
  triggerBadge: {
    padding: "6px 14px",
    backgroundColor: "#1a0808",
    border: "1px solid #c0392b",
    borderRadius: 4,
    fontSize: 11,
    color: "#c0392b",
  },

  visionBox: {
    padding: "12px 16px",
    backgroundColor: "#080808",
    border: "1px solid #1a1a1a",
    borderRadius: 6,
  },
  visionText: { margin: 0, fontSize: 12, color: "#555", lineHeight: 1.7 },

  conceptRow:   { display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" },
  conceptLabel: { fontSize: 9, color: "#444", letterSpacing: "1.5px", paddingTop: 8, flexShrink: 0 },
  conceptChips: { display: "flex", gap: 6, flexWrap: "wrap" },
  conceptChip: {
    padding: "4px 10px", borderRadius: 3,
    fontSize: 10, cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
    transition: "border-color 0.2s, color 0.2s, background 0.2s",
    letterSpacing: "0.3px",
  },

  searchInput: {
    padding: "10px 14px",
    backgroundColor: "#111",
    border: "1px solid #222",
    borderRadius: 6,
    color: "#ccc",
    fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace",
    outline: "none",
  },

  tabs: { display: "flex", gap: 0, borderBottom: "1px solid #222" },
  tab: {
    padding: "10px 18px", backgroundColor: "transparent",
    border: "none", borderBottom: "2px solid transparent",
    color: "#555", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace",
    cursor: "pointer", letterSpacing: "0.5px",
  },
  tabActive: { color: "#e8e8e8", borderBottom: "2px solid #c0392b" },

  videoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 },
  videoCard: { borderRadius: 8, overflow: "hidden", transition: "border-color 0.2s, background 0.2s" },
  videoThumb: { position: "relative", aspectRatio: "16/9", backgroundColor: "#111", overflow: "hidden" },
  videoThumbPlaceholder: {
    display: "flex", alignItems: "center", justifyContent: "center",
    height: "100%", fontSize: 32, color: "#333",
  },
  videoThumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  videoDuration: {
    position: "absolute", bottom: 6, right: 6,
    padding: "2px 6px", backgroundColor: "#000000cc",
    fontSize: 10, color: "#fff", borderRadius: 2,
  },
  videoInfo:        { padding: "10px 12px" },
  videoTitle:       { margin: "0 0 4px", fontSize: 12, color: "#ccc", lineHeight: 1.4 },
  videoPlaceholder: { margin: 0, fontSize: 10, color: "#444", fontStyle: "italic" },

  playerWrap: { borderRadius: 8, overflow: "hidden", backgroundColor: "#000", aspectRatio: "16/9" },
  player:     { width: "100%", height: "100%", border: "none", display: "block" },

  slidesSection: { display: "flex", flexDirection: "column", gap: 12 },
  slidesTitle:   { margin: 0, fontSize: 10, color: "#444", letterSpacing: "1px" },
  carousel:      { display: "flex", flexDirection: "column", gap: 10, maxWidth: 600 },
  carouselMain:  {},
  carouselSlide: { position: "relative", backgroundColor: "#111", borderRadius: 8, overflow: "hidden", minHeight: 200 },
  carouselImg:   { width: "100%", display: "block" },
  carouselOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 12px",
    background: "linear-gradient(transparent, #000000cc)",
  },
  carouselSlug: { fontSize: 9, color: "#aaa", letterSpacing: "1px" },
  carouselNum:  { fontSize: 10, color: "#666" },
  carouselDots: { display: "flex", gap: 6, justifyContent: "center" },
  carouselDot:  { width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer", transition: "background 0.2s" },
  slidesNote:   { margin: 0, fontSize: 11, color: "#444" },

  gmSection: { display: "flex", flexDirection: "column", gap: 12 },
  gmList:    { display: "flex", flexDirection: "column", gap: 10 },
  gmCard: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "12px 14px",
    backgroundColor: "#111",
    border: "1px solid #222",
    borderRadius: 8,
    textDecoration: "none",
    transition: "border-color 0.2s",
  },
  gmThumb:   { width: 80, height: 45, objectFit: "cover", borderRadius: 4, flexShrink: 0 },
  gmInfo:    { flex: 1, minWidth: 0 },
  gmTitle:   { margin: "0 0 2px", fontSize: 12, color: "#ccc", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  gmChannel: { margin: 0, fontSize: 10, color: "#555" },
  gmArrow:   { fontSize: 16, color: "#444", flexShrink: 0 },

  apiWarning: {
    padding: "16px 18px",
    backgroundColor: "#1a1200",
    border: "1px solid #3d2800",
    borderRadius: 8,
  },
  apiWarningTitle: { margin: "0 0 6px", fontSize: 13, color: "#f39c12", fontWeight: 700 },
  apiWarningText:  { margin: 0, fontSize: 12, color: "#8a6a2a", lineHeight: 1.7 },

  emptyText: { margin: 0, fontSize: 13, color: "#444", fontStyle: "italic" },
};
