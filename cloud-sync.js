(() => {
  "use strict";

  const fb = window.__firebase;
  const app = window.lifeAdminApp;

  if (!fb || !app) {
    console.warn("Cloud sync not started: Firebase bridge or app bridge missing.");
    return;
  }

  let currentUser = null;
  let cloudSyncEnabled = localStorage.getItem("lifeAdmin.cloudSyncEnabled") === "true";
  let unsubscribeSnapshot = null;
  let isApplyingRemoteState = false;

  const els = {
    btnLogin: document.getElementById("btnLogin"),
    btnLogout: document.getElementById("btnLogout"),
    btnPull: document.getElementById("btnPull"),
    btnPush: document.getElementById("btnPush"),
    cloudStatus: document.getElementById("cloudStatus"),

    setCloudSync: document.getElementById("setCloudSync"),
    btnSignInGoogle: document.getElementById("btnSignInGoogle"),
    btnSignOut: document.getElementById("btnSignOut"),
    btnSyncNow: document.getElementById("btnSyncNow"),
    cloudBadge: document.getElementById("cloudBadge"),
    syncText: document.getElementById("syncText"),
    syncDot: document.getElementById("syncDot"),
    syncStatus: document.getElementById("syncStatus")
  };

  function getDocRef(uid) {
    return fb.doc(fb.db, "users", uid, "lifeAdmin", "main");
  }

  function updateUi() {
    const signedIn = !!currentUser;
    const active = signedIn && cloudSyncEnabled;

    if (els.btnLogin) els.btnLogin.hidden = signedIn;
    if (els.btnLogout) els.btnLogout.hidden = !signedIn;
    if (els.btnPull) els.btnPull.hidden = !signedIn;
    if (els.btnPush) els.btnPush.hidden = !signedIn;

    if (els.btnSignInGoogle) els.btnSignInGoogle.disabled = signedIn;
    if (els.btnSignOut) els.btnSignOut.disabled = !signedIn;
    if (els.btnSyncNow) els.btnSyncNow.disabled = !active;
    if (els.setCloudSync) els.setCloudSync.checked = cloudSyncEnabled;

    if (!signedIn) {
      if (els.cloudStatus) els.cloudStatus.textContent = "Not signed in";
      if (els.cloudBadge) els.cloudBadge.textContent = "Local-only";
      if (els.syncText) els.syncText.textContent = "Sync off";
      if (els.syncDot) els.syncDot.className = "dot dot--red";
      if (els.syncStatus) els.syncStatus.className = "sync-status is-off";
      return;
    }

    if (!cloudSyncEnabled) {
      if (els.cloudStatus) els.cloudStatus.textContent = `Signed in as ${currentUser.email || currentUser.displayName || "Google user"}`;
      if (els.cloudBadge) els.cloudBadge.textContent = "Signed in";
      if (els.syncText) els.syncText.textContent = "Sync off";
      if (els.syncDot) els.syncDot.className = "dot dot--red";
      if (els.syncStatus) els.syncStatus.className = "sync-status is-off";
      return;
    }

    if (els.cloudStatus) els.cloudStatus.textContent = `Syncing as ${currentUser.email || currentUser.displayName || "Google user"}`;
    if (els.cloudBadge) els.cloudBadge.textContent = "Cloud sync on";
    if (els.syncText) els.syncText.textContent = "Sync on";
    if (els.syncDot) els.syncDot.className = "dot dot--green";
    if (els.syncStatus) els.syncStatus.className = "sync-status is-on";
  }

  async function signInToCloud() {
    try {
      await fb.signInWithPopup(fb.auth, fb.provider);
    } catch (err) {
      console.error("Google sign-in failed:", err);
      alert("Google sign-in failed.");
    }
  }

  async function signOutFromCloud() {
    try {
      stopRealtimeSync();
      await fb.signOut(fb.auth);
    } catch (err) {
      console.error("Sign out failed:", err);
      alert("Sign out failed.");
    }
  }

  async function pullFromCloud() {
    if (!currentUser) return;

    try {
      const snap = await fb.getDoc(getDocRef(currentUser.uid));

      if (snap.exists()) {
        const remote = app.normaliseStore(snap.data());
        isApplyingRemoteState = true;
        app.saveStore(remote);
        app.rerenderAll();
        isApplyingRemoteState = false;
      } else {
        await pushToCloud();
      }
    } catch (err) {
      console.error("Cloud pull failed:", err);
      alert("Could not load cloud data from Firebase.");
    }
  }

  async function pushToCloud() {
    if (!currentUser || !cloudSyncEnabled || isApplyingRemoteState) return;

    try {
      const store = app.normaliseStore(app.loadStore());
      const payload = {
        ...store,
        cloudMeta: {
          updatedAt: Date.now(),
          updatedBy: currentUser.uid,
          email: currentUser.email || ""
        },
        firestoreUpdatedAt: fb.serverTimestamp()
      };

      await fb.setDoc(getDocRef(currentUser.uid), payload, { merge: true });
    } catch (err) {
      console.error("Cloud push failed:", err);
    }
  }

  function stopRealtimeSync() {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
  }

  function startRealtimeSync() {
    if (!currentUser || !cloudSyncEnabled) return;

    stopRealtimeSync();

    unsubscribeSnapshot = fb.onSnapshot(
      getDocRef(currentUser.uid),
      (snap) => {
        if (!snap.exists()) return;

        const remote = app.normaliseStore(snap.data());
        const remoteTs = Number(remote?.cloudMeta?.updatedAt || 0);
        const local = app.normaliseStore(app.loadStore());
        const localTs = Number(local?.cloudMeta?.updatedAt || 0);

        if (remoteTs <= localTs) return;

        isApplyingRemoteState = true;
        app.saveStore(remote);
        app.rerenderAll();
        isApplyingRemoteState = false;
      },
      (err) => {
        console.error("Realtime sync listener failed:", err);
      }
    );
  }

  function initButtons() {
    els.btnLogin?.addEventListener("click", signInToCloud);
    els.btnLogout?.addEventListener("click", signOutFromCloud);
    els.btnSignInGoogle?.addEventListener("click", signInToCloud);
    els.btnSignOut?.addEventListener("click", signOutFromCloud);
    els.btnPull?.addEventListener("click", pullFromCloud);
    els.btnPush?.addEventListener("click", pushToCloud);
    els.btnSyncNow?.addEventListener("click", pushToCloud);

    els.setCloudSync?.addEventListener("change", async (e) => {
      cloudSyncEnabled = !!e.target.checked;
      localStorage.setItem("lifeAdmin.cloudSyncEnabled", String(cloudSyncEnabled));

      if (!cloudSyncEnabled) {
        stopRealtimeSync();
        updateUi();
        return;
      }

      if (!currentUser) {
        await signInToCloud();
        return;
      }

      await pullFromCloud();
      startRealtimeSync();
      updateUi();
    });
  }

  function initAutoPush() {
    window.addEventListener("lifeadmin:datachanged", () => {
      pushToCloud();
    });
  }

  function initAuth() {
    fb.onAuthStateChanged(fb.auth, async (user) => {
      currentUser = user || null;
      updateUi();

      if (!currentUser) {
        stopRealtimeSync();
        return;
      }

      if (cloudSyncEnabled) {
        await pullFromCloud();
        startRealtimeSync();
      }
    });
  }

  initButtons();
  initAutoPush();
  initAuth();
  updateUi();
})();