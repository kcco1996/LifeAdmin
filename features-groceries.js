/* features-groceries.js
   Groceries page for Life Admin (localStorage)
*/
(() => {
  const APP_KEY = "lifeAdmin:v1";
  const GRO_KEY = "lifeAdmin:groceries:v1";

  const $ = (id) => document.getElementById(id);

  const CATS = [
    "Fruit & Veg","Meat","Fish","Dairy","Freezer","Cupboard",
    "Snacks","Drinks","Household","Pet","Other"
  ];

  function safeJsonParse(raw, fallback) {
    try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
  }

  function loadAppState() {
    return safeJsonParse(localStorage.getItem(APP_KEY), {});
  }

  function saveAppState(state) {
    localStorage.setItem(APP_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("lifeadmin:datachanged"));
  }

  function loadGroceries() {
    return safeJsonParse(localStorage.getItem(GRO_KEY), {
      meta: { shop: "Tesco", budget: "" },
      items: []
    });
  }

  function saveGroceries(data) {
    localStorage.setItem(GRO_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("lifeadmin:datachanged"));
  }

  function uid() {
    return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
  }

  function normName(s) {
    return String(s || "").trim().replace(/\s+/g, " ");
  }

  function setChipActive(value) {
    const wrap = $("groceriesFilters");
    if (!wrap) return;
    wrap.querySelectorAll(".chip").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.filter === value);
    });
  }

  function getActiveFilter() {
    const wrap = $("groceriesFilters");
    const active = wrap?.querySelector(".chip.is-active");
    return active?.dataset.filter || "All";
  }

  function getSortMode() {
    return $("groceriesSort")?.value || "recent";
  }

  function sortItems(items, mode) {
    const arr = [...items];
    if (mode === "alpha") {
      arr.sort((a,b) => a.name.localeCompare(b.name));
    } else if (mode === "category") {
      arr.sort((a,b) => (a.category || "").localeCompare(b.category || "") || a.name.localeCompare(b.name));
    } else {
      // recent
      arr.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return arr;
  }

  function render() {
    const data = loadGroceries();

    // meta
    const shop = $("groceriesShop");
    const budget = $("groceriesBudget");
    if (shop) shop.value = data.meta.shop || "Tesco";
    if (budget) budget.value = data.meta.budget ?? "";

    const filter = getActiveFilter();
    const sortMode = getSortMode();

    const active = data.items.filter(x => !x.bought);
    const bought = data.items.filter(x => x.bought);

    const activeFiltered = filter === "All"
      ? active
      : active.filter(x => x.category === filter);

    const activeSorted = sortItems(activeFiltered, sortMode);
    const boughtSorted = sortItems(bought, "recent");

    // badges
    if ($("groceriesActiveCount")) $("groceriesActiveCount").textContent = String(active.length);
    if ($("groceriesListBadge")) $("groceriesListBadge").textContent = String(activeSorted.length);
    if ($("groceriesBoughtBadge")) $("groceriesBoughtBadge").textContent = String(boughtSorted.length);

    // weekly meta
    const weekMeta = $("groceriesWeekMeta");
    const weekBadge = $("groceriesWeekBadge");
    if (weekMeta) {
      const b = data.meta.budget ? `£${data.meta.budget}` : "£0 budget";
      weekMeta.textContent = `${active.length} items • ${b}`;
    }
    if (weekBadge) weekBadge.textContent = active.length ? `${active.length}` : "—";

    // lists
    renderList("groceriesList", "groceriesEmpty", activeSorted, (item) => makeRow(item, data));
    renderList("groceriesBoughtList", "groceriesBoughtEmpty", boughtSorted, (item) => makeRow(item, data, true));
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
    items.forEach(it => ul.appendChild(makeLi(it)));
  }

  function makeRow(item, data, isBought = false) {
    const li = document.createElement("li");
    li.className = "list__item";

    li.innerHTML = `
      <div class="list__main">
        <div class="list__title">${escapeHtml(item.name)}</div>
        <div class="list__sub muted">${escapeHtml(item.category || "Other")}</div>
      </div>
      <div class="list__actions" style="display:flex; gap:8px; align-items:center;">
        <label style="display:flex; align-items:center; gap:6px;">
          <input type="checkbox" ${item.bought ? "checked" : ""} />
          <span class="muted">${isBought ? "Bought" : "Buy"}</span>
        </label>
        <button class="ghost-btn ghost-btn--sm" type="button" data-repeat="1">Repeat</button>
        <button class="ghost-btn ghost-btn--sm" type="button" data-del="1">Delete</button>
      </div>
    `;

    const cb = li.querySelector("input[type=checkbox]");
    cb?.addEventListener("change", () => {
      const fresh = loadGroceries();
      const it = fresh.items.find(x => x.id === item.id);
      if (!it) return;
      it.bought = !!cb.checked;
      it.updatedAt = Date.now();
      saveGroceries(fresh);
      render();
    });

    li.querySelector("[data-del]")?.addEventListener("click", () => {
      const fresh = loadGroceries();
      fresh.items = fresh.items.filter(x => x.id !== item.id);
      saveGroceries(fresh);
      render();
    });

    li.querySelector("[data-repeat]")?.addEventListener("click", () => {
      const fresh = loadGroceries();
      fresh.items.unshift({
        id: uid(),
        name: item.name,
        category: item.category || "Other",
        bought: false,
        createdAt: Date.now()
      });
      saveGroceries(fresh);
      render();
    });

    return li;
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function bind() {
    // Add
    $("btnGroceriesAdd")?.addEventListener("click", addItem);
    $("groceriesName")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addItem();
    });

    // Filters
    $("groceriesFilters")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      setChipActive(btn.dataset.filter);
      render();
    });

    // Sort
    $("groceriesSort")?.addEventListener("change", () => render());

    // Meta
    $("groceriesShop")?.addEventListener("change", () => {
      const d = loadGroceries();
      d.meta.shop = $("groceriesShop").value;
      saveGroceries(d);
      render();
    });

    $("groceriesBudget")?.addEventListener("input", () => {
      const d = loadGroceries();
      d.meta.budget = $("groceriesBudget").value.trim();
      saveGroceries(d);
      render();
    });

    // Clear bought
    $("btnGroceriesClearBought")?.addEventListener("click", () => {
      const d = loadGroceries();
      d.items = d.items.filter(x => !x.bought);
      saveGroceries(d);
      render();
    });

    // Reset
    $("btnGroceriesReset")?.addEventListener("click", () => {
      const d = loadGroceries();
      d.items = [];
      d.meta = { shop: "Tesco", budget: "" };
      saveGroceries(d);
      render();
    });

    // If other parts of your app save data, re-render
    window.addEventListener("lifeadmin:datachanged", () => {
      // Only re-render if groceries page exists
      if (document.getElementById("view-groceries")) render();
    });
  }

  function addItem() {
    const nameEl = $("groceriesName");
    const catEl = $("groceriesCategory");
    if (!nameEl || !catEl) return;

    const name = normName(nameEl.value);
    const category = catEl.value || "Other";
    if (!name) return;

    const d = loadGroceries();

    // prevent duplicates (same name + category) unless already bought
    const dup = d.items.find(x =>
      !x.bought &&
      x.category === category &&
      x.name.toLowerCase() === name.toLowerCase()
    );
    if (!dup) {
      d.items.unshift({
        id: uid(),
        name,
        category: CATS.includes(category) ? category : "Other",
        bought: false,
        createdAt: Date.now()
      });
      saveGroceries(d);
    }

    nameEl.value = "";
    nameEl.focus();
    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Only boot if the page exists in DOM
    if (!document.getElementById("view-groceries")) return;
    bind();
    setChipActive("All");
    render();
  });
})();
