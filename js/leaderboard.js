// ============================================================
//  LEADERBOARD.JS
// ============================================================

let currentMode  = "today";
let lastUpdated  = null;

const QUOTES = [
  "Hustle in silence. Let the numbers make the noise.",
  "Every door is an opportunity. Make it count.",
  "The grind doesn't stop. Neither do you.",
  "Sales is the lifeblood. Keep it pumping.",
  "One more knock. One more sale.",
  "Champions show up every single day.",
  "Your next customer is one conversation away.",
  "Work like someone is always watching — because they are.",
  "Outwork. Outperform. Outlast.",
  "The scoreboard doesn't lie. What does yours say?",
];

document.addEventListener("DOMContentLoaded", () => {
  // Today's date
  const d = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric",
    timeZone: "America/Detroit"
  });
  document.getElementById("todayDate").textContent = d;

  // Quote — always visible immediately
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const qEl = document.getElementById("motivationalQuote");
  if (qEl) qEl.textContent = '"' + q + '"';

  // Initial load
  loadBoard(currentMode);

  // Auto-refresh every 5 minutes
  setInterval(() => loadBoard(currentMode), 5 * 60 * 1000);

  // Update "last updated" text every 30 seconds
  setInterval(updateLastUpdatedText, 30 * 1000);
});

// ── Toggle ───────────────────────────────────────────────────
function switchBoard(mode) {
  if (mode === currentMode) return;
  currentMode = mode;

  document.getElementById("btnToday").classList.toggle("active",   mode === "today");
  document.getElementById("btnAllTime").classList.toggle("active", mode === "alltime");
  document.getElementById("boardSubtitle").textContent =
    mode === "today" ? "Today's sales only" : "All-time rankings";

  loadBoard(mode);
}

// ── Load ─────────────────────────────────────────────────────
async function loadBoard(mode) {
  showLoading();
  const scriptMode = mode === "alltime" ? "all" : "today";

  try {
    const data = await Sheets.get({ action: "getLeaderboard", mode: scriptMode });
    renderBoard(data.board || []);
    lastUpdated = new Date();
    updateLastUpdatedText();
  } catch (e) {
    console.error("Leaderboard load failed:", e);
    showEmpty();
  }
}

// ── Render ───────────────────────────────────────────────────
function renderBoard(board) {
  // Always hide loading first
  document.getElementById("boardLoading").hidden = true;

  if (!board || board.length === 0) {
    showEmpty();
    return;
  }

  document.getElementById("boardEmpty").hidden   = true;
  document.getElementById("boardContent").hidden = false;

  renderPodium(board.slice(0, 3));
  renderList(board);
}

function renderPodium(top) {
  const podium   = document.getElementById("podium");
  const medalMap = { 0: "🥇", 1: "🥈", 2: "🥉" };

  // Display order: 2nd, 1st, 3rd
  const display = [];
  if (top[1]) display.push({ ...top[1], origRank: 1 });
  if (top[0]) display.push({ ...top[0], origRank: 0 });
  if (top[2]) display.push({ ...top[2], origRank: 2 });

  podium.innerHTML = display.map(p => `
    <div class="podium-slot">
      <div class="podium-name">${p.name}</div>
      <div class="podium-count">${p.sales}</div>
      <div class="podium-count-label">SALES</div>
      <div class="podium-block">${medalMap[p.origRank]}</div>
    </div>
  `).join("");
}

function renderList(board) {
  const list = document.getElementById("boardList");
  list.innerHTML = board.map((p, i) => {
    const rank = i + 1;
    const rev  = p.revenue ? `$${Number(p.revenue).toLocaleString()}` : "";
    return `
      <div class="board-row">
        <span class="board-rank ${rank <= 3 ? "top" : ""}">${rank}</span>
        <span class="board-name">${p.name}</span>
        <div class="board-stats">
          <div class="board-sales">${p.sales} sale${p.sales !== 1 ? "s" : ""}</div>
          ${rev ? `<div class="board-rev">${rev}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

// ── Last updated ─────────────────────────────────────────────
function updateLastUpdatedText() {
  const el = document.getElementById("lastUpdated");
  if (!lastUpdated || !el) return;
  const mins = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
  if (mins < 1)      el.textContent = "Updated just now";
  else if (mins ===1) el.textContent = "Updated 1 min ago";
  else               el.textContent = `Updated ${mins} mins ago`;
}

// ── State helpers ─────────────────────────────────────────────
function showLoading() {
  document.getElementById("boardLoading").hidden = false;
  document.getElementById("boardContent").hidden = true;
  document.getElementById("boardEmpty").hidden   = true;
}

function showEmpty() {
  document.getElementById("boardLoading").hidden = true;
  document.getElementById("boardContent").hidden = true;
  document.getElementById("boardEmpty").hidden   = false;
}