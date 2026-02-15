/* features-settings.js
   Wires up Settings / Notifications / Vault Auto-lock / Cloud Sync / Backup / Integrity
   for Life Admin (GitHub Pages + Firebase)
*/

(() => {
  // ---------- Helpers ----------
  const $ = (id) => document.getElementById(id);

  const APP_KEY = "lifeAdmin:v1";
  const BACKUP_KEY = "lifeAdmin:backups:v1";

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function deepMerge(base, extra) {
    if (typeof base !== "object" || base === null) return extra ?? base;
    const out = Array.isArray(base) ? [...base] : { ...base };
    for (const k of Object.keys(extra || {})) {
      const v = extra[k];
      out[k] =
        typeof v === "object" && v !== null && !Array.isArray(v)
          ? deepMerge(base[k] ?? {}, v)
          : v;
    }
    return out;
  }

  function defaultState() {
    return {
      version: 1,
      updatedAt: Date.now(),

      prefs: {
        calmModeDefault: false,
        simplifyUI: false,
        animations: true,
        reducedMotion: false,
        highContrast: false,
        privacyBlurAmounts: false,
      },

      notifications: {
        enabled: false,
        level: "off",       // "off" | "urgent" | "all"
        quietFrom: "",
        quietTo: "",
        lastNudgeAt: 0,
      },

      vault: {
        locked: true,
        autoLockEnabled: false,
        idleMinutes: 5,
        blob: null,               // encrypted vault blob
        blobUpdatedAt: 0,
      },

      cloud: {
        enabled: false,
        status: "local-only",     // "local-only" | "ready" | "error"
        lastSyncAt: 0,
        user: null,               // { uid, email, name }
      },

      // your app likely already has these sections stored:
      admin: {},
      home: {},
      skills: {},
      money: {},
      wins: { events: [] },
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(APP_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return deepMerge(defaultState(), parsed);
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    state.updatedAt = Date.now();
    localStorage.setItem(APP_KEY, JSON.stringify(state));
    maybeAutoBackup();
  }

  function toast(msg) {
    // If your app already has a toast system, this won't interfere.
    // Otherwise, fallback to alert-like minimal toast.
    const wrap = $("toastWrap");
    if (!wrap) return console.log(msg);

    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.classList.add("is-in"), 10);
    setTimeout(() => {
      el.classList.remove("is-in");
      setTimeout(() => el.remove(), 250);
    }, 2500);
  }

  // ---------- State ----------
  let state = loadState();

  // ---------- Preferences -> DOM ----------
  function applyPrefsToDOM() {
    const p = state.prefs;
    const root = document.documentElement;

    // reduced motion forces animations off
    if (p.reducedMotion) p.animations = false;

    root.classList.toggle("calm-mode", !!p.calmModeDefault);
    root.classList.toggle("simplify-ui", !!p.simplifyUI);
    root.classList.toggle("no-anim", !p.animations || !!p.reducedMotion);
    root.classList.toggle("high-contrast", !!p.highContrast);
    root.classList.toggle("privacy-blur", !!p.privacyBlurAmounts);
  }

  function bindToggle(id, getter, setter) {
    const el = $(id);
    if (!el) return;
    el.checked = !!getter();
    el.addEventListener("change", () => {
      setter(el.checked);
      saveState();
      applyPrefsToDOM();
      updateOverallBadges();
    });
  }

  // ---------- Notification permission UI ----------
  function setNotifPermissionBadge() {
    const badge = $("notifPermissionBadge");
    const msg = $("notifPermissionMsg");
    if (!badge || !msg) return;

    if (!("Notification" in window)) {
      badge.textContent = "Unsupported";
      msg.textContent = "Your browser doesn’t support notifications.";
      return;
    }

    const p = Notification.permission; // "default" | "granted" | "denied"
    if (p === "granted") {
      badge.textContent = "Enabled";
      msg.textContent = "Browser notifications are enabled.";
    } else if (p === "denied") {
      badge.textContent = "Blocked";
      msg.textContent = "Notifications are blocked in browser settings.";
    } else {
      badge.textContent = "Unknown";
      msg.textContent = "Notifications are optional. You can enable them for gentle reminders only.";
    }
  }

  async function requestNotifPermission() {
    if (!("Notification" in window)) return toast("Notifications not supported.");
    const res = await Notification.requestPermission();
    setNotifPermissionBadge();
    toast(res === "granted" ? "Notifications enabled ✅" : "Notifications not enabled.");
  }

  function sendTestNotification() {
    if (!("Notification" in window)) return toast("Notifications not supported.");
    if (Notification.permission !== "granted") return toast("Enable notifications first.");
    new Notification("Life Admin", { body: "Test notification ✅" });
    toast("Test sent.");
  }

  function setNotifLevel(level) {
    state.notifications.level = level; // off | urgent | all
    // button UI
    const off = $("notifLevelOff");
    const urg = $("notifLevelUrgent");
    const all = $("notifLevelAll");
    [off, urg, all].forEach(b => b?.classList.remove("is-active"));
    if (level === "off") off?.classList.add("is-active");
    if (level === "urgent") urg?.classList.add("is-active");
    if (level === "all") all?.classList.add("is-active");
    saveState();
  }

  function bindNotifLevelButtons() {
    $("notifLevelOff")?.addEventListener("click", () => setNotifLevel("off"));
    $("notifLevelUrgent")?.addEventListener("click", () => setNotifLevel("urgent"));
    $("notifLevelAll")?.addEventListener("click", () => setNotifLevel("all"));

    // init UI from state
    setNotifLevel(state.notifications.level || "off");
  }

  function bindNotificationInputs() {
    bindToggle("setNotifications",
      () => state.notifications.enabled,
      (v) => (state.notifications.enabled = v)
    );

    const qf = $("setQuietFrom");
    const qt = $("setQuietTo");
    if (qf) {
      qf.value = state.notifications.quietFrom || "";
      qf.addEventListener("change", () => { state.notifications.quietFrom = qf.value; saveState(); });
    }
    if (qt) {
      qt.value = state.notifications.quietTo || "";
      qt.addEventListener("change", () => { state.notifications.quietTo = qt.value; saveState(); });
    }

    $("btnRequestNotifPermission")?.addEventListener("click", requestNotifPermission);
    $("btnTestNotification")?.addEventListener("click", sendTestNotification);
    $("btnPreviewBundle")?.addEventListener("click", () => {
      toast("Preview: gentle nudges are enabled when the app is open.");
    });
  }

  // Quiet hours check
  function inQuietHours(now = new Date()) {
    const { quietFrom, quietTo } = state.notifications;
    if (!quietFrom || !quietTo) return false;
    const [fh, fm] = quietFrom.split(":").map(Number);
    const [th, tm] = quietTo.split(":").map(Number);
    const mins = now.getHours() * 60 + now.getMinutes();
    const fromM = fh * 60 + fm;
    const toM = th * 60 + tm;
    if (fromM <= toM) return mins >= fromM && mins <= toM;
    return mins >= fromM || mins <= toM; // wraps midnight
  }

  // Basic in-app “nudge” (works while open)
  function maybeNudge() {
    if (!state.notifications.enabled) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (state.notifications.level === "off") return;
    if (inQuietHours()) return;

    const now = Date.now();
    const calm = !!state.prefs.calmModeDefault;
    const minGap = calm ? 24 * 60 * 60 * 1000 : 6 * 60 * 60 * 1000;
    if (now - (state.notifications.lastNudgeAt || 0) < minGap) return;

    // Placeholder: hook into your real “due soon” logic later
    const body =
      state.notifications.level === "urgent"
        ? "Quick check: anything urgent due soon?"
        : "Gentle nudge: check your Next Steps / This Week.";

    new Notification("Life Admin", { body });
    state.notifications.lastNudgeAt = now;
    saveState();
  }

  // ---------- Vault encryption helpers ----------
  function b64(bytes) {
    return btoa(String.fromCharCode(...new Uint8Array(bytes)));
  }
  function unb64(str) {
    return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  }

  async function deriveKey(passphrase, saltU8) {
    const baseKey = await crypto.subtle.importKey(
      "raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: saltU8, iterations: 200000, hash: "SHA-256" },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptVaultJSON(passphrase, obj) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const ct = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(JSON.stringify(obj))
    );
    return { v: 1, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
  }

  // Auto-lock wiring from settings (does not require decrypting anything)
  let lastActivityAt = Date.now();
  function markActivity() { lastActivityAt = Date.now(); }

  ["click", "keydown", "touchstart", "mousemove", "scroll"].forEach((evt) => {
    window.addEventListener(evt, markActivity, { passive: true });
  });

  function lockVaultNow() {
    // If your existing vault code keeps a cache, this won't touch it.
    // This simply flips locked state + updates badge if present.
    state.vault.locked = true;
    saveState();
    // Update vault badges if they exist
    $("vaultStatusBadge") && ($("vaultStatusBadge").textContent = "Locked");
    toast("Vault locked.");
  }

  function bindVaultAutolock() {
    bindToggle("setVaultAutoLock",
      () => state.vault.autoLockEnabled,
      (v) => (state.vault.autoLockEnabled = v)
    );

    const mins = $("setVaultAutoLockMins");
    if (mins) {
      mins.value = state.vault.idleMinutes ?? 5;
      mins.addEventListener("change", () => {
        const n = Math.max(1, Math.min(240, Number(mins.value || 5)));
        state.vault.idleMinutes = n;
        mins.value = n;
        saveState();
      });
    }

    $("btnVaultLockFromSettings")?.addEventListener("click", lockVaultNow);

    // Auto-lock timer
    setInterval(() => {
      if (!state.vault.autoLockEnabled) return;
      if (state.vault.locked) return;
      const idleMs = (state.vault.idleMinutes || 5) * 60 * 1000;
      if (Date.now() - lastActivityAt > idleMs) lockVaultNow();
    }, 10_000);
  }

  // ---------- Backup / Restore / History ----------
  function getBackupHistory() {
    try { return JSON.parse(localStorage.getItem(BACKUP_KEY)) || []; }
    catch { return []; }
  }
  function setBackupHistory(list) {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(list));
  }

  function renderBackupHistory() {
    const listEl = $("backupHistoryList");
    const emptyEl = $("backupHistoryEmpty");
    const badge = $("backupHistoryBadge");
    if (!listEl || !emptyEl || !badge) return;

    const hist = getBackupHistory();
    badge.textContent = String(hist.length);

    listEl.innerHTML = "";
    if (hist.length === 0) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;

    for (const b of hist.slice(0, 15)) {
      const li = document.createElement("li");
      li.className = "list__item";

      const d = new Date(b.ts);
      const meta = `${d.toLocaleString()} • ${b.reason}`;

      li.innerHTML = `
        <div class="list__main">
          <div class="list__title">${meta}</div>
          <div class="list__sub muted">Snapshot: Admin, Home, Skills, Money</div>
        </div>
        <div class="list__actions">
          <button class="ghost-btn ghost-btn--sm" type="button" data-restore-id="${b.id}">Restore</button>
        </div>
      `;
      listEl.appendChild(li);
    }

    // Hook restore buttons -> open confirm modal if present
    listEl.querySelectorAll("[data-restore-id]").forEach((btn) => {
      btn.addEventListener("click", () => openConfirmRestore(btn.getAttribute("data-restore-id")));
    });
  }

  function addBackupSnapshot(reason = "auto") {
    const hist = getBackupHistory();
    hist.unshift({
      id: crypto.randomUUID(),
      ts: Date.now(),
      reason,
      snapshot: {
        admin: state.admin,
        home: state.home,
        skills: state.skills,
        money: state.money,
        updatedAt: state.updatedAt,
      },
    });

    const LIMIT = 30;
    setBackupHistory(hist.slice(0, LIMIT));
    renderBackupHistory();
  }

  function maybeAutoBackup() {
    // Auto backup at most once per hour when changes happen
    const hist = getBackupHistory();
    const last = hist[0]?.ts || 0;
    if (Date.now() - last > 60 * 60 * 1000) {
      addBackupSnapshot("auto");
    }
  }

  function downloadFullBackup() {
    const payload = { app: "LifeAdmin", exportedAt: Date.now(), state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeadmin-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addBackupSnapshot("manual-backup");
    toast("Backup exported.");
  }

  function restoreFromPayload(payloadState) {
    state = deepMerge(defaultState(), payloadState);
    localStorage.setItem(APP_KEY, JSON.stringify(state));
    applyPrefsToDOM();
    bindUIFromState();
    renderBackupHistory();
    setNotifPermissionBadge();
    updateCloudUI();
    updateOverallBadges();
  }

  async function handleRestoreFile(file) {
    const txt = await file.text();
    const payload = JSON.parse(txt);
    if (!payload?.state) throw new Error("Invalid backup file");
    restoreFromPayload(payload.state);
    addBackupSnapshot("restore");
    toast("Backup restored.");
  }

  function resetAllData() {
    localStorage.removeItem(APP_KEY);
    state = defaultState();
    localStorage.setItem(APP_KEY, JSON.stringify(state));
    applyPrefsToDOM();
    bindUIFromState();
    renderBackupHistory();
    updateCloudUI();
    setNotifPermissionBadge();
    updateOverallBadges();
    toast("All data reset.");
  }

  // Confirm restore modal flow (uses your existing modal IDs if present)
  let pendingRestoreId = null;

  function openConfirmRestore(backupId) {
    const modal = $("confirmRestoreModal");
    if (!modal) {
      // fallback direct restore without modal
      restoreBackupById(backupId);
      return;
    }

    pendingRestoreId = backupId;
    const hist = getBackupHistory();
    const b = hist.find(x => x.id === backupId);
    $("confirmRestoreMeta") && ($("confirmRestoreMeta").textContent =
      b ? `Backup: ${new Date(b.ts).toLocaleString()} • ${b.reason}` : "Backup: —");

    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("is-open");
  }

  function closeConfirmRestore() {
    const modal = $("confirmRestoreModal");
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("is-open");
    pendingRestoreId = null;
  }

  function restoreBackupById(backupId) {
    const hist = getBackupHistory();
    const b = hist.find(x => x.id === backupId);
    if (!b) return toast("Backup not found.");
    const safety = $("chkPreRestoreSafetyBackup")?.checked;
    if (safety) addBackupSnapshot("pre-restore-safety");
    restoreFromPayload(b.snapshot);
    toast("Backup restored from history.");
  }

  // ---------- Integrity check ----------
  function runIntegrityCheck() {
    const issues = [];

    if (!state || typeof state !== "object") issues.push("State missing");
    if (typeof state.version !== "number") issues.push("Version missing");
    if (!state.prefs) issues.push("Prefs missing");
    if (!state.notifications) issues.push("Notifications missing");
    if (!state.vault) issues.push("Vault missing");
    if (!state.cloud) issues.push("Cloud missing");

    const mins = state.vault?.idleMinutes;
    if (mins != null && (mins < 1 || mins > 240)) issues.push("Vault idle minutes out of range");

    const level = state.notifications?.level;
    if (level && !["off", "urgent", "all"].includes(level)) issues.push("Notification level invalid");

    return { ok: issues.length === 0, issues };
  }

  function updateIntegrityUI() {
    const badge = $("integrityBadge");
    const msg = $("integrityMessage");
    const btnRecovery = $("btnAttemptRecovery");
    if (!badge || !msg) return;

    const res = runIntegrityCheck();
    if (res.ok) {
      badge.textContent = "OK";
      badge.classList.add("badge--ok");
      msg.textContent = "Your data looks healthy.";
      btnRecovery && (btnRecovery.hidden = true);
    } else {
      badge.textContent = "Issues";
      badge.classList.remove("badge--ok");
      msg.textContent = `Found issues: ${res.issues.join(", ")}`;
      btnRecovery && (btnRecovery.hidden = false);
    }
  }

  function restoreLastBackup() {
    const hist = getBackupHistory();
    if (!hist.length) return toast("No backups available.");
    restoreFromPayload(hist[0].snapshot);
    toast("Restored last backup.");
  }

  // ---------- Cloud Sync (Firebase) ----------
  const fb = () => window.__firebase;

  function setCloudBadge(text, ok = false) {
    const b = $("cloudBadge");
    if (!b) return;
    b.textContent = text;
    b.classList.toggle("badge--ok", !!ok);
  }

  function updateCloudUI() {
    const enabled = !!state.cloud.enabled;
    const toggle = $("setCloudSync");
    const signOutBtn = $("btnSignOut");
    const syncBtn = $("btnSyncNow");
    const syncText = $("syncText");
    const syncDot = $("syncDot");
    const statusWrap = $("syncStatus");

    toggle && (toggle.checked = enabled);

    const authed = !!state.cloud.user;
    if (signOutBtn) signOutBtn.disabled = !authed;
    if (syncBtn) syncBtn.disabled = !authed || !enabled;

    if (syncText && syncDot && statusWrap) {
      if (!enabled) {
        syncText.textContent = "Sync off";
        syncDot.className = "dot dot--red";
        statusWrap.classList.add("is-off");
        setCloudBadge("Local-only", false);
      } else if (enabled && !authed) {
        syncText.textContent = "Sign in required";
        syncDot.className = "dot dot--red";
        statusWrap.classList.add("is-off");
        setCloudBadge("Local-only", false);
      } else {
        syncText.textContent = "Ready";
        syncDot.className = "dot dot--green";
        statusWrap.classList.remove("is-off");
        setCloudBadge("Cloud ready", true);
      }
    }
  }

  async function signInGoogle() {
    try {
      const { auth, provider, signInWithPopup } = fb();
      const res = await signInWithPopup(auth, provider);
      const u = res.user;
      state.cloud.user = { uid: u.uid, email: u.email || "", name: u.displayName || "" };
      saveState();
      updateCloudUI();
      toast("Signed in.");
    } catch (e) {
      console.error(e);
      toast("Sign-in failed (popup blocked?).");
    }
  }

  async function signOutGoogle() {
    try {
      const { auth, signOut } = fb();
      await signOut(auth);
      state.cloud.user = null;
      saveState();
      updateCloudUI();
      toast("Signed out.");
    } catch (e) {
      console.error(e);
      toast("Sign-out failed.");
    }
  }

  async function getRemoteDocRef() {
    const { db, doc } = fb();
    const uid = state.cloud.user?.uid;
    if (!uid) throw new Error("Not signed in");
    return doc(db, "lifeadmin", uid);
  }

  async function pullRemote() {
    const { getDoc } = fb();
    const ref = await getRemoteDocRef();
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data();
  }

  async function pushRemote(payload) {
    const { setDoc, serverTimestamp } = fb();
    const ref = await getRemoteDocRef();
    await setDoc(ref, { ...payload, serverUpdatedAt: serverTimestamp() }, { merge: true });
  }

  async function syncNow() {
    if (!state.cloud.enabled) return toast("Enable cloud sync first.");
    if (!state.cloud.user) return toast("Sign in first.");

    try {
      const remote = await pullRemote();

      // First push if no remote
      if (!remote?.state) {
        await pushRemote({ state, updatedAt: state.updatedAt });
        state.cloud.lastSyncAt = Date.now();
        state.cloud.status = "ready";
        saveState();
        updateCloudUI();
        toast("Synced (first push).");
        return;
      }

      const remoteUpdated = remote.updatedAt || 0;
      const localUpdated = state.updatedAt || 0;

      // Conflict indicator (only if both changed recently)
      const conflict = Math.abs(remoteUpdated - localUpdated) < 5 * 60 * 1000 && remoteUpdated !== localUpdated;
      $("conflictBadge") && ($("conflictBadge").hidden = !conflict);

      if (remoteUpdated > localUpdated) {
        // Pull wins
        state = deepMerge(defaultState(), remote.state);
        localStorage.setItem(APP_KEY, JSON.stringify(state));
        applyPrefsToDOM();
        bindUIFromState();
        toast("Synced: pulled newer cloud data.");
      } else {
        // Push wins
        await pushRemote({ state, updatedAt: state.updatedAt });
        toast("Synced: pushed local data.");
      }

      state.cloud.lastSyncAt = Date.now();
      state.cloud.status = "ready";
      saveState();
      updateCloudUI();
      updateOverallBadges();
    } catch (e) {
      console.error(e);
      state.cloud.status = "error";
      saveState();
      updateCloudUI();
      toast("Sync failed. Check Firebase rules / login.");
    }
  }

  function bindCloudSync() {
    bindToggle("setCloudSync",
      () => state.cloud.enabled,
      (v) => (state.cloud.enabled = v)
    );

    $("btnSignInGoogle")?.addEventListener("click", signInGoogle);
    $("btnSignOut")?.addEventListener("click", signOutGoogle);
    $("btnSyncNow")?.addEventListener("click", syncNow);

    // Keep in sync with Firebase auth state too
    try {
      const { auth, onAuthStateChanged } = fb();
      onAuthStateChanged(auth, (u) => {
        if (u) {
          state.cloud.user = { uid: u.uid, email: u.email || "", name: u.displayName || "" };
        } else {
          state.cloud.user = null;
        }
        saveState();
        updateCloudUI();
      });
    } catch {}
  }

  // ---------- Overall badges ----------
  function updateOverallBadges() {
    // optional: hook into your existing status badges if you want
    updateIntegrityUI();
  }

  // ---------- Bind UI from state (init) ----------
  function bindUIFromState() {
    // Preferences toggles
    bindToggle("setCalmDefault", () => state.prefs.calmModeDefault, (v) => (state.prefs.calmModeDefault = v));
    bindToggle("setSimplifyUI", () => state.prefs.simplifyUI, (v) => (state.prefs.simplifyUI = v));
    bindToggle("setAnimations", () => state.prefs.animations, (v) => (state.prefs.animations = v));
    bindToggle("setReducedMotion", () => state.prefs.reducedMotion, (v) => (state.prefs.reducedMotion = v));
    bindToggle("setHighContrast", () => state.prefs.highContrast, (v) => (state.prefs.highContrast = v));
    bindToggle("setPrivacyMode", () => state.prefs.privacyBlurAmounts, (v) => (state.prefs.privacyBlurAmounts = v));

    // Notifications
    bindNotifLevelButtons();
    bindNotificationInputs();
    setNotifPermissionBadge();

    // Vault auto-lock
    bindVaultAutolock();

    // Cloud sync
    bindCloudSync();
    updateCloudUI();

    // Backup buttons
    $("btnBackupAll")?.addEventListener("click", downloadFullBackup);

    const fileInput = $("fileImport");
    $("btnRestoreAll")?.addEventListener("click", () => {
      if (!fileInput) return toast("Missing file input.");
      fileInput.value = "";
      fileInput.onchange = async () => {
        const f = fileInput.files?.[0];
        if (!f) return;
        try { await handleRestoreFile(f); }
        catch { toast("Restore failed (invalid file)."); }
      };
      fileInput.click();
    });

    $("btnResetAll")?.addEventListener("click", () => {
      if (confirm("Reset all data? This cannot be undone unless you have a backup.")) resetAllData();
    });

    $("btnRunAutoBackupNow")?.addEventListener("click", () => {
      addBackupSnapshot("auto-now");
      toast("Auto-backup snapshot saved.");
    });

    $("btnClearBackupHistory")?.addEventListener("click", () => {
      if (!confirm("Clear backup history?")) return;
      setBackupHistory([]);
      renderBackupHistory();
      toast("Backup history cleared.");
    });

    // Integrity
    $("btnRunIntegrityCheck")?.addEventListener("click", () => {
      updateIntegrityUI();
      const r = runIntegrityCheck();
      toast(r.ok ? "Integrity check OK ✅" : "Integrity issues found.");
    });

    $("btnAttemptRecovery")?.addEventListener("click", restoreLastBackup);

    // Confirm restore modal buttons
    $("btnCloseConfirmRestore")?.addEventListener("click", closeConfirmRestore);
    $("btnCancelConfirmRestore")?.addEventListener("click", closeConfirmRestore);
    $("btnConfirmRestoreNow")?.addEventListener("click", () => {
      if (!pendingRestoreId) return;
      restoreBackupById(pendingRestoreId);
      closeConfirmRestore();
    });

    // close modal by backdrop click if your attributes are used
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (t?.dataset?.closeConfirmRestore === "true") closeConfirmRestore();
    });

    // Render history
    renderBackupHistory();

    // Integrity UI
    updateIntegrityUI();

    // Apply prefs now
    applyPrefsToDOM();
  }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    // Ensure CSS classes match current prefs immediately
    applyPrefsToDOM();

    // Bind everything
    bindUIFromState();

    // Periodic nudge while app open
    setInterval(maybeNudge, 60_000);
  });
})();
