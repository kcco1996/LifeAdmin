(() => {
  "use strict";

  // =========================
  // ROUTER: Admin / Home / Skills
  // =========================
  const navButtons = Array.from(document.querySelectorAll(".nav__item"));
  const views = {
    admin: document.getElementById("view-admin"),
    home: document.getElementById("view-home"),
    skills: document.getElementById("view-skills"),
  };

  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  const btnMenu = document.getElementById("btnMenu");
  const sidebar = document.querySelector(".sidebar");

  const viewMeta = {
    admin: {
      title: "Life Admin",
      subtitle: "Keep your real-world life organised with calm, smart nudges.",
    },
    home: {
      title: "Future Home",
      subtitle: "Plan furniture essentials first, then extras when you're ready.",
    },
    skills: {
      title: "Life Skills",
      subtitle: "Everyday living skills with progress you can actually see.",
    },
  };

  function setActiveView(viewKey) {
    // highlight nav buttons
    navButtons.forEach((btn) =>
      btn.classList.toggle("is-active", btn.dataset.view === viewKey)
    );
    // show/hide views
    Object.keys(views).forEach((k) =>
      views[k]?.classList.toggle("is-visible", k === viewKey)
    );
    // update title/subtitle
    pageTitle.textContent = viewMeta[viewKey]?.title ?? "Life Admin";
    pageSubtitle.textContent = viewMeta[viewKey]?.subtitle ?? "";
    // close sidebar
    sidebar?.classList.remove("is-open");
  }

  // nav button clicks
  navButtons.forEach((btn) =>
    btn.addEventListener("click", () => setActiveView(btn.dataset.view))
  );

  // hamburger / menu toggle
  btnMenu?.addEventListener("click", () => sidebar?.classList.toggle("is-open"));

})();

(() => {
  "use strict";

  // =========================
  // STORAGE HELPERS
  // =========================
  const LS_KEY = "lifeSetup.lifeAdmin.items.v6";

  // Generate a unique ID
  const uid = () =>
    crypto?.randomUUID
      ? crypto.randomUUID()
      : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  // Safely parse JSON array
  const safeParseArray = (raw) => {
    try {
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  // Load items from localStorage and normalize
  function loadItems() {
    const raw = localStorage.getItem(LS_KEY);
    return normaliseItems(safeParseArray(raw) ?? []);
  }

  // Save items to localStorage
  function saveItems(items) {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }

  // Normalize items with defaults, validation, recurrence
  function normaliseItems(arr) {
    const nowISO = new Date().toISOString();

    return arr
      .map((x) => {
        const name = (x?.name ?? x?.title ?? "").toString().trim();
        if (!name) return null;

        const item = {
          id: x?.id ?? uid(),
          category: ["renewal", "account", "vehicle", "info"].includes(x?.category)
            ? x.category
            : "renewal",
          name,
          details: x?.details?.toString() ?? "",
          dueDateISO: x?.dueDateISO ?? x?.dueDate ?? null,
          reminderProfile: ["gentle", "careful", "tight"].includes(x?.reminderProfile)
            ? x.reminderProfile
            : "gentle",
          priority: ["normal", "high"].includes(x?.priority) ? x.priority : "normal",
          archived: Boolean(x?.archived ?? false),
          recurrence: ["none", "weekly", "monthly", "yearly", "custom"].includes(x?.recurrence)
            ? x.recurrence
            : "none",
          customDays: x?.customDays != null ? Number(x.customDays) : null,
          createdAtISO: x?.createdAtISO ?? nowISO,
          updatedAtISO: x?.updatedAtISO ?? nowISO,
          doneCount: Number.isFinite(Number(x?.doneCount)) ? Number(x.doneCount) : 0,
        };

        // Validate dueDate format (YYYY-MM-DD)
        if (item.dueDateISO && !/^\d{4}-\d{2}-\d{2}$/.test(item.dueDateISO))
          item.dueDateISO = null;

        // Recurrence handling
        if (item.recurrence !== "custom") item.customDays = null;
        if (item.recurrence === "custom" && (!item.customDays || item.customDays <= 0))
          item.customDays = 30;

        return item;
      })
      .filter(Boolean);
  }

})();

(() => {
  "use strict";

  // =========================
  // DATE UTILITIES
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

  function isDueThisWeek(item) {
    const d = daysUntil(item.dueDateISO);
    return d !== null && d <= 7;
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

  // =========================
  // RECURRENCE DATE HELPERS
  // =========================
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
  // URGENCY & CALM MODE HELPERS
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
    // Calm mode: hide non-urgent and archived items
    return items.filter((i) => !i.archived && isUrgentItem(i));
  }

  function setCategoryCardVisibility(categoryKey, hasItems) {
    const card = document.querySelector(`[data-cat-card="${categoryKey}"]`);
    if (!card) return;
    card.hidden = !hasItems;
  }

})();

(() => {
  "use strict";

  // =========================
  // NUDGES
  // =========================
  function profileWindows(profile) {
    if (profile === "careful") return [56, 28, 14, 7, 1];
    if (profile === "tight") return [21, 7, 1];
    return [42, 21, 7, 1]; // gentle
  }

  function gentleNudge(item, d) {
    const name = (item.name || "").toLowerCase();
    const windows = profileWindows(item.reminderProfile);

    if (item.archived) return "Archived — you can unarchive it any time.";

    if (d === null) {
      if (item.category === "info") return "Handy to keep this here so you don’t have to hunt for it later.";
      return "Worth keeping this saved so it stays easy to manage.";
    }

    if (d < 0) return "It might be worth sorting this soon, just to get it off your mind.";

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

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();

(() => {
  "use strict";

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
        return { ...base, category: "renewal", name: "Car insurance", details: "Compare quotes • check auto-renew", recurrence: "yearly", priority: "high", dueDateISO: addYearsISO(todayISO, 1) };
      case "mot":
        return { ...base, category: "vehicle", name: "MOT", details: "Book early for a convenient date", recurrence: "yearly", priority: "high", dueDateISO: addYearsISO(todayISO, 1) };
      case "carService":
        return { ...base, category: "vehicle", name: "Car service", details: "Full/Interim (note mileage)", recurrence: "yearly", priority: "normal", dueDateISO: addYearsISO(todayISO, 1) };
      case "passport":
        return { ...base, category: "renewal", name: "Passport expiry", details: "Some countries require 6 months validity", recurrence: "none", priority: "normal" };
      case "travelInsurance":
        return { ...base, category: "renewal", name: "Travel insurance", details: "Check cover for the trip dates", recurrence: "none", priority: "normal" };
      case "phoneContract":
        return { ...base, category: "account", name: "Phone contract", details: "Consider SIM-only options", recurrence: "monthly", priority: "normal", dueDateISO: addMonthsISO(todayISO, 1) };
      case "subscriptionReview":
        return { ...base, category: "account", name: "Subscription review", details: "Cancel anything unused", recurrence: "custom", customDays: 90, priority: "normal", dueDateISO: addDaysISO(todayISO, 90) };
      default: return null;
    }
  }
})();

(() => {
  "use strict";

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
  });

  itemForm?.recurrence?.addEventListener("change", () => {
    setRecurrenceUI(itemForm.recurrence.value);
  });
})();

(() => {
  "use strict";

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
    uiState.calmModeManual = next; // user override
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
})();

(() => {
  "use strict";

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
})();

(() => {
  "use strict";

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
})();

(() => {
  "use strict";

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

})();

(() => {
  "use strict";

  // =========================
  // BADGES & LIST
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
})();

(() => {
  "use strict";

  // =========================
  // BADGES & LIST
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
})();

(() => {
  "use strict";

  // =========================
  // ACTIONS: edit/delete/archive/done
  // =========================
  document.getElementById("view-admin")?.addEventListener("click", (e) => {
    const target = e.target;
    const btn = target.closest("button[data-action]");
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
  // EXPORT
  // =========================
  document.getElementById("btnExport")?.addEventListener("click", () => {
    const items = loadItems();
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "life-setup-life-admin.json";
    a.click();

    URL.revokeObjectURL(url);
  });

  // =========================
  // IMPORT
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
        if (!Array.isArray(parsed)) throw new Error("JSON must be an array.");

        const imported = normaliseItems(parsed);
        if (!imported.length) {
          alert("No valid items found in that file.");
          return;
        }

        const existing = loadItems();
        const map = new Map(existing.map((x) => [x.id, x]));
        for (const it of imported) map.set(it.id, it);

        saveItems(Array.from(map.values()));
        renderAdmin();
        alert(`Imported ${imported.length} item(s).`);
      } catch {
        alert("Import failed. Make sure it's a Life Admin JSON export file.");
      }
    });

    input.click();
  });

  // =========================
  // SAMPLE DATA
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
      { category: "renewal", name: "Car insurance", dueDateISO: fmt(18), details: "Compare quotes • check auto-renew", reminderProfile: "gentle", priority: "high", recurrence: "yearly", customDays: null },
      { category: "renewal", name: "Passport expiry", dueDateISO: fmt(160), details: "Check travel validity rules", reminderProfile: "careful", priority: "normal", recurrence: "none", customDays: null },
      { category: "vehicle", name: "MOT", dueDateISO: fmt(11), details: "Book a slot near work/home", reminderProfile: "tight", priority: "high", recurrence: "yearly", customDays: null },
      { category: "account", name: "Phone contract", dueDateISO: fmt(25), details: "Consider SIM-only options", reminderProfile: "gentle", priority: "normal", recurrence: "monthly", customDays: null },
      { category: "info", name: "Spare keys location", dueDateISO: null, details: "Top drawer in desk (non-sensitive)", reminderProfile: "gentle", priority: "normal", recurrence: "none", customDays: null },
    ];

    const items = loadItems();
    for (const s of sample) {
      items.push({ ...s, id: uid(), archived: false, createdAtISO: nowISO, updatedAtISO: nowISO, doneCount: 0 });
    }

    saveItems(items);
    renderAdmin();
  });

  // =========================
  // SETTINGS PLACEHOLDER
  // =========================
  document.getElementById("btnSettings")?.addEventListener("click", () => {
    alert("Settings coming soon: templates, backups, notifications.");
  });

})();
