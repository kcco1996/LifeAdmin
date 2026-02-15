/* =========================
   Life Admin — script.js
   Clean single-source logic file
   ========================= */

(() => {
  "use strict";

  // =========================
  // ROUTER (Admin/Home/Skills/Money/Settings)
  // =========================
  const navButtons = Array.from(document.querySelectorAll(".nav__item"));
  const views = {
    admin: document.getElementById("view-admin"),
    home: document.getElementById("view-home"),
    skills: document.getElementById("view-skills"),
    money: document.getElementById("view-money"),
    groceries: document.getElementById("view-groceries"),
    settings: document.getElementById("view-settings"),
  };

  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  const sidebar = document.querySelector(".sidebar");
  const btnMenu = document.getElementById("btnMenu");

  const viewMeta = {
    admin: { title: "Life Admin", subtitle: "Keep your real-world life organised with calm, smart nudges." },
    home: { title: "Future Home", subtitle: "Plan furniture essentials first, then extras when you're ready." },
    skills: { title: "Life Skills", subtitle: "Everyday living skills with progress you can actually see." },
    money: { title: "Money", subtitle: "Future funds, budgets, and simple tracking that stays calm." },
    groceries: { title: "Groceries", subtitle: "Build a weekly shopping list and tick items off." },
    settings: { title: "Settings", subtitle: "Preferences, notifications, backups, and data health." },
  };

  function setActiveView(viewKey) {
    navButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.view === viewKey));
    Object.keys(views).forEach((k) => views[k]?.classList.toggle("is-visible", k === viewKey));
    if (pageTitle) pageTitle.textContent = viewMeta[viewKey]?.title ?? "Life Admin";
    if (pageSubtitle) pageSubtitle.textContent = viewMeta[viewKey]?.subtitle ?? "";
    sidebar?.classList.remove("is-open");
  }

  navButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      const v = btn.dataset.view;
      setActiveView(v);

      // Force refresh on open
      if (v === "home") { try { renderHome(); } catch {} }
      if (v === "skills") { try { renderSkills(); } catch {} }
      if (v === "admin") { try { renderAdmin(); } catch {} }
      if (v === "money") { try { renderMoney(); } catch {} }
      if (v === "groceries") { try { renderGroceries(); } catch {} }
      if (v === "settings") { try { renderSettings(); } catch {} }
    })
  );

  btnMenu?.addEventListener("click", () => sidebar?.classList.toggle("is-open"));

  // =========================
  // IDS / HELPERS
  // =========================
  function uid() {
    return crypto?.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function safeParseArray(raw) {
    try {
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // =========================
  // DATE + STATUS
  // =========================
  function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function toISODate(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function daysUntil(dateISO) {
    if (!dateISO) return null;
    const due = new Date(dateISO + "T00:00:00");
    const diffMs = due.getTime() - startOfToday().getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  function statusFromDays(d) {
    if (d === null) return "green";
    if (d < 0) return "red";
    if (d <= 14) return "red";
    if (d <= 30) return "amber";
    return "green";
  }

  function badgeFromStatus(status) {
    if (status === "red") return { label: "Urgent", cls: "badge--danger" };
    if (status === "amber") return { label: "Due soon", cls: "badge--warn" };
    return { label: "On track", cls: "badge--ok" };
  }

  function fmtDueText(d) {
    if (d === null) return "No due date";
    if (d < 0) return `Overdue by ${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"}`;
    if (d === 0) return "Due today";
    return `Due in ${d} day${d === 1 ? "" : "s"}`;
  }

  function addDaysISO(dateISO, days) {
    const base = dateISO ? new Date(dateISO + "T00:00:00") : startOfToday();
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return toISODate(d);
  }

  function addMonthsISO(dateISO, months) {
    const base = dateISO ? new Date(dateISO + "T00:00:00") : startOfToday();
    const d = new Date(base);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== day) d.setDate(0);
    return toISODate(d);
  }

  function addYearsISO(dateISO, years) {
    const base = dateISO ? new Date(dateISO + "T00:00:00") : startOfToday();
    const d = new Date(base);
    const m = d.getMonth();
    d.setFullYear(d.getFullYear() + years);
    if (d.getMonth() !== m) d.setDate(0);
    return toISODate(d);
  }

  // =========================
  // GLOBAL STORE + MIGRATION
  // =========================
  const LS_STORE_KEY = "lifeSetup.store.v1";
  const LS_LEGACY_LIFEADMIN = "lifeSetup.lifeAdmin.items.v5";

  function defaultRooms() {
    const mkItem = (name) => ({
      id: uid(),
      name,
      planned: false,
      owned: false,
nextToBuy: false,
      priority: "normal",
      cost: 0,
      notes: "",
      createdAtISO: new Date().toISOString(),
      updatedAtISO: new Date().toISOString(),
    });

    const mk = (title, essentials, extras) => ({
      title,
      notes: "",
      essentials: essentials.map(mkItem),
      extras: extras.map(mkItem),
    });

    return {
      bedroom: mk(
        "Bedroom",
        ["Bed frame", "Mattress", "Pillow(s)", "Duvet", "Bedsheets", "Wardrobe / storage"],
        ["Bedside table", "Lamp", "Mirror", "Rug", "Extra storage boxes"]
      ),
      kitchen: mk(
        "Kitchen",
        ["Plates/bowls", "Cutlery", "Mugs", "Cooking basics (knife/board)", "Bin", "Tea towels"],
        ["Air fryer", "Blender", "Extra pans", "Nice glasses", "Organisers"]
      ),
      living: mk(
        "Living Room",
        ["Sofa", "TV stand", "Curtains/blinds", "Lighting", "Basic cleaning kit"],
        ["Coffee table", "Rug", "Wall art", "Speaker", "Extra seating"]
      ),
      bathroom: mk(
        "Bathroom",
        ["Towels", "Toilet brush", "Shower curtain (if needed)", "Soap/shampoo", "Bath mat"],
        ["Storage caddy", "Nice mirror", "Plants", "Extra shelves"]
      ),
      office: mk(
        "Home Office",
        ["Desk", "Chair", "Monitor (optional)", "Extension lead", "Basic stationery"],
        ["Second monitor", "Desk lamp", "Cable management", "Whiteboard", "Printer"]
      ),
      utility: mk(
        "Storage/Utility",
        ["Basic shelving", "Laundry basket", "Hooks / hangers", "Basic tool kit (starter)"],
        ["Storage boxes", "Label maker", "Suitcases", "Extra shelves", "Bike rack / wall mounts"]
      ),
    };
  }

  function defaultSkills() {
    const mk = (category, names) => ({
      category,
      items: names.map((n) => ({
        id: uid(),
        name: n,
        level: "ns",
        notes: "",
        createdAtISO: new Date().toISOString(),
        updatedAtISO: new Date().toISOString(),
      })),
    });

    return {
      Cooking: mk("Cooking", ["Make a hot breakfast", "Cook chicken safely", "Make rice properly"]),
      Cleaning: mk("Cleaning", ["Clean a bathroom properly", "Dust + vacuum routine", "Clean a fridge"]),
      Laundry: mk("Laundry", ["Sort colours", "Run a wash cycle", "Hang/air-dry properly"]),
      "Personal Admin": mk("Personal Admin", ["Track bills & renewals", "Book appointments", "Keep documents organised"]),
      Health: mk("Health", ["Basic meal planning", "Consistent sleep routine", "Short daily walk"]),
      "Home Basics": mk("Home Basics", ["Change a lightbulb", "Stop a small leak (basics)", "Reset internet router"]),
    };
  }

  function makeFund(name) {
    return {
      id: uid(),
      name,
      priority: "normal",
      target: 0,
      current: 0,
      monthlyGoal: 0,
      targetDate: null,
      notes: "",
      createdAtISO: new Date().toISOString(),
      updatedAtISO: new Date().toISOString(),
    };
  }

  function makeBudget(name) {
    return {
      id: uid(),
      name,
      priority: "normal",
      monthlyLimit: 0,
      notes: "",
      createdAtISO: new Date().toISOString(),
      updatedAtISO: new Date().toISOString(),
    };
  }

  function makeTxn({ type, label, amount, dateISO, fundId = null, budgetId = null }) {
    return {
      id: uid(),
      type, // deposit | withdraw | spend | income
      label: String(label ?? "").trim(),
      amount: Number(amount ?? 0),
      dateISO: String(dateISO ?? toISODate(startOfToday())),
      fundId: fundId ? String(fundId) : null,
      budgetId: budgetId ? String(budgetId) : null,
      createdAtISO: new Date().toISOString(),
    };
  }

  function defaultStore() {
    return {
      version: 2,
      lifeAdmin: { items: [] },
      home: { rooms: defaultRooms(), version: 2 },
      skills: { categories: defaultSkills(), version: 2 },
      money: {
        currency: "GBP",
        funds: [],
        budgets: [],
        txns: [],
        paydayISO: null,
      },

         // ✅ Monthly Wins (events log)
    wins: {
      events: [], // { ts, type, label, delta }
      version: 1,
    },

      settings: {
        calmModeAuto: true,
        calmThreshold: 3,
        focusWeekDefault: false,
        showArchivedDefault: false,
        defaultSort: "dueSoonest",
        hideMoney: false,
      },
    };
  }

  // =========================
  // NORMALISERS
  // =========================
  function normaliseBudgets(budgets) {
    if (!Array.isArray(budgets)) return [];
    const nowISO = new Date().toISOString();

    return budgets
      .map((b) => {
        const name = String(b?.name ?? "").trim();
        if (!name) return null;

        const monthlyLimit = Number(b?.monthlyLimit ?? 0);

        return {
          id: String(b?.id ?? uid()),
          name,
          priority: ["normal", "high"].includes(b?.priority) ? b.priority : "normal",
          monthlyLimit: Number.isFinite(monthlyLimit) && monthlyLimit >= 0 ? monthlyLimit : 0,
          notes: String(b?.notes ?? ""),
          createdAtISO: String(b?.createdAtISO ?? nowISO),
          updatedAtISO: String(b?.updatedAtISO ?? nowISO),
        };
      })
      .filter(Boolean);
  }

  function normaliseTxns(txns) {
    if (!Array.isArray(txns)) return [];
    const today = toISODate(startOfToday());

    const okType = new Set(["deposit", "withdraw", "spend", "income"]);
    return txns
      .map((t) => {
        const type = String(t?.type ?? "").trim();
        if (!okType.has(type)) return null;

        const amount = Number(t?.amount ?? 0);
        const dateISO = String(t?.dateISO ?? today);

        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return null;
        if (!Number.isFinite(amount) || amount <= 0) return null;

        const label = String(t?.label ?? "").trim();
        if (!label) return null;

        return {
          id: String(t?.id ?? uid()),
          type,
          label,
          amount,
          dateISO,
          fundId: t?.fundId ? String(t.fundId) : null,
          budgetId: t?.budgetId ? String(t.budgetId) : null,
          createdAtISO: String(t?.createdAtISO ?? new Date().toISOString()),
        };
      })
      .filter(Boolean);
  }

  function normaliseSettings(s) {
    const base = defaultStore().settings;
    const out = { ...base, ...(typeof s === "object" && s ? s : {}) };

    out.calmModeAuto = !!out.calmModeAuto;
    out.hideMoney = !!out.hideMoney;

    const th = Number(out.calmThreshold);
    out.calmThreshold = Number.isFinite(th) && th >= 0 ? th : base.calmThreshold;

    out.focusWeekDefault = !!out.focusWeekDefault;
    out.showArchivedDefault = !!out.showArchivedDefault;

    const allowedSort = new Set(["dueSoonest", "dueLatest", "createdOldest", "createdNewest", "nameAZ", "nameZA"]);
    out.defaultSort = allowedSort.has(out.defaultSort) ? out.defaultSort : base.defaultSort;

    return out;
  }

  function normaliseWins(w) {
  const out = { events: [], version: 1 };

  if (!w || typeof w !== "object") return out;

  const events = Array.isArray(w.events) ? w.events : [];
  out.events = events
    .map((e) => {
      const ts = Number(e?.ts);
      const type = String(e?.type ?? "").trim();
      const label = String(e?.label ?? "").trim();
      const delta = Number(e?.delta ?? 1);

      if (!Number.isFinite(ts) || ts <= 0) return null;
      if (!type || !label) return null;

      return {
        ts,
        type,
        label,
        delta: Number.isFinite(delta) ? delta : 1,
      };
    })
    .filter(Boolean);

  // keep it from growing forever
  const LIMIT = 600;
  if (out.events.length > LIMIT) out.events = out.events.slice(-LIMIT);

  out.version = 1;
  return out;
}

  function normaliseItems(arr) {
    const nowISO = new Date().toISOString();
    return (arr ?? [])
      .map((x) => {
        const name = (x?.name ?? x?.title ?? "").toString().trim();
        if (!name) return null;

        const item = {
          id: (x?.id ?? uid()).toString(),
          category: x?.category ?? "renewal",
          name,
          details: (x?.details ?? "").toString(),
          dueDateISO: x?.dueDateISO ?? x?.dueDate ?? null,
          reminderProfile: x?.reminderProfile ?? "gentle",
          priority: x?.priority ?? "normal",
          archived: Boolean(x?.archived ?? false),
          recurrence: x?.recurrence ?? "none",
          customDays: x?.customDays != null ? Number(x.customDays) : null,
          createdAtISO: (x?.createdAtISO ?? nowISO).toString(),
          updatedAtISO: (x?.updatedAtISO ?? nowISO).toString(),
          doneCount: Number.isFinite(Number(x?.doneCount)) ? Number(x.doneCount) : 0,
        };

        const allowedCats = ["renewal", "account", "vehicle", "info", "money"];
        if (!allowedCats.includes(item.category)) item.category = "renewal";

        if (!["gentle", "careful", "tight"].includes(item.reminderProfile)) item.reminderProfile = "gentle";
        if (!["normal", "high"].includes(item.priority)) item.priority = "normal";
        if (!["none", "weekly", "monthly", "yearly", "custom"].includes(item.recurrence)) item.recurrence = "none";

        if (item.dueDateISO && !/^\d{4}-\d{2}-\d{2}$/.test(String(item.dueDateISO))) {
          item.dueDateISO = null;
        } else if (item.dueDateISO) {
          item.dueDateISO = String(item.dueDateISO);
        }

        if (item.recurrence !== "custom") item.customDays = null;
        if (item.recurrence === "custom") {
          if (!Number.isFinite(item.customDays) || item.customDays <= 0) item.customDays = 30;
        }

        return item;
      })
      .filter(Boolean);
  }

  function normaliseFunds(funds) {
    if (!Array.isArray(funds)) return [];
    const nowISO = new Date().toISOString();

    return funds
      .map((f) => {
        const name = String(f?.name ?? "").trim();
        if (!name) return null;

        const target = Number(f?.target ?? 0);
        const current = Number(f?.current ?? 0);
        const monthlyGoal = Number(f?.monthlyGoal ?? 0);

        const td = f?.targetDate;
        const targetDate = td && /^\d{4}-\d{2}-\d{2}$/.test(String(td)) ? String(td) : null;

        return {
          id: String(f?.id ?? uid()),
          name,
          priority: ["normal", "high"].includes(f?.priority) ? f.priority : "normal",
          target: Number.isFinite(target) && target >= 0 ? target : 0,
          current: Number.isFinite(current) && current >= 0 ? current : 0,
          monthlyGoal: Number.isFinite(monthlyGoal) && monthlyGoal >= 0 ? monthlyGoal : 0,
          targetDate,
          notes: String(f?.notes ?? ""),
          createdAtISO: String(f?.createdAtISO ?? nowISO),
          updatedAtISO: String(f?.updatedAtISO ?? nowISO),
        };
      })
      .filter(Boolean);
  }

  function normaliseHomeRooms(rooms) {
  const base = defaultRooms();
  const out = rooms && typeof rooms === "object" ? rooms : base;

  for (const [rk, r] of Object.entries(out)) {
    if (!r) continue;

    const fixArr = (arr) =>
      (Array.isArray(arr) ? arr : []).map((it) => ({
        id: String(it?.id ?? uid()),
        name: String(it?.name ?? "").trim() || "Unnamed",
        planned: !!it?.planned,
        owned: !!it?.owned,
        nextToBuy: !!it?.nextToBuy,
        priority: it?.priority === "high" ? "high" : "normal",
        cost: Number.isFinite(Number(it?.cost)) ? Number(it.cost) : 0,
        notes: String(it?.notes ?? ""),
        createdAtISO: String(it?.createdAtISO ?? new Date().toISOString()),
        updatedAtISO: String(it?.updatedAtISO ?? new Date().toISOString()),
      }));

    r.essentials = fixArr(r.essentials);
    r.extras = fixArr(r.extras);
    r.notes = String(r.notes ?? "");
    r.title = String(r.title ?? rk);
  }

  return out;
}


  function normaliseStore(s) {
    const base = defaultStore();

    base.lifeAdmin.items = normaliseItems(Array.isArray(s?.lifeAdmin?.items) ? s.lifeAdmin.items : []);

    base.money = {
      currency: String(s?.money?.currency ?? "GBP"),
      funds: normaliseFunds(s?.money?.funds),
      budgets: normaliseBudgets(s?.money?.budgets),
      txns: normaliseTxns(s?.money?.txns),
      paydayISO:
        s?.money?.paydayISO && /^\d{4}-\d{2}-\d{2}$/.test(String(s.money.paydayISO))
          ? String(s.money.paydayISO)
          : null,
    };

    base.settings = normaliseSettings(s?.settings);
    base.wins = normaliseWins(s?.wins);
    base.home.rooms = normaliseHomeRooms(s?.home?.rooms ?? base.home.rooms);
    base.skills.categories = s?.skills?.categories ?? base.skills.categories;
    base.version = 2;

    return base;
  }

  // =========================
  // STORE LOAD/SAVE + MIGRATION
  // =========================
  function saveStore(store) {
    localStorage.setItem(LS_STORE_KEY, JSON.stringify(store));
  }

  function loadStore() {
    const raw = localStorage.getItem(LS_STORE_KEY);
    if (raw) {
      try {
        return normaliseStore(JSON.parse(raw));
      } catch {
        // fall through to migration
      }
    }

    const legacyRaw = localStorage.getItem(LS_LEGACY_LIFEADMIN);
    const legacyArr = safeParseArray(legacyRaw) ?? [];

    const store = defaultStore();
    store.lifeAdmin.items = normaliseItems(legacyArr);
    saveStore(store);
    return store;
  }

  function loadItems() {
    return loadStore().lifeAdmin.items;
  }

  function saveItems(items) {
    const store = loadStore();
    store.lifeAdmin.items = normaliseItems(items);
    saveStore(store);
  }

  function getSettings() {
    return loadStore().settings || defaultStore().settings;
  }

  // =========================
  // MONEY FORMATTERS (KEEP ONCE)
  // =========================
  function currencySymbol(code) {
    if (code === "EUR") return "€";
    if (code === "USD") return "$";
    return "£";
  }

  function makeMoneyFormatter() {
  const store = loadStore();
  const code = String(store.money?.currency ?? "GBP");
  const sym = currencySymbol(code);

  return (n) => {
    const x = Number(n ?? 0);
    const safe = Number.isFinite(x) ? x : 0;
    return sym + safe.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
}


  function fmtMoney(n) {
    const store = loadStore();
    const code = String(store.money?.currency ?? "GBP");
    const sym = currencySymbol(code);

    const x = Number(n ?? 0);
    const safe = Number.isFinite(x) ? x : 0;
    return sym + safe.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function monthKeyFromISO(dateISO) {
    return String(dateISO).slice(0, 7);
  }

  function currentMonthKey() {
    return monthKeyFromISO(toISODate(startOfToday()));
  }

  // =========================
  // TOAST
  // =========================
  const toastWrap = document.getElementById("toastWrap");
  function toast(msg) {
    if (!toastWrap) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    toastWrap.appendChild(el);
    setTimeout(() => el.classList.add("is-off"), 1800);
    setTimeout(() => el.remove(), 2400);
  }

  // =========================
// MONTHLY WINS — logger (writes to LS_STORE_KEY store)
// =========================
function winsMonthKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function logWin(type, label, delta = 1) {
  const store = loadStore();
  store.wins = normaliseWins(store.wins);

  store.wins.events.push({
    ts: Date.now(),
    type: String(type),
    label: String(label),
    delta: Number.isFinite(Number(delta)) ? Number(delta) : 1,
  });

  // cap
  const LIMIT = 600;
  if (store.wins.events.length > LIMIT) store.wins.events = store.wins.events.slice(-LIMIT);

  saveStore(store);

  // let dashboards/widgets re-render if they listen for it
  window.dispatchEvent(new Event("lifeadmin:datachanged"));
}

function getMonthlyWinTotals() {
  const store = loadStore();
  store.wins = normaliseWins(store.wins);

  const mk = winsMonthKey();
  const monthEvents = store.wins.events.filter(e => winsMonthKey(e.ts) === mk);

  const totals = monthEvents.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + (Number(e.delta) || 1);
    return acc;
  }, {});

  return { totals, monthEvents, monthKey: mk };
}


  // =========================
  // DOM HOOKS (Life Admin)
  // =========================
  const adminStats = document.getElementById("adminStats");
  const listAlerts = document.getElementById("listAlerts");
  const emptyAlerts = document.getElementById("emptyAlerts");
  const badgeAlerts = document.getElementById("badgeAlerts");

  const listRenewals = document.getElementById("listRenewals");
  const listAccounts = document.getElementById("listAccounts");
  const listInfo = document.getElementById("listInfo");
  const listVehicle = document.getElementById("listVehicle");

  const emptyRenewals = document.getElementById("emptyRenewals");
  const emptyAccounts = document.getElementById("emptyAccounts");
  const emptyInfo = document.getElementById("emptyInfo");
  const emptyVehicle = document.getElementById("emptyVehicle");

  const badgeRenewals = document.getElementById("badgeRenewals");
  const badgeAccounts = document.getElementById("badgeAccounts");
  const badgeInfo = document.getElementById("badgeInfo");
  const badgeVehicle = document.getElementById("badgeVehicle");

  const overallDot = document.getElementById("overallDot");
  const statusText = document.getElementById("statusText");

  // Money panel DOM (Admin view Money panel)
  const badgeMoney = document.getElementById("badgeMoney");
  const moneySummary = document.getElementById("moneySummary");
  const btnAddFund = document.getElementById("btnAddFund");
  const listMoneyFunds = document.getElementById("listMoneyFunds");
  const emptyMoneyFunds = document.getElementById("emptyMoneyFunds");

  // Budgets DOM (Admin view Budgets)
  const badgeBudgets = document.getElementById("badgeBudgets");
  const listBudgets = document.getElementById("listBudgets");
  const emptyBudgets = document.getElementById("emptyBudgets");
  const btnAddBudget = document.getElementById("btnAddBudget");
  const moneyTxnsList = document.getElementById("moneyTxnsList");
  const moneyTxnsEmpty = document.getElementById("moneyTxnsEmpty");

  // Controls
  const searchInput = document.getElementById("adminSearch");
  const showArchivedCheckbox = document.getElementById("chkArchived");
  const focusWeekCheckbox = document.getElementById("chkFocusWeek");
  const calmCheckbox = document.getElementById("chkCalmMode");
  const sortSelect = document.getElementById("selSort");
  const btnSampleData = document.getElementById("btnSampleData");
  const templateSelect = document.getElementById("selTemplate");
  const filterButtons = Array.from(document.querySelectorAll("[data-admin-filter]"));

  // Modal (Life Admin items)
  const btnAdd = document.getElementById("btnAdd");
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBackdrop = modal?.querySelector(".modal__backdrop");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const btnCancel = document.getElementById("btnCancel");
  const itemForm = document.getElementById("itemForm");
  const customDaysWrap = document.getElementById("customDaysWrap");

  // Modal (Funds)
  const fundModal = document.getElementById("fundModal");
  const fundModalTitle = document.getElementById("fundModalTitle");
  const fundBackdrop = fundModal?.querySelector(".modal__backdrop");
  const btnCloseFundModal = document.getElementById("btnCloseFundModal");
  const btnCancelFund = document.getElementById("btnCancelFund");
  const fundForm = document.getElementById("fundForm");

  // Budget modal
  const budgetModal = document.getElementById("budgetModal");
  const budgetModalTitle = document.getElementById("budgetModalTitle");
  const budgetBackdrop = budgetModal?.querySelector(".modal__backdrop");
  const btnCloseBudgetModal = document.getElementById("btnCloseBudgetModal");
  const btnCancelBudgetModal = document.getElementById("btnCancelBudgetModal");
  const budgetForm = document.getElementById("budgetForm");

  // =========================
  // Part D: Next Steps hooks
  // =========================
  const badgeNextSteps = document.getElementById("badgeNextSteps");
  const nextStepsToday = document.getElementById("nextStepsToday");
  const nextStepsWeek = document.getElementById("nextStepsWeek");
  const emptyNextToday = document.getElementById("emptyNextToday");
  const emptyNextWeek = document.getElementById("emptyNextWeek");

  // =========================
  // UI STATE
  // =========================
  const uiState = {
    filter: "all",
    query: "",
    showArchived: false,
    sort: "dueSoonest",
    focusWeek: false,
    calmMode: false,
    calmModeManual: null,
  };

  function applyDefaultUIFromSettings() {
    const s = getSettings();
    uiState.showArchived = !!s.showArchivedDefault;
    uiState.focusWeek = !!s.focusWeekDefault;
    uiState.sort = s.defaultSort || "dueSoonest";

    if (showArchivedCheckbox) showArchivedCheckbox.checked = uiState.showArchived;
    if (focusWeekCheckbox) focusWeekCheckbox.checked = uiState.focusWeek;
    if (sortSelect) sortSelect.value = uiState.sort;
  }

  // =========================
  // URGENCY + CALM MODE HELPERS
  // =========================
  function isUrgentItem(item) {
    if (item.archived) return false;
    const s = statusFromDays(daysUntil(item.dueDateISO));
    return s === "red" || s === "amber";
  }

  function urgentCount(items) {
    return items.filter(isUrgentItem).length;
  }

  function applyCalmMode(items) {
    return items.filter((i) => !i.archived && isUrgentItem(i));
  }

  function setCategoryCardVisibility(categoryKey, hasItems) {
    const card = document.querySelector(`[data-cat-card="${categoryKey}"]`);
    if (!card) return;
    card.hidden = !hasItems;
  }

  // =========================
  // NUDGES
  // =========================
  function profileWindows(profile) {
    if (profile === "careful") return [56, 28, 14, 7, 1];
    if (profile === "tight") return [21, 7, 1];
    return [42, 21, 7, 1];
  }

  function gentleNudge(item, d) {
    const name = (item.name || "").toLowerCase();
    const windows = profileWindows(item.reminderProfile);

    if (item.archived) return "Archived — you can unarchive it any time.";

    if (d === null) {
      if (item.category === "info") return "Handy to keep this here so you don’t have to hunt for it later.";
      if (item.category === "money") return "Worth keeping this saved so your money plan stays simple.";
      return "Worth keeping this saved so it stays easy to manage.";
    }

    if (d < 0) return "It might be worth sorting this soon, just to get it off your mind.";

    if (item.category === "money") {
      if (name.includes("budget")) return "A quick check-in can keep things feeling under control.";
      if (name.includes("payday")) return "Might be a good time to plan transfers before money disappears.";
      if (name.includes("savings") || name.includes("fund")) return "Even a small top-up helps over time.";
      if (d <= windows[0]) return "A calm check-in now can help you stay on track.";
    }

    if (item.category === "renewal") {
      if (name.includes("insurance")) {
        if (d <= windows[0] && d > (windows[1] ?? 0)) return "Good time to start checking quotes calmly.";
        if (d <= (windows[1] ?? windows[0]) && d > (windows[2] ?? 0)) return "You could shortlist a couple of quotes.";
        if (d <= (windows[2] ?? windows[0]) && d > (windows[3] ?? 0)) return "Worth checking auto-renew settings.";
        if (d <= (windows[windows.length - 1] ?? 1)) return "Gentle reminder to confirm you’re covered.";
      }
      if (name.includes("mot") && d <= 30) return "Might be a good time to book a slot so you get a convenient date.";
      if (name.includes("passport") && d <= 180) return "Some countries require 6 months validity — worth checking.";
      if (d <= windows[0]) return "A small plan now keeps it low-stress later.";
    }

    if (item.category === "vehicle") {
      if (name.includes("tyre")) return "Quick tyre pressure check can prevent surprises.";
      if (name.includes("oil")) return "A quick oil check now and then can help.";
      if (d <= windows[0]) return "Small check-ins keep things running smoothly.";
    }

    if (item.category === "account") {
      if (name.includes("phone")) return "If you’re near contract end, SIM-only can be worth a look.";
      if (name.includes("subscription")) return "A quick review can save more than you’d expect.";
      if (d <= windows[0]) return "A small review soon keeps it easy.";
    }

    if (item.priority === "high" && d <= 30) return "High priority — worth a quick look soon.";
    return "All seems fine — just keeping it on your radar.";
  }

  // =========================
  // QUICK ADD TEMPLATE -> ITEM
  // =========================
  function templateToItem(templateKey) {
    const todayISO = toISODate(startOfToday());

    const base = {
      id: "",
      category: "renewal",
      name: "",
      details: "",
      dueDateISO: null,
      reminderProfile: "gentle",
      priority: "normal",
      archived: false,
      recurrence: "none",
      customDays: null,
    };

    switch (templateKey) {
      case "carInsurance":
        return {
          ...base,
          category: "renewal",
          name: "Car insurance",
          details: "Compare quotes • check auto-renew",
          recurrence: "yearly",
          priority: "high",
          dueDateISO: addYearsISO(todayISO, 1),
        };
      case "mot":
        return {
          ...base,
          category: "vehicle",
          name: "MOT",
          details: "Book early for a convenient date",
          recurrence: "yearly",
          priority: "high",
          dueDateISO: addYearsISO(todayISO, 1),
        };
      case "carService":
        return {
          ...base,
          category: "vehicle",
          name: "Car service",
          details: "Full/Interim (note mileage)",
          recurrence: "yearly",
          priority: "normal",
          dueDateISO: addYearsISO(todayISO, 1),
        };
      case "passport":
        return {
          ...base,
          category: "renewal",
          name: "Passport expiry",
          details: "Some countries require 6 months validity",
          recurrence: "none",
          priority: "normal",
        };
      case "travelInsurance":
        return {
          ...base,
          category: "renewal",
          name: "Travel insurance",
          details: "Check cover for the trip dates",
          recurrence: "none",
          priority: "normal",
        };
      case "phoneContract":
        return {
          ...base,
          category: "account",
          name: "Phone contract",
          details: "Consider SIM-only options",
          recurrence: "monthly",
          priority: "normal",
          dueDateISO: addMonthsISO(todayISO, 1),
        };
      case "subscriptionReview":
        return {
          ...base,
          category: "account",
          name: "Subscription review",
          details: "Cancel anything unused",
          recurrence: "custom",
          customDays: 90,
          priority: "normal",
          dueDateISO: addDaysISO(todayISO, 90),
        };
      default:
        return null;
    }
  }

  // =========================
  // MODAL (Life Admin items)
  // =========================
  let editingId = null;

  function setRecurrenceUI(value) {
    if (!customDaysWrap) return;
    customDaysWrap.style.display = value === "custom" ? "" : "none";
  }

  function openModal(mode, item = null) {
    editingId = mode === "edit" ? (item?.id ?? null) : null;
    if (modalTitle) modalTitle.textContent = mode === "edit" ? "Edit Life Admin Item" : "Add Life Admin Item";

    itemForm?.reset();

    if (itemForm) {
      itemForm.id.value = item?.id ?? "";
      itemForm.category.value = item?.category ?? "renewal";
      itemForm.name.value = item?.name ?? "";
      itemForm.dueDate.value = item?.dueDateISO ?? "";
      itemForm.details.value = item?.details ?? "";
      itemForm.reminderProfile.value = item?.reminderProfile ?? "gentle";
      itemForm.priority.value = item?.priority ?? "normal";
      itemForm.recurrence.value = item?.recurrence ?? "none";
      itemForm.customDays.value = item?.customDays != null ? String(item.customDays) : "";
      setRecurrenceUI(itemForm.recurrence.value);
    }

    modal?.setAttribute("aria-hidden", "false");
    modal?.classList.add("is-open");
    itemForm?.name?.focus?.();
  }

  function closeModal() {
    modal?.setAttribute("aria-hidden", "true");
    modal?.classList.remove("is-open");
    editingId = null;
  }

  btnAdd?.addEventListener("click", () => openModal("add"));
  btnCloseModal?.addEventListener("click", closeModal);
  btnCancel?.addEventListener("click", closeModal);
  modalBackdrop?.addEventListener("click", closeModal);

  // =========================
  // MODAL (Funds)
  // =========================
  let editingFundId = null;

  function openFundModal(mode, fund = null) {
    editingFundId = mode === "edit" ? (fund?.id ?? null) : null;
    if (fundModalTitle) fundModalTitle.textContent = mode === "edit" ? "Edit Fund" : "Add Fund";

    fundForm?.reset();

    if (fundForm) {
      fundForm.id.value = fund?.id ?? "";
      fundForm.name.value = fund?.name ?? "";
      fundForm.priority.value = fund?.priority ?? "normal";
      fundForm.target.value = fund?.target != null ? String(fund.target) : "";
      fundForm.current.value = fund?.current != null ? String(fund.current) : "";
      fundForm.monthlyGoal.value = fund?.monthlyGoal != null ? String(fund.monthlyGoal) : "";
      fundForm.notes.value = fund?.notes ?? "";
    }

    fundModal?.setAttribute("aria-hidden", "false");
    fundModal?.classList.add("is-open");
    fundForm?.name?.focus?.();
  }

  function closeFundModal() {
    fundModal?.setAttribute("aria-hidden", "true");
    fundModal?.classList.remove("is-open");
    editingFundId = null;
  }

  btnAddFund?.addEventListener("click", () => openFundModal("add"));
  btnCloseFundModal?.addEventListener("click", closeFundModal);
  btnCancelFund?.addEventListener("click", closeFundModal);
  fundBackdrop?.addEventListener("click", closeFundModal);

  // =========================
  // MODAL (Budget)
  // =========================
  let editingBudgetId = null;

  function openBudgetModal(mode, budget = null) {
    editingBudgetId = mode === "edit" ? (budget?.id ?? null) : null;
    if (budgetModalTitle) budgetModalTitle.textContent = mode === "edit" ? "Edit Budget" : "Add Budget";

    budgetForm?.reset();

    if (budgetForm) {
      budgetForm.id.value = budget?.id ?? "";
      budgetForm.name.value = budget?.name ?? "";
      budgetForm.priority.value = budget?.priority ?? "normal";
      budgetForm.monthlyLimit.value = budget?.monthlyLimit != null ? String(budget.monthlyLimit) : "";
      budgetForm.notes.value = budget?.notes ?? "";
    }

    budgetModal?.setAttribute("aria-hidden", "false");
    budgetModal?.classList.add("is-open");
    budgetForm?.name?.focus?.();
  }

  function closeBudgetModal() {
    budgetModal?.setAttribute("aria-hidden", "true");
    budgetModal?.classList.remove("is-open");
    editingBudgetId = null;
  }

  btnAddBudget?.addEventListener("click", () => openBudgetModal("add"));
  btnCloseBudgetModal?.addEventListener("click", closeBudgetModal);
  btnCancelBudgetModal?.addEventListener("click", closeBudgetModal);
  budgetBackdrop?.addEventListener("click", closeBudgetModal);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("is-open")) closeModal();
    if (e.key === "Escape" && fundModal?.classList.contains("is-open")) closeFundModal();
    if (e.key === "Escape" && budgetModal?.classList.contains("is-open")) closeBudgetModal();
  });

  itemForm?.recurrence?.addEventListener("change", () => setRecurrenceUI(itemForm.recurrence.value));

  // =========================
  // CONTROLS
  // =========================
  searchInput?.addEventListener("input", () => {
    uiState.query = searchInput.value.trim().toLowerCase();
    renderAdmin();
  });

  showArchivedCheckbox?.addEventListener("change", () => {
    uiState.showArchived = !!showArchivedCheckbox.checked;
    renderAdmin();
  });

  focusWeekCheckbox?.addEventListener("change", () => {
    uiState.focusWeek = !!focusWeekCheckbox.checked;
    renderAdmin();
  });

  calmCheckbox?.addEventListener("change", () => {
    const next = !!calmCheckbox.checked;
    uiState.calmMode = next;
    uiState.calmModeManual = next;
    renderAdmin();
  });

  sortSelect?.addEventListener("change", () => {
    uiState.sort = sortSelect.value || "dueSoonest";
    renderAdmin();
  });

  templateSelect?.addEventListener("change", () => {
    const key = templateSelect.value;
    if (!key) return;
    const item = templateToItem(key);
    if (item) openModal("add", item);
    templateSelect.value = "";
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-admin-filter") || "all";
      uiState.filter = key;
      filterButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
      renderAdmin();
    });
  });

  // =========================
  // ADD / EDIT SUBMIT (Life Admin)
  // =========================
  itemForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const category = itemForm.category.value;
    const name = itemForm.name.value.trim();
    const dueDateISO = itemForm.dueDate.value ? itemForm.dueDate.value : null;
    const details = itemForm.details.value.trim();
    const reminderProfile = itemForm.reminderProfile.value;
    const priority = itemForm.priority.value;
    const recurrence = itemForm.recurrence.value;
    const customDaysRaw = itemForm.customDays.value;

    if (!name) {
      alert("Please enter a name (e.g., Car insurance).");
      itemForm.name.focus();
      return;
    }

    let customDays = null;
    if (recurrence === "custom") {
      const n = Number(customDaysRaw);
      if (!Number.isFinite(n) || n <= 0) {
        alert("Custom days must be a positive number (e.g., 90).");
        itemForm.customDays.focus();
        return;
      }
      customDays = n;
    }

    const items = loadItems();
    const nowISO = new Date().toISOString();

    if (editingId) {
      const idx = items.findIndex((x) => x.id === editingId);
      if (idx === -1) {
        alert("That item couldn't be found (it may have been deleted).");
        closeModal();
        return;
      }
      items[idx] = {
        ...items[idx],
        category,
        name,
        dueDateISO,
        details,
        reminderProfile,
        priority,
        recurrence,
        customDays,
        updatedAtISO: nowISO,
      };
    } else {
      items.push({
        id: uid(),
        category,
        name,
        details,
        dueDateISO,
        reminderProfile,
        priority,
        archived: false,
        recurrence,
        customDays,
        createdAtISO: nowISO,
        updatedAtISO: nowISO,
        doneCount: 0,
      });
    }

    saveItems(items);
    renderAdmin();
    closeModal();
  });

  // =========================
  // FUND SUBMIT (✅ now actually saves)
  // =========================
  fundForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = fundForm.name.value.trim();
    if (!name) {
      alert("Fund name is required.");
      fundForm.name.focus();
      return;
    }

    const store = loadStore();
    const nowISO = new Date().toISOString();

    const target = Number(fundForm.target.value || 0);
    const current = Number(fundForm.current.value || 0);
    const monthlyGoal = Number(fundForm.monthlyGoal.value || 0);

    let prevCurrent = 0;
if (editingFundId) {
  const existing = (store.money.funds || []).find(f => f.id === editingFundId);
  prevCurrent = Number(existing?.current || 0);
}

    if (![target, current, monthlyGoal].every((n) => Number.isFinite(n) && n >= 0)) {
      alert("Target/current/monthly goal must be 0 or a positive number.");
      return;
    }

    const payload = {
      id: editingFundId || uid(),
      name,
      priority: fundForm.priority.value === "high" ? "high" : "normal",
      target,
      current,
      monthlyGoal,
      targetDate: null,
      notes: (fundForm.notes.value || "").trim(),
      createdAtISO: nowISO,
      updatedAtISO: nowISO,
    };

    // preserve createdAt on edit
    if (editingFundId) {
      const idx = (store.money.funds || []).findIndex((f) => f.id === editingFundId);
      if (idx !== -1) {
        payload.createdAtISO = store.money.funds[idx].createdAtISO || nowISO;
        store.money.funds[idx] = { ...store.money.funds[idx], ...payload, updatedAtISO: nowISO };
      }
    } else {
      store.money.funds = Array.isArray(store.money.funds) ? store.money.funds : [];
      store.money.funds.push(payload);
    }

    store.money.funds = normaliseFunds(store.money.funds);
    saveStore(store);

    const delta = current - prevCurrent;
if (delta > 0) logWin("saving", `Fund updated: ${name} (+${fmtMoney(delta)})`, delta);
else logWin("fund", `Fund saved: ${name}`, 1);

    closeFundModal();
    renderAdmin();
    try { renderMoney(); } catch {}
    toast("Fund saved");
  });

  // =========================
  // BUDGET SUBMIT (✅ now actually saves)
  // =========================
  budgetForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = budgetForm.name.value.trim();
    if (!name) {
      alert("Budget name is required.");
      budgetForm.name.focus();
      return;
    }

    const monthlyLimit = Number(budgetForm.monthlyLimit.value || 0);
    if (!Number.isFinite(monthlyLimit) || monthlyLimit < 0) {
      alert("Monthly limit must be 0 or a positive number.");
      budgetForm.monthlyLimit.focus();
      return;
    }

    const store = loadStore();
    const nowISO = new Date().toISOString();

    const payload = {
      id: editingBudgetId || uid(),
      name,
      priority: budgetForm.priority.value === "high" ? "high" : "normal",
      monthlyLimit,
      notes: (budgetForm.notes.value || "").trim(),
      createdAtISO: nowISO,
      updatedAtISO: nowISO,
    };

    if (editingBudgetId) {
      const idx = (store.money.budgets || []).findIndex((b) => b.id === editingBudgetId);
      if (idx !== -1) {
        payload.createdAtISO = store.money.budgets[idx].createdAtISO || nowISO;
        store.money.budgets[idx] = { ...store.money.budgets[idx], ...payload, updatedAtISO: nowISO };
      }
    } else {
      store.money.budgets = Array.isArray(store.money.budgets) ? store.money.budgets : [];
      store.money.budgets.push(payload);
    }

    store.money.budgets = normaliseBudgets(store.money.budgets);
    saveStore(store);

    closeBudgetModal();
    renderAdmin();
    try { renderMoney(); } catch {}
    toast("Budget saved");
  });

  // =========================
  // FILTER + SORT
  // =========================
  function applyFilterAndSort(allItems) {
    let items = [...allItems];

    if (!uiState.showArchived) items = items.filter((i) => !i.archived);
    if (uiState.filter !== "all") items = items.filter((i) => i.category === uiState.filter);

    if (uiState.query) {
      const q = uiState.query;
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.details || "").toLowerCase().includes(q) ||
          (i.dueDateISO || "").includes(q)
      );
    }

    if (uiState.focusWeek) {
      items = items.filter((i) => {
        const d = daysUntil(i.dueDateISO);
        if (d === null) return false;
        return d < 0 || d <= 7;
      });
    }

    const byDueAsc = (a, b) => {
      const da = daysUntil(a.dueDateISO);
      const db = daysUntil(b.dueDateISO);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    };

    switch (uiState.sort) {
      case "dueLatest":
        items.sort((a, b) => -byDueAsc(a, b));
        break;
      case "createdOldest":
        items.sort((a, b) => a.createdAtISO.localeCompare(b.createdAtISO));
        break;
      case "createdNewest":
        items.sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO));
        break;
      case "nameZA":
        items.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "nameAZ":
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "dueSoonest":
      default:
        items.sort((a, b) => byDueAsc(a, b));
        break;
    }

    // Secondary: high priority first
    items.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
      return 0;
    });

    return items;
  }

  function computeOverallStatus(items) {
    let worst = "green";
    for (const it of items) {
      if (it.archived) continue;
      const s = statusFromDays(daysUntil(it.dueDateISO));
      if (s === "red") return "red";
      if (s === "amber") worst = "amber";
    }
    return worst;
  }

  function setOverallPill(status) {
    if (!overallDot || !statusText) return;
    overallDot.classList.remove("dot--green", "dot--amber", "dot--red");

    if (status === "red") {
      overallDot.classList.add("dot--red");
      statusText.textContent = "Needs attention";
      return;
    }
    if (status === "amber") {
      overallDot.classList.add("dot--amber");
      statusText.textContent = "Coming up";
      return;
    }
    overallDot.classList.add("dot--green");
    statusText.textContent = "All good";
  }

  // =========================
  // STATS
  // =========================
  function getNextNudgeItem(items) {
    const enriched = items
      .filter((x) => !x.archived)
      .map((it) => {
        const d = daysUntil(it.dueDateISO);
        return { it, d, nudge: gentleNudge(it, d) };
      });

    const overdue = enriched.filter((x) => x.d !== null && x.d < 0).sort((a, b) => b.d - a.d)[0];
    if (overdue) return { ...overdue.it, nudge: overdue.nudge };

    const upcoming = enriched.filter((x) => x.d !== null && x.d >= 0).sort((a, b) => a.d - b.d)[0];
    if (upcoming) return { ...upcoming.it, nudge: upcoming.nudge };

    const any = enriched[0];
    return any ? { ...any.it, nudge: any.nudge } : null;
  }

  function renderStats(allItems) {
    if (!adminStats) return;

    const active = allItems.filter((i) => !i.archived);

    const dueSoonCount = active.filter((i) => {
      const d = daysUntil(i.dueDateISO);
      return d !== null && d >= 0 && d <= 30;
    }).length;

    const onTrackCount = active.filter((i) => statusFromDays(daysUntil(i.dueDateISO)) === "green").length;
    const priorityCount = active.filter((i) => i.priority === "high").length;

    const next = getNextNudgeItem(active);

    adminStats.innerHTML = `
      <article class="card card--stat">
        <div class="card__label">Next gentle nudge</div>
        <div class="card__value">${escapeHtml(next?.name ?? "All sorted")}</div>
        <div class="card__hint">${escapeHtml(next?.nudge ?? "Nothing urgent — you’re in a good place.")}</div>
      </article>

      <article class="card card--stat">
        <div class="card__label">Due soon</div>
        <div class="card__value">${dueSoonCount}</div>
        <div class="card__hint">Items coming up within 30 days.</div>
      </article>

      <article class="card card--stat">
        <div class="card__label">On track</div>
        <div class="card__value">${onTrackCount}</div>
        <div class="card__hint">Everything else looks steady.</div>
      </article>

      <article class="card card--stat">
        <div class="card__label">High priority</div>
        <div class="card__value">${priorityCount}</div>
        <div class="card__hint">Things you marked as important.</div>
      </article>
    `;
  }

  // =========================
  // BADGES + LIST RENDER
  // =========================
  function setCategoryBadge(el, itemsInCategory) {
    if (!el) return;

    if (!itemsInCategory.length) {
      el.className = "badge badge--neutral";
      el.textContent = "Empty";
      return;
    }

    const overdue = itemsInCategory.filter((i) => {
      const d = daysUntil(i.dueDateISO);
      return !i.archived && d !== null && d < 0;
    }).length;

    const dueSoon = itemsInCategory.filter((i) => {
      const d = daysUntil(i.dueDateISO);
      return !i.archived && d !== null && d >= 0 && d <= 30;
    }).length;

    if (overdue > 0) {
      el.className = "badge badge--danger";
      el.textContent = `${overdue} overdue`;
      return;
    }
    if (dueSoon > 0) {
      el.className = "badge badge--warn";
      el.textContent = `${dueSoon} due soon`;
      return;
    }

    const activeCount = itemsInCategory.filter((i) => !i.archived).length;
    el.className = "badge badge--ok";
    el.textContent = `${activeCount} saved`;
  }

  function recurrenceLabel(item) {
    if (item.recurrence === "none") return "One-off";
    if (item.recurrence === "weekly") return "Repeats weekly";
    if (item.recurrence === "monthly") return "Repeats monthly";
    if (item.recurrence === "yearly") return "Repeats yearly";
    if (item.recurrence === "custom") return `Repeats every ${item.customDays ?? 30} days`;
    return "One-off";
  }

  function renderList(listEl, emptyEl, items) {
    if (!listEl) return;

    listEl.innerHTML = "";

    if (!items.length) {
      emptyEl?.removeAttribute("hidden");
      return;
    }
    emptyEl?.setAttribute("hidden", "true");

    for (const item of items) {
      const d = daysUntil(item.dueDateISO);
      const status = statusFromDays(d);
      const badge = item.archived ? { label: "Archived", cls: "badge--neutral" } : badgeFromStatus(status);

      const metaParts = [];
      metaParts.push(recurrenceLabel(item));
      if (item.dueDateISO) metaParts.push(fmtDueText(d));
      if (item.details?.trim()) metaParts.push(item.details.trim());
      if (item.priority === "high") metaParts.push("High priority");
      metaParts.push(`Done: ${item.doneCount}`);

      const li = document.createElement("li");
      const stripClass =
        item.archived
          ? "list__item--neutral"
          : status === "red"
          ? "list__item--red"
          : status === "amber"
          ? "list__item--amber"
          : "list__item--green";

      li.className = `list__item ${stripClass}${item.archived ? " is-archived" : ""}`;
      li.innerHTML = `
        <div class="list__main">
          <div class="list__title">${escapeHtml(item.name)}</div>
          <div class="list__meta">${escapeHtml(metaParts.join(" • "))}</div>
        </div>

        <div class="row-actions">
          <button class="mini-btn" type="button" data-action="done" data-id="${item.id}">Mark done</button>
          <button class="mini-btn" type="button" data-action="edit" data-id="${item.id}">Edit</button>
          <button class="mini-btn mini-btn--danger" type="button" data-action="delete" data-id="${item.id}">Delete</button>
          <button class="mini-btn" type="button" data-action="${item.archived ? "unarchive" : "archive"}" data-id="${item.id}">
            ${item.archived ? "Unarchive" : "Archive"}
          </button>
          <span class="badge ${badge.cls}">${badge.label}</span>
        </div>
      `;
      listEl.appendChild(li);
    }
  }

  // =========================
  // SMART ALERTS
  // =========================
  function buildSmartAlerts(allItems) {
    const items = allItems.filter((i) => !i.archived);

    return items
      .map((it) => {
        const d = daysUntil(it.dueDateISO);
        const s = statusFromDays(d);

        const urgency =
          (s === "red" ? 120 : s === "amber" ? 70 : 10) +
          (it.priority === "high" ? 20 : 0) +
          (d === null ? -10 : 0) +
          (d !== null ? Math.max(0, 40 - Math.min(40, d)) : 0);

        return {
          id: it.id,
          title: it.name,
          dueText: fmtDueText(d),
          badge: badgeFromStatus(s),
          nudge: gentleNudge(it, d),
          score: urgency,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  function renderSmartAlerts(allItems) {
    if (!listAlerts) return;

    const alerts = buildSmartAlerts(allItems);
    listAlerts.innerHTML = "";

    if (!alerts.length) {
      emptyAlerts?.removeAttribute("hidden");
      if (badgeAlerts) {
        badgeAlerts.className = "badge badge--ok";
        badgeAlerts.textContent = "Clear";
      }
      return;
    }

    emptyAlerts?.setAttribute("hidden", "true");

    if (badgeAlerts) {
      badgeAlerts.className = "badge badge--warn";
      badgeAlerts.textContent = `${alerts.length} active`;
    }

    for (const a of alerts) {
      const li = document.createElement("li");
      const strip =
        a.badge.cls.includes("danger")
          ? "list__item--red"
          : a.badge.cls.includes("warn")
          ? "list__item--amber"
          : "list__item--green";

      li.className = `list__item ${strip}`;
      li.innerHTML = `
        <div class="list__main">
          <div class="list__title">${escapeHtml(a.title)}</div>
          <div class="list__meta">${escapeHtml(a.dueText)} • ${escapeHtml(a.nudge)}</div>
        </div>
        <div class="row-actions">
          <button class="mini-btn" type="button" data-action="edit" data-id="${a.id}">Open</button>
          <span class="badge ${a.badge.cls}">${a.badge.label}</span>
        </div>
      `;
      listAlerts.appendChild(li);
    }
  }

  // =========================
  // PART D — NEXT STEPS
  // =========================
  function buildNextSteps(allItems) {
    const active = allItems.filter((i) => !i.archived);

    const today = [];
    const week = [];

    for (const it of active) {
      const d = daysUntil(it.dueDateISO);
      if (d === null) continue;

      if (d < 0 || d === 0) today.push(it);
      else if (d <= 7) week.push(it);
    }

    today.sort((a, b) => daysUntil(a.dueDateISO) - daysUntil(b.dueDateISO));
    week.sort((a, b) => daysUntil(a.dueDateISO) - daysUntil(b.dueDateISO));

    return { today, week };
  }

  function renderNextSteps(allItems) {
    if (!nextStepsToday || !nextStepsWeek) return;

    const { today, week } = buildNextSteps(allItems);

    nextStepsToday.innerHTML = "";
    nextStepsWeek.innerHTML = "";

    if (!today.length) emptyNextToday?.removeAttribute("hidden");
    else emptyNextToday?.setAttribute("hidden", "true");

    if (!week.length) emptyNextWeek?.removeAttribute("hidden");
    else emptyNextWeek?.setAttribute("hidden", "true");

    const makeRow = (item) => {
      const d = daysUntil(item.dueDateISO);
      const li = document.createElement("li");
      li.className = "list__item list__item--amber";
      li.innerHTML = `
        <div class="list__main">
          <div class="list__title">${escapeHtml(item.name)}</div>
          <div class="list__meta">${fmtDueText(d)} • ${gentleNudge(item, d)}</div>
        </div>
        <div class="row-actions">
          <button class="mini-btn" data-action="edit" data-id="${item.id}">Open</button>
        </div>
      `;
      return li;
    };

    today.forEach((i) => nextStepsToday.appendChild(makeRow(i)));
    week.forEach((i) => nextStepsWeek.appendChild(makeRow(i)));

    const total = today.length + week.length;
    if (badgeNextSteps) {
      badgeNextSteps.className = total ? "badge badge--warn" : "badge badge--ok";
      badgeNextSteps.textContent = total ? `${total} coming up` : "Clear";
    }
  }

  // =========================
  // MONEY — FUNDS (Admin list)
  // =========================
  function renderFunds() {
    if (!listMoneyFunds) return;

    const store = loadStore();
    const funds = store.money.funds || [];
    listMoneyFunds.innerHTML = "";

    const money = makeMoneyFormatter();

    if (!funds.length) {
      emptyMoneyFunds?.removeAttribute("hidden");
      if (badgeMoney) {
        badgeMoney.className = "badge badge--neutral";
        badgeMoney.textContent = "Empty";
      }
      return;
    }
    emptyMoneyFunds?.setAttribute("hidden", "true");

    if (badgeMoney) {
      badgeMoney.className = "badge badge--ok";
      badgeMoney.textContent = `${funds.length} funds`;
    }

    for (const f of funds) {
      const pct = f.target ? Math.min(100, Math.round((f.current / f.target) * 100)) : 0;

      const li = document.createElement("li");
      li.className = "list__item list__item--green";
      li.innerHTML = `
        <div class="list__main">
          <div class="list__title">${escapeHtml(f.name)}</div>
          <div class="list__meta">${money(f.current)} of ${money(f.target)}• ${pct}%</div>
          <div class="progress"><div class="progress__bar" style="width:${pct}%"></div></div>
        </div>
        <div class="row-actions">
          <button class="mini-btn" data-fund-action="add" data-id="${f.id}">+ Add</button>
          <button class="mini-btn" data-fund-action="edit" data-id="${f.id}">Edit</button>
          <button class="mini-btn mini-btn--danger" data-fund-action="delete" data-id="${f.id}">Delete</button>
        </div>
      `;
      listMoneyFunds.appendChild(li);
    }
  }

  // =========================
  // MONEY — BUDGETS (Admin list)
  // =========================
  function renderBudgets() {
    if (!listBudgets) return;

    const store = loadStore();
    const budgets = store.money.budgets || [];
    const txns = store.money.txns || [];

    const money = makeMoneyFormatter();

    listBudgets.innerHTML = "";

    if (!budgets.length) {
      emptyBudgets?.removeAttribute("hidden");
      if (badgeBudgets) {
        badgeBudgets.className = "badge badge--neutral";
        badgeBudgets.textContent = "Empty";
      }
      return;
    }
    emptyBudgets?.setAttribute("hidden", "true");

    if (badgeBudgets) {
      badgeBudgets.className = "badge badge--ok";
      badgeBudgets.textContent = `${budgets.length} budgets`;
    }

    const month = currentMonthKey();

    for (const b of budgets) {
      const spent = txns
        .filter((t) => t.budgetId === b.id && t.type === "spend" && monthKeyFromISO(t.dateISO) === month)
        .reduce((sum, t) => sum + t.amount, 0);

      const pct = b.monthlyLimit ? Math.min(100, Math.round((spent / b.monthlyLimit) * 100)) : 0;

      const li = document.createElement("li");
      li.className = "list__item list__item--amber";
      li.innerHTML = `
        <div class="list__main">
          <div class="list__title">${escapeHtml(b.name)}</div>
          <div class="list__meta">${money(spent)} of ${money(b.monthlyLimit)} • ${pct}%</div>
          <div class="progress"><div class="progress__bar" style="width:${pct}%"></div></div>
        </div>
        <div class="row-actions">
          <button class="mini-btn" data-budget-action="edit" data-id="${b.id}">Edit</button>
          <button class="mini-btn mini-btn--danger" data-budget-action="delete" data-id="${b.id}">Delete</button>
        </div>
      `;
      listBudgets.appendChild(li);
    }
  }

  // =========================
  // ROW ACTIONS (Admin + Money widgets)
  // =========================
document.addEventListener("click", (e) => {
  const btn = e.target.closest(
    "button[data-action], button[data-fund-action], button[data-budget-action]"
  );
  if (!btn) return;

  const id = btn.dataset.id || null;
  const action = btn.dataset.action || null;



    // Life Admin item actions
    if (action && id) {
      const items = loadItems();
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return;

      const item = items[idx];

      if (action === "edit") openModal("edit", item);

      if (action === "delete") {
        if (!confirm("Delete this item?")) return;
        items.splice(idx, 1);
        saveItems(items);
        renderAdmin();
      }

      if (action === "archive" || action === "unarchive") {
        item.archived = action === "archive";
        item.updatedAtISO = new Date().toISOString();
        saveItems(items);
        renderAdmin();
      }

    if (action === "done") {
  item.doneCount++;
  item.updatedAtISO = new Date().toISOString();

  if (item.recurrence === "weekly") item.dueDateISO = addDaysISO(item.dueDateISO, 7);
  else if (item.recurrence === "monthly") item.dueDateISO = addMonthsISO(item.dueDateISO, 1);
  else if (item.recurrence === "yearly") item.dueDateISO = addYearsISO(item.dueDateISO, 1);
  else if (item.recurrence === "custom") item.dueDateISO = addDaysISO(item.dueDateISO, item.customDays || 30);

  saveItems(items);
  renderAdmin();
}
    }

    // Fund actions
    const fundAction = btn.dataset.fundAction;
    if (fundAction && id) {
      const store = loadStore();
      const funds = store.money.funds || [];
      const idx = funds.findIndex((f) => f.id === id);
      if (idx === -1) return;

      if (fundAction === "delete") {
        if (!confirm("Delete this fund?")) return;
        funds.splice(idx, 1);
        store.money.funds = normaliseFunds(funds);
        saveStore(store);
        renderAdmin();
        try { renderMoney(); } catch {}
        toast("Fund deleted");
        return;
      }

      if (fundAction === "edit") {
        openFundModal("edit", funds[idx]);
        return;
      }

      if (fundAction === "add") {
        const amtRaw = prompt("Add amount:", "10");
        if (amtRaw === null) return;
        const amt = Number(amtRaw);
        if (!Number.isFinite(amt) || amt <= 0) return alert("Amount must be a positive number.");

        funds[idx] = { ...funds[idx], current: Number(funds[idx].current || 0) + amt, updatedAtISO: new Date().toISOString() };
        store.money.funds = normaliseFunds(funds);
        saveStore(store);
        logWin("saving", `Saved to fund: ${funds[idx].name} (+${fmtMoney(amt)})`, amt);
        renderAdmin();
        try { renderMoney(); } catch {}
        toast("Added to fund");
        return;
      }
    }

    // Budget actions
    const budgetAction = btn.dataset.budgetAction;
    if (budgetAction && id) {
      const store = loadStore();
      const budgets = store.money.budgets || [];
      const idx = budgets.findIndex((b) => b.id === id);
      if (idx === -1) return;

      if (budgetAction === "delete") {
        if (!confirm("Delete this budget?")) return;
        budgets.splice(idx, 1);
        store.money.budgets = normaliseBudgets(budgets);
        saveStore(store);
        renderAdmin();
        try { renderMoney(); } catch {}
        toast("Budget deleted");
        return;
      }

      if (budgetAction === "edit") {
        openBudgetModal("edit", budgets[idx]);
        return;
      }
    }
  });

  // =========================
  // MAIN ADMIN RENDER
  // =========================
  function renderAdmin() {
    const store = loadStore();
    let items = store.lifeAdmin.items;

if (uiState.calmModeManual === null) {
  const s = getSettings();
  if (s.calmModeAuto) {
    const urgent = urgentCount(items);
    const threshold = s.calmThreshold ?? 3;
    uiState.calmMode = urgent > threshold;
  } else {
    uiState.calmMode = false;
  }
  if (calmCheckbox) calmCheckbox.checked = uiState.calmMode;
}

    if (uiState.calmMode) items = applyCalmMode(items);

    const filtered = applyFilterAndSort(items);

    const renewals = filtered.filter((i) => i.category === "renewal");
    const accounts = filtered.filter((i) => i.category === "account");
    const vehicle = filtered.filter((i) => i.category === "vehicle");
    const info = filtered.filter((i) => i.category === "info");

    renderStats(store.lifeAdmin.items);
    renderSmartAlerts(store.lifeAdmin.items);
    renderNextSteps(store.lifeAdmin.items);

    renderList(listRenewals, emptyRenewals, renewals);
    renderList(listAccounts, emptyAccounts, accounts);
    renderList(listVehicle, emptyVehicle, vehicle);
    renderList(listInfo, emptyInfo, info);

    setCategoryBadge(badgeRenewals, renewals);
    setCategoryBadge(badgeAccounts, accounts);
    setCategoryBadge(badgeVehicle, vehicle);
    setCategoryBadge(badgeInfo, info);

    setCategoryCardVisibility("renewal", renewals.length);
    setCategoryCardVisibility("account", accounts.length);
    setCategoryCardVisibility("vehicle", vehicle.length);
    setCategoryCardVisibility("info", info.length);

    setOverallPill(computeOverallStatus(store.lifeAdmin.items));

    // Admin panel Money widgets
    renderFunds();
    renderBudgets();

    // Optional: money summary top text
    if (moneySummary) {
      const totalCurrent = (store.money.funds || []).reduce((a, f) => a + Number(f.current || 0), 0);
      moneySummary.textContent = `Total saved across funds: ${fmtMoney(totalCurrent)}`;
    }
  }

  // =========================
  // SAFE ROUTER TARGETS (so nav can’t throw)
  // =========================
  function renderMoney() {
    // money view might not exist in some HTML versions
    // we still keep this function so router calls are safe
    const store = loadStore();
    // If you want money-view rendering here later, this is the place.
    return store;
  }

  function renderSettings() {
    // settings view might not exist in some HTML versions
    return;
  }

    // ============================================================
  // SECTION 4/5 — HOME (Part E) + SKILLS (Part F) + GLOBAL SEARCH
  // ============================================================

  // =========================
  // SETTINGS (toggle money visibility)
  // =========================
  const chkHideMoney = document.getElementById("chkHideMoney");

  function applyMoneyVisibilityFromSettings() {
    const store = loadStore();
    const hide = !!store.settings?.hideMoney;

    if (chkHideMoney) chkHideMoney.checked = hide;

    const moneyCard = document.querySelector('[data-cat-card="money"]');
    if (moneyCard) moneyCard.hidden = hide;
  }

  chkHideMoney?.addEventListener("change", () => {
    const store = loadStore();
    store.settings = normaliseSettings({ ...store.settings, hideMoney: !!chkHideMoney.checked });
    saveStore(store);
    applyMoneyVisibilityFromSettings();
    toast(store.settings.hideMoney ? "Money section hidden" : "Money section visible");
  });

  // =========================
  // HOME (Future Home)
  // =========================
  const homeStats = document.getElementById("homeStats");
  const roomsGrid = document.getElementById("roomsGrid");
  const roomDetail = document.getElementById("roomDetail");

  function findHomeGridWrap() {
    const explicit = document.getElementById("homeGridWrap");
    if (explicit) return explicit;

    const clsWrap = roomsGrid?.closest(".home-grid-wrap");
    if (clsWrap && roomDetail && !clsWrap.contains(roomDetail)) return clsWrap;

    let el = roomsGrid?.parentElement || null;
    while (el) {
      if (roomsGrid && el.contains(roomsGrid) && roomDetail && !el.contains(roomDetail)) return el;
      el = el.parentElement;
    }
    return null;
  }

  const homeGridWrap = findHomeGridWrap();

  const btnRoomBack = document.getElementById("btnRoomBack");
  const roomTitleEl = document.getElementById("roomTitle");

  const homeRoomNotes = document.getElementById("homeRoomNotes");
  const btnSaveRoomNotes = document.getElementById("btnSaveRoomNotes");

  const homeSearch = document.getElementById("homeSearch");
  const chkPlannedOnly = document.getElementById("chkPlannedOnly");

  // Home > Shopping List (global)
const selShoppingSort = document.getElementById("selShoppingSort");
const chkShoppingEssentialsOnly = document.getElementById("chkShoppingEssentialsOnly");
const chkShoppingNextOnly = document.getElementById("chkShoppingNextOnly");
const homeShoppingList = document.getElementById("homeShoppingList");
const homeShoppingEmpty = document.getElementById("homeShoppingEmpty");
const homeShoppingBadge = document.getElementById("homeShoppingBadge");


  const essentialsList = document.getElementById("essentialsList");
  const extrasList = document.getElementById("extrasList");

  const btnAddEssential = document.getElementById("btnAddEssential");
  const btnAddExtra = document.getElementById("btnAddExtra");

  let activeRoomKey = null;

  function getHomeRooms() {
    const store = loadStore();
    return store.home.rooms || defaultRooms();
  }

  function saveHomeRooms(rooms) {
    const store = loadStore();
    store.home.rooms = rooms;
    saveStore(store);
  }

  function roomItems(room) {
    const essentials = Array.isArray(room?.essentials) ? room.essentials : [];
    const extras = Array.isArray(room?.extras) ? room.extras : [];
    return { essentials, extras };
  }

  function calcRoomProgress(room) {
    const { essentials, extras } = roomItems(room);
    const eTotal = essentials.length || 0;
    const xTotal = extras.length || 0;

    const ePlanned = essentials.filter((i) => !!i.planned).length;
    const xPlanned = extras.filter((i) => !!i.planned).length;

    const eCost = essentials.reduce((a, i) => a + Number(i.cost || 0), 0);
    const xCost = extras.reduce((a, i) => a + Number(i.cost || 0), 0);

    const ePct = eTotal ? Math.round((ePlanned / eTotal) * 100) : 0;
    const xPct = xTotal ? Math.round((xPlanned / xTotal) * 100) : 0;
    const completionPct = (eTotal + xTotal) ? Math.round(((ePlanned + xPlanned) / (eTotal + xTotal)) * 100) : 0;


    return { eTotal, xTotal, ePlanned, xPlanned, eCost, xCost, ePct, xPct, completionPct };
  }

  function calcOverallHomeStats(rooms) {
    const keys = Object.keys(rooms || {});
    let eTotal = 0, xTotal = 0, ePlanned = 0, xPlanned = 0, eCost = 0, xCost = 0;

    for (const k of keys) {
      const r = rooms[k];
      const p = calcRoomProgress(r);
      eTotal += p.eTotal;
      xTotal += p.xTotal;
      ePlanned += p.ePlanned;
      xPlanned += p.xPlanned;
      eCost += p.eCost;
      xCost += p.xCost;
    }

    const ePct = eTotal ? Math.round((ePlanned / eTotal) * 100) : 0;
    const xPct = xTotal ? Math.round((xPlanned / xTotal) * 100) : 0;

    return { eTotal, xTotal, ePlanned, xPlanned, eCost, xCost, ePct, xPct };
  }

  function renderHomeStats() {
    if (!homeStats) return;
    const rooms = getHomeRooms();
    const o = calcOverallHomeStats(rooms);

    homeStats.innerHTML = `
      <article class="card card--stat">
        <div class="card__label">Essentials planned</div>
        <div class="card__value">${o.ePlanned}/${o.eTotal} (${o.ePct}%)</div>
        <div class="card__hint">Estimated essentials: ${escapeHtml(fmtMoney(o.eCost))}</div>
      </article>
      <article class="card card--stat">
        <div class="card__label">Extras planned</div>
        <div class="card__value">${o.xPlanned}/${o.xTotal} (${o.xPct}%)</div>
        <div class="card__hint">Estimated extras: ${escapeHtml(fmtMoney(o.xCost))}</div>
      </article>
      <article class="card card--stat">
        <div class="card__label">Total estimate</div>
        <div class="card__value">${escapeHtml(fmtMoney(o.eCost + o.xCost))}</div>
        <div class="card__hint">Based on item costs you’ve entered.</div>
      </article>
    `;
  }

  function renderRoomsGrid() {
    if (!roomsGrid) return;

    const rooms = getHomeRooms();
    const keys = Object.keys(rooms);

    roomsGrid.innerHTML = "";
    for (const key of keys) {
      const r = rooms[key];
      const p = calcRoomProgress(r);

      const card = document.createElement("button");
      card.type = "button";
      card.className = "room-card";
      card.setAttribute("data-room-key", key);
      card.innerHTML = `
        <div class="room-card__top">
          <div class="room-card__title">${escapeHtml(r.title || key)}</div>
         <div class="room-card__meta">
  ${p.ePlanned}/${p.eTotal} essentials • ${p.xPlanned}/${p.xTotal} extras • ${p.completionPct}% complete
</div>
        <div class="room-card__bars">
          <div class="room-card__bar">
            <div class="room-card__barlabel">Essentials</div>
            <div class="progress"><div class="progress__bar" style="width:${p.ePct}%"></div></div>
          </div>
          <div class="room-card__bar">
            <div class="room-card__barlabel">Extras</div>
            <div class="progress"><div class="progress__bar" style="width:${p.xPct}%"></div></div>
          </div>
        </div>
      `;
      roomsGrid.appendChild(card);
    }
  }

  function showRoomDetail(key) {
    const rooms = getHomeRooms();
    const room = rooms[key];
    if (!room) {
      toast("Room not found");
      return;
    }

    activeRoomKey = key;

    if (homeGridWrap) homeGridWrap.classList.add("is-hidden");
    roomDetail?.classList.add("is-visible");

    if (roomTitleEl) roomTitleEl.textContent = room.title || key;
    if (homeRoomNotes) homeRoomNotes.value = room.notes || "";

    // Ensure the "Mark all essentials owned" button exists once
let btn = document.getElementById("btnMarkAllOwned");
if (!btn) {
  btn = document.createElement("button");
  btn.id = "btnMarkAllOwned";
  btn.className = "mini-btn";
  btn.textContent = "Mark all essentials owned";
  roomTitleEl?.after(btn);

  btn.addEventListener("click", () => {
    const rooms = getHomeRooms();
    const room = rooms[activeRoomKey];
    if (!room) return;

    room.essentials = (room.essentials || []).map(i => ({ ...i, owned: true, updatedAtISO: new Date().toISOString() }));
    saveHomeRooms(rooms);
    refreshHomeUI();
    toast("All essentials marked owned");
  });
}


    renderRoomLists();
  }

  function renderHomeShoppingList() {
  if (!homeShoppingList) return;

  const money = makeMoneyFormatter();

  const essentialsOnly = !!chkShoppingEssentialsOnly?.checked;
  const nextOnly = !!chkShoppingNextOnly?.checked;
  const sortMode = selShoppingSort?.value || "priority";

  // IMPORTANT: this line must match your real home data structure
const rooms = getHomeRooms();

  let items = [];

  Object.entries(rooms).forEach(([roomKey, room]) => {
    const title = room?.title || roomKey;

    const addItems = (arr, kind) => {
      (arr || []).forEach(it => {
        const planned = !!it.planned;
        const owned = !!it.owned;
        const nextToBuy = !!it.nextToBuy;

        // shopping = planned + not owned
        if (!planned) return;
        if (owned) return;
        if (nextOnly && !nextToBuy) return;

        items.push({
          roomKey,
          roomTitle: title,
          kind,
          name: it.name || "(Unnamed)",
          cost: Number(it.cost || 0),
          priority: it.priority || "normal",
          nextToBuy
        });
      });
    };

    addItems(room.essentials, "essential");
    if (!essentialsOnly) addItems(room.extras, "extra");
  });

  // sort
  items.sort((a, b) => {
    if (sortMode === "costLow") return a.cost - b.cost;
    if (sortMode === "costHigh") return b.cost - a.cost;
    if (sortMode === "roomAZ") return a.roomTitle.localeCompare(b.roomTitle) || a.name.localeCompare(b.name);

    const pa = a.priority === "high" ? 1 : 0;
    const pb = b.priority === "high" ? 1 : 0;
    const na = a.nextToBuy ? 1 : 0;
    const nb = b.nextToBuy ? 1 : 0;
    return (pb - pa) || (nb - na) || a.name.localeCompare(b.name);
  });

  // render
  homeShoppingList.innerHTML = "";
  if (homeShoppingBadge) homeShoppingBadge.textContent = String(items.length);

  if (items.length === 0) {
    if (homeShoppingEmpty) homeShoppingEmpty.hidden = false;
    return;
  }
  if (homeShoppingEmpty) homeShoppingEmpty.hidden = true;

  items.forEach(it => {
    const li = document.createElement("li");
    li.className = "list__item";

    li.innerHTML = `
      <div class="list__main">
        <div class="list__title">${escapeHtml(it.name)}</div>
        <div class="list__meta">
          ${escapeHtml(it.roomTitle)} • ${it.kind === "essential" ? "Essential" : "Extra"} •
          Priority: ${escapeHtml(it.priority)} • Cost: ${escapeHtml(money(it.cost))}
          ${it.nextToBuy ? " • <span class='badge badge--warn'>Next</span>" : ""}
        </div>
      </div>
      <div class="list__actions">
        <button class="mini-btn" type="button">View</button>
      </div>
    `;

    li.querySelector("button")?.addEventListener("click", () => {
      showRoomDetail(it.roomKey);
    });

    homeShoppingList.appendChild(li);
  });
}


  function hideRoomDetail() {
    activeRoomKey = null;

    if (homeGridWrap) homeGridWrap.classList.remove("is-hidden");
    roomDetail?.classList.remove("is-visible");

    renderHomeStats();
    renderRoomsGrid();
  }

  btnRoomBack?.addEventListener("click", hideRoomDetail);

  roomsGrid?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-room-key]");
    if (!btn) return;
    const key = btn.getAttribute("data-room-key");
    if (!key) return;
    showRoomDetail(key);
  });

  btnSaveRoomNotes?.addEventListener("click", () => {
    if (!activeRoomKey) return;
    const rooms = getHomeRooms();
    const room = rooms[activeRoomKey];
    if (!room) return;

    room.notes = String(homeRoomNotes?.value ?? "");
    saveHomeRooms(rooms);

    renderHomeStats();
    renderRoomsGrid();

    toast("Room notes saved");
  });

  function applyHomeFilters(items) {
    let out = [...items];
    const q = (homeSearch?.value || "").trim().toLowerCase();
    const plannedOnly = !!chkPlannedOnly?.checked;

    if (q) {
      out = out.filter(
        (i) =>
          String(i.name || "").toLowerCase().includes(q) ||
          String(i.notes || "").toLowerCase().includes(q)
      );
    }
    if (plannedOnly) out = out.filter((i) => !!i.planned);

    out.sort((a, b) => {
      const pa = a.priority === "high" ? 1 : 0;
      const pb = b.priority === "high" ? 1 : 0;
      return pb - pa || String(a.name).localeCompare(String(b.name));
    });

    return out;
  }

  function refreshHomeUI() {
  renderHomeStats();
  renderRoomsGrid();
  renderRoomLists();
  renderHomeShoppingList();
}

  function renderRoomLists() {
    if (!activeRoomKey) return;

    const rooms = getHomeRooms();
    const room = rooms[activeRoomKey];
    if (!room) return;

    const { essentials, extras } = roomItems(room);

    const e = applyHomeFilters(essentials);
    const x = applyHomeFilters(extras);

    if (essentialsList) essentialsList.innerHTML = "";
    if (extrasList) extrasList.innerHTML = "";

    const mkRow = (item, kind) => {
      const li = document.createElement("li");
      li.className = "list__item list__item--neutral";
      const plannedText = item.planned ? "Planned" : "Not planned";

      li.innerHTML = `
        <div class="list__main">
          <div class="list__title">${escapeHtml(item.name)}</div>
          <div class="list__meta">
            ${escapeHtml(plannedText)}
            • Priority: ${escapeHtml(item.priority || "normal")}
            • Cost: ${escapeHtml(fmtMoney(item.cost || 0))}
            ${item.notes?.trim() ? " • " + escapeHtml(item.notes.trim()) : ""}
          </div>
        </div>
      <div class="row-actions">
  <button class="mini-btn" type="button" data-home-action="togglePlanned" data-kind="${kind}" data-id="${item.id}">
    ${item.planned ? "Unplan" : "Plan"}
  </button>
      
<button class="mini-btn" type="button" data-home-action="toggleOwned" data-kind="${kind}" data-id="${item.id}">
  ${item.owned ? "Unmark owned" : "Mark owned"}
</button>

<button class="mini-btn" type="button" data-home-action="toggleNext" data-kind="${kind}" data-id="${item.id}">
  ${item.nextToBuy ? "Unmark next" : "Mark next"}
</button>
    <button class="mini-btn" type="button" data-home-action="edit" data-kind="${kind}" data-id="${item.id}">Edit</button>
  <button class="mini-btn mini-btn--danger" type="button" data-home-action="delete" data-kind="${kind}" data-id="${item.id}">Delete</button>
</div>
      `;
      return li;
    };

    e.forEach((it) => essentialsList?.appendChild(mkRow(it, "essentials")));
    x.forEach((it) => extrasList?.appendChild(mkRow(it, "extras")));
  }

  function promptHomeItem(base = null, title = "Add item") {
    const name = prompt(`${title} — Name:`, base?.name ?? "");
    if (name === null) return null;
    const trimmed = name.trim();
    if (!trimmed) {
      alert("Name is required.");
      return null;
      
    }

    // 🚫 Prevent duplicate item names in this room
if (activeRoomKey) {
  const rooms = getHomeRooms();
  const room = rooms[activeRoomKey];
  if (room) {
    const allItems = [...(room.essentials || []), ...(room.extras || [])];
    const exists = allItems.some(i => i.name.toLowerCase() === trimmed.toLowerCase() && i.id !== base?.id);
    if (exists) {
      alert("That item already exists in this room.");
      return null;
    }
  }
}

    const planned = confirm("Planned? (OK = Planned, Cancel = Not planned)");
    const priority = confirm("High priority? (OK = High, Cancel = Normal)") ? "high" : "normal";

    const costRaw = prompt("Cost (number):", String(Number(base?.cost ?? 0)));
    if (costRaw === null) return null;
    const cost = Number(costRaw);
    if (!Number.isFinite(cost) || cost < 0) {
      alert("Cost must be 0 or a positive number.");
      return null;
    }

    const notes = prompt("Notes (optional):", base?.notes ?? "");
    if (notes === null) return null;

    return {
      id: base?.id ?? uid(),
      name: trimmed,
      planned,
      owned: base?.owned ?? false,
nextToBuy: base?.nextToBuy ?? false,
      priority,
      cost,
      notes: notes.trim(),
      createdAtISO: base?.createdAtISO ?? new Date().toISOString(),
      updatedAtISO: new Date().toISOString(),
    };
  }

  btnAddEssential?.addEventListener("click", () => {
    if (!activeRoomKey) return;
    const rooms = getHomeRooms();
    const room = rooms[activeRoomKey];
    if (!room) return;

    const item = promptHomeItem(null, "Add essential");
    if (!item) return;

    room.essentials = Array.isArray(room.essentials) ? room.essentials : [];
    room.essentials.push(item);

 saveHomeRooms(rooms);
refreshHomeUI();
toast("Essential added");
  });

  btnAddExtra?.addEventListener("click", () => {
    if (!activeRoomKey) return;
    const rooms = getHomeRooms();
    const room = rooms[activeRoomKey];
    if (!room) return;

    const item = promptHomeItem(null, "Add extra");
    if (!item) return;

    room.extras = Array.isArray(room.extras) ? room.extras : [];
    room.extras.push(item);

   saveHomeRooms(rooms);
refreshHomeUI();
toast("Extra added");
  });

  homeSearch?.addEventListener("input", () => renderRoomLists());
  chkPlannedOnly?.addEventListener("change", () => renderRoomLists());

  // Home > Shopping List header controls
selShoppingSort?.addEventListener("change", renderHomeShoppingList);
chkShoppingEssentialsOnly?.addEventListener("change", renderHomeShoppingList);
chkShoppingNextOnly?.addEventListener("change", renderHomeShoppingList);

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-home-action]");
  if (!btn) return;

  const action = btn.getAttribute("data-home-action");
  const kind = btn.getAttribute("data-kind");
  const id = btn.getAttribute("data-id");

  if (!action || !kind || !id) return;

  // Only handle if a room is open
  if (!activeRoomKey) return;

  const rooms = getHomeRooms();
  const room = rooms[activeRoomKey];
  if (!room) return;

  const arr = kind === "essentials" ? (room.essentials || []) : (room.extras || []);
  const idx = arr.findIndex((x) => x.id === id);
  if (idx === -1) return;

  if (action === "delete") {
    if (!confirm("Delete this item?")) return;
    arr.splice(idx, 1);
    if (kind === "essentials") room.essentials = arr;
    else room.extras = arr;

    saveHomeRooms(rooms);
    refreshHomeUI();
    toast("Item deleted");
    return;
  }

  if (action === "togglePlanned") {
    arr[idx] = { ...arr[idx], planned: !arr[idx].planned, updatedAtISO: new Date().toISOString() };
    if (kind === "essentials") room.essentials = arr;
    else room.extras = arr;

    saveHomeRooms(rooms);
    refreshHomeUI();
    toast(arr[idx].planned ? "Marked planned" : "Marked not planned");
    return;
  }

  if (action === "toggleOwned") {
    arr[idx] = { ...arr[idx], owned: !arr[idx].owned, updatedAtISO: new Date().toISOString() };
    if (kind === "essentials") room.essentials = arr;
    else room.extras = arr;

    saveHomeRooms(rooms);
    refreshHomeUI();
    toast(arr[idx].owned ? "Marked owned" : "Marked not owned");
    return;
  }

  if (action === "toggleNext") {
    arr[idx] = { ...arr[idx], nextToBuy: !arr[idx].nextToBuy, updatedAtISO: new Date().toISOString() };
    if (kind === "essentials") room.essentials = arr;
    else room.extras = arr;

    saveHomeRooms(rooms);
    refreshHomeUI();
    toast(arr[idx].nextToBuy ? "Marked as next" : "Unmarked as next");
    return;
  }

  if (action === "edit") {
    const edited = promptHomeItem(arr[idx], "Edit item");
    if (!edited) return;

    arr[idx] = edited;
    if (kind === "essentials") room.essentials = arr;
    else room.extras = arr;

    saveHomeRooms(rooms);
    refreshHomeUI();
    toast("Item updated");
  }
});


  function renderHome() {
    renderHomeStats();
    renderRoomsGrid();
    renderHomeShoppingList();

    if (activeRoomKey) {
      const rooms = getHomeRooms();
      if (!rooms[activeRoomKey]) {
        hideRoomDetail();
        return;
      }
      renderRoomLists();
    } else {
      if (homeGridWrap) homeGridWrap.classList.remove("is-hidden");
      roomDetail?.classList.remove("is-visible");
    }
  }

  // =========================
// SKILLS (Life Skills) — FULLY WIRED TO YOUR HTML
// =========================
const skillsGrowthBadge = document.getElementById("skillsGrowthBadge");
const skillsSuggestionsSummary = document.getElementById("skillsSuggestionsSummary");
const skillsSuggestionsList = document.getElementById("skillsSuggestionsList");
const skillsSuggestionsEmpty = document.getElementById("skillsSuggestionsEmpty");
const skillsMilestones = document.getElementById("skillsMilestones");
const skillsTrendCanvas = document.getElementById("skillsTrendCanvas");

const skillsBadge = document.getElementById("skillsBadge");
const skillsSummary = document.getElementById("skillsSummary");
const skillsCountBadge = document.getElementById("skillsCountBadge");
const skillsEmpty = document.getElementById("skillsEmpty");

// ✅ MISSING HOOKS (this is why nothing renders)
const skillsList = document.getElementById("skillsList");
const skillsSearch = document.getElementById("skillsSearch"); // optional (used by Global Search)


const formAddSkill = document.getElementById("formAddSkill");
const skillsFilterChips = document.getElementById("skillsFilterChips");

// NOTE: Your HTML doesn't have these by default. If you add ids (recommended),
// these will be found. If not, we fall back to querying inside the form.
const skillsCategorySelect = document.getElementById("skillsCategorySelect") || formAddSkill?.querySelector("select[name='category']");
const skillsNameInput = document.getElementById("skillsNameInput") || formAddSkill?.querySelector("input[name='name']");

// Levels
const SKILL_LEVELS = [
  { key: "ns", label: "Not started" },
  { key: "l1", label: "Level 1" },
  { key: "l2", label: "Level 2" },
  { key: "l3", label: "Level 3" },
  { key: "l4", label: "Level 4" },
  { key: "l5", label: "Level 5" },
];

function getSkillsCategories() {
  const store = loadStore();
  return store.skills.categories || defaultSkills();
}

function saveSkillsCategories(categories) {
  const store = loadStore();
  store.skills.categories = categories;
  saveStore(store);
}

function skillScore(levelKey) {
  const idx = SKILL_LEVELS.findIndex((x) => x.key === levelKey);
  return idx < 0 ? 0 : idx;
}

// UI state for skills
const skillsUI = {
  filter: "all", // "all" or category name
};

// Helpers
function allSkills(categories) {
  const rows = [];
  for (const [cat, c] of Object.entries(categories || {})) {
    for (const it of (c.items || [])) rows.push({ cat, it });
  }
  return rows;
}

function calcSkillsStats(categories) {
  const rows = allSkills(categories);
  const total = rows.length;
  const started = rows.filter((r) => r.it.level !== "ns").length;
  const avg = total ? rows.reduce((a, r) => a + skillScore(r.it.level), 0) / total : 0;
  const max = total ? Math.max(...rows.map((r) => skillScore(r.it.level))) : 0;
  return { total, started, avg: Math.round(avg * 10) / 10, max };
}

function setSkillsBadgesAndSummary() {
  const categories = getSkillsCategories();
  const s = calcSkillsStats(categories);

  if (skillsBadge) {
    skillsBadge.className = s.started ? "badge badge--ok" : "badge badge--neutral";
    skillsBadge.textContent = s.started ? "In progress" : "Empty";
  }

  if (skillsCountBadge) {
    skillsCountBadge.className = s.total ? "badge badge--ok" : "badge badge--neutral";
    skillsCountBadge.textContent = s.total ? `${s.total} skills` : "—";
  }

  if (skillsSummary) {
    skillsSummary.textContent = s.total
      ? `Started: ${s.started}/${s.total} • Average level: ${s.avg}`
      : "Add your first skill to start tracking progress.";
  }

  // Growth badge: simple "confidence" label based on average score
  if (skillsGrowthBadge) {
    const label =
      s.total === 0 ? "—" :
      s.avg < 1 ? "Starting" :
      s.avg < 2 ? "Building" :
      s.avg < 3 ? "Steady" :
      s.avg < 4 ? "Strong" : "Confident";

    skillsGrowthBadge.className = s.total === 0 ? "badge badge--neutral" : (s.avg >= 3 ? "badge badge--ok" : "badge badge--warn");
    skillsGrowthBadge.textContent = label;
  }

  if (skillsSuggestionsSummary) {
    skillsSuggestionsSummary.textContent = s.total
      ? `Focus on your lowest-level skills first — quick wins compound.`
      : "Add a few skills and I’ll suggest the next best steps.";
  }
}

function renderSkillsList() {
  const categories = getSkillsCategories();
  const rows = allSkills(categories)
    .filter((r) => skillsUI.filter === "all" || r.cat === skillsUI.filter);

  rows.sort((a, b) => {
    const sa = skillScore(a.it.level);
    const sb = skillScore(b.it.level);
    return sa - sb || String(a.it.name).localeCompare(String(b.it.name));
  });

  if (!skillsList) return;
  skillsList.innerHTML = "";

  if (skillsEmpty) {
    skillsEmpty.hidden = rows.length > 0;
  }

  for (const r of rows) {
    const li = document.createElement("li");
    li.className = "list__item list__item--neutral";

    const levelOptions = SKILL_LEVELS.map(
      (l) => `<option value="${l.key}" ${l.key === r.it.level ? "selected" : ""}>${escapeHtml(l.label)}</option>`
    ).join("");

    li.innerHTML = `
      <div class="list__main" style="min-width:0;">
        <div class="list__title">${escapeHtml(r.it.name)}</div>
        <div class="list__meta">${escapeHtml(r.cat)}${r.it.notes?.trim() ? " • " + escapeHtml(r.it.notes.trim()) : ""}</div>
      </div>

      <div class="row-actions">
        <select class="mini-select" data-skill-action="level" data-cat="${escapeHtml(r.cat)}" data-id="${r.it.id}">
          ${levelOptions}
        </select>
        <button class="mini-btn" type="button" data-skill-action="notes" data-cat="${escapeHtml(r.cat)}" data-id="${r.it.id}">Notes</button>
        <button class="mini-btn mini-btn--danger" type="button" data-skill-action="delete" data-cat="${escapeHtml(r.cat)}" data-id="${r.it.id}">Delete</button>
      </div>
    `;

    skillsList.appendChild(li);
  }
}

function renderSuggestions() {
  if (!skillsSuggestionsList) return;

  const categories = getSkillsCategories();
  const rows = allSkills(categories);

  // Take lowest-level skills first, up to 6
  rows.sort((a, b) => {
    const sa = skillScore(a.it.level);
    const sb = skillScore(b.it.level);
    return sa - sb || String(a.it.name).localeCompare(String(b.it.name));
  });

  const picks = rows.slice(0, 6);

  skillsSuggestionsList.innerHTML = "";

  if (!picks.length) {
    skillsSuggestionsEmpty?.removeAttribute("hidden");
    return;
  }
  skillsSuggestionsEmpty?.setAttribute("hidden", "true");

  for (const p of picks) {
    const nextLevelIdx = Math.min(SKILL_LEVELS.length - 1, skillScore(p.it.level) + 1);
    const nextLabel = SKILL_LEVELS[nextLevelIdx]?.label || "Next level";

    const li = document.createElement("li");
    li.className = "list__item list__item--amber";
    li.innerHTML = `
      <div class="list__main">
        <div class="list__title">${escapeHtml(p.it.name)}</div>
        <div class="list__meta">${escapeHtml(p.cat)} • Aim for: ${escapeHtml(nextLabel)}</div>
      </div>
      <div class="row-actions">
        <button class="mini-btn" type="button" data-skill-suggest-open="1" data-cat="${escapeHtml(p.cat)}" data-id="${p.it.id}">Add notes</button>
      </div>
    `;
    skillsSuggestionsList.appendChild(li);
  }
}

function renderMilestones() {
  if (!skillsMilestones) return;

  const categories = getSkillsCategories();
  const s = calcSkillsStats(categories);

  const milestones = [];

  if (s.total >= 1) milestones.push("Started");
  if (s.started >= 3) milestones.push("3 skills underway");
  if (s.started >= 10) milestones.push("10 skills underway");
  if (s.avg >= 2) milestones.push("Average L2+");
  if (s.avg >= 3) milestones.push("Average L3+");
  if (s.max >= 4) milestones.push("Reached L4/L5");

  if (!milestones.length) milestones.push("Add your first skill");

  skillsMilestones.innerHTML = milestones
    .map((m) => `<span class="chip">${escapeHtml(m)}</span>`)
    .join("");
}

function drawTrend() {
  if (!skillsTrendCanvas) return;
  const ctx = skillsTrendCanvas.getContext("2d");
  if (!ctx) return;

  const categories = getSkillsCategories();
  const rows = allSkills(categories);

  // Build a simple “trend” from updatedAtISO if available.
  // We group by month and average score.
  const pointsByMonth = new Map();

  for (const r of rows) {
    const iso = r.it.updatedAtISO || r.it.createdAtISO;
    if (!iso) continue;
    const month = String(iso).slice(0, 10); // YYYY-MM-DD
    const val = skillScore(r.it.level);

    const cur = pointsByMonth.get(month) || { sum: 0, n: 0 };
    cur.sum += val;
    cur.n += 1;
    pointsByMonth.set(month, cur);
  }

  window.drawTrend = drawTrend;

  const months = [...pointsByMonth.keys()].sort();
  const pts = months.map((m) => {
    const x = pointsByMonth.get(m);
    return x && x.n ? x.sum / x.n : 0;
  });

  // Clear
  ctx.clearRect(0, 0, skillsTrendCanvas.width, skillsTrendCanvas.height);

  // If nothing to draw
  if (pts.length < 2) {
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("Add skills + update levels to see a trend.", 10, 20);
    return;
  }

  const w = skillsTrendCanvas.width;
  const h = skillsTrendCanvas.height;
  const pad = 16;

  const minY = 0;
  const maxY = SKILL_LEVELS.length - 1;

  const scaleX = (i) => pad + (i * (w - pad * 2)) / (pts.length - 1);
  const scaleY = (v) => (h - pad) - ((v - minY) * (h - pad * 2)) / (maxY - minY);

  // Axes
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.stroke();

  // Line
  ctx.lineWidth = 2;
  ctx.beginPath();
  pts.forEach((v, i) => {
    const x = scaleX(i);
    const y = scaleY(v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots
  ctx.lineWidth = 1;
  pts.forEach((v, i) => {
    const x = scaleX(i);
    const y = scaleY(v);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function wireSkillsFilterChips() {
  if (!skillsFilterChips) return;

  skillsFilterChips.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-skill-filter]");
    if (!btn) return;

    const key = btn.getAttribute("data-skill-filter") || "all";
    skillsUI.filter = key;

    // UI highlight
    [...skillsFilterChips.querySelectorAll(".chip")].forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });

    renderSkills();
  });
}

// -------------------------
// SKILLS: Add skill (clean + no duplicate listeners)
// -------------------------
function addSkillFromInputs() {
  const category = String(skillsCategorySelect?.value || "Cooking").trim() || "Cooking";
  const name = String(skillsNameInput?.value || "").trim();

  if (!name) {
    toast("Enter a skill name");
    skillsNameInput?.focus?.();
    return;
  }

  const categories = getSkillsCategories();
  if (!categories[category]) categories[category] = { category, items: [] };

  const exists = (categories[category].items || []).some(
    (s) => String(s.name || "").trim().toLowerCase() === name.toLowerCase()
  );
  if (exists) {
    toast("That skill already exists");
    skillsNameInput?.focus?.();
    skillsNameInput?.select?.();
    return;
  }

  categories[category].items.push({
    id: uid(),
    name,
    level: "ns",
    notes: "",
    createdAtISO: new Date().toISOString(),
    updatedAtISO: new Date().toISOString(),
  });

  saveSkillsCategories(categories);

  if (skillsNameInput) skillsNameInput.value = "";
  renderSkills();
  logWin("skill", `Skill added: ${name}`, 1);
  toast("Skill added");
}

// If you have a real form, submit = add skill
formAddSkill?.addEventListener("submit", (e) => {
  e.preventDefault();
  addSkillFromInputs();
});

// Fallback: if you also have a non-submit button somewhere
const form = document.getElementById("formAddSkill");

form.addEventListener("submit", (e) => {
  e.preventDefault(); // <- this is the key

  const fd = new FormData(form);
  const category = (fd.get("category") || "").toString().trim();
  const name = (fd.get("name") || "").toString().trim();

  if (!name) return;

  // TODO: add skill to your skills array + save + render
  // addSkill({ category, name });

  form.reset();
});

// Level change + Notes/Delete buttons (event delegation)
document.getElementById("view-skills")?.addEventListener("change", (e) => {
  const sel = e.target.closest("select[data-skill-action='level']");
  if (!sel) return;

  const cat = sel.getAttribute("data-cat");
  const id = sel.getAttribute("data-id");
  const level = sel.value;
  if (!cat || !id) return;

  const categories = getSkillsCategories();
  const c = categories[cat];
  if (!c) return;

  const idx = (c.items || []).findIndex((x) => x.id === id);
  if (idx === -1) return;

  c.items[idx] = { ...c.items[idx], level, updatedAtISO: new Date().toISOString() };
  saveSkillsCategories(categories);

  renderSkills();
  toast("Skill updated");
});

document.getElementById("view-skills")?.addEventListener("click", (e) => {
  // Suggestions "Add notes"
  const suggestBtn = e.target.closest("button[data-skill-suggest-open]");
  if (suggestBtn) {
    const cat = suggestBtn.getAttribute("data-cat");
    const id = suggestBtn.getAttribute("data-id");
    if (!cat || !id) return;

    const categories = getSkillsCategories();
    const c = categories[cat];
    if (!c) return;

    const idx = (c.items || []).findIndex((x) => x.id === id);
    if (idx === -1) return;

    const current = c.items[idx].notes || "";
    const notes = prompt("Notes:", current);
    if (notes === null) return;

    c.items[idx] = { ...c.items[idx], notes: notes.trim(), updatedAtISO: new Date().toISOString() };
    saveSkillsCategories(categories);
    renderSkills();
    toast("Notes saved");
    return;
  }

  // List buttons
  const btn = e.target.closest("button[data-skill-action]");
  if (!btn) return;

  const action = btn.getAttribute("data-skill-action");
  const cat = btn.getAttribute("data-cat");
  const id = btn.getAttribute("data-id");
  if (!action || !cat || !id) return;

  const categories = getSkillsCategories();
  const c = categories[cat];
  if (!c) return;

  const idx = (c.items || []).findIndex((x) => x.id === id);
  if (idx === -1) return;

  if (action === "delete") {
    if (!confirm("Delete this skill?")) return;
    c.items.splice(idx, 1);
    saveSkillsCategories(categories);
    renderSkills();
    toast("Skill deleted");
    return;
  }

  if (action === "notes") {
    const current = c.items[idx].notes || "";
    const notes = prompt("Notes:", current);
    if (notes === null) return;

    c.items[idx] = { ...c.items[idx], notes: notes.trim(), updatedAtISO: new Date().toISOString() };
    saveSkillsCategories(categories);
    renderSkills();
    toast("Notes saved");
  }
});

function renderSkills() {
  setSkillsBadgesAndSummary();
  renderSkillsList();
  renderSuggestions();
  renderMilestones();
  drawTrend();
}

// Wire chips once
wireSkillsFilterChips();
skillsSearch?.addEventListener("input", () => renderSkills());


  // =========================
  // GLOBAL SEARCH (Admin + Home + Skills)
  // =========================
  const globalSearch = document.getElementById("globalSearch");
  const globalResults = document.getElementById("globalResults");

  function setGlobalResultsOpen(open) {
    if (!globalResults) return;
    globalResults.hidden = !open;
  }

  function buildGlobalResults(q) {
    const query = q.trim().toLowerCase();
    if (!query) return [];

    const results = [];

    // Life Admin
    const items = loadItems();
    for (const it of items) {
      const hay = `${it.name} ${it.details || ""} ${it.dueDateISO || ""}`.toLowerCase();
      if (hay.includes(query)) {
        results.push({
          type: "admin",
          title: it.name,
          subtitle: it.dueDateISO ? `Due: ${it.dueDateISO}` : "No due date",
          id: it.id,
          score: 3,
        });
      }
    }

    // Home
    const rooms = getHomeRooms();
    for (const [rk, r] of Object.entries(rooms)) {
      const { essentials, extras } = roomItems(r);

      const scan = (arr, kind) => {
        for (const x of arr) {
          const hay = `${x.name} ${x.notes || ""}`.toLowerCase();
          if (hay.includes(query)) {
            results.push({
              type: "home",
              title: x.name,
              subtitle: `${r.title || rk} • ${kind}`,
              roomKey: rk,
              id: x.id,
              score: 2,
            });
          }
        }
      };

      scan(essentials, "Essentials");
      scan(extras, "Extras");
    }

    // Skills
    const categories = getSkillsCategories();
    for (const [cat, c] of Object.entries(categories)) {
      for (const s of c.items || []) {
        const hay = `${s.name} ${s.notes || ""}`.toLowerCase();
        if (hay.includes(query)) {
          results.push({
            type: "skills",
            title: s.name,
            subtitle: `${cat} • ${SKILL_LEVELS.find((l) => l.key === s.level)?.label || "Not started"}`,
            cat,
            id: s.id,
            score: 1,
          });
        }
      }
    }

    results.sort((a, b) => b.score - a.score || String(a.title).localeCompare(String(b.title)));
    return results.slice(0, 10);
  }

  function renderGlobalResults(q) {
    if (!globalResults) return;

    const res = buildGlobalResults(q);

    if (!q.trim()) {
      globalResults.innerHTML = "";
      setGlobalResultsOpen(false);
      return;
    }

    if (!res.length) {
      globalResults.innerHTML = `<div class="global-results__empty">No matches</div>`;
      setGlobalResultsOpen(true);
      return;
    }

    globalResults.innerHTML = res
      .map(
        (r) => `
          <button type="button" class="global-results__row"
            data-gs-type="${escapeHtml(r.type)}"
            data-gs-id="${escapeHtml(r.id)}"
            ${r.roomKey ? `data-gs-room="${escapeHtml(r.roomKey)}"` : ""}
            ${r.cat ? `data-gs-cat="${escapeHtml(r.cat)}"` : ""}>
            <div class="gr__title">${escapeHtml(r.title)}</div>
            <div class="gr__sub">${escapeHtml(r.subtitle)}</div>
          </button>
        `
      )
      .join("");

    setGlobalResultsOpen(true);
  }

  globalSearch?.addEventListener("input", () => renderGlobalResults(globalSearch.value));
  globalSearch?.addEventListener("focus", () => renderGlobalResults(globalSearch.value));

  document.addEventListener("click", (e) => {
    if (!globalResults || !globalSearch) return;
    const inside = globalResults.contains(e.target) || globalSearch.contains(e.target);
    if (!inside) setGlobalResultsOpen(false);
  });

  globalResults?.addEventListener("click", (e) => {
    const row = e.target.closest("button[data-gs-type]");
    if (!row) return;

    const type = row.getAttribute("data-gs-type");
    const id = row.getAttribute("data-gs-id");
    if (!type || !id) return;

    if (type === "admin") {
      const item = loadItems().find((x) => x.id === id);
      if (!item) return;
      setActiveView("admin");
      openModal("edit", item);
      setGlobalResultsOpen(false);
      return;
    }

    if (type === "home") {
      const roomKey = row.getAttribute("data-gs-room");
      if (!roomKey) return;

      setActiveView("home");
      renderHome();
      showRoomDetail(roomKey);

      setGlobalResultsOpen(false);
      return;
    }

    if (type === "skills") {
      setActiveView("skills");
      if (skillsSearch) {
        skillsSearch.value = row.querySelector(".gr__title")?.textContent || "";
        renderSkillsList();
      }
      setGlobalResultsOpen(false);
    }
  });

  // ============================================================
  // SECTION 5/5 — EXPORT/IMPORT + SAMPLE DATA + CLOUD + BOOT
  // ============================================================

  // =========================
  // EXPORT / IMPORT (JSON)
  // =========================
  const btnExport = document.getElementById("btnExport");
  const btnImportJson = document.getElementById("btnImportJson");
  const fileImport = document.getElementById("fileImport");

  function downloadJSON(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  btnExport?.addEventListener("click", () => {
    const store = loadStore();
    downloadJSON("life-admin-backup.json", store);
    toast("Exported backup JSON");
  });

  btnImportJson?.addEventListener("click", () => {
    if (!fileImport) {
      alert("Import control not found (missing #fileImport).");
      return;
    }
    fileImport.click();
  });

  fileImport?.addEventListener("change", async () => {
    const file = fileImport.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const store = normaliseStore(parsed);

      if (!confirm("Import this backup? This will overwrite your current data.")) {
        fileImport.value = "";
        return;
      }

      saveStore(store);
      fileImport.value = "";

      applyDefaultUIFromSettings();
      applyMoneyVisibilityFromSettings();
      renderAdmin();
      renderHome();
      renderSkills();

      toast("Import complete");
    } catch (err) {
      alert("Import failed. Make sure this is a valid JSON backup.\n\n" + (err?.message || err));
    }
  });

  // =========================
  // SAMPLE DATA
  // =========================
  btnSampleData?.addEventListener("click", () => {
    if (!confirm("Add sample data? (Won’t delete existing, just adds a few examples.)")) return;

    const store = loadStore();

    const nowISO = new Date().toISOString();
    const todayISO = toISODate(startOfToday());

    const sampleItems = [
      {
        id: uid(),
        category: "renewal",
        name: "Car insurance renewal",
        details: "Compare quotes • check auto-renew",
        dueDateISO: addDaysISO(todayISO, 18),
        reminderProfile: "gentle",
        priority: "high",
        archived: false,
        recurrence: "yearly",
        customDays: null,
        createdAtISO: nowISO,
        updatedAtISO: nowISO,
        doneCount: 0,
      },
      {
        id: uid(),
        category: "account",
        name: "Subscription review",
        details: "Cancel anything unused",
        dueDateISO: addDaysISO(todayISO, 14),
        reminderProfile: "gentle",
        priority: "normal",
        archived: false,
        recurrence: "custom",
        customDays: 90,
        createdAtISO: nowISO,
        updatedAtISO: nowISO,
        doneCount: 0,
      },
      {
        id: uid(),
        category: "vehicle",
        name: "MOT",
        details: "Book early for a convenient slot",
        dueDateISO: addDaysISO(todayISO, 33),
        reminderProfile: "careful",
        priority: "high",
        archived: false,
        recurrence: "yearly",
        customDays: null,
        createdAtISO: nowISO,
        updatedAtISO: nowISO,
        doneCount: 0,
      },
      {
        id: uid(),
        category: "info",
        name: "NI number / key docs",
        details: "Keep a secure note with where it’s stored",
        dueDateISO: null,
        reminderProfile: "gentle",
        priority: "normal",
        archived: false,
        recurrence: "none",
        customDays: null,
        createdAtISO: nowISO,
        updatedAtISO: nowISO,
        doneCount: 0,
      },
    ];

    store.lifeAdmin.items = normaliseItems([...(store.lifeAdmin.items || []), ...sampleItems]);

    if ((store.money.funds || []).length === 0) {
      const f1 = makeFund("Emergency fund");
      f1.priority = "high";
      f1.target = 2000;
      f1.current = 400;
      f1.monthlyGoal = 150;

      const f2 = makeFund("Holiday fund");
      f2.priority = "normal";
      f2.target = 1200;
      f2.current = 250;
      f2.monthlyGoal = 100;

      store.money.funds = normaliseFunds([f1, f2]);
    }

    if ((store.money.budgets || []).length === 0) {
      const b1 = makeBudget("Food");
      b1.priority = "high";
      b1.monthlyLimit = 300;

      const b2 = makeBudget("Transport");
      b2.priority = "normal";
      b2.monthlyLimit = 120;

      store.money.budgets = normaliseBudgets([b1, b2]);
    }

    const mk = currentMonthKey();
    const someDate = mk + "-05";
    const foodId = store.money.budgets.find((b) => b.name.toLowerCase() === "food")?.id || store.money.budgets[0]?.id;
    const transportId =
      store.money.budgets.find((b) => b.name.toLowerCase() === "transport")?.id || store.money.budgets[1]?.id;

    if (foodId) store.money.txns.push(makeTxn({ type: "spend", label: "Tesco", amount: 45.2, dateISO: someDate, budgetId: foodId }));
    if (transportId) store.money.txns.push(makeTxn({ type: "spend", label: "Fuel", amount: 35, dateISO: mk + "-08", budgetId: transportId }));

    store.money.txns = normaliseTxns(store.money.txns);

    const rooms = store.home.rooms || defaultRooms();
    const pick = (arr, name, cost) => {
      const it = arr.find((x) => (x.name || "").toLowerCase().includes(name.toLowerCase()));
      if (it) it.cost = cost;
      if (it) it.planned = true;
    };
    if (rooms.bedroom) {
      pick(rooms.bedroom.essentials, "mattress", 350);
      pick(rooms.bedroom.essentials, "bed", 400);
    }
    if (rooms.kitchen) pick(rooms.kitchen.extras, "air fryer", 120);
    store.home.rooms = rooms;

    saveStore(store);

    renderAdmin();
    renderHome();
    renderSkills();
    renderNextSteps(store.lifeAdmin.items);
    applyMoneyVisibilityFromSettings();

    toast("Sample data added");
  });

  // =========================
  // CLOUD SYNC (Firebase) — single-store (LS_STORE_KEY)
  // Requires window.__firebase = { auth, db, provider, doc, getDoc, setDoc, onAuthStateChanged, signInWithPopup, signOut, serverTimestamp }
  // =========================
  const btnLogin = document.getElementById("btnLogin");
  const btnLogout = document.getElementById("btnLogout");
  const btnPull = document.getElementById("btnPull");
  const btnPush = document.getElementById("btnPush");
  const cloudStatus = document.getElementById("cloudStatus");

  let fbUser = null;

  function cloudDocRef(uid) {
    const f = window.__firebase;
    return f.doc(f.db, "users", uid, "apps", "life-admin");
  }

  function setCloudUI(signedIn) {
    if (btnLogin) btnLogin.hidden = signedIn;
    if (btnLogout) btnLogout.hidden = !signedIn;
    if (btnPull) btnPull.hidden = !signedIn;
    if (btnPush) btnPush.hidden = !signedIn;

    if (cloudStatus) {
      cloudStatus.textContent = signedIn
        ? `Cloud: signed in • ${fbUser?.email || "account"}`
        : "Cloud: not signed in";
    }
  }

  async function cloudPull() {
    if (!fbUser) return alert("Please sign in first.");
    const f = window.__firebase;

    const snap = await f.getDoc(cloudDocRef(fbUser.uid));
    if (!snap.exists()) return alert("No cloud data yet. Push once to create it.");

    const data = snap.data();
    if (!data?.store) return alert("Cloud data exists but has no store payload.");

    const store = normaliseStore(data.store);
    saveStore(store);

    applyDefaultUIFromSettings();
    applyMoneyVisibilityFromSettings();
    renderAdmin();
    renderHome();
    renderSkills();

    alert("Pulled from cloud.");
  }

  async function cloudPush() {
    if (!fbUser) return alert("Please sign in first.");
    const f = window.__firebase;

    const store = loadStore();
    await f.setDoc(
      cloudDocRef(fbUser.uid),
      { updatedAt: f.serverTimestamp(), appVersion: "1.0", store },
      { merge: true }
    );

    alert("Pushed to cloud.");
  }

  function initFirebaseAuth() {
    const f = window.__firebase;
    if (!f) return;

    f.onAuthStateChanged(f.auth, (user) => {
      fbUser = user || null;
      setCloudUI(!!fbUser);
    });

    btnLogin?.addEventListener("click", async () => {
      try {
        await f.signInWithPopup(f.auth, f.provider);
      } catch (err) {
        alert("Sign-in failed: " + (err?.message || "unknown"));
      }
    });

    btnLogout?.addEventListener("click", async () => {
      try {
        await f.signOut(f.auth);
      } catch (err) {
        alert("Sign-out failed: " + (err?.message || "unknown"));
      }
    });

    btnPull?.addEventListener("click", () => cloudPull().catch((e) => alert(e?.message || e)));
    btnPush?.addEventListener("click", () => cloudPush().catch((e) => alert(e?.message || e)));

    setCloudUI(false);
  }
  /* =========================
   MONEY MODULE (LocalStorage)
   ========================= */

const MONEY_KEY = "lifeadmin_money_v1";

function moneyTodayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function moneyMonthKeyFromISO(dateISO) {
  if (!dateISO || typeof dateISO !== "string" || dateISO.length < 7) return null;
  return dateISO.slice(0, 7); // YYYY-MM
}

function moneyCurrentMonthKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function moneyUid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function moneyLoad() {
  try {
    const raw = localStorage.getItem(MONEY_KEY);
    if (!raw) {
      const m = moneyCurrentMonthKey();
      const init = { activeMonth: m, months: { [m]: { income: 0, budgets: [], funds: [], txns: [] } } };
      localStorage.setItem(MONEY_KEY, JSON.stringify(init));
      return init;
    }
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") throw new Error("Bad money store");
    if (!data.months) data.months = {};
    if (!data.activeMonth) data.activeMonth = moneyCurrentMonthKey();
    if (!data.months[data.activeMonth]) {
      data.months[data.activeMonth] = { income: 0, budgets: [], funds: [], txns: [] };
    }
    return data;
  } catch (e) {
    console.warn("Money store reset:", e);
    const m = moneyCurrentMonthKey();
    const init = { activeMonth: m, months: { [m]: { income: 0, budgets: [], funds: [], txns: [] } } };
    localStorage.setItem(MONEY_KEY, JSON.stringify(init));
    return init;
  }
}

function moneySave(store) {
  localStorage.setItem(MONEY_KEY, JSON.stringify(store));
}

function moneyEnsureMonth(store, monthKey) {
  if (!store.months[monthKey]) store.months[monthKey] = { income: 0, budgets: [], funds: [], txns: [] };
  return store.months[monthKey];
}

function fmtGBP(n) {
  const v = Number(n || 0);
  return v.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

function getMoneyEls() {
  return {
    moneyMonth: document.getElementById("moneyMonth"),
    moneyMonthBadge: document.getElementById("moneyMonthBadge"),
    btnSetIncome: document.getElementById("btnMoneySetIncome"),
    btnQuickAddTx: document.getElementById("btnMoneyQuickAddTx"),

    kpiIncome: document.getElementById("kpiIncome"),
    kpiBudgeted: document.getElementById("kpiBudgeted"),
    kpiSpent: document.getElementById("kpiSpent"),
    kpiRemaining: document.getElementById("kpiRemaining"),

    fundsBadge: document.getElementById("fundsBadge"),
    budgetsBadge: document.getElementById("budgetsBadge"),
    txBadge: document.getElementById("txBadge"),

    btnAddFund: document.getElementById("btnMoneyAddFund"),
    btnAddBudget: document.getElementById("btnMoneyAddBudget"),
    fundsList: document.getElementById("fundsList"),
    budgetsList: document.getElementById("budgetsList"),
    fundsEmpty: document.getElementById("fundsEmpty"),
    budgetsEmpty: document.getElementById("budgetsEmpty"),

    txMonthFilter: document.getElementById("txMonthFilter"),
    txCategoryFilter: document.getElementById("txCategoryFilter"),
    btnTxAdd: document.getElementById("btnTxAdd"),
    txTbody: document.getElementById("txTbody"),
    txEmpty: document.getElementById("txEmpty"),

    // Modals
    fundModal: document.getElementById("fundModal"),
    fundForm: document.getElementById("fundForm"),
    btnCloseFundModal: document.getElementById("btnCloseFundModal"),
    btnCancelFund: document.getElementById("btnCancelFund"),

    budgetModal: document.getElementById("budgetModal"),
    budgetForm: document.getElementById("budgetForm"),
    btnCloseBudgetModal: document.getElementById("btnCloseBudgetModal"),
    btnCancelBudget: document.getElementById("btnCancelBudget"),

    txModal: document.getElementById("txModal"),
    txForm: document.getElementById("txForm"),
    btnCloseTxModal: document.getElementById("btnCloseTxModal"),
    btnCancelTx: document.getElementById("btnCancelTx"),
  };
}

function modalOpen(modalEl) {
  if (!modalEl) return;
  modalEl.setAttribute("aria-hidden", "false");
  modalEl.classList.add("is-open");
}

function modalClose(modalEl) {
  if (!modalEl) return;
  modalEl.setAttribute("aria-hidden", "true");
  modalEl.classList.remove("is-open");
}

function moneyComputeMonthTotals(monthData) {
  const income = Number(monthData.income || 0);

  // Budgets: sum limits
  const budgeted = (monthData.budgets || []).reduce((sum, b) => sum + Number(b.limit || 0), 0);

  // Transactions: treat positive as spend, negative as income/returns
  const txns = monthData.txns || [];
  const spent = txns.reduce((sum, t) => {
    const a = Number(t.amount || 0);
    return sum + (a > 0 ? a : 0);
  }, 0);

  const netRemaining = income - spent;
  return { income, budgeted, spent, netRemaining };
}

function moneyRecalcBudgetSpentFromTxns(monthData) {
  const spentByCat = new Map();
  for (const t of monthData.txns || []) {
    const a = Number(t.amount || 0);
    if (!(a > 0)) continue;
    const cat = (t.category || "").trim() || "Uncategorised";
    spentByCat.set(cat, (spentByCat.get(cat) || 0) + a);
  }

  // Keep category spend aligned with transactions
  for (const b of monthData.budgets || []) {
    const cat = (b.name || "").trim();
    b.spent = spentByCat.get(cat) || 0;
  }
}

function moneyRender(store) {
  const els = getMoneyEls();
  if (!els.moneyMonth) return; // if view not present

  const active = store.activeMonth || moneyCurrentMonthKey();
  const monthData = moneyEnsureMonth(store, active);

  // Keep budgets.spent synced to txns
  moneyRecalcBudgetSpentFromTxns(monthData);

  // Month dropdown options = months present + current month
  const monthKeys = new Set(Object.keys(store.months || {}));
  monthKeys.add(moneyCurrentMonthKey());

  const sortedMonths = Array.from(monthKeys).sort(); // YYYY-MM sorts naturally
  els.moneyMonth.innerHTML = sortedMonths
    .map((m) => `<option value="${m}" ${m === active ? "selected" : ""}>${m}</option>`)
    .join("");

  // Month badge
  els.moneyMonthBadge.textContent = active === moneyCurrentMonthKey() ? "Current" : active;

  // KPIs
  const totals = moneyComputeMonthTotals(monthData);
  els.kpiIncome.textContent = fmtGBP(totals.income);
  els.kpiBudgeted.textContent = fmtGBP(totals.budgeted);
  els.kpiSpent.textContent = fmtGBP(totals.spent);
  els.kpiRemaining.textContent = fmtGBP(totals.netRemaining);

  // Funds
  const funds = monthData.funds || [];
  els.fundsBadge.textContent = String(funds.length);
  els.fundsEmpty.hidden = funds.length !== 0;
  els.fundsList.innerHTML = funds
    .slice()
    .sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "high" ? -1 : 1))
    .map((f) => {
      const target = Number(f.target || 0);
      const current = Number(f.current || 0);
      const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

      return `
        <li class="list__item">
          <div class="list__main">
            <div class="list__title">
              ${f.name || "Unnamed fund"}
              ${f.priority === "high" ? `<span class="badge badge--warn" style="margin-left:8px;">High</span>` : ""}
            </div>
            <div class="muted">${fmtGBP(current)} / ${fmtGBP(target)} • ${pct}%</div>
            ${f.targetDate ? `<div class="muted muted--small">Target date: ${f.targetDate}</div>` : ""}
            ${f.notes ? `<div class="muted muted--small">${f.notes}</div>` : ""}
          </div>
          <div class="list__actions">
            <button class="ghost-btn ghost-btn--sm" data-fund-edit="${f.id}">Edit</button>
            <button class="ghost-btn ghost-btn--sm" data-fund-del="${f.id}">Delete</button>
          </div>
        </li>
      `;
    })
    .join("");

  // Budgets
  const budgets = monthData.budgets || [];
  els.budgetsBadge.textContent = String(budgets.length);
  els.budgetsEmpty.hidden = budgets.length !== 0;

  els.budgetsList.innerHTML = budgets
    .slice()
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    .map((b) => {
      const lim = Number(b.limit || 0);
      const sp = Number(b.spent || 0);
      const left = lim - sp;
      const over = left < 0;

      return `
        <li class="list__item">
          <div class="list__main">
            <div class="list__title">${b.name || "Unnamed budget"}</div>
            <div class="muted">${fmtGBP(sp)} spent • ${fmtGBP(lim)} limit • ${over ? `<strong>${fmtGBP(Math.abs(left))} over</strong>` : `${fmtGBP(left)} left`}</div>
            ${b.notes ? `<div class="muted muted--small">${b.notes}</div>` : ""}
          </div>
          <div class="list__actions">
            <button class="ghost-btn ghost-btn--sm" data-budget-edit="${b.id}">Edit</button>
            <button class="ghost-btn ghost-btn--sm" data-budget-del="${b.id}">Delete</button>
          </div>
        </li>
      `;
    })
    .join("");

  // Transaction filters: month filter options
  els.txMonthFilter.innerHTML = sortedMonths
    .map((m) => `<option value="${m}" ${m === active ? "selected" : ""}>${m}</option>`)
    .join("");

  // Category filter options derived from budgets + txns
  const cats = new Set(["all"]);
  for (const b of budgets) cats.add((b.name || "").trim()).add;
  for (const t of monthData.txns || []) cats.add((t.category || "").trim() || "Uncategorised");
  const catList = Array.from(cats).filter(Boolean);

  // Preserve current selection if possible
  const prevCat = els.txCategoryFilter.value || "all";
  els.txCategoryFilter.innerHTML = [
    `<option value="all">All categories</option>`,
    ...catList
      .filter((c) => c !== "all")
      .sort((a, b) => a.localeCompare(b))
      .map((c) => `<option value="${c}">${c}</option>`),
  ].join("");
  if (catList.includes(prevCat)) els.txCategoryFilter.value = prevCat;

  // Transactions table
  const selectedMonth = els.txMonthFilter.value || active;
  const filterData = moneyEnsureMonth(store, selectedMonth);
  const category = els.txCategoryFilter.value || "all";

  const rows = (filterData.txns || [])
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .filter((t) => {
      const tcat = (t.category || "").trim() || "Uncategorised";
      return category === "all" ? true : tcat === category;
    });

  els.txBadge.textContent = String(rows.length);
  els.txEmpty.hidden = rows.length !== 0;

  els.txTbody.innerHTML = rows
    .map((t) => {
      const amt = Number(t.amount || 0);
      return `
        <tr>
          <td>${t.date || ""}</td>
          <td>${(t.category || "").trim() || "Uncategorised"}</td>
          <td>${t.note ? t.note : ""}</td>
          <td>${fmtGBP(amt)}</td>
          <td>
            <button class="ghost-btn ghost-btn--sm" data-tx-edit="${t.id}">Edit</button>
            <button class="ghost-btn ghost-btn--sm" data-tx-del="${t.id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  moneySave(store);
}

function moneyInit() {
  const els = getMoneyEls();
  if (!els.moneyMonth) return;

  let store = moneyLoad();

  // Month selector (top)
  els.moneyMonth.addEventListener("change", () => {
    store = moneyLoad();
    store.activeMonth = els.moneyMonth.value;
    moneyEnsureMonth(store, store.activeMonth);
    moneySave(store);
    moneyRender(store);
  });

  // Income
  els.btnSetIncome?.addEventListener("click", () => {
    store = moneyLoad();
    const month = store.activeMonth;
    const md = moneyEnsureMonth(store, month);
    const current = Number(md.income || 0);

    const raw = prompt(`Set income for ${month} (GBP)`, String(current || ""));
    if (raw === null) return;
    const val = Number(raw);
    if (!Number.isFinite(val) || val < 0) {
      alert("Please enter a valid non-negative number.");
      return;
    }
    md.income = val;
    moneySave(store);
    moneyRender(store);
  });

  // Open Fund modal
  function openFundModal(fund) {
    els.fundForm.reset();
    els.fundForm.elements.id.value = fund?.id || "";
    els.fundForm.elements.name.value = fund?.name || "";
    els.fundForm.elements.priority.value = fund?.priority || "normal";
    els.fundForm.elements.target.value = fund?.target ?? "";
    els.fundForm.elements.current.value = fund?.current ?? "";
    els.fundForm.elements.targetDate.value = fund?.targetDate || "";
    els.fundForm.elements.monthlyGoal.value = fund?.monthlyGoal ?? "";
    els.fundForm.elements.notes.value = fund?.notes || "";
    document.getElementById("fundModalTitle").textContent = fund ? "Edit Fund" : "Add Fund";
    modalOpen(els.fundModal);
  }

  els.btnAddFund?.addEventListener("click", () => {
    store = moneyLoad();
    openFundModal(null);
  });

  els.btnCloseFundModal?.addEventListener("click", () => modalClose(els.fundModal));
  els.btnCancelFund?.addEventListener("click", () => modalClose(els.fundModal));
  els.fundModal?.addEventListener("click", (e) => {
    if (e.target?.matches("[data-close]") || e.target === els.fundModal.querySelector(".modal__backdrop")) {
      modalClose(els.fundModal);
    }
  });

  els.fundForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    store = moneyLoad();
    const month = store.activeMonth;
    const md = moneyEnsureMonth(store, month);

    const id = els.fundForm.elements.id.value || moneyUid("fund");
    const payload = {
      id,
      name: els.fundForm.elements.name.value.trim(),
      priority: els.fundForm.elements.priority.value,
      target: Number(els.fundForm.elements.target.value || 0),
      current: Number(els.fundForm.elements.current.value || 0),
      targetDate: els.fundForm.elements.targetDate.value || "",
      monthlyGoal: Number(els.fundForm.elements.monthlyGoal.value || 0),
      notes: els.fundForm.elements.notes.value.trim(),
    };

    let prev = 0;
const existingIdx = (md.funds || []).findIndex((f) => f.id === id);
if (existingIdx >= 0) prev = Number(md.funds[existingIdx]?.current || 0);


    const idx = (md.funds || []).findIndex((f) => f.id === id);
    if (idx >= 0) md.funds[idx] = payload;
    else md.funds.push(payload);

    moneySave(store);
    const delta = Number(payload.current || 0) - prev;
if (delta > 0) logWin("saving", `Saved to fund: ${payload.name} (+${fmtGBP(delta)})`, delta);
else logWin("fund", `Fund saved: ${payload.name}`, 1);
    modalClose(els.fundModal);
    moneyRender(store);
  });

  // Budget modal
  function openBudgetModal(b) {
    els.budgetForm.reset();
    els.budgetForm.elements.id.value = b?.id || "";
    els.budgetForm.elements.name.value = b?.name || "";
    els.budgetForm.elements.limit.value = b?.limit ?? "";
    els.budgetForm.elements.spent.value = b?.spent ?? "";
    els.budgetForm.elements.notes.value = b?.notes || "";
    document.getElementById("budgetModalTitle").textContent = b ? "Edit Budget" : "Add Budget";
    modalOpen(els.budgetModal);
  }

  els.btnAddBudget?.addEventListener("click", () => {
    store = moneyLoad();
    openBudgetModal(null);
  });

  els.btnCloseBudgetModal?.addEventListener("click", () => modalClose(els.budgetModal));
  els.btnCancelBudget?.addEventListener("click", () => modalClose(els.budgetModal));
  els.budgetModal?.addEventListener("click", (e) => {
    if (e.target?.matches("[data-close]") || e.target === els.budgetModal.querySelector(".modal__backdrop")) {
      modalClose(els.budgetModal);
    }
  });

  els.budgetForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    store = moneyLoad();
    const month = store.activeMonth;
    const md = moneyEnsureMonth(store, month);

    const id = els.budgetForm.elements.id.value || moneyUid("bud");
    const name = els.budgetForm.elements.name.value.trim();
    const limit = Number(els.budgetForm.elements.limit.value || 0);

    if (!name) {
      alert("Please enter a category name.");
      return;
    }
    if (!Number.isFinite(limit) || limit < 0) {
      alert("Please enter a valid non-negative limit.");
      return;
    }

    const payload = {
      id,
      name,
      limit,
      // spent is derived from transactions; we store it for display but re-sync every render
      spent: Number(els.budgetForm.elements.spent.value || 0),
      notes: els.budgetForm.elements.notes.value.trim(),
    };

    const idx = (md.budgets || []).findIndex((x) => x.id === id);
    if (idx >= 0) md.budgets[idx] = payload;
    else md.budgets.push(payload);

    moneySave(store);
    modalClose(els.budgetModal);
    moneyRender(store);
  });

  // Transaction modal
  function openTxModal(tx) {
    els.txForm.reset();
    els.txForm.elements.id.value = tx?.id || "";
    els.txForm.elements.date.value = tx?.date || moneyTodayISO();
    els.txForm.elements.category.value = tx?.category || "";
    els.txForm.elements.amount.value = tx?.amount ?? "";
    els.txForm.elements.note.value = tx?.note || "";
    document.getElementById("txModalTitle").textContent = tx ? "Edit Transaction" : "Add Transaction";
    modalOpen(els.txModal);
  }

  function openTxAdd() {
    store = moneyLoad();
    // default month = active month; date defaults today
    openTxModal(null);
  }

  els.btnTxAdd?.addEventListener("click", openTxAdd);
  els.btnQuickAddTx?.addEventListener("click", openTxAdd);

  els.btnCloseTxModal?.addEventListener("click", () => modalClose(els.txModal));
  els.btnCancelTx?.addEventListener("click", () => modalClose(els.txModal));
  els.txModal?.addEventListener("click", (e) => {
    if (e.target?.matches("[data-close]") || e.target === els.txModal.querySelector(".modal__backdrop")) {
      modalClose(els.txModal);
    }
  });

  els.txForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    store = moneyLoad();

    const id = els.txForm.elements.id.value || moneyUid("tx");
    const date = els.txForm.elements.date.value;
    const monthKey = moneyMonthKeyFromISO(date) || store.activeMonth;
    const md = moneyEnsureMonth(store, monthKey);

    const category = els.txForm.elements.category.value.trim();
    const amount = Number(els.txForm.elements.amount.value);
    const note = els.txForm.elements.note.value.trim();

    if (!date) return alert("Please choose a date.");
    if (!category) return alert("Please enter a category.");
    if (!Number.isFinite(amount)) return alert("Please enter a valid amount.");

    const payload = { id, date, category, amount, note };

    const idx = (md.txns || []).findIndex((t) => t.id === id);
    if (idx >= 0) md.txns[idx] = payload;
    else md.txns.push(payload);

    logWin("txn", `Transaction saved: ${category} (${fmtGBP(amount)})`, 1);

    moneySave(store);
    modalClose(els.txModal);

    // Keep user on the active month if they added tx in that month
    store.activeMonth = store.activeMonth || moneyCurrentMonthKey();
    moneyRender(store);
  });

  // Filters refresh
  els.txMonthFilter?.addEventListener("change", () => {
    store = moneyLoad();
    moneyRender(store);
  });
  els.txCategoryFilter?.addEventListener("change", () => {
    store = moneyLoad();
    moneyRender(store);
  });

  // Delegated actions (edit/delete)
  document.addEventListener("click", (e) => {
    const t = e.target;

    // Funds
    const fundEdit = t?.getAttribute?.("data-fund-edit");
    const fundDel = t?.getAttribute?.("data-fund-del");
    if (fundEdit || fundDel) {
      store = moneyLoad();
      const md = moneyEnsureMonth(store, store.activeMonth);

      if (fundEdit) {
        const f = (md.funds || []).find((x) => x.id === fundEdit);
        openFundModal(f || null);
      } else if (fundDel) {
        if (!confirm("Delete this fund?")) return;
        md.funds = (md.funds || []).filter((x) => x.id !== fundDel);
        moneySave(store);
        moneyRender(store);
      }
      return;
    }

    // Budgets
    const budEdit = t?.getAttribute?.("data-budget-edit");
    const budDel = t?.getAttribute?.("data-budget-del");
    if (budEdit || budDel) {
      store = moneyLoad();
      const md = moneyEnsureMonth(store, store.activeMonth);

      if (budEdit) {
        const b = (md.budgets || []).find((x) => x.id === budEdit);
        openBudgetModal(b || null);
      } else if (budDel) {
        if (!confirm("Delete this budget?")) return;
        md.budgets = (md.budgets || []).filter((x) => x.id !== budDel);
        moneySave(store);
        moneyRender(store);
      }
      return;
    }

    // Transactions
    const txEdit = t?.getAttribute?.("data-tx-edit");
    const txDel = t?.getAttribute?.("data-tx-del");
    if (txEdit || txDel) {
      store = moneyLoad();

      // tx might be in the currently filtered month (txMonthFilter), so look there first
      const monthKey = els.txMonthFilter?.value || store.activeMonth;
      const md = moneyEnsureMonth(store, monthKey);

      if (txEdit) {
        const tx = (md.txns || []).find((x) => x.id === txEdit);
        openTxModal(tx || null);
      } else if (txDel) {
        if (!confirm("Delete this transaction?")) return;
        md.txns = (md.txns || []).filter((x) => x.id !== txDel);
        moneySave(store);
        moneyRender(store);
      }
      return;
    }
  });

  // Initial render
  moneyRender(store);
}

// Call this once when app boots
document.addEventListener("DOMContentLoaded", () => {
  moneyInit();
});


// ✅ PASTE OPTION A HERE (RIGHT HERE)

function repairSkillsStructure() {
  const store = loadStore();

  if (!store.skills || typeof store.skills !== "object") store.skills = {};
  if (!store.skills.categories || typeof store.skills.categories !== "object") {
    store.skills.categories = defaultSkills();
  }

  for (const [catName, catObj] of Object.entries(store.skills.categories)) {
    if (!catObj || typeof catObj !== "object") {
      store.skills.categories[catName] = { category: catName, items: [] };
      continue;
    }

    catObj.category = String(catObj.category || catName);
    catObj.items = Array.isArray(catObj.items) ? catObj.items : [];

    catObj.items = catObj.items
      .map((it) => ({
        id: String(it?.id ?? uid()),
        name: String(it?.name ?? "").trim() || "Unnamed",
        level: ["ns", "l1", "l2", "l3", "l4", "l5"].includes(it?.level) ? it.level : "ns",
        notes: String(it?.notes ?? ""),
        createdAtISO: String(it?.createdAtISO ?? new Date().toISOString()),
        updatedAtISO: String(it?.updatedAtISO ?? new Date().toISOString()),
      }))
      .filter((it) => it.name.trim());
  }

  saveStore(store);
}

  // =========================
  // BOOT
  // =========================
  function boot() {
  let store = loadStore();

  // ✅ FIX SKILLS STRUCTURE FIRST
  repairSkillsStructure();

  // Reload after repair
  store = loadStore();

  saveStore(store);

  applyDefaultUIFromSettings();
  applyMoneyVisibilityFromSettings();

  setActiveView("admin");

  renderAdmin();
  renderHome();
  renderSkills();   // ...
  renderNextSteps(store.lifeAdmin.items);

  initFirebaseAuth();

  toast("Ready");
}


  boot();

})(); // end IIFE