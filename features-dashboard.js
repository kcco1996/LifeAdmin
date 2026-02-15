/* features-dashboard.js
   Dashboard: Next Steps / This Week / Focus / Monthly Wins
   Works off localStorage lifeAdmin:v1 (or window.__lifeAdminState if you later expose it)
*/

(() => {
  const $ = (id) => document.getElementById(id);

  const APP_KEY = "lifeAdmin:v1";
  const DASH_KEY = "lifeAdmin:dash:v1";

  // ---------- Load helpers ----------
  function loadState() {
    // If you later expose a live in-memory state, this will use it.
    if (window.__lifeAdminState && typeof window.__lifeAdminState === "object") return window.__lifeAdminState;

    try {
      const raw = localStorage.getItem(APP_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function loadDash() {
    try {
      return JSON.parse(localStorage.getItem(DASH_KEY)) || { dismissed: {} };
    } catch {
      return { dismissed: {} };
    }
  }

  function saveDash(dash) {
    localStorage.setItem(DASH_KEY, JSON.stringify(dash));
  }

  // ---------- Date helpers ----------
  function toDate(d) {
    if (!d) return null;
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? null : x;
  }

  function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function daysBetween(a, b) {
    const ms = b.getTime() - a.getTime();
    return Math.floor(ms / (24 * 60 * 60 * 1000));
  }

  function inNextNDays(date, n) {
    const t0 = startOfToday();
    const dd = daysBetween(t0, date);
    return dd >= 0 && dd <= n;
  }

  function isToday(date) {
    const t0 = startOfToday();
    const dd = daysBetween(t0, date);
    return dd === 0;
  }

  // ---------- Extract data from your state (robust) ----------
  function getAdminItems(state) {
    // Try common shapes
    const candidates = [
      state?.admin?.items,
      state?.admin?.list,
      state?.adminItems,
      state?.items,
      state?.lifeAdmin?.items,
      state?.lifeAdminItems
    ];
    const arr = candidates.find(Array.isArray);
    return arr || [];
  }

  function getMoneyFunds(state) {
    const candidates = [
      state?.money?.funds,
      state?.money?.futureFunds,
      state?.funds,
    ];
    const arr = candidates.find(Array.isArray);
    return arr || [];
  }

  function getMoneyTx(state) {
    const candidates = [
      state?.money?.transactions,
      state?.money?.tx,
      state?.transactions,
    ];
    const arr = candidates.find(Array.isArray);
    return arr || [];
  }

  function getSkills(state) {
    const candidates = [
      state?.skills?.items,
      state?.skills?.skills,
      state?.skillsList,
      state?.lifeSkills?.items
    ];
    const arr = candidates.find(Array.isArray);
    return arr || [];
  }

  // ---------- Build dashboard "tasks" ----------
  function buildTasks(state) {
    const tasks = [];

    // Life Admin items with due dates
    for (const it of getAdminItems(state)) {
      const due = toDate(it.dueDate || it.due || it.date);
      if (!due) continue;
      if (it.archived) continue;

      tasks.push({
        id: `admin:${it.id || it.name || due.toISOString()}`,
        source: "Life Admin",
        title: it.name || "Life Admin item",
        subtitle: it.details || it.provider || "",
        due,
        priority: it.priority || "normal",
      });
    }

    // Money funds with target dates (optional)
    for (const f of getMoneyFunds(state)) {
      const due = toDate(f.targetDate || f.dueDate);
      if (!due) continue;

      tasks.push({
        id: `fund:${f.id || f.name || due.toISOString()}`,
        source: "Money",
        title: `Fund target: ${f.name || "Fund"}`,
        subtitle: f.notes || "",
        due,
        priority: f.priority || "normal",
      });
    }

    // Money budgets (if you store a "renewal" / "next date")
    // (kept minimal; can extend later)

    return tasks.sort((a, b) => a.due - b.due);
  }

  // ---------- Monthly wins (derived) ----------
  function monthKey(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

function pickDate(obj) {
  return toDate(obj?.ts || obj?.date || obj?.dateAdded || obj?.createdAt || obj?.updatedAt);
}

function buildMonthlyWins(state) {
  const events = Array.isArray(state?.wins?.events) ? state.wins.events : null;
  const key = monthKey();

  if (events) {
    const monthEvents = events.filter(e => monthKey(e.ts) === key);
    const totals = monthEvents.reduce((acc, e) => {
      const t = e.type || "other";
      acc[t] = (acc[t] || 0) + (e.delta ?? 1);
      return acc;
    }, {});
    return { totals, monthEvents };
  }

  // Infer from timestamps if your items have them
  const skills = getSkills(state)
    .filter(s => {
      const d = pickDate(s);
      return d && monthKey(d.getTime()) === key;
    }).length;

  const plans = getAdminItems(state)
    .filter(p => {
      // treat newly created planned items as "planned"
      const d = pickDate(p);
      return d && monthKey(d.getTime()) === key && !p.archived;
    }).length;

  const savings = getMoneyTx(state)
    .filter(t => {
      const d = pickDate(t);
      const amt = Number(t.amount ?? t.delta ?? t.value ?? 0);
      // count positive transactions as savings (adjust if you store type/category)
      return d && monthKey(d.getTime()) === key && amt > 0;
    }).length;

  return {
    totals: { skill: skills, plan: plans, saving: savings },
    monthEvents: [],
    inferred: true
  };
}

  // ---------- Rendering ----------
  function setBadge(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  function renderList(listId, emptyId, items, makeLi) {
    const ul = $(listId);
    const empty = $(emptyId);
    if (!ul) return;

    ul.innerHTML = "";

    if (!items.length) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    for (const it of items) ul.appendChild(makeLi(it));
  }

  function pillDueText(due) {
    const t0 = startOfToday();
    const dd = daysBetween(t0, due);
    if (dd === 0) return "Today";
    if (dd === 1) return "Tomorrow";
    if (dd < 0) return `${Math.abs(dd)}d overdue`;
    return `In ${dd}d`;
  }

  function makeTaskLi(task, dash) {
    const li = document.createElement("li");
    li.className = "list__item";

    const dueTxt = pillDueText(task.due);
    const sub = task.subtitle ? ` • ${task.subtitle}` : "";

    li.innerHTML = `
      <div class="list__main">
        <div class="list__title">${escapeHtml(task.title)}</div>
        <div class="list__sub muted">${escapeHtml(task.source)}${escapeHtml(sub)}</div>
      </div>
      <div class="list__actions" style="display:flex; gap:8px; align-items:center;">
        <span class="badge badge--neutral">${escapeHtml(dueTxt)}</span>
        <button class="ghost-btn ghost-btn--sm" type="button" data-dismiss="${task.id}">Dismiss</button>
      </div>
    `;

    li.querySelector("[data-dismiss]")?.addEventListener("click", () => {
      dash.dismissed[task.id] = Date.now();
      saveDash(dash);
      renderDashboard(); // re-render
    });

    return li;
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // ---------- Cards collapse (your UI shows a minus button) ----------
  function bindCollapseButtons() {
    // Your markup doesn’t show explicit buttons for these cards,
    // so we add a simple handler: any card header badge that looks like "—" isn't a toggle.
    // If you already have collapse logic, this does nothing.

    document.querySelectorAll(".card").forEach(card => {
      const header = card.querySelector(".card__header");
      if (!header) return;
      const btn = card.querySelector(".card__header .icon-btn, .card__header button[data-collapse]");
      if (!btn) return;
      // If you already have it wired, skip.
    });
  }

  // ---------- Clear button for Next Steps (top-right) ----------
  function bindClearButton() {
    // In your screenshot, Next Steps has a "Clear" button.
    // Your HTML currently doesn't show it. If it exists, wire it.
    const btn = document.querySelector("[data-dash-clear], #btnDashClear, #btnClearNextSteps");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const dash = loadDash();
      dash.dismissed = {};
      saveDash(dash);
      renderDashboard();
    });
  }

  // ---------- Main render ----------
  function renderDashboard() {
    const state = loadState();
    const dash = loadDash();

    const tasks = buildTasks(state).filter(t => !dash.dismissed[t.id]);

    const today = tasks.filter(t => isToday(t.due));
    const week = tasks.filter(t => inNextNDays(t.due, 7) && !isToday(t.due));

    // Next Steps badges
    setBadge("badgeNextSteps", String(today.length + week.length));

    renderList(
      "nextStepsToday",
      "emptyNextToday",
      today,
      (t) => makeTaskLi(t, dash)
    );

    renderList(
      "nextStepsWeek",
      "emptyNextWeek",
      week,
      (t) => makeTaskLi(t, dash)
    );

    // This Week (combined list)
    const thisWeek = tasks.filter(t => inNextNDays(t.due, 7));
   setBadge("badgeThisWeek", String(thisWeek.length)); // keep

   function setBadge(id, text, ...alts) {
  const el = $(id, ...alts);
  if (el) el.textContent = text;
}

setBadge("badgeThisWeek", String(thisWeek.length), "badgeThisWeekCount");
setBadge("badgeFocus", "Gentle", "badgeFocusLabel");
setBadge("badgeMonthlyWins", "0", "badgeWins");

    renderList(
      "thisWeekList",
      "emptyThisWeek",
      thisWeek,
      (t) => makeTaskLi(t, dash)
    );

    // Focus suggestion (simple rule-based)
    // - if many due soon -> "Careful"
    // - if some due soon -> "Gentle"
    // - if none -> calm message
    const focus = [];
    if (thisWeek.length >= 6) {
      setBadge("badgeFocus", "Careful");
      focus.push({ title: "Pick 1 urgent thing and do a 10-minute first step.", sub: "Lots due soon — keep it tiny." });
      focus.push({ title: "Do one admin task that removes future stress.", sub: "Insurance / renewal / bill check." });
    } else if (thisWeek.length >= 1) {
      setBadge("badgeFocus", "Gentle");
      focus.push({ title: "Do the easiest ‘due soon’ task first.", sub: "Momentum beats perfection." });
      focus.push({ title: "If it takes <2 mins, do it now.", sub: "Small wins reduce overwhelm." });
    } else {
      setBadge("badgeFocus", "Gentle");
      focus.push({ title: "You’re clear this week — add one future-proof task.", sub: "E.g. emergency fund, document tidy-up." });
    }

    renderList(
      "focusSuggestionList",
      "emptyFocusSuggestion",
      focus,
      (x) => {
        const li = document.createElement("li");
        li.className = "list__item";
        li.innerHTML = `
          <div class="list__main">
            <div class="list__title">${escapeHtml(x.title)}</div>
            <div class="list__sub muted">${escapeHtml(x.sub || "")}</div>
          </div>
        `;
        return li;
      }
    );

    // Monthly wins
    const wins = buildMonthlyWins(state);
    const winsSummary = $("monthlyWinsSummary");
    const winsList = $("monthlyWinsList");
    const winsBadge = $("badgeMonthlyWins");

    if (winsBadge) winsBadge.textContent = "—";

    if (winsSummary) {
      // If you have a money-summary component, populate it with simple chips
      const skill = wins.totals.skill ?? 0;
      const plan = wins.totals.plan ?? 0;
      const saving = wins.totals.saving ?? 0;

      winsSummary.innerHTML = `
        <div class="money-pill"><span class="muted">Skills</span><strong>${skill}</strong></div>
        <div class="money-pill"><span class="muted">Planned</span><strong>${plan}</strong></div>
        <div class="money-pill"><span class="muted">Savings</span><strong>${saving}</strong></div>
      `;
    }

    if (winsList) {
      winsList.innerHTML = "";
      const events = wins.monthEvents || [];

      if (events.length) {
        if (winsBadge) winsBadge.textContent = String(events.length);

        for (const e of events.slice(0, 8)) {
          const li = document.createElement("li");
          li.className = "list__item";
          li.innerHTML = `
            <div class="list__main">
              <div class="list__title">${escapeHtml(e.label || e.type || "Win")}</div>
              <div class="list__sub muted">${new Date(e.ts).toLocaleString()}</div>
            </div>
            <div class="list__actions"><span class="badge badge--ok">+${e.delta ?? 1}</span></div>
          `;
          winsList.appendChild(li);
        }
      } else {
        if (winsBadge) winsBadge.textContent = "0";
        // small friendly placeholder row
        const li = document.createElement("li");
        li.className = "list__item";
        li.innerHTML = `
          <div class="list__main">
            <div class="list__title">No wins logged yet</div>
            <div class="list__sub muted">Add a skill, plan an item, or update a fund — and this will start filling in.</div>
          </div>
        `;
        winsList.appendChild(li);
      }
    }
  }

  // ---------- Listen for changes ----------
  // If your app triggers saves, the easiest reliable refresh is polling.
  // Lightweight and safe.
  let lastHash = "";
  function computeHash() {
    const raw = localStorage.getItem(APP_KEY) || "";
    // small hash to detect change
    let h = 0;
    for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) >>> 0;
    return String(h);
  }

  function startWatcher() {
    setInterval(() => {
      const h = computeHash();
      if (h !== lastHash) {
        lastHash = h;
        renderDashboard();
      }
    }, 1500);
  }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    bindCollapseButtons();
    bindClearButton();
    lastHash = computeHash();
    renderDashboard();
    startWatcher();
    window.addEventListener("lifeadmin:datachanged", () => renderDashboard());
  });
})();