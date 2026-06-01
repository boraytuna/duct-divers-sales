// ============================================================
//  SHEETS.JS — all Google Sheets communication goes here
// ============================================================

const Sheets = {

  // POST data to Apps Script
  async post(payload) {
    const res = await fetch(CONFIG.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  // GET data from Apps Script
  async get(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = `${CONFIG.SCRIPT_URL}?${qs}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

};

// ── Roster cache (loaded once per session) ──────────────────
let _rosterCache = null;

async function getRoster() {
  if (_rosterCache) return _rosterCache;
  try {
    const data = await Sheets.get({ action: "getRoster" });
    _rosterCache = data.names || [];
    return _rosterCache;
  } catch (e) {
    console.error("Failed to load roster:", e);
    return [];
  }
}

// ── Autocomplete helper ─────────────────────────────────────
function bindAutocomplete(inputId, listId) {
  const input = document.getElementById(inputId);
  const list  = document.getElementById(listId);
  if (!input || !list) return;

  let names = [];
  let highlighted = -1;

  // Load roster on first focus
  input.addEventListener("focus", async () => {
    if (names.length === 0) names = await getRoster();
  });

  input.addEventListener("input", () => {
    const val = input.value.trim().toLowerCase();
    highlighted = -1;
    if (!val) { closeList(); return; }

    const matches = names.filter(n => n.toLowerCase().includes(val));
    if (!matches.length) { closeList(); return; }

    list.innerHTML = matches.map(n =>
      `<li role="option" tabindex="-1">${n}</li>`
    ).join("");
    list.classList.add("open");

    list.querySelectorAll("li").forEach(li => {
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        input.value = li.textContent;
        closeList();
        input.dispatchEvent(new Event("change"));
      });
    });
  });

  // Keyboard nav
  input.addEventListener("keydown", (e) => {
    const items = list.querySelectorAll("li");
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlighted = Math.min(highlighted + 1, items.length - 1);
      updateHighlight(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlighted = Math.max(highlighted - 1, 0);
      updateHighlight(items);
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      input.value = items[highlighted].textContent;
      closeList();
    } else if (e.key === "Escape") {
      closeList();
    }
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !list.contains(e.target)) closeList();
  });

  function updateHighlight(items) {
    items.forEach((li, i) => li.classList.toggle("highlighted", i === highlighted));
    if (highlighted >= 0) items[highlighted].scrollIntoView({ block: "nearest" });
  }

  function closeList() {
    list.innerHTML = "";
    list.classList.remove("open");
    highlighted = -1;
  }
}
