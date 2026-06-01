// ============================================================
//  HOURS.JS — clock in / clock out logic
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  bindAutocomplete("hoursName", "hoursSuggestions");
  setInitialButtonState();

  document.getElementById("hoursName").addEventListener("change", onNameChange);
  document.getElementById("hoursName").addEventListener("input",  onNameChange);
});

// ── Name change — check open session ─────────────────────────
let checkTimeout = null;
let activeCheckId = 0; // tracks which check is the latest

function onNameChange() {
  clearTimeout(checkTimeout);
  activeCheckId++; // invalidate any previous in-flight response

  const name = document.getElementById("hoursName").value.trim();

  document.getElementById("btnClockIn").disabled  = true;
  document.getElementById("btnClockOut").disabled = true;
  document.getElementById("statusDot").className  = "status-dot";
  document.getElementById("statusText").textContent = "🔍 Searching records…";

  if (!name) { setInitialButtonState(); return; }
  
  const thisCheckId = activeCheckId;
  checkTimeout = setTimeout(() => checkStatus(name, thisCheckId), 500);
}

async function checkStatus(name, checkId) {
  try {
    const data = await Sheets.get({ action: "getClockStatus", name });
    
    // If a newer check has started since this one, ignore this response
    if (checkId !== activeCheckId) return;

    updateStatusUI(data.status, data.clockedInAt);
    await loadTodaySessions(name);
  } catch (e) {
    console.error("Status check failed:", e);
  }
}

function updateStatusUI(status, clockedInAt) {
  const dot  = document.getElementById("statusDot");
  const text = document.getElementById("statusText");
  const btnIn  = document.getElementById("btnClockIn");
  const btnOut = document.getElementById("btnClockOut");

  if (status === "in") {
    dot.className  = "status-dot in";
    text.textContent = `Clocked in since ${clockedInAt}`;
    btnIn.disabled  = true;
    btnOut.disabled = false;
  } else {
    dot.className  = "status-dot out";
    text.textContent = "Not currently clocked in";
    btnIn.disabled  = false;
    btnOut.disabled = true;
  }
}

function setInitialButtonState() {
  document.getElementById("statusDot").className = "status-dot";
  document.getElementById("statusText").textContent = "Enter your name to see status";
  document.getElementById("btnClockIn").disabled  = true;
  document.getElementById("btnClockOut").disabled = true;
  document.getElementById("sessionsSection").hidden = true;
}

// ── Clock In ─────────────────────────────────────────────────
async function handleClockIn() {
  const name = document.getElementById("hoursName").value.trim();
  if (!showNameError(name)) return;

  setBtnLoading(true);

  const now = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  try {
    await Sheets.post({ action: "clockIn", name, timestamp: now });
    showHoursBanner("in");
    updateStatusUI("in", formatTime(new Date()));
    await loadTodaySessions(name);
  } catch (e) {
    alert("Clock in failed. Check your connection and try again.");
    console.error(e);
  } finally {
    setBtnLoading(false);
  }
}

// ── Clock Out ────────────────────────────────────────────────
async function handleClockOut() {
  const name = document.getElementById("hoursName").value.trim();
  if (!showNameError(name)) return;

  setBtnLoading(true);

  const now = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  try {
    await Sheets.post({ action: "clockOut", name, timestamp: now });
    showHoursBanner("out");
    updateStatusUI("out", null);
    await loadTodaySessions(name);
  } catch (e) {
    alert("Clock out failed. Check your connection and try again.");
    console.error(e);
  } finally {
    setBtnLoading(false);
  }
}

// ── Load today's sessions ─────────────────────────────────────
async function loadTodaySessions(name) {
  try {
    const data = await Sheets.get({ action: "getTodaySessions", name });
    renderSessions(data.sessions || []);
  } catch (e) {
    console.error("Failed to load sessions:", e);
  }
}

function renderSessions(sessions) {
  const section = document.getElementById("sessionsSection");
  const list    = document.getElementById("sessionsList");
  const total   = document.getElementById("sessionsTotal");

  if (!sessions.length) { section.hidden = true; return; }

  section.hidden = false;
  list.innerHTML = sessions.map(s => {
    const isOpen = !s.clockOut;
    return `
      <div class="session-row">
        <span class="session-time">${s.clockIn}${isOpen ? "" : ` → ${s.clockOut}`}</span>
        <span class="session-dur ${isOpen ? "session-open" : ""}">${isOpen ? "Active" : s.duration}</span>
      </div>
    `;
  }).join("");

  // Sum completed sessions
  const totalMins = sessions
    .filter(s => s.durationMins != null)
    .reduce((acc, s) => acc + s.durationMins, 0);

  if (totalMins > 0) {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    total.textContent = `Total today: ${h}h ${m}m`;
  } else {
    total.textContent = "";
  }
}

// ── Helpers ──────────────────────────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
    hour12: true, timeZone: "America/New_York"
  });
}

function showNameError(name) {
  const err = document.getElementById("err-hoursName");
  if (!name) {
    err.textContent = "Enter your name first";
    err.classList.add("visible");
    return false;
  }
  err.classList.remove("visible");
  return true;
}

function setBtnLoading(loading) {
  document.getElementById("btnClockIn").disabled  = loading;
  document.getElementById("btnClockOut").disabled = loading;
}

function showHoursBanner(type) {
  const banner = document.getElementById("hoursBanner");
  const icon   = document.getElementById("hoursBannerIcon");
  const title  = document.getElementById("hoursBannerTitle");
  const sub    = document.getElementById("hoursBannerSub");

  if (type === "in") {
    icon.textContent  = "✓";
    title.textContent = "Clocked In!";
    sub.textContent   = "Have a great shift.";
    banner.style.borderColor = "var(--green)";
    banner.style.background  = "rgba(45,206,137,0.1)";
    icon.style.color  = "var(--green)";
  } else {
    icon.textContent  = "✓";
    title.textContent = "Clocked Out!";
    sub.textContent   = "See you next time.";
    banner.style.borderColor = "var(--red)";
    banner.style.background  = "rgba(245,60,60,0.08)";
    icon.style.color  = "var(--red)";
  }

  banner.hidden = false;
  banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
  setTimeout(() => { banner.hidden = true; }, 4000);
}
