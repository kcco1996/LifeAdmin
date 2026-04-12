/* =========================
   Life Admin — features-meals.js
   Meal Planning feature
   ========================= */

(() => {
  "use strict";

  const DAY_ORDER = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const MEAL_ORDER = ["breakfast", "lunch", "dinner", "dessert"];

  const PRESETS = {
    italianWeek: {
      label: "Italian Week",
      days: {
        Monday:    { breakfast: "Cornetto", lunch: "Panini", dinner: "Spaghetti Bolognese", dessert: "Tiramisu" },
        Tuesday:   { breakfast: "Cappuccino and pastry", lunch: "Caprese focaccia", dinner: "Lasagne", dessert: "Gelato" },
        Wednesday: { breakfast: "Biscotti and coffee", lunch: "Piadina", dinner: "Risotto alla Milanese", dessert: "Panna cotta" },
        Thursday:  { breakfast: "Ricotta toast", lunch: "Minestrone", dinner: "Chicken Parmigiana", dessert: "Cannoli" },
        Friday:    { breakfast: "Yoghurt and fruit", lunch: "Arancini", dinner: "Margherita pizza", dessert: "Affogato" },
        Saturday:  { breakfast: "Frittata", lunch: "Pasta salad", dinner: "Tagliatelle al ragù", dessert: "Sfogliatella" },
        Sunday:    { breakfast: "Croissant and espresso", lunch: "Bruschetta", dinner: "Roast chicken with rosemary potatoes", dessert: "Zabaglione" },
      }
    },

    britishWeek: {
      label: "British Week",
      days: {
        Monday:    { breakfast: "Full English", lunch: "Cheese toastie", dinner: "Cottage pie", dessert: "Apple crumble" },
        Tuesday:   { breakfast: "Beans on toast", lunch: "Jacket potato with tuna", dinner: "Bangers and mash", dessert: "Sticky toffee pudding" },
        Wednesday: { breakfast: "Porridge", lunch: "Ploughman’s lunch", dinner: "Fish pie", dessert: "Trifle" },
        Thursday:  { breakfast: "Scrambled eggs on toast", lunch: "Sausage roll and salad", dinner: "Chicken tikka masala", dessert: "Jam roly-poly" },
        Friday:    { breakfast: "Bacon sandwich", lunch: "Soup and bread", dinner: "Fish and chips", dessert: "Bread and butter pudding" },
        Saturday:  { breakfast: "Crumpets", lunch: "Pie and peas", dinner: "Steak and ale pie", dessert: "Eton mess" },
        Sunday:    { breakfast: "Toast and tea", lunch: "Welsh rarebit", dinner: "Sunday roast", dessert: "Spotted dick" },
      }
    },

    americanWeek: {
      label: "American Week",
      days: {
        Monday:    { breakfast: "Pancakes", lunch: "Turkey club sandwich", dinner: "Cheeseburger and fries", dessert: "Brownie" },
        Tuesday:   { breakfast: "Bagel and cream cheese", lunch: "Mac and cheese", dinner: "BBQ chicken", dessert: "Apple pie" },
        Wednesday: { breakfast: "Breakfast burrito", lunch: "Hot dog", dinner: "Meatloaf", dessert: "Ice cream sundae" },
        Thursday:  { breakfast: "French toast", lunch: "Grilled cheese", dinner: "Buffalo wings", dessert: "Chocolate chip cookie" },
        Friday:    { breakfast: "Waffles", lunch: "Chicken Caesar wrap", dinner: "Pepperoni pizza", dessert: "Cheesecake" },
        Saturday:  { breakfast: "Biscuits and gravy", lunch: "Sloppy Joe", dinner: "Fried chicken", dessert: "Pecan pie" },
        Sunday:    { breakfast: "Hash browns and eggs", lunch: "BLT sandwich", dinner: "Pot roast", dessert: "Banana pudding" },
      }
    },

    indianWeek: {
      label: "Indian Week",
      days: {
        Monday:    { breakfast: "Masala omelette", lunch: "Chicken kathi roll", dinner: "Butter chicken", dessert: "Gulab jamun" },
        Tuesday:   { breakfast: "Aloo paratha", lunch: "Paneer wrap", dinner: "Lamb rogan josh", dessert: "Kheer" },
        Wednesday: { breakfast: "Poha", lunch: "Chole bhature", dinner: "Chicken tikka masala", dessert: "Rasmalai" },
        Thursday:  { breakfast: "Upma", lunch: "Samosa chaat", dinner: "Biryani", dessert: "Jalebi" },
        Friday:    { breakfast: "Idli", lunch: "Pav bhaji", dinner: "Palak paneer", dessert: "Kulfi" },
        Saturday:  { breakfast: "Dosa", lunch: "Aloo tikki burger", dinner: "Dansak", dessert: "Barfi" },
        Sunday:    { breakfast: "Egg bhurji", lunch: "Keema naan", dinner: "Tandoori chicken", dessert: "Shrikhand" },
      }
    },

    japaneseWeek: {
      label: "Japanese Week",
      days: {
        Monday:    { breakfast: "Tamago toast", lunch: "Chicken katsu sando", dinner: "Chicken katsu curry", dessert: "Dorayaki" },
        Tuesday:   { breakfast: "Onigiri", lunch: "Yakisoba", dinner: "Tonkatsu", dessert: "Mochi" },
        Wednesday: { breakfast: "Japanese omelette", lunch: "Karaage rice bowl", dinner: "Ramen", dessert: "Castella" },
        Thursday:  { breakfast: "Rice and miso soup", lunch: "Takoyaki", dinner: "Teriyaki chicken", dessert: "Taiyaki" },
        Friday:    { breakfast: "Toast and matcha latte", lunch: "Korokke", dinner: "Gyudon", dessert: "Matcha ice cream" },
        Saturday:  { breakfast: "Tamago on toast", lunch: "Curry pan", dinner: "Okonomiyaki", dessert: "Anmitsu" },
        Sunday:    { breakfast: "Fruit sandwich", lunch: "Chicken karaage", dinner: "Hambagu steak", dessert: "Purin" },
      }
    },

    mexicanWeek: {
      label: "Mexican Week",
      days: {
        Monday:    { breakfast: "Huevos rancheros", lunch: "Chicken quesadilla", dinner: "Beef tacos", dessert: "Churros" },
        Tuesday:   { breakfast: "Breakfast burrito", lunch: "Torta", dinner: "Chicken enchiladas", dessert: "Flan" },
        Wednesday: { breakfast: "Molletes", lunch: "Nachos", dinner: "Chilli con carne", dessert: "Tres leches cake" },
        Thursday:  { breakfast: "Scrambled eggs with salsa", lunch: "Chicken taquitos", dinner: "Fajitas", dessert: "Arroz con leche" },
        Friday:    { breakfast: "Chilaquiles", lunch: "Burrito bowl", dinner: "Carnitas tacos", dessert: "Sopapillas" },
        Saturday:  { breakfast: "Quesadilla", lunch: "Tostadas", dinner: "Tamales", dessert: "Buñuelos" },
        Sunday:    { breakfast: "Breakfast tacos", lunch: "Elote snack plate", dinner: "Mole chicken", dessert: "Mexican chocolate cake" },
      }
    }
  };

  function getApp() {
    return window.lifeAdminApp || null;
  }

  function emptyDay() {
    return {
      breakfast: "",
      lunch: "",
      dinner: "",
      dessert: "",
    };
  }

  function defaultMealsState() {
    return {
      version: 1,
      selectedPreset: "",
      weekLabel: "",
      days: {
        Monday: emptyDay(),
        Tuesday: emptyDay(),
        Wednesday: emptyDay(),
        Thursday: emptyDay(),
        Friday: emptyDay(),
        Saturday: emptyDay(),
        Sunday: emptyDay(),
      }
    };
  }

  function ensureMealsInStore(store) {
    if (!store.meals || typeof store.meals !== "object") {
      store.meals = defaultMealsState();
    }

    if (!store.meals.days || typeof store.meals.days !== "object") {
      store.meals.days = defaultMealsState().days;
    }

    for (const day of DAY_ORDER) {
      if (!store.meals.days[day] || typeof store.meals.days[day] !== "object") {
        store.meals.days[day] = emptyDay();
      }

      for (const meal of MEAL_ORDER) {
        store.meals.days[day][meal] = String(store.meals.days[day][meal] ?? "");
      }
    }

    store.meals.selectedPreset = String(store.meals.selectedPreset ?? "");
    store.meals.weekLabel = String(store.meals.weekLabel ?? "");
    store.meals.version = 1;

    return store;
  }

  function getStore() {
    const app = getApp();
    if (!app?.loadStore) return null;
    const store = app.loadStore();
    return ensureMealsInStore(store);
  }

  function saveStore(store) {
    const app = getApp();
    if (!app?.saveStore) return;
    app.saveStore(ensureMealsInStore(store));
  }

  function getMeals() {
    const store = getStore();
    return store ? store.meals : defaultMealsState();
  }

  function saveMeals(meals) {
    const store = getStore();
    if (!store) return;
    store.meals = meals;
    saveStore(store);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function getMealsView() {
    return byId("view-meals");
  }

  function getPresetSelect() {
    return byId("mealPlanPresetSelect");
  }

  function getWeekNameInput() {
    return byId("mealPlanWeekName");
  }

  function getApplyPresetBtn() {
    return byId("btnMealPlanApplyPreset");
  }

  function getClearBtn() {
    return byId("btnMealPlanClear");
  }

  function getPresetBadge() {
    return byId("mealPlanPresetBadge");
  }

  function getMealInput(day, meal) {
    return getMealsView()?.querySelector(
      `.meal-input[data-day="${day}"][data-meal="${meal}"]`
    ) || null;
  }

  function fillPresetOptions() {
    const select = getPresetSelect();
    if (!select) return;

    const current = select.value || "";
    const options = [
      `<option value="">Choose a preset…</option>`,
      ...Object.entries(PRESETS).map(
        ([key, preset]) => `<option value="${key}">${preset.label}</option>`
      )
    ];

    select.innerHTML = options.join("");

    if (current && PRESETS[current]) {
      select.value = current;
    }
  }

  function renderMeals() {
    const meals = getMeals();
    const view = getMealsView();
    if (!view) return;

    fillPresetOptions();

    const presetSelect = getPresetSelect();
    const weekNameInput = getWeekNameInput();
    const presetBadge = getPresetBadge();

    if (presetSelect) {
      presetSelect.value = meals.selectedPreset || "";
    }

    if (weekNameInput) {
      weekNameInput.value = meals.weekLabel || "";
    }

    if (presetBadge) {
      presetBadge.textContent = meals.selectedPreset
        ? (PRESETS[meals.selectedPreset]?.label || "Preset")
        : "Preset";
    }

    for (const day of DAY_ORDER) {
      for (const meal of MEAL_ORDER) {
        const input = getMealInput(day, meal);
        if (!input) continue;
        input.value = meals.days?.[day]?.[meal] ?? "";
      }
    }
  }

  function applyPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    const meals = defaultMealsState();
    meals.selectedPreset = presetKey;
    meals.weekLabel = preset.label;

    for (const day of DAY_ORDER) {
      meals.days[day] = {
        breakfast: preset.days?.[day]?.breakfast ?? "",
        lunch: preset.days?.[day]?.lunch ?? "",
        dinner: preset.days?.[day]?.dinner ?? "",
        dessert: preset.days?.[day]?.dessert ?? "",
      };
    }

    saveMeals(meals);
    renderMeals();
  }

  function clearWeek() {
    const meals = defaultMealsState();
    saveMeals(meals);
    renderMeals();
  }

  function saveSingleMeal(day, meal, value) {
    const meals = getMeals();
    if (!meals.days[day]) meals.days[day] = emptyDay();
    meals.days[day][meal] = String(value ?? "");
    saveMeals(meals);
  }

  function saveWeekLabel(value) {
    const meals = getMeals();
    meals.weekLabel = String(value ?? "");
    saveMeals(meals);
  }

  function saveSelectedPreset(value) {
    const meals = getMeals();
    meals.selectedPreset = String(value ?? "");
    saveMeals(meals);
  }

  let eventsWired = false;

  function wireMealsEvents() {
    if (eventsWired) return;
    eventsWired = true;

    const view = getMealsView();
    if (!view) return;

    getApplyPresetBtn()?.addEventListener("click", () => {
      const key = getPresetSelect()?.value || "";
      if (!key) return;
      applyPreset(key);
    });

    getClearBtn()?.addEventListener("click", () => {
      if (!confirm("Clear the whole meal week?")) return;
      clearWeek();
    });

    getPresetSelect()?.addEventListener("change", (e) => {
      saveSelectedPreset(e.target.value || "");
      renderMeals();
    });

    getWeekNameInput()?.addEventListener("input", (e) => {
      saveWeekLabel(e.target.value || "");
    });

    view.addEventListener("input", (e) => {
      const input = e.target.closest(".meal-input[data-day][data-meal]");
      if (!input) return;

      const day = input.getAttribute("data-day");
      const meal = input.getAttribute("data-meal");
      if (!day || !meal) return;

      saveSingleMeal(day, meal, input.value);
    });

    window.addEventListener("lifeadmin:datachanged", () => {
      renderMeals();
    });
  }

  function initMealsFeature() {
    fillPresetOptions();
    wireMealsEvents();
    renderMeals();

    if (window.lifeAdminApp) {
      window.lifeAdminApp.renderMeals = renderMeals;
    }
  }

  window.renderMeals = renderMeals;
  window.initMealsFeature = initMealsFeature;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMealsFeature);
  } else {
    initMealsFeature();
  }
})();