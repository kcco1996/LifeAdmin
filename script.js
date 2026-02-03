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
    return crypto?.randomUUID
      ? crypto.randomUUID()
      : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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
  // GLOBAL STORE + MIGRATION (PART A)
  // =========================
  const LS_STORE_KEY = "lifeSetup.store.v1";
  const LS_LEGACY_LIFEADMIN = "lifeSetup.lifeAdmin.items.v5";

  function defaultRooms() {
    return {}; // Part A: store scaffolding only (Home build comes in Part B)
  }

  function defaultSkills() {
    return {}; // Part A: store scaffolding only (Skills build comes in Part B)
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

  function defaultStore() {
    return {
      version: 1,
      lifeAdmin: { items: [] },
      home: { rooms: defaultRooms() },
      skills: { categories: defaultSkills() },
      money: { funds: [], currency: "GBP" },
      settings: { calmModeAuto: true, calmThreshold: 3 },
    };
  }

  function normaliseItems(arr) {
    const nowISO = new Date().toISOString();
    return (arr ?? [])
      .map((x) => {
        const name = (x?.name ?? x?.title ?? "").toString().trim();
        if (!name) return null;

        const item = {
          id: (x?.id ?? uid()).toString(),
          category: (x?.category ?? "renewal"),
          name,
          details: (x?.details ?? "").toString(),
          dueDateISO: x?.dueDateISO ?? x?.dueDate ?? null,
          reminderProfile: (x?.reminderProfile ?? "gentle"),
          priority: (x?.priority ?? "normal"),
          archived: Boolean(x?.archived ?? false),
          recurrence: (x?.recurrence ?? "none"),
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
    };

    base.settings = {
      ...base.settings,
      ...(typeof s?.settings === "object" && s.settings ? s.settings : {}),
    };

    // Part A: home/skills store placeholders
    base.home.rooms = s?.home?.rooms ?? base.home.rooms;
    base.skills.categories = s?.skills?.categories ?? base.skills.categories;

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

    // MIGRATE legacy Life Admin
    const legacyRaw = localStorage.getItem(LS_LEGACY_LIFEADMIN);
    const legacyArr = safeParseArray(legacyRaw) ?? [];

    const store = defaultStore();
    store.lifeAdmin.items = normaliseItems(legacyArr);
    saveStore(store);
    return store;
  }

  // Keep existing Life Admin API the same
  function loadItems() {
    return loadStore().lifeAdmin.items;
  }

  function saveItems(items) {
    const store = loadStore();
    store.lifeAdmin.items = normaliseItems(items);
    saveStore(store);
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

  // Money panel DOM
  const badgeMoney = document.getElementById("badgeMoney");
  const moneySummary = document.getElementById("moneySummary");
  const btnAddFund = document.getElementById("btnAddFund");
  const listMoneyFunds = document.getElementById("listMoneyFunds");
  const emptyMoneyFunds = document.getElementById("emptyMoneyFunds");

  // Controls
  const searchInput = document.getElementById("adminSearch");
  const showArchivedCheckbox = document.getElementById("chkArchived");
  const focusWeekCheckbox = document.getElementById("chkFocusWeek");
  const calmCheckbox = document.getElementById("chkCalmMode");
  const sortSelect = document.getElementById("selSort");
  const btnSampleData = document.getElementById("btnSampleData");
  const btnImport = document.getElementById("btnImport");
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

  // =========================
  // AUTO CALM CONFIG
  // =========================
  const AUTO_CALM_ENABLED = true;
  const AUTO_CALM_THRESHOLD = 3;

  const uiState = {
    filter: "all",
    query: "",
    showArchived: false,
    sort: "dueSoonest",
    focusWeek: false,
    calmMode: false,
    calmModeManual: null,
  };

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
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("is-open")) closeModal();
    if (e.key === "Escape" && fundModal?.classList.contains("is-open")) closeFundModal();
  });

  itemForm?.recurrence?.addEventListener("change", () => {
    setRecurrenceUI(itemForm.recurrence.value);
  });

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

  // Save fund
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
    closeFundModal();
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
  // FILTER + SORT
  // =========================
  function applyFilterAndSort(allItems) {
    let items = [...allItems];

    if (!uiState.showArchived) items = items.filter((i) => !i.archived);
    if (uiState.filter !== "all") items = items.filter((i) => i.category === uiState.filter);

    if (uiState.query) {
      const q = uiState.query;
      items = items.filter((i) => (
        i.name.toLowerCase().includes(q) ||
        (i.details || "").toLowerCase().includes(q) ||
        (i.dueDateISO || "").includes(q)
      ));
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
      case "dueLatest": items.sort((a, b) => -byDueAsc(a, b)); break;
      case "createdOldest": items.sort((a, b) => a.createdAtISO.localeCompare(b.createdAtISO)); break;
      case "createdNewest": items.sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO)); break;
      case "nameZA": items.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "nameAZ": items.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "dueSoonest":
      default: items.sort((a, b) => byDueAsc(a, b)); break;
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
  // BADGES
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
        item.archived ? "list__item--neutral" :
        status === "red" ? "list__item--red" :
        status === "amber" ? "list__item--amber" :
        "list__item--green";

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
  // MONEY RENDER (Funds)
  // =========================
  function fmtGBP(n) {
    const x = Number(n ?? 0);
    const safe = Number.isFinite(x) ? x : 0;
    return "£" + safe.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function fundProgress(f) {
    const target = Number(f.target ?? 0);
    const current = Number(f.current ?? 0);
    if (!Number.isFinite(target) || target <= 0) return { pct: 0, label: `${fmtGBP(current)} / (no target)` };
    const pct = Math.max(0, Math.min(100, (current / target) * 100));
    return { pct, label: `${fmtGBP(current)} / ${fmtGBP(target)} (${Math.round(pct)}%)` };
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

    // Sort: high priority first, then name
    const sorted = [...funds].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
      return String(a.name).localeCompare(String(b.name));
    });

    for (const f of sorted) {
      const prog = fundProgress(f);

      const li = document.createElement("li");
      li.className = "list__item list__item--neutral";

      const monthly = Number(f.monthlyGoal ?? 0);
      const monthlyText = monthly > 0 ? `Monthly goal: ${fmtGBP(monthly)}` : "Monthly goal: —";
      const prioText = f.priority === "high" ? "High priority" : "Normal";

      li.innerHTML = `
        <div class="fund-row" style="width:100%;">
          <div class="fund-top">
            <div class="fund-meta">
              <div class="fund-name">${escapeHtml(f.name)}</div>
              <div class="fund-sub">${escapeHtml(prog.label)} • ${escapeHtml(monthlyText)} • ${escapeHtml(prioText)}</div>
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

  // Fund actions (deposit/withdraw/edit/delete)
  document.querySelector('[data-cat-card="money"]')?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-fund-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-fund-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    const store = loadStore();
    const idx = store.money.funds.findIndex((f) => f.id === id);
    if (idx === -1) return;

    const fund = store.money.funds[idx];

    if (action === "edit") {
      openFundModal("edit", fund);
      return;
    }

    if (action === "delete") {
      if (!confirm("Delete this fund?")) return;
      store.money.funds.splice(idx, 1);
      store.money.funds = normaliseFunds(store.money.funds);
      saveStore(store);
      renderMoney();
      return;
    }

    if (action === "deposit" || action === "withdraw") {
      const label = action === "deposit" ? "Deposit amount (£)" : "Withdraw amount (£)";
      const raw = prompt(label, "");
      if (raw === null) return;

      const amt = Number(raw);
      if (!Number.isFinite(amt) || amt <= 0) {
        alert("Please enter a positive number.");
        return;
      }

      const next = action === "deposit"
        ? (Number(fund.current ?? 0) + amt)
        : Math.max(0, (Number(fund.current ?? 0) - amt));

      store.money.funds[idx] = {
        ...fund,
        current: next,
        updatedAtISO: new Date().toISOString(),
      };

      store.money.funds = normaliseFunds(store.money.funds);
      saveStore(store);
      renderMoney();
      return;
    }
  });

  // =========================
  // MAIN RENDER
  // =========================
  function renderAdmin() {
    const allItems = loadItems();

    // Auto calm mode (only if user hasn't manually overridden)
    if (AUTO_CALM_ENABLED && uiState.calmModeManual === null) {
      uiState.calmMode = urgentCount(allItems) > AUTO_CALM_THRESHOLD;
      if (calmCheckbox) calmCheckbox.checked = uiState.calmMode;
    }

    setOverallPill(computeOverallStatus(allItems));
    renderStats(allItems);
    renderSmartAlerts(allItems);

    let visible = applyFilterAndSort(allItems);

    if (uiState.calmMode) {
      visible = applyCalmMode(visible);
    }

    const groups = {
      renewal: visible.filter((i) => i.category === "renewal"),
      account: visible.filter((i) => i.category === "account"),
      info: visible.filter((i) => i.category === "info"),
      vehicle: visible.filter((i) => i.category === "vehicle"),
      money: visible.filter((i) => i.category === "money"),
    };

    renderList(listRenewals, emptyRenewals, groups.renewal);
    renderList(listAccounts, emptyAccounts, groups.account);
    renderList(listInfo, emptyInfo, groups.info);
    renderList(listVehicle, emptyVehicle, groups.vehicle);

    // Money list is separate (funds), so we hide Life Admin "money items" usage in lists.
    // (You can still create money reminders using Life Admin items if you want — later we can add a "Money reminders" sublist.)
    renderMoney();

    // Calm Mode hides empty categories
    if (uiState.calmMode) {
      setCategoryCardVisibility("renewal", groups.renewal.length > 0);
      setCategoryCardVisibility("account", groups.account.length > 0);
      setCategoryCardVisibility("info", groups.info.length > 0);
      setCategoryCardVisibility("vehicle", groups.vehicle.length > 0);
      setCategoryCardVisibility("money", true); // money panel should stay visible
    } else {
      setCategoryCardVisibility("renewal", true);
      setCategoryCardVisibility("account", true);
      setCategoryCardVisibility("info", true);
      setCategoryCardVisibility("vehicle", true);
      setCategoryCardVisibility("money", true);
    }

    // Badges for Life Admin item categories
    const badgeItems = uiState.showArchived ? allItems : allItems.filter((i) => !i.archived);
    setCategoryBadge(badgeRenewals, badgeItems.filter((i) => i.category === "renewal"));
    setCategoryBadge(badgeAccounts, badgeItems.filter((i) => i.category === "account"));
    setCategoryBadge(badgeInfo, badgeItems.filter((i) => i.category === "info"));
    setCategoryBadge(badgeVehicle, badgeItems.filter((i) => i.category === "vehicle"));
  }

  // =========================
  // ACTIONS: edit/delete/archive/done (Life Admin items)
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

    if (action === "edit") {
      openModal("edit", item);
      return;
    }

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

      // If overdue, advance from today
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

  // =========================
  // EXPORT (entire store)
  // =========================
  document.getElementById("btnExport")?.addEventListener("click", () => {
    const store = loadStore();
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "life-setup-store.json";
    a.click();

    URL.revokeObjectURL(url);
  });

  // =========================
  // IMPORT (store or legacy array)
  // =========================
  btnImport?.addEventListener("click", async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        // If it's an array, treat as legacy Life Admin items import
        if (Array.isArray(parsed)) {
          const imported = normaliseItems(parsed);
          if (!imported.length) {
            alert("No valid Life Admin items found in that file.");
            return;
          }

          const items = loadItems();
          const map = new Map(items.map((x) => [x.id, x]));
          for (const it of imported) map.set(it.id, it);

          saveItems(Array.from(map.values()));
          renderAdmin();
          alert(`Imported ${imported.length} item(s).`);
          return;
        }

        // Else treat as full store import
        const store = normaliseStore(parsed);
        saveStore(store);
        renderAdmin();
        alert("Imported Life Setup store.");
      } catch {
        alert("Import failed. Make sure it's a valid Life Setup export file.");
      }
    });

    input.click();
  });

  // =========================
  // SAMPLE DATA (Life Admin items only)
  // =========================
  btnSampleData?.addEventListener("click", () => {
    if (!confirm("Add sample data? (You can delete it afterwards)")) return;

    const nowISO = new Date().toISOString();
    const today = startOfToday();

    const fmt = (add) => {
      const d = new Date(today);
      d.setDate(d.getDate() + add);
      return toISODate(d);
    };

    const sample = [
      {
        category: "renewal",
        name: "Car insurance",
        dueDateISO: fmt(18),
        details: "Compare quotes • check auto-renew",
        reminderProfile: "gentle",
        priority: "high",
        recurrence: "yearly",
        customDays: null,
      },
      {
        category: "renewal",
        name: "Passport expiry",
        dueDateISO: fmt(160),
        details: "Check travel validity rules",
        reminderProfile: "careful",
        priority: "normal",
        recurrence: "none",
        customDays: null,
      },
      {
        category: "vehicle",
        name: "MOT",
        dueDateISO: fmt(11),
        details: "Book a slot near work/home",
        reminderProfile: "tight",
        priority: "high",
        recurrence: "yearly",
        customDays: null,
      },
      {
        category: "account",
        name: "Phone contract",
        dueDateISO: fmt(25),
        details: "Consider SIM-only options",
        reminderProfile: "gentle",
        priority: "normal",
        recurrence: "monthly",
        customDays: null,
      },
      {
        category: "info",
        name: "Spare keys location",
        dueDateISO: null,
        details: "Top drawer in desk (non-sensitive)",
        reminderProfile: "gentle",
        priority: "normal",
        recurrence: "none",
        customDays: null,
      },
    ];

    const items = loadItems();
    for (const s of sample) {
      items.push({
        id: uid(),
        category: s.category,
        name: s.name,
        details: s.details,
        dueDateISO: s.dueDateISO,
        reminderProfile: s.reminderProfile,
        priority: s.priority,
        archived: false,
        recurrence: s.recurrence,
        customDays: s.customDays,
        createdAtISO: nowISO,
        updatedAtISO: nowISO,
        doneCount: 0,
      });
    }

    saveItems(items);
    renderAdmin();
  });

  // =========================
  // SETTINGS PLACEHOLDER
  // =========================
  document.getElementById("btnSettings")?.addEventListener("click", () => {
    alert("Settings coming soon: templates, backups, notifications, money preferences.");
  });

  // =========================
  // BOOT
  // =========================
  setActiveView("admin");
  setRecurrenceUI(itemForm?.recurrence?.value || "none");
  renderAdmin();
})();
