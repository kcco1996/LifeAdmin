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
  // GLOBAL STORE + MIGRATION (PART A/B)
  // =========================
  const LS_STORE_KEY = "lifeSetup.store.v1";
  const LS_LEGACY_LIFEADMIN = "lifeSetup.lifeAdmin.items.v5";

  function defaultRooms() {
  const mkItem = (name) => ({
    id: uid(),
    name,
    planned: false,        // ✅ planned replaces done
    priority: "normal",    // "high" | "normal"
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
    };

    base.settings = {
      ...base.settings,
      ...(typeof s?.settings === "object" && s.settings ? s.settings : {}),
    };

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
  // DOM HOOKS (Home)
  // =========================
  const roomsGrid = document.getElementById("roomsGrid");
  const roomPanel = document.getElementById("roomPanel");
  const roomTitle = document.getElementById("roomTitle");
  const roomBadge = document.getElementById("roomBadge");
  const btnCloseRoom = document.getElementById("btnCloseRoom");

  const listEssentials = document.getElementById("listEssentials");
  const listExtras = document.getElementById("listExtras");
  const emptyEssentials = document.getElementById("emptyEssentials");
  const emptyExtras = document.getElementById("emptyExtras");
  const badgeEssentials = document.getElementById("badgeEssentials");
  const badgeExtras = document.getElementById("badgeExtras");

  const formAddEssential = document.getElementById("formAddEssential");
  const formAddExtra = document.getElementById("formAddExtra");

  const roomNotes = document.getElementById("roomNotes");
  const btnSaveRoomNotes = document.getElementById("btnSaveRoomNotes");
  const btnResetRoom = document.getElementById("btnResetRoom");
  const roomBudgetSummary = document.getElementById("roomBudgetSummary");
  const roomBudgetBadge = document.getElementById("roomBudgetBadge");

  // =========================
  // DOM HOOKS (Skills)
  // =========================
  const skillsBadge = document.getElementById("skillsBadge");
  const skillsSummary = document.getElementById("skillsSummary");
  const formAddSkill = document.getElementById("formAddSkill");
  const skillsFilterChips = document.getElementById("skillsFilterChips");
  const skillsList = document.getElementById("skillsList");
  const skillsEmpty = document.getElementById("skillsEmpty");
  const skillsCountBadge = document.getElementById("skillsCountBadge");

    // =========================
  // Part D: Next Steps hooks
  // =========================
  const badgeNextSteps = document.getElementById("badgeNextSteps");
  const nextStepsToday = document.getElementById("nextStepsToday");
  const nextStepsWeek = document.getElementById("nextStepsWeek");
  const emptyNextToday = document.getElementById("emptyNextToday");
  const emptyNextWeek = document.getElementById("emptyNextWeek");

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
    renderNextSteps(); // ✅ keep dashboard in sync
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
  // Part D: Next Steps builder
  // =========================
  function buildNextSteps() {
    const today = [];
    const week = [];

    // ---- LIFE ADMIN ----
    const adminItems = loadItems().filter((i) => !i.archived);
    for (const it of adminItems) {
      const d = daysUntil(it.dueDateISO);
      if (d === null) continue;

      // Today: overdue or due within 1 day
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

      // This week: due within 7 days, or high priority within 14
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

// ---- FUTURE HOME ----
// prioritise: essentials not planned + essentials with £0 cost (budget clarity)
try {
  const home = loadHome();
  const rooms = home.rooms || {};

  for (const rk of Object.keys(rooms)) {
    const r = rooms[rk];
    const title = r.title || rk;

    const essentials = r.essentials || [];
    for (const item of essentials) {
      const nm = (item.name || "").trim();
      if (!nm) continue;

      const cost = Number(item.cost) || 0;
      const planned = !!item.planned;

      if (!planned) {
        if (cost <= 0) {
          week.push({
            source: "home",
            id: item.id || uid(),
            title: `${title}: estimate cost`,
            meta: nm,
            hint: "Adding a rough cost makes your move budget feel real (no need to be perfect).",
            tag: "Future Home",
            score: 90,
          });
        } else {
          week.push({
            source: "home",
            id: item.id || uid(),
            title: `${title}: plan this essential`,
            meta: `${nm} • £${cost.toFixed(0)}`,
            hint: "One small decision now = less overwhelm later.",
            tag: "Future Home",
            score: 95,
          });
        }
      }
    }
  }
} catch {
  // ignore
}


    // ---- LIFE SKILLS ----
    // focus: “In progress” items
    try {
      const skills = loadSkills();
      const cats = skills.categories || {};

      for (const ck of Object.keys(cats)) {
        const cat = cats[ck];
        const catTitle = cat.category || ck; // YOUR structure uses `category`
        const items = cat.items || [];

        for (const it of items) {
          const nm = (it.name || "").trim();
          if (!nm) continue;

          if (it.level === "ip") {
            today.push({
              source: "skills",
              id: it.id || uid(),
              title: `${catTitle}: practise`,
              meta: nm,
              hint: "Even one attempt counts — you can mark it as confident later.",
              tag: "Life Skills",
              score: 110,
            });
          }
        }
      }
    } catch {
      // ignore
    }

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

    // badge
    if (badgeNextSteps) {
      const total = today.length + week.length;
      badgeNextSteps.className = total ? "badge badge--warn" : "badge badge--ok";
      badgeNextSteps.textContent = total ? `${total} suggested` : "Clear";
    }

    // today list
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
          ${
            t.source === "admin"
              ? `<button class="mini-btn" type="button" data-ns-action="openAdmin" data-id="${t.id}">Open</button>`
              : `<button class="mini-btn" type="button" data-ns-action="go" data-view="${t.source === "home" ? "home" : "skills"}">Go</button>`
          }
          <span class="nextstep-tag">${escapeHtml(t.tag)}</span>
        </div>
      `;
      nextStepsToday.appendChild(li);
    }

    // week list
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
          ${
            t.source === "admin"
              ? `<button class="mini-btn" type="button" data-ns-action="openAdmin" data-id="${t.id}">Open</button>`
              : `<button class="mini-btn" type="button" data-ns-action="go" data-view="${t.source === "home" ? "home" : "skills"}">Go</button>`
          }
          <span class="nextstep-tag">${escapeHtml(t.tag)}</span>
        </div>
      `;
      nextStepsWeek.appendChild(li);
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
      renderNextSteps();
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

      const next =
        action === "deposit"
          ? Number(fund.current ?? 0) + amt
          : Math.max(0, Number(fund.current ?? 0) - amt);

      store.money.funds[idx] = {
        ...fund,
        current: next,
        updatedAtISO: new Date().toISOString(),
      };

      store.money.funds = normaliseFunds(store.money.funds);
      saveStore(store);
      renderMoney();
      renderNextSteps();
    }
  });

  // =========================
  // Home + Skills save/load
  // =========================
  function normaliseHomeItem(it) {
  const name = String(it?.name ?? "").trim();
  if (!name) return null;

  const nowISO = new Date().toISOString();

  // ✅ migrate old shape: { done, cost } -> { planned, cost }
  const planned =
    typeof it?.planned === "boolean" ? it.planned :
    typeof it?.done === "boolean" ? it.done :
    false;

  const priority = it?.priority === "high" ? "high" : "normal";

  const costNum = Number(it?.cost ?? 0);
  const cost = Number.isFinite(costNum) && costNum >= 0 ? costNum : 0;

  return {
    id: String(it?.id ?? uid()),
    name,
    planned: Boolean(planned),
    priority,
    cost,
    notes: String(it?.notes ?? ""),
    createdAtISO: String(it?.createdAtISO ?? nowISO),
    updatedAtISO: String(it?.updatedAtISO ?? nowISO),
  };
}

function normaliseRoom(room, fallbackTitle) {
  const title = String(room?.title ?? fallbackTitle ?? "Room");

  const essentialsRaw = Array.isArray(room?.essentials) ? room.essentials : [];
  const extrasRaw = Array.isArray(room?.extras) ? room.extras : [];

  const essentials = essentialsRaw.map(normaliseHomeItem).filter(Boolean);
  const extras = extrasRaw.map(normaliseHomeItem).filter(Boolean);

  return {
    title,
    notes: String(room?.notes ?? ""),
    essentials,
    extras,
  };
}

// ✅ HOME now lives in the main store (versioned)
function loadHome() {
  const store = loadStore();

  // ensure section exists + version
  if (!store.home || typeof store.home !== "object") store.home = {};
  if (!store.home.version) store.home.version = 2;

  // ensure rooms exist
  const templates = defaultRooms();
  const existing = store.home.rooms && typeof store.home.rooms === "object" ? store.home.rooms : {};

  const outRooms = {};
  for (const key of Object.keys(templates)) {
    outRooms[key] = normaliseRoom(existing[key], templates[key].title);
    // if room missing completely, seed from template
    if (!existing[key]) outRooms[key] = normaliseRoom(templates[key], templates[key].title);
  }

  store.home.rooms = outRooms;
  store.home.version = 2;
  saveStore(store);

  return store.home;
}

function saveHome(home) {
  const store = loadStore();
  store.home = home;
  store.home.version = 2;
  saveStore(store);
}


  // =========================
// FUTURE HOME (Part E)
// =========================
let activeRoomKey = null;

// Optional top summary bar hooks (safe if missing)
const homeSummaryEss = document.getElementById("homeSummaryEssentials");
const homeSummaryEx = document.getElementById("homeSummaryExtras");
const homeSummaryCosts = document.getElementById("homeSummaryCosts");

// Room-level filters (safe if missing)
const roomSearch = document.getElementById("roomSearch");
const chkPlannedOnly = document.getElementById("chkPlannedOnly");

// Add/Edit modal hooks (safe if missing)
const homeItemModal = document.getElementById("homeItemModal");
const homeItemModalTitle = document.getElementById("homeItemModalTitle");
const homeItemBackdrop = homeItemModal?.querySelector(".modal__backdrop");
const btnCloseHomeItemModal = document.getElementById("btnCloseHomeItemModal");
const btnCancelHomeItemModal = document.getElementById("btnCancelHomeItemModal");
const homeItemForm = document.getElementById("homeItemForm");

let editingHomeItem = { roomKey: null, kind: null, id: null };

function homeRoomStats(room) {
  const essTotal = room.essentials.length;
  const essPlanned = room.essentials.filter((x) => x.planned).length;
  const exTotal = room.extras.length;
  const exPlanned = room.extras.filter((x) => x.planned).length;

  const essCost = room.essentials.reduce((a, it) => a + (Number(it.cost) || 0), 0);
  const exCost = room.extras.reduce((a, it) => a + (Number(it.cost) || 0), 0);

  return { essTotal, essPlanned, exTotal, exPlanned, essCost, exCost, totalCost: essCost + exCost };
}

function homeTotals(home) {
  const rooms = home.rooms || {};
  let essTotal = 0, essPlanned = 0, exTotal = 0, exPlanned = 0;
  let essCost = 0, exCost = 0;

  for (const rk of Object.keys(rooms)) {
    const st = homeRoomStats(rooms[rk]);
    essTotal += st.essTotal;
    essPlanned += st.essPlanned;
    exTotal += st.exTotal;
    exPlanned += st.exPlanned;
    essCost += st.essCost;
    exCost += st.exCost;
  }

  return { essTotal, essPlanned, exTotal, exPlanned, essCost, exCost, overallCost: essCost + exCost };
}

function renderHomeSummary() {
  const home = loadHome();
  const t = homeTotals(home);

  if (homeSummaryEss) homeSummaryEss.textContent = `${t.essPlanned}/${t.essTotal}`;
  if (homeSummaryEx) homeSummaryEx.textContent = `${t.exPlanned}/${t.exTotal}`;

  if (homeSummaryCosts) {
    homeSummaryCosts.innerHTML = `
      <span class="money-chip">Essentials: <strong>${fmtGBP(t.essCost)}</strong></span>
      <span class="money-chip">Extras: <strong>${fmtGBP(t.exCost)}</strong></span>
      <span class="money-chip">Overall: <strong>${fmtGBP(t.overallCost)}</strong></span>
    `;
  }
}

function renderRoomsGrid() {
  if (!roomsGrid) return;

  const home = loadHome();
  const rooms = home.rooms || {};

  roomsGrid.innerHTML = "";

  for (const key of Object.keys(rooms)) {
    const room = rooms[key];
    const st = homeRoomStats(room);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "room-card";
    btn.dataset.roomKey = key;

    // Optional: room cost total
    const roomCost = st.totalCost > 0 ? ` • ${fmtGBP(st.totalCost)}` : "";

    btn.innerHTML = `
      <div class="room-card__title">${escapeHtml(room.title)}</div>
      <div class="room-card__meta">
        Essentials: ${st.essPlanned}/${st.essTotal} • Extras: ${st.exPlanned}/${st.exTotal}${roomCost}
      </div>
    `;

    btn.addEventListener("click", () => openRoom(key));
    roomsGrid.appendChild(btn);
  }

  renderHomeSummary(); // ✅ top bar stays in sync
}

function openRoom(roomKey) {
  activeRoomKey = roomKey;

  const home = loadHome();
  const room = home.rooms[roomKey];
  if (!room) return;

  if (roomTitle) roomTitle.textContent = room.title;
  if (roomPanel) roomPanel.hidden = false;
  if (roomNotes) roomNotes.value = room.notes || "";

  // reset filters
  if (roomSearch) roomSearch.value = "";
  if (chkPlannedOnly) chkPlannedOnly.checked = false;

  renderRoomLists();
}

function closeRoom() {
  activeRoomKey = null;
  if (roomPanel) roomPanel.hidden = true;
}

btnCloseRoom?.addEventListener("click", closeRoom);

roomSearch?.addEventListener("input", renderRoomLists);
chkPlannedOnly?.addEventListener("change", renderRoomLists);

function applyRoomFilters(items) {
  let out = [...items];

  const q = (roomSearch?.value ?? "").trim().toLowerCase();
  if (q) {
    out = out.filter((it) =>
      (it.name || "").toLowerCase().includes(q) ||
      (it.notes || "").toLowerCase().includes(q)
    );
  }

  if (chkPlannedOnly?.checked) out = out.filter((it) => !!it.planned);

  return out;
}

function setHomeBadges(room) {
  const st = homeRoomStats(room);

  if (badgeEssentials) {
    badgeEssentials.className = st.essPlanned < st.essTotal ? "badge badge--warn" : "badge badge--ok";
    badgeEssentials.textContent = `${st.essPlanned}/${st.essTotal}`;
  }
  if (badgeExtras) {
    badgeExtras.className = st.exPlanned ? "badge badge--ok" : "badge badge--neutral";
    badgeExtras.textContent = `${st.exPlanned}/${st.exTotal}`;
  }

  if (roomBadge) {
    roomBadge.className = st.essPlanned === st.essTotal && st.essTotal > 0 ? "badge badge--ok" : "badge badge--warn";
    roomBadge.textContent = st.essPlanned === st.essTotal && st.essTotal > 0 ? "Essentials planned" : "Essentials first";
  }

  if (roomBudgetSummary) {
    roomBudgetSummary.innerHTML = `
      <span class="money-chip">Essentials: <strong>${fmtGBP(st.essCost)}</strong></span>
      <span class="money-chip">Extras: <strong>${fmtGBP(st.exCost)}</strong></span>
      <span class="money-chip">Room total: <strong>${fmtGBP(st.totalCost)}</strong></span>
    `;
  }

  if (roomBudgetBadge) {
    roomBudgetBadge.className = st.totalCost > 0 ? "badge badge--ok" : "badge badge--neutral";
    roomBudgetBadge.textContent = st.totalCost > 0 ? "Budgeted" : "No costs yet";
  }
}

function renderRoomLists() {
  const home = loadHome();
  const room = home.rooms[activeRoomKey];
  if (!room) return;

  setHomeBadges(room);

  const renderItems = (listEl, emptyEl, rawItems, kind) => {
    if (!listEl) return;
    listEl.innerHTML = "";

    const items = applyRoomFilters(rawItems);

    if (!items.length) {
      emptyEl?.removeAttribute("hidden");
      return;
    }
    emptyEl?.setAttribute("hidden", "true");

    for (const it of items) {
      const li = document.createElement("li");
      li.className = "list__item list__item--neutral";

      const cost = Number(it.cost) || 0;
      const prioOn = it.priority === "high";

      li.innerHTML = `
        <div class="room-item" style="width:100%;">
          <div class="room-item__left">
            <button class="tick ${it.planned ? "is-on" : ""}" type="button"
              data-room-action="togglePlanned" data-kind="${kind}" data-id="${it.id}"></button>

            <div style="min-width:0;">
              <div class="room-item__title">${escapeHtml(it.name)}</div>
              <div class="room-item__meta">
                ${it.planned ? "Planned" : "Not planned"} •
                <button class="mini-btn ${prioOn ? "mini-btn--warn" : ""}" type="button"
                  data-room-action="togglePriority" data-kind="${kind}" data-id="${it.id}">
                  ${prioOn ? "⭐ High" : "☆ Normal"}
                </button>
                ${it.notes?.trim() ? ` • ${escapeHtml(it.notes.trim())}` : ""}
              </div>
            </div>
          </div>

          <div class="row-actions">
            <span class="cost">${fmtGBP(cost)}</span>
            <button class="mini-btn" type="button" data-room-action="edit" data-kind="${kind}" data-id="${it.id}">Edit</button>
            <button class="mini-btn mini-btn--danger" type="button" data-room-action="delete" data-kind="${kind}" data-id="${it.id}">Delete</button>
          </div>
        </div>
      `;

      listEl.appendChild(li);
    }
  };

  renderItems(listEssentials, emptyEssentials, room.essentials, "essentials");
  renderItems(listExtras, emptyExtras, room.extras, "extras");

  renderHomeSummary();
}

function openHomeItemModal(mode, payload) {
  // payload: { roomKey, kind, item? }
  const { roomKey, kind, item } = payload;

  editingHomeItem = { roomKey, kind, id: mode === "edit" ? item?.id : null };

  // If you haven’t added the modal HTML yet, fallback to prompts
  if (!homeItemModal || !homeItemForm) {
    const nm = prompt("Item name:", item?.name ?? "");
    if (nm === null) return;

    const planned = confirm("Planned? OK = planned, Cancel = not planned");
    const high = confirm("High priority? OK = High (⭐), Cancel = Normal");
    const costRaw = prompt("Estimated cost (£):", String(Number(item?.cost ?? 0)));
    if (costRaw === null) return;
    const notes = prompt("Notes:", item?.notes ?? "");
    if (notes === null) return;

    upsertRoomItem(roomKey, kind, {
      id: item?.id,
      name: nm.trim() || item?.name || "Item",
      planned,
      priority: high ? "high" : "normal",
      cost: Number(costRaw) || 0,
      notes: notes.trim(),
    });
    return;
  }

  if (homeItemModalTitle) homeItemModalTitle.textContent = mode === "edit" ? "Edit item" : "Add item";
  homeItemForm.reset();

  // expected form fields: name, planned, priority, cost, notes, bucket(kind) optional
  if (homeItemForm.name) homeItemForm.name.value = item?.name ?? "";
  if (homeItemForm.planned) homeItemForm.planned.checked = !!item?.planned;
  if (homeItemForm.priority) homeItemForm.priority.value = item?.priority ?? "normal";
  if (homeItemForm.cost) homeItemForm.cost.value = item?.cost != null ? String(Number(item.cost) || 0) : "";
  if (homeItemForm.notes) homeItemForm.notes.value = item?.notes ?? "";
  if (homeItemForm.kind) homeItemForm.kind.value = kind; // optional hidden field

  homeItemModal.setAttribute("aria-hidden", "false");
  homeItemModal.classList.add("is-open");
  homeItemForm.name?.focus?.();
}

function closeHomeItemModal() {
  homeItemModal?.setAttribute("aria-hidden", "true");
  homeItemModal?.classList.remove("is-open");
  editingHomeItem = { roomKey: null, kind: null, id: null };
}

btnCloseHomeItemModal?.addEventListener("click", closeHomeItemModal);
btnCancelHomeItemModal?.addEventListener("click", closeHomeItemModal);
homeItemBackdrop?.addEventListener("click", closeHomeItemModal);

homeItemForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const roomKey = editingHomeItem.roomKey;
  const kind = editingHomeItem.kind;
  if (!roomKey || !kind) return;

  const name = String(homeItemForm.name?.value ?? "").trim();
  if (!name) {
    alert("Please enter a name.");
    homeItemForm.name?.focus?.();
    return;
  }

  const planned = !!homeItemForm.planned?.checked;
  const priority = homeItemForm.priority?.value === "high" ? "high" : "normal";

  const costNum = Number(homeItemForm.cost?.value ?? 0);
  const cost = Number.isFinite(costNum) && costNum >= 0 ? costNum : 0;

  const notes = String(homeItemForm.notes?.value ?? "").trim();

  upsertRoomItem(roomKey, kind, {
    id: editingHomeItem.id,
    name,
    planned,
    priority,
    cost,
    notes,
  });

  closeHomeItemModal();
});

function upsertRoomItem(roomKey, kind, patch) {
  const home = loadHome();
  const room = home.rooms[roomKey];
  if (!room) return;

  const arr = kind === "extras" ? room.extras : room.essentials;
  const nowISO = new Date().toISOString();

  if (patch.id) {
    const idx = arr.findIndex((x) => x.id === patch.id);
    if (idx >= 0) {
      arr[idx] = {
        ...arr[idx],
        ...patch,
        updatedAtISO: nowISO,
      };
    }
  } else {
    arr.push({
      id: uid(),
      name: patch.name,
      planned: !!patch.planned,
      priority: patch.priority === "high" ? "high" : "normal",
      cost: Number(patch.cost) || 0,
      notes: patch.notes || "",
      createdAtISO: nowISO,
      updatedAtISO: nowISO,
    });
  }

  saveHome(home);
  renderRoomLists();
  renderRoomsGrid();
  renderNextSteps();
}

function addRoomItem(kind) {
  if (!activeRoomKey) return;
  openHomeItemModal("add", { roomKey: activeRoomKey, kind });
}

// ✅ your existing “Add essential/extra” forms can now open the modal
formAddEssential?.addEventListener("submit", (e) => {
  e.preventDefault();
  addRoomItem("essentials");
  formAddEssential.reset();
});

formAddExtra?.addEventListener("submit", (e) => {
  e.preventDefault();
  addRoomItem("extras");
  formAddExtra.reset();
});

roomPanel?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-room-action]");
  if (!btn) return;

  const action = btn.getAttribute("data-room-action");
  const kind = btn.getAttribute("data-kind");
  const id = btn.getAttribute("data-id");
  if (!action || !kind || !id) return;

  const home = loadHome();
  const room = home.rooms[activeRoomKey];
  if (!room) return;

  const arr = kind === "extras" ? room.extras : room.essentials;
  const idx = arr.findIndex((x) => x.id === id);
  if (idx === -1) return;

  const nowISO = new Date().toISOString();

  if (action === "togglePlanned") {
    arr[idx].planned = !arr[idx].planned;
    arr[idx].updatedAtISO = nowISO;
    saveHome(home);
    renderRoomLists();
    renderRoomsGrid();
    renderNextSteps();
    return;
  }

  if (action === "togglePriority") {
    arr[idx].priority = arr[idx].priority === "high" ? "normal" : "high";
    arr[idx].updatedAtISO = nowISO;
    saveHome(home);
    renderRoomLists();
    renderRoomsGrid();
    renderNextSteps();
    return;
  }

  if (action === "delete") {
    if (!confirm("Delete this item?")) return;
    arr.splice(idx, 1);
    saveHome(home);
    renderRoomLists();
    renderRoomsGrid();
    renderNextSteps();
    return;
  }

  if (action === "edit") {
    openHomeItemModal("edit", { roomKey: activeRoomKey, kind, item: arr[idx] });
  }
});

btnSaveRoomNotes?.addEventListener("click", () => {
  if (!activeRoomKey) return;
  const home = loadHome();
  const room = home.rooms[activeRoomKey];
  if (!room) return;

  room.notes = (roomNotes?.value ?? "").trim();
  saveHome(home);

  alert("Room notes saved.");
});

btnResetRoom?.addEventListener("click", () => {
  if (!activeRoomKey) return;
  if (!confirm("Reset this room back to its template? This will overwrite items + notes.")) return;

  const templates = defaultRooms();
  const home = loadHome();

  home.rooms[activeRoomKey] = normaliseRoom(templates[activeRoomKey], templates[activeRoomKey]?.title);
  saveHome(home);

  openRoom(activeRoomKey);
  renderRoomsGrid();
  renderNextSteps();
});

  // =========================
  // LIFE SKILLS (Part B)
  // =========================
  const skillsState = { filter: "all" };

  function skillLevelLabel(level) {
    if (level === "ns") return { text: "Not started", cls: "skill-pill skill-pill--ns" };
    if (level === "ip") return { text: "In progress", cls: "skill-pill skill-pill--ip" };
    return { text: "Confident", cls: "skill-pill skill-pill--cf" };
  }

  function nextSkillLevel(level) {
    if (level === "ns") return "ip";
    if (level === "ip") return "cf";
    return "ns";
  }

  function flattenSkills(categoriesObj) {
    const all = [];
    for (const key of Object.keys(categoriesObj)) {
      const cat = categoriesObj[key];
      for (const it of cat.items ?? []) {
        all.push({ ...it, category: key });
      }
    }
    return all;
  }

  function renderSkills() {
    const skills = loadSkills();
    const categories = skills.categories;
    const all = flattenSkills(categories);

    const ns = all.filter((x) => x.level === "ns").length;
    const ip = all.filter((x) => x.level === "ip").length;
    const cf = all.filter((x) => x.level === "cf").length;

    if (skillsBadge) {
      skillsBadge.className = cf > 0 ? "badge badge--ok" : "badge badge--neutral";
      skillsBadge.textContent = `${cf} confident`;
    }

    if (skillsCountBadge) {
      skillsCountBadge.className = "badge badge--neutral";
      skillsCountBadge.textContent = `${all.length} total`;
    }

    if (skillsSummary) {
      skillsSummary.innerHTML = `
        <span class="money-chip">Not started: <strong>${ns}</strong></span>
        <span class="money-chip">In progress: <strong>${ip}</strong></span>
        <span class="money-chip">Confident: <strong>${cf}</strong></span>
      `;
    }

    let visible = [...all];
    if (skillsState.filter !== "all") visible = visible.filter((x) => x.category === skillsState.filter);

    const order = { ns: 0, ip: 1, cf: 2 };
    visible.sort((a, b) => {
      if (order[a.level] !== order[b.level]) return order[a.level] - order[b.level];
      return a.name.localeCompare(b.name);
    });

    if (!skillsList) return;
    skillsList.innerHTML = "";

    if (!visible.length) {
      skillsEmpty?.removeAttribute("hidden");
      return;
    }
    skillsEmpty?.setAttribute("hidden", "true");

    for (const s of visible) {
      const pill = skillLevelLabel(s.level);

      const li = document.createElement("li");
      li.className = "list__item list__item--neutral";
      li.innerHTML = `
        <div class="list__main">
          <div class="list__title">${escapeHtml(s.name)}</div>
          <div class="list__meta">${escapeHtml(s.category)}</div>
        </div>

        <div class="row-actions">
          <button class="mini-btn" type="button" data-skill-action="toggle" data-id="${s.id}" data-category="${escapeHtml(s.category)}">
            Update
          </button>
          <button class="mini-btn" type="button" data-skill-action="rename" data-id="${s.id}" data-category="${escapeHtml(s.category)}">
            Rename
          </button>
          <button class="mini-btn mini-btn--danger" type="button" data-skill-action="delete" data-id="${s.id}" data-category="${escapeHtml(s.category)}">
            Delete
          </button>
          <span class="${pill.cls}">${pill.text}</span>
        </div>
      `;
      skillsList.appendChild(li);
    }
  }

  formAddSkill?.addEventListener("submit", (e) => {
    e.preventDefault();

    const category = formAddSkill.category.value;
    const name = formAddSkill.name.value.trim();
    if (!name) return;

    const skills = loadSkills();
    if (!skills.categories[category]) skills.categories[category] = { category, items: [] };

    skills.categories[category].items.push({
      id: uid(),
      name,
      level: "ns",
      notes: "",
      createdAtISO: new Date().toISOString(),
    });

    saveSkills(skills);
    formAddSkill.reset();
    renderSkills();
   renderNextSteps(); // ✅
  });

  skillsFilterChips?.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-skill-filter]");
    if (!chip) return;

    const key = chip.getAttribute("data-skill-filter");
    if (!key) return;

    skillsState.filter = key;

    Array.from(skillsFilterChips.querySelectorAll(".chip")).forEach((c) =>
      c.classList.toggle("is-active", c === chip)
    );

    renderSkills();
    renderNextSteps(); // ✅
  });

  skillsList?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-skill-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-skill-action");
    const id = btn.getAttribute("data-id");
    const category = btn.getAttribute("data-category");

    if (!action || !id || !category) return;

    const skills = loadSkills();
    const cat = skills.categories[category];
    if (!cat) return;

    const idx = cat.items.findIndex((x) => x.id === id);
    if (idx === -1) return;

    if (action === "toggle") {
      cat.items[idx].level = nextSkillLevel(cat.items[idx].level);
      saveSkills(skills);
      renderSkills();
      renderNextSteps(); // ✅
      return;
    }

    if (action === "rename") {
      const next = prompt("Rename skill:", cat.items[idx].name);
      if (next === null) return;
      cat.items[idx].name = next.trim() || cat.items[idx].name;
      saveSkills(skills);
      renderSkills();
      renderNextSteps(); // ✅
      return;
    }

    if (action === "delete") {
      if (!confirm("Delete this skill?")) return;
      cat.items.splice(idx, 1);
      saveSkills(skills);
      renderSkills();
      renderNextSteps(); // ✅
    }
  });

  // =========================
  // MAIN RENDER
  // =========================
  function renderAdmin() {
    const allItems = loadItems();

    if (AUTO_CALM_ENABLED && uiState.calmModeManual === null) {
      uiState.calmMode = urgentCount(allItems) > AUTO_CALM_THRESHOLD;
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
      money: visible.filter((i) => i.category === "money"),
    };

    renderList(listRenewals, emptyRenewals, groups.renewal);
    renderList(listAccounts, emptyAccounts, groups.account);
    renderList(listInfo, emptyInfo, groups.info);
    renderList(listVehicle, emptyVehicle, groups.vehicle);

    // Funds list (separate storage)
    renderMoney();

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

       // ✅ Part D: keep Next Steps in sync
    renderNextSteps();
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
  // Part D: Next Steps clicks
  // =========================
  document.getElementById("nextStepsWrap")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-ns-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-ns-action");
    if (action === "go") {
      const view = btn.getAttribute("data-view");
      if (view) setActiveView(view);
      return;
    }

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

        const store = normaliseStore(parsed);
        saveStore(store);

        loadHome();
        loadSkills();

        renderAdmin();
        renderRoomsGrid();
        renderSkills();
        renderNextSteps(); // ✅

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

function normaliseHomeItem(x) {
  const name = (x?.name ?? "").toString().trim();
  if (!name) return null;

  const item = {
    id: (x?.id ?? uid()).toString(),
    name,
    bucket: x?.bucket === "extra" ? "extra" : "essential",
    planned: Boolean(x?.planned ?? false),
    priority: x?.priority === "high" ? "high" : "normal",
    cost: x?.cost != null && String(x.cost).trim() !== "" ? Number(x.cost) : null,
    notes: (x?.notes ?? "").toString(),
    createdAtISO: (x?.createdAtISO ?? new Date().toISOString()).toString(),
    updatedAtISO: (x?.updatedAtISO ?? new Date().toISOString()).toString(),
  };

  if (!Number.isFinite(item.cost)) item.cost = null;
  if (item.cost != null && item.cost < 0) item.cost = null;

  return item;
}

function roomById(rooms, roomId) {
  return rooms.find(r => r.id === roomId) || null;
}

function loadSkills() {
  const store = loadStore();
  if (!store.skills?.categories || Object.keys(store.skills.categories).length === 0) {
    store.skills = { categories: defaultSkills() };
    saveStore(store);
  }
  return store.skills;
}

function saveSkills(skills) {
  const store = loadStore();
  store.skills = skills;
  saveStore(store);
}


  // =========================
  // BOOT (Part B)
  // =========================
  setActiveView("admin");
  setRecurrenceUI(itemForm?.recurrence?.value || "none");

  loadHome();
  loadSkills();

  renderAdmin();
  renderRoomsGrid();
  renderHomeSummary();
  renderSkills();
  renderNextSteps(); // ✅
})();
