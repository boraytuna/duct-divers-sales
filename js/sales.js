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
    { id: "customerName",  label: "Customer name is required" },
    { id: "salesmanName",  label: "Salesman name is required" },
    { id: "address",       label: "Address is required" },
    { id: "serviceType",   label: "Select a service type" },
    { id: "scheduledDate", label: "Scheduled date is required" },
    { id: "scheduledTime", label: "Scheduled time is required" },
    { id: "paymentMethod", label: "Select a payment method" },
  ];

  required.forEach(({ id, label }) => {
    const elId = id === "paymentMethod" ? "paymentMethodValue" : id;
    const el   = document.getElementById(elId);
    const err  = document.getElementById(`err-${id}`);
    if (!el || !el.value.trim()) {
      if (err) { err.textContent = label; err.classList.add("visible"); }
      if (el)  el.classList.add("error");
      valid = false;
    } else {
      if (err) err.classList.remove("visible");
      if (el)  el.classList.remove("error");
    }
  });

  // Optional email — only validate format if something was entered
  const emailEl  = document.getElementById("customerEmail");
  const emailErr = document.getElementById("err-customerEmail");
  if (emailEl && emailEl.value.trim()) {
    const emailOk = /\S+@\S+\.\S+/.test(emailEl.value.trim());
    if (!emailOk) {
      emailErr.classList.add("visible");
      emailEl.classList.add("error");
      valid = false;
    } else {
      emailErr.classList.remove("visible");
      emailEl.classList.remove("error");
    }
  }

  return valid;
}

function clearError(id) {
  const elId = id === "paymentMethod" ? "paymentMethodValue" : id;
  const err  = document.getElementById(`err-${id}`);
  const el   = document.getElementById(elId);
  if (err) err.classList.remove("visible");
  if (el)  el.classList.remove("error");
}

["customerName", "salesmanName", "address", "serviceType", "customerEmail"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", () => clearError(id));
});

// ── Form submit ──────────────────────────────────────────────
document.getElementById("salesForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validate()) return;

  const btn     = document.getElementById("submitBtn");
  const spinner = document.getElementById("btnSpinner");
  const label   = btn.querySelector(".btn-label");

  btn.disabled   = true;
  label.hidden   = true;
  spinner.hidden = false;

  const now = new Date().toLocaleString("en-US", { timeZone: "America/Detroit" });

  const payload = {
    action:        "submitSale",
    timestamp:     now,
    customerName:  document.getElementById("customerName").value.trim(),
    customerEmail: document.getElementById("customerEmail").value.trim(),
    salesmanName:  document.getElementById("salesmanName").value.trim(),
    address:       document.getElementById("address").value.trim(),
    serviceType:   document.getElementById("serviceType").value,
    scheduledDate: document.getElementById("scheduledDate").value,
    scheduledTime: document.getElementById("scheduledTime").value,
    price:         document.getElementById("price").value.trim() || "",
    paymentMethod: document.getElementById("paymentMethodValue").value,
    notes:         document.getElementById("notes").value.trim(),
  };

  try {
    const result = await Sheets.post(payload);

    if (result.error) {
      alert(result.error);
      return;
    }

    // Send business notification + customer confirmation (if email provided)
    await sendSaleEmail(payload);

    showSuccess(!!payload.customerEmail);
    document.getElementById("salesForm").reset();
    document.querySelectorAll(".pill").forEach(p => p.classList.remove("selected"));
    document.getElementById("paymentMethodValue").value = "";

  } catch (err) {
    alert("Something went wrong. Check your connection and try again.");
    console.error(err);
  } finally {
    btn.disabled   = false;
    label.hidden   = false;
    spinner.hidden = true;
  }
});

function showSuccess(emailSent) {
  const banner = document.getElementById("successBanner");
  const sub    = banner.querySelector("p");
  sub.textContent = emailSent
    ? "Confirmation sent to customer."
    : "Nice work. Ready for the next one.";
  banner.hidden = false;
  banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
  setTimeout(() => { banner.hidden = true; }, 4000);
}