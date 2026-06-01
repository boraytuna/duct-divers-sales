// ============================================================
//  LEADERBOARD.JS — today + all-time board
// ============================================================

let currentMode = "today";

document.addEventListener("DOMContentLoaded", () => {
  // Show today's date
  const d = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric",
    timeZone: "America/New_York"
  });
  document.getElementById("todayDate").textContent = d;

  loadBoard("today");
});

function switchBoard(mode) {
  if (mode === currentMode) return;
  currentMode = mode;

  document.getElementById("btnToday").classList.toggle("active",   mode === "today");
  document.getElementById("btnAllTime").classList.toggle("active", mode === "alltime");

  loadBoard(mode);
}

async function loadBoard(mode) {
  showLoading();
  try {
    const data = await Sheets.get({ action: "getLeaderboard", mode });
    renderBoard(data.board || []);
  } catch (e) {
    console.error("Leaderboard load failed:", e);
    showEmpty();
  }
}

function renderBoard(board) {
  if (!board.length) { showEmpty(); return; }

  document.getElementById("boardLoading").hidden = true;
  document.getElementById("boardEmpty").hidden   = true;
  document.getElementById("boardContent").hidden = false;

  renderPodium(board.slice(0, 3));
  renderList(board);
}

function renderPodium(top) {
  const podium = document.getElementById("podium");

  // Reorder for podium display: 2nd, 1st, 3rd
  const slots = top.length >= 2
    ? [top[1], top[0], top[2]].filter(Boolean)
    : top;

  const medals = ["🥈", "🥇", "🥉"];
  // Map original rank to medal: top[0]=gold, top[1]=silver, top[2]=bronze
  const medalMap = { 0: "🥇", 1: "🥈", 2: "🥉" };

  // Rebuild: always show 1st in center
  const orderedForDisplay = [];
  if (top[1]) orderedForDisplay.push({ ...top[1], origRank: 1 });
  if (top[0]) orderedForDisplay.push({ ...top[0], origRank: 0 });
  if (top[2]) orderedForDisplay.push({ ...top[2], origRank: 2 });

  podium.innerHTML = orderedForDisplay.map(p => `
    <div class="podium-slot">
      <div class="podium-name">${p.name}</div>
      <div class="podium-count">${p.sales}</div>
      <div class="podium-count-label">sales</div>
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
          <div class="board-sales">${p.sales} sales</div>
          ${rev ? `<div class="board-rev">${rev}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

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
