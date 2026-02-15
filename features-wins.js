/* features-wins.js
   Monthly Wins (Small win logger + dashboard renderer)

   ✅ What this does:
   - Stores wins in: localStorage["lifeAdmin:v1"].wins.events[]
   - Exposes: window.logWin(type, label, delta, meta)
   - Exposes convenience helpers: logSkillWin, logPlanWin, logSavingWin, etc.
   - Auto-renders the Monthly Wins dashboard panel when data changes
   - Listens for: window "lifeadmin:datachanged" and DOMContentLoaded

   ✅ What you STILL must do elsewhere:
   - Call window.logSkillWin(...) when a skill is added / levelled up
   - Call window.logPlanWin(...) when a home item is planned/owned
   - Call window.logSavingWin(...) when a fund increases (diff > 0)

   (This file cannot magically detect those changes without you calling it.)
*/

(() => {
  const APP_KEY = "lifeAdmin:v1";
  const LIMIT = 600;

  // ---------- State helpers ----------
  function loadState() {
    try {
      const raw = localStorage.getItem(APP_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveState(state) {
    state.updatedAt = Date.now();
    localStorage.setItem(APP_KEY, JSON.stringify(state));
  }

  function ensureWins(state) {
    if (!state.wins || typeof state.wins !== "object") state.wins = {};
    if (!Array.isArray(state.wins.events)) state.wins.events = [];
  }

  function monthKeyFromTs(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function getSelectedMonthKey() {
    // Prefer whatever the user is looking at on Money page if present
    const moneyMonth = document.getElementById("moneyMonth");
    if (moneyMonth && moneyMonth.value) return String(moneyMonth.value);

    // Fallbacks (if you ever use other month selectors)
    const txMonth = document.getElementById("txMonthFilter");
    if (txMonth && txMonth.value) return String(txMonth.value);

    // Default: current month
    return monthKeyFromTs(Date.now());
  }

  // ---------- Public logger ----------
  window.logWin = function logWin(type, label, delta = 1, meta = {}) {
    const safeType = String(type || "").trim() || "other";
    const safeLabel = String(label || "").trim();
    if (!safeLabel) return false;

    const state = loadState();
    ensureWins(state);

    state.wins.events.push({
      id: (crypto?.randomUUID?.() || `win_${Date.now()}_${Math.random().toString(16).slice(2)}`),
      ts: Date.now(),
      type: safeType,      // e.g. "skill" | "plan" | "saving"
      label: safeLabel,
      delta: Number.isFinite(delta) ? delta : 1,
      meta: meta && typeof meta === "object" ? meta : {}
    });

    if (state.wins.events.length > LIMIT) {
      state.wins.events = state.wins.events.slice(-LIMIT);
    }

    saveState(state);

    // Trigger other modules (dashboard) to update immediately
    window.dispatchEvent(new Event("lifeadmin:datachanged"));
    return true;
  };

  // ---------- Convenience helpers ----------
  window.logSkillWin = (name, verb = "Added") =>
    window.logWin("skill", `${verb} skill: ${name}`, 1, { name });

  window.logSkillLevelWin = (name, level) =>
    window.logWin("skill", `Improved skill: ${name} → ${level}`, 1, { name, level });

  window.logPlanWin = (label, meta = {}) =>
    window.logWin("plan", `Planned: ${label}`, 1, meta);

  window.logOwnedWin = (label, meta = {}) =>
    window.logWin("plan", `Owned: ${label}`, 1, meta);

  // IMPORTANT: pass *diff* (increase) not the full amount
  window.logSavingWin = (fundName, diff) => {
    const amt = Number(diff);
    if (!Number.isFinite(amt) || amt <= 0) return false;
    return window.logWin("saving", `Saved £${amt.toFixed(2)} to ${fundName}`, amt, {
      fund: fundName,
      amount: amt
    });
  };

  // ---------- Monthly totals helper ----------
  window.getMonthlyWinTotals = function getMonthlyWinTotals(monthKey = getSelectedMonthKey()) {
    const state = loadState();
    ensureWins(state);

    const monthEvents = state.wins.events.filter(e => monthKeyFromTs(e.ts) === monthKey);

    const totals = monthEvents.reduce((acc, e) => {
      const t = e.type || "other";
      const d = Number.isFinite(e.delta) ? e.delta : 1;
      acc[t] = (acc[t] || 0) + d;
      return acc;
    }, {});

    return { monthKey, totals, monthEvents };
  };

  // ---------- Dashboard renderer ----------
  function renderMonthlyWins() {
    const badgeEl = document.getElementById("badgeMonthlyWins");
    const summaryEl = document.getElementById("monthlyWinsSummary");
    const listEl = document.getElementById("monthlyWinsList");

    // If the dashboard panel isn't on this page, do nothing
    if (!badgeEl || !summaryEl || !listEl) return;

    const monthKey = getSelectedMonthKey();
    const { totals, monthEvents } = window.getMonthlyWinTotals(monthKey);

    const skillsCount = Math.round(totals.skill || 0);
    const plannedCount = Math.round(totals.plan || 0);
    const savingsTotal = totals.saving || 0;

    // Badge (total events this month)
    badgeEl.textContent = String(monthEvents.length || 0);

    // Summary pills (match your UI wording)
    summaryEl.innerHTML = `
      <div class="pill">Skills ${skillsCount}</div>
      <div class="pill">Planned ${plannedCount}</div>
      <div class="pill">Savings ${formatCurrency(savingsTotal)}</div>
    `;

    // List (latest first)
    if (!monthEvents.length) {
      listEl.innerHTML = `
        <li>
          <strong>No wins logged yet</strong><br>
          <span class="muted">Add a skill, plan a home item, or increase a fund — and this will start filling in.</span>
        </li>
      `;
      return;
    }

    const items = monthEvents
      .slice()
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))
      .slice(0, 10)
      .map(e => {
        const when = new Date(e.ts).toLocaleDateString(undefined, { day: "2-digit", month: "short" });
        return `<li><span class="muted">${when}</span> — ${escapeHtml(e.label)}</li>`;
      })
      .join("");

    listEl.innerHTML = items;
  }

  function formatCurrency(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return "£0";
    return v.toLocaleString(undefined, { style: "currency", currency: "GBP" });
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Expose renderer (handy for debugging)
  window.renderMonthlyWins = renderMonthlyWins;

  // Re-render when:
  // - app data changes
  // - month dropdown changes
  // - initial load
  window.addEventListener("lifeadmin:datachanged", renderMonthlyWins);

  document.addEventListener("DOMContentLoaded", () => {
    renderMonthlyWins();

    const moneyMonth = document.getElementById("moneyMonth");
    if (moneyMonth) moneyMonth.addEventListener("change", renderMonthlyWins);

    const txMonth = document.getElementById("txMonthFilter");
    if (txMonth) txMonth.addEventListener("change", renderMonthlyWins);
  });
})();
