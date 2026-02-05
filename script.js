(() => {
  "use strict";

  // =========================
  // ROUTER (Admin/Home/Skills)
  // =========================
  const navButtons = Array.from(document.querySelectorAll(".nav__item"));
  const views = {
    admin: document.getElementById("view-admin"),
    home: document.getElementById("view-home"),
    skills: document.getElementById("view-skills"),
  };

  // Simple dev-friendly error surfacing (remove later if you want)
  window.addEventListener("error", (e) => {
    alert("JS Error: " + (e.message || "unknown"));
  });
  window.addEventListener("unhandledrejection", (e) => {
    alert("Promise Error: " + (e.reason?.message || e.reason || "unknown"));
  });

  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  const btnMenu = document.getElementById("btnMenu");
  const sidebar = document.querySelector(".sidebar");

  const viewMeta = {
    admin: { title: "Life Admin", subtitle: "Keep your real-world life organised with calm, smart nudges." },
    home: { title: "Future Home", subtitle: "Plan furniture essentials first, then extras when you're ready." },
    skills: { title: "Life Skills", subtitle: "Everyday living skills with progress you can actually see." },
  };

  function setActiveView(viewKey) {
    navButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.view === viewKey));
    Object.keys(views).forEach((k) => views[k]?.classList.toggle("is-visible", k === viewKey));
    if (pageTitle) pageTitle.textContent = viewMeta[viewKey]?.title ?? "Life Admin";
    if (pageSubtitle) pageSubtitle.textContent = viewMeta[viewKey]?.subtitle ?? "";
    sidebar?.classList.remove("is-open");
  }

  navButtons.forEach((btn) => btn.addEventListener("click", () => setActiveView(btn.dataset.view)));
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
        ["Storage boxes", "Label maker", "Extra shelves", "Bike rack / wall mounts"]
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

        return {
          id: String(f?.id ?? uid()),
          name,
          priority: ["normal", "high"].includes(f?.priority) ? f.priority : "normal",
          target: Number.isFinite(target) && target >= 0 ? target : 0,
          current: Number.isFinite(current) && current >= 0 ? current : 0,
          monthlyGoal: Number.isFinite(monthlyGoal) && monthlyGoal >= 0 ? monthlyGoal : 0,
          notes: String(f?.notes ?? ""),
          createdAtISO: String(f?.createdAtISO ?? nowISO),
          updatedAtISO: String(f?.updatedAtISO ?? nowISO),
        };
      })
      .filter(Boolean);
  }

  function normaliseStore(s) {
    const base = defaultStore();

    base.lifeAdmin.items = normaliseItems(Array.isArray(s?.lifeAdmin?.items) ? s.lifeAdmin.items : []);

    base.money = {
      currency: String(s?.money?.currency ?? "GBP"),
      funds: normaliseFunds(s?.money?.funds),
      budgets: normaliseBudgets(s?.money?.budgets),
      txns: normaliseTxns(s?.money?.txns),
      paydayISO: (s?.money?.paydayISO && /^\d{4}-\d{2}-\d{2}$/.test(String(s.money.paydayISO)))
        ? String(s.money.paydayISO)
        : null,
    };

    base.settings = normaliseSettings(s?.settings);

    base.home.rooms = s?.home?.rooms ?? base.home.rooms;
    base.skills.categories = s?.skills?.categories ?? base.skills.categories;

    base.version = 2;
    return base;
  }

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
  // MONEY FORMATTERS (KEEP ONCE)
  // =========================
  function currencySymbol(code) {
    if (code === "EUR") return "€";
    if (code === "USD") return "$";
    return "£";
  }

  function fmtMoney(n) {
    const store = loadStore();
    const code = String(store.money?.currency ?? "GBP");
    const sym = currencySymbol(code);

    const x = Number(n ?? 0);
    const safe = Number.isFinite(x) ? x : 0;
    return sym + safe.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function fmtGBP(n) {
    return fmtMoney(n);
  }

  function monthKeyFromISO(dateISO) {
    return String(dateISO).slice(0, 7);
  }

  function currentMonthKey() {
    return monthKeyFromISO(toISODate(startOfToday()));
  }

  (() => {
  "use strict";

  // =========================
  // ROUTER (Admin/Home/Skills)
  // =========================
  const navButtons = Array.from(document.querySelectorAll(".nav__item"));
  const views = {
    admin: document.getElementById("view-admin"),
    home: document.getElementById("view-home"),
    skills: document.getElementById("view-skills"),
  };

  // Simple dev-friendly error surfacing (remove later if you want)
  window.addEventListener("error", (e) => {
    alert("JS Error: " + (e.message || "unknown"));
  });
  window.addEventListener("unhandledrejection", (e) => {
    alert("Promise Error: " + (e.reason?.message || e.reason || "unknown"));
  });

  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  const btnMenu = document.getElementById("btnMenu");
  const sidebar = document.querySelector(".sidebar");

  const viewMeta = {
    admin: { title: "Life Admin", subtitle: "Keep your real-world life organised with calm, smart nudges." },
    home: { title: "Future Home", subtitle: "Plan furniture essentials first, then extras when you're ready." },
    skills: { title: "Life Skills", subtitle: "Everyday living skills with progress you can actually see." },
  };

  function setActiveView(viewKey) {
    navButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.view === viewKey));
    Object.keys(views).forEach((k) => views[k]?.classList.toggle("is-visible", k === viewKey));
    if (pageTitle) pageTitle.textContent = viewMeta[viewKey]?.title ?? "Life Admin";
    if (pageSubtitle) pageSubtitle.textContent = viewMeta[viewKey]?.subtitle ?? "";
    sidebar?.classList.remove("is-open");
  }

  navButtons.forEach((btn) => btn.addEventListener("click", () => setActiveView(btn.dataset.view)));
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
        ["Storage boxes", "Label maker", "Extra shelves", "Bike rack / wall mounts"]
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

        return {
          id: String(f?.id ?? uid()),
          name,
          priority: ["normal", "high"].includes(f?.priority) ? f.priority : "normal",
          target: Number.isFinite(target) && target >= 0 ? target : 0,
          current: Number.isFinite(current) && current >= 0 ? current : 0,
          monthlyGoal: Number.isFinite(monthlyGoal) && monthlyGoal >= 0 ? monthlyGoal : 0,
          notes: String(f?.notes ?? ""),
          createdAtISO: String(f?.createdAtISO ?? nowISO),
          updatedAtISO: String(f?.updatedAtISO ?? nowISO),
        };
      })
      .filter(Boolean);
  }

  function normaliseStore(s) {
    const base = defaultStore();

    base.lifeAdmin.items = normaliseItems(Array.isArray(s?.lifeAdmin?.items) ? s.lifeAdmin.items : []);

    base.money = {
      currency: String(s?.money?.currency ?? "GBP"),
      funds: normaliseFunds(s?.money?.funds),
      budgets: normaliseBudgets(s?.money?.budgets),
      txns: normaliseTxns(s?.money?.txns),
      paydayISO: (s?.money?.paydayISO && /^\d{4}-\d{2}-\d{2}$/.test(String(s.money.paydayISO)))
        ? String(s.money.paydayISO)
        : null,
    };

    base.settings = normaliseSettings(s?.settings);

    base.home.rooms = s?.home?.rooms ?? base.home.rooms;
    base.skills.categories = s?.skills?.categories ?? base.skills.categories;

    base.version = 2;
    return base;
  }

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
  // MONEY FORMATTERS (KEEP ONCE)
  // =========================
  function currencySymbol(code) {
    if (code === "EUR") return "€";
    if (code === "USD") return "$";
    return "£";
  }

  function fmtMoney(n) {
    const store = loadStore();
    const code = String(store.money?.currency ?? "GBP");
    const sym = currencySymbol(code);

    const x = Number(n ?? 0);
    const safe = Number.isFinite(x) ? x : 0;
    return sym + safe.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function fmtGBP(n) {
    return fmtMoney(n);
  }

  function monthKeyFromISO(dateISO) {
    return String(dateISO).slice(0, 7);
  }

  function currentMonthKey() {
    return monthKeyFromISO(toISODate(startOfToday()));
  }

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
      items[idx] = { ...items[idx], category, name, dueDateISO, details, reminderProfile, priority, recurrence, customDays, updatedAtISO: nowISO };
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
        a.badge.cls.includes("danger") ? "list__item--red" :
        a.badge.cls.includes("warn") ? "list__item--amber" :
        "list__item--green";

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
  // NEXT STEPS (Part D)
  // =========================
  function buildNextSteps() {
    const today = [];
    const week = [];

    // ---- LIFE ADMIN ----
    const adminItems = loadItems().filter((i) => !i.archived);
    for (const it of adminItems) {
      const d = daysUntil(it.dueDateISO);
      if (d === null) continue;

      if (d < 0 || d <= 1) {
        today.push({
          source: "admin",
          id: it.id,
          title: it.name,
          meta: fmtDueText(d),
          hint: gentleNudge(it, d),
          tag: "Life Admin",
          score: 200 + (it.priority === "high" ? 20 : 0) + (d < 0 ? 40 : 0),
        });
        continue;
      }

      if (d <= 7 || (it.priority === "high" && d <= 14)) {
        week.push({
          source: "admin",
          id: it.id,
          title: it.name,
          meta: fmtDueText(d),
          hint: gentleNudge(it, d),
          tag: "Life Admin",
          score: 140 + (it.priority === "high" ? 20 : 0) + Math.max(0, 20 - d),
        });
      }
    }

    // ---- MONEY (Budgets + Payday) ----
    try {
      const store = loadStore();
      const budgets = store.money.budgets || [];
      const mk = currentMonthKey();

      for (const b of budgets) {
        const limit = Number(b.monthlyLimit || 0);
        if (limit <= 0) continue;

        const spent = (store.money.txns || [])
          .filter(t => t.type === "spend" && t.budgetId === b.id && monthKeyFromISO(t.dateISO) === mk)
          .reduce((acc, t) => acc + Number(t.amount || 0), 0);

        if (spent > limit) {
          today.push({
            source: "admin",
            id: `overspend_${b.id}`,
            title: `Budget overspent: ${b.name}`,
            meta: `${fmtMoney(spent)} / ${fmtMoney(limit)}`,
            hint: "No panic — even one small adjustment helps (pause one optional spend).",
            tag: "Money",
            score: 220 + (b.priority === "high" ? 20 : 0),
          });
        } else if (spent > limit * 0.85) {
          week.push({
            source: "admin",
            id: `near_${b.id}`,
            title: `Budget nearly full: ${b.name}`,
            meta: `${fmtMoney(spent)} / ${fmtMoney(limit)}`,
            hint: "You’re close to the limit — worth keeping an eye on this week.",
            tag: "Money",
            score: 130 + (b.priority === "high" ? 10 : 0),
          });
        }
      }

      if (store.money.paydayISO) {
        const d = daysUntil(store.money.paydayISO);
        if (d !== null && d >= 0 && d <= 3) {
          week.push({
            source: "admin",
            id: "payday",
            title: "Payday coming up",
            meta: fmtDueText(d),
            hint: "Quick plan: bills → savings → fun money. Even a rough split helps.",
            tag: "Money",
            score: 125,
          });
        }
      }
    } catch {}

    // (Home + Skills next steps are in later sections; kept synced via renderNextSteps calls)

    const sortDesc = (a, b) => b.score - a.score;
    today.sort(sortDesc);
    week.sort(sortDesc);

    return {
      today: today.slice(0, 4),
      week: week.slice(0, 6),
    };
  }

  function renderNextSteps() {
    if (!nextStepsToday || !nextStepsWeek) return;

    const { today, week } = buildNextSteps();

    if (badgeNextSteps) {
      const total = today.length + week.length;
      badgeNextSteps.className = total ? "badge badge--warn" : "badge badge--ok";
      badgeNextSteps.textContent = total ? `${total} suggested` : "Clear";
    }

    nextStepsToday.innerHTML = "";
    if (!today.length) emptyNextToday?.removeAttribute("hidden");
    else emptyNextToday?.setAttribute("hidden", "true");

    for (const t of today) {
      const li = document.createElement("li");
      li.className = "list__item list__item--amber";
      li.innerHTML = `
        <div class="list__main">
          <div class="list__title">${escapeHtml(t.title)}</div>
          <div class="list__meta">${escapeHtml(t.meta)} • ${escapeHtml(t.hint)}</div>
        </div>
        <div class="row-actions">
          <button class="mini-btn" type="button" data-ns-action="openAdmin" data-id="${escapeHtml(t.id)}">Open</button>
          <span class="nextstep-tag">${escapeHtml(t.tag)}</span>
        </div>
      `;
      nextStepsToday.appendChild(li);
    }

    nextStepsWeek.innerHTML = "";
    if (!week.length) emptyNextWeek?.removeAttribute("hidden");
    else emptyNextWeek?.setAttribute("hidden", "true");

    for (const t of week) {
      const li = document.createElement("li");
      li.className = "list__item list__item--green";
      li.innerHTML = `
        <div class="list__main">
          <div class="list__title">${escapeHtml(t.title)}</div>
          <div class="list__meta">${escapeHtml(t.meta)} • ${escapeHtml(t.hint)}</div>
        </div>
        <div class="row-actions">
          <button class="mini-btn" type="button" data-ns-action="openAdmin" data-id="${escapeHtml(t.id)}">Open</button>
          <span class="nextstep-tag">${escapeHtml(t.tag)}</span>
        </div>
      `;
      nextStepsWeek.appendChild(li);
    }
  }

  // =========================
  // FUNDS (Money)
  // =========================
  function fundProgress(f) {
    const target = Number(f.target ?? 0);
    const current = Number(f.current ?? 0);
    if (!Number.isFinite(target) || target <= 0) return { pct: 0, label: `${fmtGBP(current)} / (no target)` };
    const pct = Math.max(0, Math.min(100, (current / target) * 100));
    return { pct, label: `${fmtGBP(current)} / ${fmtGBP(target)} (${Math.round(pct)}%)` };
  }

  function monthsToTarget(f) {
    const target = Number(f.target ?? 0);
    const current = Number(f.current ?? 0);
    const monthly = Number(f.monthlyGoal ?? 0);

    if (!Number.isFinite(target) || target <= 0) return null;
    if (!Number.isFinite(monthly) || monthly <= 0) return null;
    if (current >= target) return 0;

    const remaining = Math.max(0, target - current);
    return Math.ceil(remaining / monthly);
  }

  function renderMoney() {
    const store = loadStore();
    const funds = store.money.funds ?? [];

    if (badgeMoney) {
      if (!funds.length) {
        badgeMoney.className = "badge badge--neutral";
        badgeMoney.textContent = "Empty";
      } else {
        const high = funds.filter((f) => f.priority === "high").length;
        badgeMoney.className = high > 0 ? "badge badge--warn" : "badge badge--ok";
        badgeMoney.textContent = `${funds.length} fund${funds.length === 1 ? "" : "s"}`;
      }
    }

    if (moneySummary) {
      const total = funds.reduce((acc, f) => acc + Number(f.current ?? 0), 0);
      const totalTargets = funds.reduce((acc, f) => acc + Number(f.target ?? 0), 0);

      moneySummary.innerHTML = `
        <span class="money-chip">Total saved: <strong>${fmtGBP(total)}</strong></span>
        <span class="money-chip">Total targets: <strong>${fmtGBP(totalTargets)}</strong></span>
        <span class="money-chip">Funds: <strong>${funds.length}</strong></span>
      `;
    }

    if (!listMoneyFunds) return;

    listMoneyFunds.innerHTML = "";

    if (!funds.length) {
      emptyMoneyFunds?.removeAttribute("hidden");
      return;
    }
    emptyMoneyFunds?.setAttribute("hidden", "true");

    const sorted = [...funds].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
      return String(a.name).localeCompare(String(b.name));
    });

    for (const f of sorted) {
      const prog = fundProgress(f);
      const monthly = Number(f.monthlyGoal ?? 0);
      const monthlyText = monthly > 0 ? `Monthly goal: ${fmtMoney(monthly)}` : "Monthly goal: —";

      const eta = monthsToTarget(f);
      const etaText = eta === null ? "" : eta === 0 ? "Target reached 🎉" : `ETA: ~${eta} month${eta === 1 ? "" : "s"}`;

      const li = document.createElement("li");
      li.className = "list__item list__item--neutral";
      li.innerHTML = `
        <div class="fund-row" style="width:100%;">
          <div class="fund-top">
            <div class="fund-meta">
              <div class="fund-name">${escapeHtml(f.name)}</div>
              <div class="fund-sub">
                ${escapeHtml(prog.label)} • ${escapeHtml(monthlyText)}${etaText ? " • " + escapeHtml(etaText) : ""}
              </div>
            </div>
            <div class="fund-actions">
              <button class="mini-btn" type="button" data-fund-action="deposit" data-id="${f.id}">Deposit</button>
              <button class="mini-btn" type="button" data-fund-action="withdraw" data-id="${f.id}">Withdraw</button>
              <button class="mini-btn" type="button" data-fund-action="edit" data-id="${f.id}">Edit</button>
              <button class="mini-btn mini-btn--danger" type="button" data-fund-action="delete" data-id="${f.id}">Delete</button>
            </div>
          </div>

          <div class="progress">
            <div class="progress__bar" style="width:${prog.pct}%"></div>
          </div>

          ${f.notes ? `<div class="fund-sub">${escapeHtml(f.notes)}</div>` : ``}
        </div>
      `;
      listMoneyFunds.appendChild(li);
    }
  }

  // Fund save
  fundForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = fundForm.name.value.trim();
    if (!name) {
      alert("Please enter a fund name.");
      fundForm.name.focus();
      return;
    }

    const priority = fundForm.priority.value;
    const target = Number(fundForm.target.value || 0);
    const current = Number(fundForm.current.value || 0);
    const monthlyGoal = Number(fundForm.monthlyGoal.value || 0);
    const notes = fundForm.notes.value.trim();

    const store = loadStore();
    const nowISO = new Date().toISOString();

    if (editingFundId) {
      const idx = store.money.funds.findIndex((f) => f.id === editingFundId);
      if (idx === -1) {
        alert("That fund couldn't be found.");
        closeFundModal();
        return;
      }
      store.money.funds[idx] = {
        ...store.money.funds[idx],
        name,
        priority,
        target: Number.isFinite(target) && target >= 0 ? target : 0,
        current: Number.isFinite(current) && current >= 0 ? current : 0,
        monthlyGoal: Number.isFinite(monthlyGoal) && monthlyGoal >= 0 ? monthlyGoal : 0,
        notes,
        updatedAtISO: nowISO,
      };
    } else {
      const f = makeFund(name);
      f.priority = priority;
      f.target = Number.isFinite(target) && target >= 0 ? target : 0;
      f.current = Number.isFinite(current) && current >= 0 ? current : 0;
      f.monthlyGoal = Number.isFinite(monthlyGoal) && monthlyGoal >= 0 ? monthlyGoal : 0;
      f.notes = notes;
      f.createdAtISO = nowISO;
      f.updatedAtISO = nowISO;
      store.money.funds.push(f);
    }

    store.money.funds = normaliseFunds(store.money.funds);
    saveStore(store);
    renderMoney();
    renderNextSteps();
    closeFundModal();
  });

  // Fund actions (ONE listener on admin view)
  document.getElementById("view-admin")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-fund-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-fund-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    const store = loadStore();
    const idx = store.money.funds.findIndex((f) => f.id === id);
    if (idx === -1) return;

    const fund = store.money.funds[idx];

    if (action === "edit") return openFundModal("edit", fund);

    if (action === "delete") {
      if (!confirm("Delete this fund?")) return;
      store.money.funds.splice(idx, 1);
      store.money.funds = normaliseFunds(store.money.funds);
      saveStore(store);
      renderMoney();
      renderNextSteps();
      return;
    }

    if (action === "deposit" || action === "withdraw") {
      const label = action === "deposit" ? "Deposit amount" : "Withdraw amount";
      const raw = prompt(`${label} (${currencySymbol(store.money.currency)}):`, "");
      if (raw === null) return;

      const amt = Number(raw);
      if (!Number.isFinite(amt) || amt <= 0) {
        alert("Please enter a positive number.");
        return;
      }

      const next =
        action === "deposit"
          ? Number(fund.current ?? 0) + amt
          : Math.max(0, Number(fund.current ?? 0) - amt);

      store.money.funds[idx] = { ...fund, current: next, updatedAtISO: new Date().toISOString() };
      store.money.funds = normaliseFunds(store.money.funds);
      saveStore(store);

      // Optional: log txn
      store.money.txns.push(makeTxn({
        type: action === "deposit" ? "deposit" : "withdraw",
        label: `${action === "deposit" ? "Deposit" : "Withdraw"}: ${fund.name}`,
        amount: amt,
        dateISO: toISODate(startOfToday()),
        fundId: fund.id,
      }));
      store.money.txns = normaliseTxns(store.money.txns);
      saveStore(store);

      renderMoney();
      renderMoneyTxns();
      renderNextSteps();
    }
  });

  // =========================
  // BUDGETS + TXNS (Money)
  // =========================
  let editingBudgetId = null;

  function budgetSpendThisMonth(store, budgetId) {
    const mk = currentMonthKey();
    return (store.money.txns || [])
      .filter(t => t.type === "spend" && t.budgetId === budgetId && monthKeyFromISO(t.dateISO) === mk)
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }

  function openBudgetModal(mode, budget = null) {
    editingBudgetId = mode === "edit" ? (budget?.id ?? null) : null;

    // fallback prompts if modal not present
    if (!budgetModal || !budgetForm) {
      const name = prompt("Budget name (e.g., Food / Petrol):", budget?.name ?? "");
      if (name === null) return;

      const limitRaw = prompt("Monthly limit:", String(Number(budget?.monthlyLimit ?? 0)));
      if (limitRaw === null) return;

      const notes = prompt("Notes (optional):", budget?.notes ?? "");
      if (notes === null) return;

      const store = loadStore();
      const nowISO = new Date().toISOString();
      const monthlyLimit = Number(limitRaw);

      if (!Number.isFinite(monthlyLimit) || monthlyLimit < 0) {
        alert("Monthly limit must be 0 or a positive number.");
        return;
      }

      if (editingBudgetId) {
        const idx = store.money.budgets.findIndex(b => b.id === editingBudgetId);
        if (idx === -1) return;
        store.money.budgets[idx] = {
          ...store.money.budgets[idx],
          name: name.trim() || store.money.budgets[idx].name,
          monthlyLimit,
          notes: notes.trim(),
          updatedAtISO: nowISO,
        };
      } else {
        const b = makeBudget(name.trim() || "Budget");
        b.monthlyLimit = monthlyLimit;
        b.notes = notes.trim();
        b.updatedAtISO = nowISO;
        store.money.budgets.push(b);
      }

      store.money.budgets = normaliseBudgets(store.money.budgets);
      saveStore(store);
      renderBudgets();
      renderMoneyTxns();
      renderNextSteps();
      return;
    }

    if (budgetModalTitle) budgetModalTitle.textContent = mode === "edit" ? "Edit Budget" : "Add Budget";
    budgetForm.reset();

    budgetForm.id.value = budget?.id ?? "";
    budgetForm.name.value = budget?.name ?? "";
    budgetForm.priority.value = budget?.priority ?? "normal";
    budgetForm.monthlyLimit.value = budget?.monthlyLimit != null ? String(budget.monthlyLimit) : "";
    budgetForm.notes.value = budget?.notes ?? "";

    budgetModal.setAttribute("aria-hidden", "false");
    budgetModal.classList.add("is-open");
    budgetForm.name?.focus?.();
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

  budgetForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = budgetForm.name.value.trim();
    if (!name) {
      alert("Please enter a budget name.");
      budgetForm.name.focus();
      return;
    }

    const priority = budgetForm.priority.value === "high" ? "high" : "normal";
    const monthlyLimit = Number(budgetForm.monthlyLimit.value || 0);
    if (!Number.isFinite(monthlyLimit) || monthlyLimit < 0) {
      alert("Monthly limit must be 0 or a positive number.");
      budgetForm.monthlyLimit.focus();
      return;
    }

    const notes = budgetForm.notes.value.trim();
    const store = loadStore();
    const nowISO = new Date().toISOString();

    if (editingBudgetId) {
      const idx = store.money.budgets.findIndex(b => b.id === editingBudgetId);
      if (idx === -1) {
        alert("Budget not found.");
        closeBudgetModal();
        return;
      }
      store.money.budgets[idx] = { ...store.money.budgets[idx], name, priority, monthlyLimit, notes, updatedAtISO: nowISO };
    } else {
      const b = makeBudget(name);
      b.priority = priority;
      b.monthlyLimit = monthlyLimit;
      b.notes = notes;
      b.createdAtISO = nowISO;
      b.updatedAtISO = nowISO;
      store.money.budgets.push(b);
    }

    store.money.budgets = normaliseBudgets(store.money.budgets);
    saveStore(store);

    renderBudgets();
    renderMoneyTxns();
    renderNextSteps();
    closeBudgetModal();
  });

  function addSpendPrompt(budgetId) {
    const store = loadStore();
    const budget = store.money.budgets.find(b => b.id === budgetId);
    if (!budget) return;

    const label = prompt(`Spend label for "${budget.name}" (e.g., Tesco / Fuel):`, "");
    if (label === null) return;

    const amtRaw = prompt("Amount:", "");
    if (amtRaw === null) return;
    const amt = Number(amtRaw);
    if (!Number.isFinite(amt) || amt <= 0) {
      alert("Please enter a positive number.");
      return;
    }

    const dateISO = (prompt("Date (YYYY-MM-DD) — leave blank for today:", "") || toISODate(startOfToday())).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
      alert("Please use YYYY-MM-DD format.");
      return;
    }

    store.money.txns.push(makeTxn({
      type: "spend",
      label: label.trim() || "Spend",
      amount: amt,
      dateISO,
      budgetId,
    }));

    store.money.txns = normaliseTxns(store.money.txns);
    saveStore(store);

    renderBudgets();
    renderMoneyTxns();
    renderNextSteps();
  }

  function renderBudgets() {
    const store = loadStore();
    const budgets = store.money.budgets || [];

    if (badgeBudgets) {
      if (!budgets.length) {
        badgeBudgets.className = "badge badge--neutral";
        badgeBudgets.textContent = "Empty";
      } else {
        const overspent = budgets.filter(b => {
          const spent = budgetSpendThisMonth(store, b.id);
          return Number(b.monthlyLimit || 0) > 0 && spent > Number(b.monthlyLimit || 0);
        }).length;

        badgeBudgets.className = overspent ? "badge badge--danger" : "badge badge--ok";
        badgeBudgets.textContent = `${budgets.length} budget${budgets.length === 1 ? "" : "s"}`;
      }
    }

    if (!listBudgets) return;

    listBudgets.innerHTML = "";

    if (!budgets.length) {
      emptyBudgets?.removeAttribute("hidden");
      return;
    }
    emptyBudgets?.setAttribute("hidden", "true");

    const sorted = [...budgets].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
      return String(a.name).localeCompare(String(b.name));
    });

    for (const b of sorted) {
      const spent = budgetSpendThisMonth(store, b.id);
      const limit = Number(b.monthlyLimit || 0);
      const pct = limit > 0 ? Math.max(0, Math.min(100, (spent / limit) * 100)) : 0;

      const status =
        limit <= 0 ? "badge--neutral" :
        spent > limit ? "badge--danger" :
        spent > (0.8 * limit) ? "badge--warn" :
        "badge--ok";

      const li = document.createElement("li");
      li.className = "list__item list__item--neutral";
      li.innerHTML = `
        <div class="fund-row" style="width:100%;">
          <div class="fund-top">
            <div class="fund-meta">
              <div class="fund-name">${escapeHtml(b.name)}</div>
              <div class="fund-sub">
                This month: ${escapeHtml(fmtMoney(spent))} • Limit: ${escapeHtml(limit > 0 ? fmtMoney(limit) : "—")}
                ${b.notes?.trim() ? ` • ${escapeHtml(b.notes.trim())}` : ""}
              </div>
            </div>
            <div class="fund-actions">
              <button class="mini-btn" type="button" data-budget-action="spend" data-id="${b.id}">Add spend</button>
              <button class="mini-btn" type="button" data-budget-action="edit" data-id="${b.id}">Edit</button>
              <button class="mini-btn mini-btn--danger" type="button" data-budget-action="delete" data-id="${b.id}">Delete</button>
              <span class="badge ${status}">${limit > 0 ? `${Math.round(pct)}%` : "No limit"}</span>
            </div>
          </div>

          ${limit > 0 ? `
            <div class="progress">
              <div class="progress__bar" style="width:${pct}%"></div>
            </div>
          ` : ``}
        </div>
      `;
      listBudgets.appendChild(li);
    }
  }

  document.getElementById("view-admin")?.addEventListener("click", (e) => {
    const bbtn = e.target.closest("button[data-budget-action]");
    if (!bbtn) return;

    const action = bbtn.getAttribute("data-budget-action");
    const id = bbtn.getAttribute("data-id");
    if (!action || !id) return;

    const store = loadStore();
    const idx = store.money.budgets.findIndex(b => b.id === id);
    if (idx === -1) return;

    const budget = store.money.budgets[idx];

    if (action === "edit") return openBudgetModal("edit", budget);

    if (action === "delete") {
      if (!confirm("Delete this budget?")) return;
      store.money.budgets.splice(idx, 1);
      store.money.txns = (store.money.txns || []).filter(t => t.budgetId !== id);
      store.money.budgets = normaliseBudgets(store.money.budgets);
      store.money.txns = normaliseTxns(store.money.txns);
      saveStore(store);
      renderBudgets();
      renderMoneyTxns();
      renderNextSteps();
      return;
    }

    if (action === "spend") addSpendPrompt(id);
  });

  function renderMoneyTxns() {
    if (!moneyTxnsList) return;

    const store = loadStore();
    const txns = store.money.txns || [];

    moneyTxnsList.innerHTML = "";

    if (!txns.length) {
      moneyTxnsEmpty?.removeAttribute("hidden");
      return;
    }
    moneyTxnsEmpty?.setAttribute("hidden", "true");

    const sorted = [...txns].sort((a, b) => (b.dateISO || "").localeCompare(a.dateISO || ""));
    for (const t of sorted.slice(0, 12)) {
      const li = document.createElement("li");
      li.className = "list__item list__item--neutral";
      li.innerHTML = `
        <div class="list__main">
          <div class="list__title">${escapeHtml(t.label)}</div>
          <div class="list__meta">${escapeHtml(t.dateISO)} • ${escapeHtml(t.type)} • ${escapeHtml(fmtMoney(t.amount))}</div>
        </div>
      `;
      moneyTxnsList.appendChild(li);
    }
  }

  // =========================
  // MAIN ADMIN RENDER
  // =========================
  function renderAdmin() {
    const allItems = loadItems();

    const settings = getSettings();
    if (settings.calmModeAuto && uiState.calmModeManual === null) {
      uiState.calmMode = urgentCount(allItems) > Number(settings.calmThreshold ?? 3);
      if (calmCheckbox) calmCheckbox.checked = uiState.calmMode;
    }

    setOverallPill(computeOverallStatus(allItems));
    renderStats(allItems);
    renderSmartAlerts(allItems);

    let visible = applyFilterAndSort(allItems);
    if (uiState.calmMode) visible = applyCalmMode(visible);

    const groups = {
      renewal: visible.filter((i) => i.category === "renewal"),
      account: visible.filter((i) => i.category === "account"),
      info: visible.filter((i) => i.category === "info"),
      vehicle: visible.filter((i) => i.category === "vehicle"),
    };

    renderList(listRenewals, emptyRenewals, groups.renewal);
    renderList(listAccounts, emptyAccounts, groups.account);
    renderList(listInfo, emptyInfo, groups.info);
    renderList(listVehicle, emptyVehicle, groups.vehicle);

    renderBudgets();
    renderMoney();
    renderMoneyTxns();

    if (uiState.calmMode) {
      setCategoryCardVisibility("renewal", groups.renewal.length > 0);
      setCategoryCardVisibility("account", groups.account.length > 0);
      setCategoryCardVisibility("info", groups.info.length > 0);
      setCategoryCardVisibility("vehicle", groups.vehicle.length > 0);
      setCategoryCardVisibility("money", true);
    } else {
      setCategoryCardVisibility("renewal", true);
      setCategoryCardVisibility("account", true);
      setCategoryCardVisibility("info", true);
      setCategoryCardVisibility("vehicle", true);
      setCategoryCardVisibility("money", true);
    }

    const badgeItems = uiState.showArchived ? allItems : allItems.filter((i) => !i.archived);
    setCategoryBadge(badgeRenewals, badgeItems.filter((i) => i.category === "renewal"));
    setCategoryBadge(badgeAccounts, badgeItems.filter((i) => i.category === "account"));
    setCategoryBadge(badgeInfo, badgeItems.filter((i) => i.category === "info"));
    setCategoryBadge(badgeVehicle, badgeItems.filter((i) => i.category === "vehicle"));

    renderNextSteps();
  }

  // =========================
  // ACTIONS: edit/delete/archive/done
  // =========================
  document.getElementById("view-admin")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    const items = loadItems();
    const idx = items.findIndex((x) => x.id === id);
    const item = idx >= 0 ? items[idx] : null;
    if (!item) return;

    if (action === "delete") {
      if (!confirm("Delete this item?")) return;
      items.splice(idx, 1);
      saveItems(items);
      renderAdmin();
      return;
    }

    if (action === "edit") return openModal("edit", item);

    if (action === "archive") {
      item.archived = true;
      item.updatedAtISO = new Date().toISOString();
      saveItems(items);
      renderAdmin();
      return;
    }

    if (action === "unarchive") {
      item.archived = false;
      item.updatedAtISO = new Date().toISOString();
      saveItems(items);
      renderAdmin();
      return;
    }

    if (action === "done") {
      item.doneCount = (item.doneCount || 0) + 1;
      const nowISO = new Date().toISOString();

      if (item.recurrence === "none") {
        item.archived = true;
        item.updatedAtISO = nowISO;
        saveItems(items);
        renderAdmin();
        return;
      }

      const todayISO = toISODate(startOfToday());
      const baseDue = item.dueDateISO ? item.dueDateISO : todayISO;

      const d = daysUntil(item.dueDateISO);
      const effectiveBase = d !== null && d < 0 ? todayISO : baseDue;

      if (item.recurrence === "weekly") item.dueDateISO = addDaysISO(effectiveBase, 7);
      if (item.recurrence === "monthly") item.dueDateISO = addMonthsISO(effectiveBase, 1);
      if (item.recurrence === "yearly") item.dueDateISO = addYearsISO(effectiveBase, 1);
      if (item.recurrence === "custom") item.dueDateISO = addDaysISO(effectiveBase, item.customDays ?? 30);

      item.updatedAtISO = nowISO;
      item.archived = false;

      saveItems(items);
      renderAdmin();
    }
  });

  // Next Steps click open
  document.getElementById("nextStepsWrap")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-ns-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-ns-action");
    if (action === "openAdmin") {
      const id = btn.getAttribute("data-id");
      if (!id) return;

      const items = loadItems();
      const item = items.find((x) => x.id === id);
      if (!item) return;

      setActiveView("admin");
      openModal("edit", item);
    }
  });

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
      items[idx] = { ...items[idx], category, name, dueDateISO, details, reminderProfile, priority, recurrence, customDays, updatedAtISO: nowISO };
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
        a.badge.cls.includes("danger") ? "list__item--red" :
        a.badge.cls.includes("warn") ? "list__item--amber" :
        "list__item--green";

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
  // NEXT STEPS (Part D)
  // =========================
  function buildNextSteps() {
    const today = [];
    const week = [];

    // ---- LIFE ADMIN ----
    const adminItems = loadItems().filter((i) => !i.archived);
    for (const it of adminItems) {
      const d = daysUntil(it.dueDateISO);
      if (d === null) continue;

      if (d < 0 || d <= 1) {
        today.push({
          source: "admin",
          id: it.id,
          title: it.name,
          meta: fmtDueText(d),
          hint: gentleNudge(it, d),
          tag: "Life Admin",
          score: 200 + (it.priority === "high" ? 20 : 0) + (d < 0 ? 40 : 0),
        });
        continue;
      }

      if (d <= 7 || (it.priority === "high" && d <= 14)) {
        week.push({
          source: "admin",
          id: it.id,
          title: it.name,
          meta: fmtDueText(d),
          hint: gentleNudge(it, d),
          tag: "Life Admin",
          score: 140 + (it.priority === "high" ? 20 : 0) + Math.max(0, 20 - d),
        });
      }
    }

    // ---- MONEY (Budgets + Payday) ----
    try {
      const store = loadStore();
      const budgets = store.money.budgets || [];
      const mk = currentMonthKey();

      for (const b of budgets) {
        const limit = Number(b.monthlyLimit || 0);
        if (limit <= 0) continue;

        const spent = (store.money.txns || [])
          .filter(t => t.type === "spend" && t.budgetId === b.id && monthKeyFromISO(t.dateISO) === mk)
          .reduce((acc, t) => acc + Number(t.amount || 0), 0);

        if (spent > limit) {
          today.push({
            source: "admin",
            id: `overspend_${b.id}`,
            title: `Budget overspent: ${b.name}`,
            meta: `${fmtMoney(spent)} / ${fmtMoney(limit)}`,
            hint: "No panic — even one small adjustment helps (pause one optional spend).",
            tag: "Money",
            score: 220 + (b.priority === "high" ? 20 : 0),
          });
        } else if (spent > limit * 0.85) {
          week.push({
            source: "admin",
            id: `near_${b.id}`,
            title: `Budget nearly full: ${b.name}`,
            meta: `${fmtMoney(spent)} / ${fmtMoney(limit)}`,
            hint: "You’re close to the limit — worth keeping an eye on this week.",
            tag: "Money",
            score: 130 + (b.priority === "high" ? 10 : 0),
          });
        }
      }

      if (store.money.paydayISO) {
        const d = daysUntil(store.money.paydayISO);
        if (d !== null && d >= 0 && d <= 3) {
          week.push({
            source: "admin",
            id: "payday",
            title: "Payday coming up",
            meta: fmtDueText(d),
            hint: "Quick plan: bills → savings → fun money. Even a rough split helps.",
            tag: "Money",
            score: 125,
          });
        }
      }
    } catch {}

    // (Home + Skills next steps are in later sections; kept synced via renderNextSteps calls)

    const sortDesc = (a, b) => b.score - a.score;
    today.sort(sortDesc);
    week.sort(sortDesc);

    return {
      today: today.slice(0, 4),
      week: week.slice(0, 6),
    };
  }

  function renderNextSteps() {
    if (!nextStepsToday || !nextStepsWeek) return;

    const { today, week } = buildNextSteps();

    if (badgeNextSteps) {
      const total = today.length + week.length;
      badgeNextSteps.className = total ? "badge badge--warn" : "badge badge--ok";
      badgeNextSteps.textContent = total ? `${total} suggested` : "Clear";
    }

    nextStepsToday.innerHTML = "";
    if (!today.length) emptyNextToday?.removeAttribute("hidden");
    else emptyNextToday?.setAttribute("hidden", "true");

    for (const t of today) {
      const li = document.createElement("li");
      li.className = "list__item list__item--amber";
      li.innerHTML = `
        <div class="list__main">
          <div class="list__title">${escapeHtml(t.title)}</div>
          <div class="list__meta">${escapeHtml(t.meta)} • ${escapeHtml(t.hint)}</div>
        </div>
        <div class="row-actions">
          <button class="mini-btn" type="button" data-ns-action="openAdmin" data-id="${escapeHtml(t.id)}">Open</button>
          <span class="nextstep-tag">${escapeHtml(t.tag)}</span>
        </div>
      `;
      nextStepsToday.appendChild(li);
    }

    nextStepsWeek.innerHTML = "";
    if (!week.length) emptyNextWeek?.removeAttribute("hidden");
    else emptyNextWeek?.setAttribute("hidden", "true");

    for (const t of week) {
      const li = document.createElement("li");
      li.className = "list__item list__item--green";
      li.innerHTML = `
        <div class="list__main">
          <div class="list__title">${escapeHtml(t.title)}</div>
          <div class="list__meta">${escapeHtml(t.meta)} • ${escapeHtml(t.hint)}</div>
        </div>
        <div class="row-actions">
          <button class="mini-btn" type="button" data-ns-action="openAdmin" data-id="${escapeHtml(t.id)}">Open</button>
          <span class="nextstep-tag">${escapeHtml(t.tag)}</span>
        </div>
      `;
      nextStepsWeek.appendChild(li);
    }
  }

  // =========================
  // FUNDS (Money)
  // =========================
  function fundProgress(f) {
    const target = Number(f.target ?? 0);
    const current = Number(f.current ?? 0);
    if (!Number.isFinite(target) || target <= 0) return { pct: 0, label: `${fmtGBP(current)} / (no target)` };
    const pct = Math.max(0, Math.min(100, (current / target) * 100));
    return { pct, label: `${fmtGBP(current)} / ${fmtGBP(target)} (${Math.round(pct)}%)` };
  }

  function monthsToTarget(f) {
    const target = Number(f.target ?? 0);
    const current = Number(f.current ?? 0);
    const monthly = Number(f.monthlyGoal ?? 0);

    if (!Number.isFinite(target) || target <= 0) return null;
    if (!Number.isFinite(monthly) || monthly <= 0) return null;
    if (current >= target) return 0;

    const remaining = Math.max(0, target - current);
    return Math.ceil(remaining / monthly);
  }

  function renderMoney() {
    const store = loadStore();
    const funds = store.money.funds ?? [];

    if (badgeMoney) {
      if (!funds.length) {
        badgeMoney.className = "badge badge--neutral";
        badgeMoney.textContent = "Empty";
      } else {
        const high = funds.filter((f) => f.priority === "high").length;
        badgeMoney.className = high > 0 ? "badge badge--warn" : "badge badge--ok";
        badgeMoney.textContent = `${funds.length} fund${funds.length === 1 ? "" : "s"}`;
      }
    }

    if (moneySummary) {
      const total = funds.reduce((acc, f) => acc + Number(f.current ?? 0), 0);
      const totalTargets = funds.reduce((acc, f) => acc + Number(f.target ?? 0), 0);

      moneySummary.innerHTML = `
        <span class="money-chip">Total saved: <strong>${fmtGBP(total)}</strong></span>
        <span class="money-chip">Total targets: <strong>${fmtGBP(totalTargets)}</strong></span>
        <span class="money-chip">Funds: <strong>${funds.length}</strong></span>
      `;
    }

    if (!listMoneyFunds) return;

    listMoneyFunds.innerHTML = "";

    if (!funds.length) {
      emptyMoneyFunds?.removeAttribute("hidden");
      return;
    }
    emptyMoneyFunds?.setAttribute("hidden", "true");

    const sorted = [...funds].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
      return String(a.name).localeCompare(String(b.name));
    });

    for (const f of sorted) {
      const prog = fundProgress(f);
      const monthly = Number(f.monthlyGoal ?? 0);
      const monthlyText = monthly > 0 ? `Monthly goal: ${fmtMoney(monthly)}` : "Monthly goal: —";

      const eta = monthsToTarget(f);
      const etaText = eta === null ? "" : eta === 0 ? "Target reached 🎉" : `ETA: ~${eta} month${eta === 1 ? "" : "s"}`;

      const li = document.createElement("li");
      li.className = "list__item list__item--neutral";
      li.innerHTML = `
        <div class="fund-row" style="width:100%;">
          <div class="fund-top">
            <div class="fund-meta">
              <div class="fund-name">${escapeHtml(f.name)}</div>
              <div class="fund-sub">
                ${escapeHtml(prog.label)} • ${escapeHtml(monthlyText)}${etaText ? " • " + escapeHtml(etaText) : ""}
              </div>
            </div>
            <div class="fund-actions">
              <button class="mini-btn" type="button" data-fund-action="deposit" data-id="${f.id}">Deposit</button>
              <button class="mini-btn" type="button" data-fund-action="withdraw" data-id="${f.id}">Withdraw</button>
              <button class="mini-btn" type="button" data-fund-action="edit" data-id="${f.id}">Edit</button>
              <button class="mini-btn mini-btn--danger" type="button" data-fund-action="delete" data-id="${f.id}">Delete</button>
            </div>
          </div>

          <div class="progress">
            <div class="progress__bar" style="width:${prog.pct}%"></div>
          </div>

          ${f.notes ? `<div class="fund-sub">${escapeHtml(f.notes)}</div>` : ``}
        </div>
      `;
      listMoneyFunds.appendChild(li);
    }
  }

  // Fund save
  fundForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = fundForm.name.value.trim();
    if (!name) {
      alert("Please enter a fund name.");
      fundForm.name.focus();
      return;
    }

    const priority = fundForm.priority.value;
    const target = Number(fundForm.target.value || 0);
    const current = Number(fundForm.current.value || 0);
    const monthlyGoal = Number(fundForm.monthlyGoal.value || 0);
    const notes = fundForm.notes.value.trim();

    const store = loadStore();
    const nowISO = new Date().toISOString();

    if (editingFundId) {
      const idx = store.money.funds.findIndex((f) => f.id === editingFundId);
      if (idx === -1) {
        alert("That fund couldn't be found.");
        closeFundModal();
        return;
      }
      store.money.funds[idx] = {
        ...store.money.funds[idx],
        name,
        priority,
        target: Number.isFinite(target) && target >= 0 ? target : 0,
        current: Number.isFinite(current) && current >= 0 ? current : 0,
        monthlyGoal: Number.isFinite(monthlyGoal) && monthlyGoal >= 0 ? monthlyGoal : 0,
        notes,
        updatedAtISO: nowISO,
      };
    } else {
      const f = makeFund(name);
      f.priority = priority;
      f.target = Number.isFinite(target) && target >= 0 ? target : 0;
      f.current = Number.isFinite(current) && current >= 0 ? current : 0;
      f.monthlyGoal = Number.isFinite(monthlyGoal) && monthlyGoal >= 0 ? monthlyGoal : 0;
      f.notes = notes;
      f.createdAtISO = nowISO;
      f.updatedAtISO = nowISO;
      store.money.funds.push(f);
    }

    store.money.funds = normaliseFunds(store.money.funds);
    saveStore(store);
    renderMoney();
    renderNextSteps();
    closeFundModal();
  });

  // Fund actions (ONE listener on admin view)
  document.getElementById("view-admin")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-fund-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-fund-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    const store = loadStore();
    const idx = store.money.funds.findIndex((f) => f.id === id);
    if (idx === -1) return;

    const fund = store.money.funds[idx];

    if (action === "edit") return openFundModal("edit", fund);

    if (action === "delete") {
      if (!confirm("Delete this fund?")) return;
      store.money.funds.splice(idx, 1);
      store.money.funds = normaliseFunds(store.money.funds);
      saveStore(store);
      renderMoney();
      renderNextSteps();
      return;
    }

    if (action === "deposit" || action === "withdraw") {
      const label = action === "deposit" ? "Deposit amount" : "Withdraw amount";
      const raw = prompt(`${label} (${currencySymbol(store.money.currency)}):`, "");
      if (raw === null) return;

      const amt = Number(raw);
      if (!Number.isFinite(amt) || amt <= 0) {
        alert("Please enter a positive number.");
        return;
      }

      const next =
        action === "deposit"
          ? Number(fund.current ?? 0) + amt
          : Math.max(0, Number(fund.current ?? 0) - amt);

      store.money.funds[idx] = { ...fund, current: next, updatedAtISO: new Date().toISOString() };
      store.money.funds = normaliseFunds(store.money.funds);
      saveStore(store);

      // Optional: log txn
      store.money.txns.push(makeTxn({
        type: action === "deposit" ? "deposit" : "withdraw",
        label: `${action === "deposit" ? "Deposit" : "Withdraw"}: ${fund.name}`,
        amount: amt,
        dateISO: toISODate(startOfToday()),
        fundId: fund.id,
      }));
      store.money.txns = normaliseTxns(store.money.txns);
      saveStore(store);

      renderMoney();
      renderMoneyTxns();
      renderNextSteps();
    }
  });

  // =========================
  // BUDGETS + TXNS (Money)
  // =========================
  let editingBudgetId = null;

  function budgetSpendThisMonth(store, budgetId) {
    const mk = currentMonthKey();
    return (store.money.txns || [])
      .filter(t => t.type === "spend" && t.budgetId === budgetId && monthKeyFromISO(t.dateISO) === mk)
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }

  function openBudgetModal(mode, budget = null) {
    editingBudgetId = mode === "edit" ? (budget?.id ?? null) : null;

    // fallback prompts if modal not present
    if (!budgetModal || !budgetForm) {
      const name = prompt("Budget name (e.g., Food / Petrol):", budget?.name ?? "");
      if (name === null) return;

      const limitRaw = prompt("Monthly limit:", String(Number(budget?.monthlyLimit ?? 0)));
      if (limitRaw === null) return;

      const notes = prompt("Notes (optional):", budget?.notes ?? "");
      if (notes === null) return;

      const store = loadStore();
      const nowISO = new Date().toISOString();
      const monthlyLimit = Number(limitRaw);

      if (!Number.isFinite(monthlyLimit) || monthlyLimit < 0) {
        alert("Monthly limit must be 0 or a positive number.");
        return;
      }

      if (editingBudgetId) {
        const idx = store.money.budgets.findIndex(b => b.id === editingBudgetId);
        if (idx === -1) return;
        store.money.budgets[idx] = {
          ...store.money.budgets[idx],
          name: name.trim() || store.money.budgets[idx].name,
          monthlyLimit,
          notes: notes.trim(),
          updatedAtISO: nowISO,
        };
      } else {
        const b = makeBudget(name.trim() || "Budget");
        b.monthlyLimit = monthlyLimit;
        b.notes = notes.trim();
        b.updatedAtISO = nowISO;
        store.money.budgets.push(b);
      }

      store.money.budgets = normaliseBudgets(store.money.budgets);
      saveStore(store);
      renderBudgets();
      renderMoneyTxns();
      renderNextSteps();
      return;
    }

    if (budgetModalTitle) budgetModalTitle.textContent = mode === "edit" ? "Edit Budget" : "Add Budget";
    budgetForm.reset();

    budgetForm.id.value = budget?.id ?? "";
    budgetForm.name.value = budget?.name ?? "";
    budgetForm.priority.value = budget?.priority ?? "normal";
    budgetForm.monthlyLimit.value = budget?.monthlyLimit != null ? String(budget.monthlyLimit) : "";
    budgetForm.notes.value = budget?.notes ?? "";

    budgetModal.setAttribute("aria-hidden", "false");
    budgetModal.classList.add("is-open");
    budgetForm.name?.focus?.();
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

  budgetForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = budgetForm.name.value.trim();
    if (!name) {
      alert("Please enter a budget name.");
      budgetForm.name.focus();
      return;
    }

    const priority = budgetForm.priority.value === "high" ? "high" : "normal";
    const monthlyLimit = Number(budgetForm.monthlyLimit.value || 0);
    if (!Number.isFinite(monthlyLimit) || monthlyLimit < 0) {
      alert("Monthly limit must be 0 or a positive number.");
      budgetForm.monthlyLimit.focus();
      return;
    }

    const notes = budgetForm.notes.value.trim();
    const store = loadStore();
    const nowISO = new Date().toISOString();

    if (editingBudgetId) {
      const idx = store.money.budgets.findIndex(b => b.id === editingBudgetId);
      if (idx === -1) {
        alert("Budget not found.");
        closeBudgetModal();
        return;
      }
      store.money.budgets[idx] = { ...store.money.budgets[idx], name, priority, monthlyLimit, notes, updatedAtISO: nowISO };
    } else {
      const b = makeBudget(name);
      b.priority = priority;
      b.monthlyLimit = monthlyLimit;
      b.notes = notes;
      b.createdAtISO = nowISO;
      b.updatedAtISO = nowISO;
      store.money.budgets.push(b);
    }

    store.money.budgets = normaliseBudgets(store.money.budgets);
    saveStore(store);

    renderBudgets();
    renderMoneyTxns();
    renderNextSteps();
    closeBudgetModal();
  });

  function addSpendPrompt(budgetId) {
    const store = loadStore();
    const budget = store.money.budgets.find(b => b.id === budgetId);
    if (!budget) return;

    const label = prompt(`Spend label for "${budget.name}" (e.g., Tesco / Fuel):`, "");
    if (label === null) return;

    const amtRaw = prompt("Amount:", "");
    if (amtRaw === null) return;
    const amt = Number(amtRaw);
    if (!Number.isFinite(amt) || amt <= 0) {
      alert("Please enter a positive number.");
      return;
    }

    const dateISO = (prompt("Date (YYYY-MM-DD) — leave blank for today:", "") || toISODate(startOfToday())).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
      alert("Please use YYYY-MM-DD format.");
      return;
    }

    store.money.txns.push(makeTxn({
      type: "spend",
      label: label.trim() || "Spend",
      amount: amt,
      dateISO,
      budgetId,
    }));

    store.money.txns = normaliseTxns(store.money.txns);
    saveStore(store);

    renderBudgets();
    renderMoneyTxns();
    renderNextSteps();
  }

  function renderBudgets() {
    const store = loadStore();
    const budgets = store.money.budgets || [];

    if (badgeBudgets) {
      if (!budgets.length) {
        badgeBudgets.className = "badge badge--neutral";
        badgeBudgets.textContent = "Empty";
      } else {
        const overspent = budgets.filter(b => {
          const spent = budgetSpendThisMonth(store, b.id);
          return Number(b.monthlyLimit || 0) > 0 && spent > Number(b.monthlyLimit || 0);
        }).length;

        badgeBudgets.className = overspent ? "badge badge--danger" : "badge badge--ok";
        badgeBudgets.textContent = `${budgets.length} budget${budgets.length === 1 ? "" : "s"}`;
      }
    }

    if (!listBudgets) return;

    listBudgets.innerHTML = "";

    if (!budgets.length) {
      emptyBudgets?.removeAttribute("hidden");
      return;
    }
    emptyBudgets?.setAttribute("hidden", "true");

    const sorted = [...budgets].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
      return String(a.name).localeCompare(String(b.name));
    });

    for (const b of sorted) {
      const spent = budgetSpendThisMonth(store, b.id);
      const limit = Number(b.monthlyLimit || 0);
      const pct = limit > 0 ? Math.max(0, Math.min(100, (spent / limit) * 100)) : 0;

      const status =
        limit <= 0 ? "badge--neutral" :
        spent > limit ? "badge--danger" :
        spent > (0.8 * limit) ? "badge--warn" :
        "badge--ok";

      const li = document.createElement("li");
      li.className = "list__item list__item--neutral";
      li.innerHTML = `
        <div class="fund-row" style="width:100%;">
          <div class="fund-top">
            <div class="fund-meta">
              <div class="fund-name">${escapeHtml(b.name)}</div>
              <div class="fund-sub">
                This month: ${escapeHtml(fmtMoney(spent))} • Limit: ${escapeHtml(limit > 0 ? fmtMoney(limit) : "—")}
                ${b.notes?.trim() ? ` • ${escapeHtml(b.notes.trim())}` : ""}
              </div>
            </div>
            <div class="fund-actions">
              <button class="mini-btn" type="button" data-budget-action="spend" data-id="${b.id}">Add spend</button>
              <button class="mini-btn" type="button" data-budget-action="edit" data-id="${b.id}">Edit</button>
              <button class="mini-btn mini-btn--danger" type="button" data-budget-action="delete" data-id="${b.id}">Delete</button>
              <span class="badge ${status}">${limit > 0 ? `${Math.round(pct)}%` : "No limit"}</span>
            </div>
          </div>

          ${limit > 0 ? `
            <div class="progress">
              <div class="progress__bar" style="width:${pct}%"></div>
            </div>
          ` : ``}
        </div>
      `;
      listBudgets.appendChild(li);
    }
  }

  document.getElementById("view-admin")?.addEventListener("click", (e) => {
    const bbtn = e.target.closest("button[data-budget-action]");
    if (!bbtn) return;

    const action = bbtn.getAttribute("data-budget-action");
    const id = bbtn.getAttribute("data-id");
    if (!action || !id) return;

    const store = loadStore();
    const idx = store.money.budgets.findIndex(b => b.id === id);
    if (idx === -1) return;

    const budget = store.money.budgets[idx];

    if (action === "edit") return openBudgetModal("edit", budget);

    if (action === "delete") {
      if (!confirm("Delete this budget?")) return;
      store.money.budgets.splice(idx, 1);
      store.money.txns = (store.money.txns || []).filter(t => t.budgetId !== id);
      store.money.budgets = normaliseBudgets(store.money.budgets);
      store.money.txns = normaliseTxns(store.money.txns);
      saveStore(store);
      renderBudgets();
      renderMoneyTxns();
      renderNextSteps();
      return;
    }

    if (action === "spend") addSpendPrompt(id);
  });

  function renderMoneyTxns() {
    if (!moneyTxnsList) return;

    const store = loadStore();
    const txns = store.money.txns || [];

    moneyTxnsList.innerHTML = "";

    if (!txns.length) {
      moneyTxnsEmpty?.removeAttribute("hidden");
      return;
    }
    moneyTxnsEmpty?.setAttribute("hidden", "true");

    const sorted = [...txns].sort((a, b) => (b.dateISO || "").localeCompare(a.dateISO || ""));
    for (const t of sorted.slice(0, 12)) {
      const li = document.createElement("li");
      li.className = "list__item list__item--neutral";
      li.innerHTML = `
        <div class="list__main">
          <div class="list__title">${escapeHtml(t.label)}</div>
          <div class="list__meta">${escapeHtml(t.dateISO)} • ${escapeHtml(t.type)} • ${escapeHtml(fmtMoney(t.amount))}</div>
        </div>
      `;
      moneyTxnsList.appendChild(li);
    }
  }

  // =========================
  // MAIN ADMIN RENDER
  // =========================
  function renderAdmin() {
    const allItems = loadItems();

    const settings = getSettings();
    if (settings.calmModeAuto && uiState.calmModeManual === null) {
      uiState.calmMode = urgentCount(allItems) > Number(settings.calmThreshold ?? 3);
      if (calmCheckbox) calmCheckbox.checked = uiState.calmMode;
    }

    setOverallPill(computeOverallStatus(allItems));
    renderStats(allItems);
    renderSmartAlerts(allItems);

    let visible = applyFilterAndSort(allItems);
    if (uiState.calmMode) visible = applyCalmMode(visible);

    const groups = {
      renewal: visible.filter((i) => i.category === "renewal"),
      account: visible.filter((i) => i.category === "account"),
      info: visible.filter((i) => i.category === "info"),
      vehicle: visible.filter((i) => i.category === "vehicle"),
    };

    renderList(listRenewals, emptyRenewals, groups.renewal);
    renderList(listAccounts, emptyAccounts, groups.account);
    renderList(listInfo, emptyInfo, groups.info);
    renderList(listVehicle, emptyVehicle, groups.vehicle);

    renderBudgets();
    renderMoney();
    renderMoneyTxns();

    if (uiState.calmMode) {
      setCategoryCardVisibility("renewal", groups.renewal.length > 0);
      setCategoryCardVisibility("account", groups.account.length > 0);
      setCategoryCardVisibility("info", groups.info.length > 0);
      setCategoryCardVisibility("vehicle", groups.vehicle.length > 0);
      setCategoryCardVisibility("money", true);
    } else {
      setCategoryCardVisibility("renewal", true);
      setCategoryCardVisibility("account", true);
      setCategoryCardVisibility("info", true);
      setCategoryCardVisibility("vehicle", true);
      setCategoryCardVisibility("money", true);
    }

    const badgeItems = uiState.showArchived ? allItems : allItems.filter((i) => !i.archived);
    setCategoryBadge(badgeRenewals, badgeItems.filter((i) => i.category === "renewal"));
    setCategoryBadge(badgeAccounts, badgeItems.filter((i) => i.category === "account"));
    setCategoryBadge(badgeInfo, badgeItems.filter((i) => i.category === "info"));
    setCategoryBadge(badgeVehicle, badgeItems.filter((i) => i.category === "vehicle"));

    renderNextSteps();
  }

  // =========================
  // ACTIONS: edit/delete/archive/done
  // =========================
  document.getElementById("view-admin")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    const items = loadItems();
    const idx = items.findIndex((x) => x.id === id);
    const item = idx >= 0 ? items[idx] : null;
    if (!item) return;

    if (action === "delete") {
      if (!confirm("Delete this item?")) return;
      items.splice(idx, 1);
      saveItems(items);
      renderAdmin();
      return;
    }

    if (action === "edit") return openModal("edit", item);

    if (action === "archive") {
      item.archived = true;
      item.updatedAtISO = new Date().toISOString();
      saveItems(items);
      renderAdmin();
      return;
    }

    if (action === "unarchive") {
      item.archived = false;
      item.updatedAtISO = new Date().toISOString();
      saveItems(items);
      renderAdmin();
      return;
    }

    if (action === "done") {
      item.doneCount = (item.doneCount || 0) + 1;
      const nowISO = new Date().toISOString();

      if (item.recurrence === "none") {
        item.archived = true;
        item.updatedAtISO = nowISO;
        saveItems(items);
        renderAdmin();
        return;
      }

      const todayISO = toISODate(startOfToday());
      const baseDue = item.dueDateISO ? item.dueDateISO : todayISO;

      const d = daysUntil(item.dueDateISO);
      const effectiveBase = d !== null && d < 0 ? todayISO : baseDue;

      if (item.recurrence === "weekly") item.dueDateISO = addDaysISO(effectiveBase, 7);
      if (item.recurrence === "monthly") item.dueDateISO = addMonthsISO(effectiveBase, 1);
      if (item.recurrence === "yearly") item.dueDateISO = addYearsISO(effectiveBase, 1);
      if (item.recurrence === "custom") item.dueDateISO = addDaysISO(effectiveBase, item.customDays ?? 30);

      item.updatedAtISO = nowISO;
      item.archived = false;

      saveItems(items);
      renderAdmin();
    }
  });

  // Next Steps click open
  document.getElementById("nextStepsWrap")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-ns-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-ns-action");
    if (action === "openAdmin") {
      const id = btn.getAttribute("data-id");
      if (!id) return;

      const items = loadItems();
      const item = items.find((x) => x.id === id);
      if (!item) return;

      setActiveView("admin");
      openModal("edit", item);
    }
  });

    // ============================================================
  // SECTION 5/5 — EXPORT/IMPORT + SAMPLE DATA + BOOT + CLOSE IIFE
  // ============================================================

  // =========================
  // EXPORT / IMPORT (JSON)
  // =========================
  const btnExport = document.getElementById("btnExport");
  const btnImportJson = document.getElementById("btnImportJson");
  const fileImport = document.getElementById("fileImport"); // <input type="file" accept="application/json">

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

      // re-render everything
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

    // Life Admin items
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

    // Money: 1–2 funds + budgets
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

    // add a couple of spends in this month
    const mk = currentMonthKey();
    const someDate = mk + "-05";
    const foodId = store.money.budgets.find(b => b.name.toLowerCase() === "food")?.id || store.money.budgets[0]?.id;
    const transportId = store.money.budgets.find(b => b.name.toLowerCase() === "transport")?.id || store.money.budgets[1]?.id;

    if (foodId) {
      store.money.txns.push(makeTxn({ type: "spend", label: "Tesco", amount: 45.2, dateISO: someDate, budgetId: foodId }));
    }
    if (transportId) {
      store.money.txns.push(makeTxn({ type: "spend", label: "Fuel", amount: 35, dateISO: mk + "-08", budgetId: transportId }));
    }

    store.money.txns = normaliseTxns(store.money.txns);

    // Home: add costs on a couple of defaults so stats show something
    const rooms = store.home.rooms || defaultRooms();
    const pick = (arr, name, cost) => {
      const it = arr.find(x => (x.name || "").toLowerCase().includes(name.toLowerCase()));
      if (it) it.cost = cost;
      if (it) it.planned = true;
    };
    if (rooms.bedroom) {
      pick(rooms.bedroom.essentials, "mattress", 350);
      pick(rooms.bedroom.essentials, "bed", 400);
    }
    if (rooms.kitchen) {
      pick(rooms.kitchen.extras, "air fryer", 120);
    }
    store.home.rooms = rooms;

    saveStore(store);

    renderAdmin();
    renderHome();
    renderSkills();
    renderNextSteps();
    applyMoneyVisibilityFromSettings();

    toast("Sample data added");
  });

  // =========================
  // BOOT
  // =========================
  function boot() {
    // ensure store exists and is normalised
    const store = loadStore();
    saveStore(store);

    applyDefaultUIFromSettings();
    applyMoneyVisibilityFromSettings();

    // default view: admin
    setActiveView("admin");

    // initial renders
    renderAdmin();
    renderHome();
    renderSkills();
    renderNextSteps();

    toast("Ready");
  }

  boot();

})(); // end IIFE
