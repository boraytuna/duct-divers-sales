// ============================================================
//  SALES.JS — handles the sales submission form
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  bindAutocomplete("salesmanName", "salesmanSuggestions");
});

// ── Pill selection (payment method) ─────────────────────────
function selectPill(btn, groupId) {
  document.querySelectorAll(`#${groupId} .pill`).forEach(p => p.classList.remove("selected"));
  btn.classList.add("selected");
  document.getElementById("paymentMethodValue").value = btn.dataset.value;
  clearError("paymentMethod");
}

// ── Validation ───────────────────────────────────────────────
function validate() {
  let valid = true;

  const required = [
    { id: "customerName", label: "Customer name is required" },
    { id: "salesmanName", label: "Salesman name is required" },
    { id: "address", label: "Address is required" },
    { id: "serviceType", label: "Select a service type" },
    { id: "scheduledDate", label: "Scheduled date is required" },
    { id: "scheduledTime", label: "Scheduled time is required" },
    { id: "paymentMethod", label: "Select a payment method" },
  ];

  required.forEach(({ id, label }) => {
    const el = document.getElementById(id === "paymentMethod" ? "paymentMethodValue" : id);
    const err = document.getElementById(`err-${id}`);
    const inp = document.getElementById(id === "paymentMethod" ? "paymentMethodValue" : id);

    if (!el.value.trim()) {
      if (err) { err.textContent = label; err.classList.add("visible"); }
      if (inp) inp.classList.add("error");
      valid = false;
    } else {
      if (err) err.classList.remove("visible");
      if (inp) inp.classList.remove("error");
    }
  });

  return valid;
}

function clearError(id) {
  const err = document.getElementById(`err-${id}`);
  const inp = document.getElementById(id === "paymentMethod" ? "paymentMethodValue" : id);
  if (err) err.classList.remove("visible");
  if (inp) inp.classList.remove("error");
}

// Clear errors on input
["customerName", "salesmanName", "address", "serviceType"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", () => clearError(id));
});

// ── Form submit ──────────────────────────────────────────────
document.getElementById("salesForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validate()) return;

  const btn = document.getElementById("submitBtn");
  const spinner = document.getElementById("btnSpinner");
  const label = btn.querySelector(".btn-label");

  btn.disabled = true;
  label.hidden = true;
  spinner.hidden = false;

  // Build EST timestamp
  const now = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  const payload = {
    action: "submitSale",
    timestamp: now,
    customerName: document.getElementById("customerName").value.trim(),
    salesmanName: document.getElementById("salesmanName").value.trim(),
    address: document.getElementById("address").value.trim(),
    serviceType: document.getElementById("serviceType").value,
    scheduledDate: document.getElementById("scheduledDate").value,
    scheduledTime: document.getElementById("scheduledTime").value,
    price: document.getElementById("price").value.trim() || "",
    paymentMethod: document.getElementById("paymentMethodValue").value,
    notes: document.getElementById("notes").value.trim(),
  };

  try {
    await Sheets.post(payload);
    showSuccess();
    document.getElementById("salesForm").reset();
    // Clear pills
    document.querySelectorAll(".pill").forEach(p => p.classList.remove("selected"));
    document.getElementById("paymentMethodValue").value = "";
  } catch (err) {
    alert("Something went wrong. Check your connection and try again.");
    console.error(err);
  } finally {
    btn.disabled = false;
    label.hidden = false;
    spinner.hidden = true;
  }
});

function showSuccess() {
  const banner = document.getElementById("successBanner");
  banner.hidden = false;
  banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
  setTimeout(() => { banner.hidden = true; }, 4000);
}
