// ============================================================
//  SHEETS.JS — all Google Sheets communication goes here
// ============================================================

// ── EmailJS config — reusing booking template ───────────────
const EMAILJS_KEY  = "EqmmvGFGhEt5Kd5sj";
const EMAILJS_SVC  = "service_zj9fjxe";
const EMAILJS_TMPL = "template_4lpa23a"; // business notification template

// Initialize EmailJS once
emailjs.init(EMAILJS_KEY);

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
    const qs  = new URLSearchParams(params).toString();
    const url = `${CONFIG.SCRIPT_URL}?${qs}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

};

// ── Send sale notification email via EmailJS ─────────────────
// Reuses the booking business template (template_4lpa23a).
// "To Email" is hardcoded to dryerductdivers@gmail.com in
// the EmailJS template settings — no customer email needed.
async function sendSaleEmail(payload) {
  const params = {
    customer_name:    payload.customerName,
    customer_email:   "—",                  // not collected on sales, placeholder
    customer_phone:   "Salesman: " + payload.salesmanName,
    customer_address: payload.address,
    booking_date:     payload.scheduledDate,
    booking_slot:     payload.scheduledTime || "Not specified",
    booking_service:  payload.serviceType,
    booking_referral: payload.paymentMethod + (payload.price ? " — $" + payload.price : ""),
  };

  try {
    await emailjs.send(EMAILJS_SVC, EMAILJS_TMPL, params);
    console.log("Sale email sent to dryerductdivers@gmail.com");
  } catch (err) {
    console.warn("EmailJS failed (sale notification):", err);
  }
}

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