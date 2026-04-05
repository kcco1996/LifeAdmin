(() => {
  "use strict";

  const fb = window.__firebase;
  const app = window.lifeAdminApp;

  if (!fb || !app) return;

  let currentUser = null;

  const btnLogin = document.getElementById("btnLogin");
  const btnLogout = document.getElementById("btnLogout");
  const btnPush = document.getElementById("btnPush");
  const btnPull = document.getElementById("btnPull");
  const cloudStatus = document.getElementById("cloudStatus");

  const setCloudSync = document.getElementById("setCloudSync");
  const btnSignInGoogle = document.getElementById("btnSignInGoogle");
  const btnSignOut = document.getElementById("btnSignOut");
  const btnSyncNow = document.getElementById("btnSyncNow");
  const cloudBadge = document.getElementById("cloudBadge");
  const syncText = document.getElementById("syncText");
  const syncDot = document.getElementById("syncDot");
  const syncStatus = document.getElementById("syncStatus");

  function docRef(uid) {
    return fb.doc(fb.db, "users", uid, "lifeAdmin", "main");
  }

  function updateUi() {
    const signedIn = !!currentUser;

    if (btnLogin) btnLogin.hidden = signedIn;
    if (btnLogout) btnLogout.hidden = !signedIn;
    if (btnPush) btnPush.hidden = !signedIn;
    if (btnPull) btnPull.hidden = !signedIn;

    if (btnSignInGoogle) btnSignInGoogle.disabled = signedIn;
    if (btnSignOut) btnSignOut.disabled = !signedIn;
    if (btnSyncNow) btnSyncNow.disabled = !signedIn;

    if (setCloudSync) setCloudSync.checked = signedIn;

    if (!signedIn) {
      if (cloudStatus) cloudStatus.textContent = "Not signed in";
      if (cloudBadge) cloudBadge.textContent = "Local-only";
      if (syncText) syncText.textContent = "Sync off";
      if (syncDot) syncDot.className = "dot dot--red";
      if (syncStatus) syncStatus.className = "sync-status is-off";
      return;
    }

    if (cloudStatus) cloudStatus.textContent = `Signed in as ${currentUser.email || "Google user"}`;
    if (cloudBadge) cloudBadge.textContent = "Cloud sync on";
    if (syncText) syncText.textContent = "Sync on";
    if (syncDot) syncDot.className = "dot dot--green";
    if (syncStatus) syncStatus.className = "sync-status is-on";
  }

  async function signInNow() {
    try {
      const result = await fb.signInWithPopup(fb.auth, fb.provider);
      currentUser = result.user;
      updateUi();
      await pullNow();
    } catch (err) {
      alert("Sign in failed: " + (err?.message || "unknown"));
    }
  }

  async function signOutNow() {
    try {
      await fb.signOut(fb.auth);
      currentUser = null;
      updateUi();
    } catch (err) {
      alert("Sign out failed: " + (err?.message || "unknown"));
    }
  }

async function pushNow() {
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  try {
    const appStore = app.normaliseStore(app.loadStore());

    let moneyStore = null;
    try {
      const raw = localStorage.getItem("lifeadmin_money_v1");
      moneyStore = raw ? JSON.parse(raw) : null;
    } catch {
      moneyStore = null;
    }

    await fb.setDoc(
      docRef(currentUser.uid),
      {
        appStore,
        moneyStore,
        cloudMeta: {
          updatedAt: Date.now(),
          updatedBy: currentUser.uid,
          email: currentUser.email || ""
        },
        firestoreUpdatedAt: fb.serverTimestamp()
      },
      { merge: true }
    );

    if (cloudStatus) {
      cloudStatus.textContent = `Last pushed OK • ${currentUser.email || "Google user"}`;
    }
  } catch (err) {
    alert("Push failed: " + (err?.message || "unknown"));
  }
}

async function pullNow() {
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  try {
    const snap = await fb.getDoc(docRef(currentUser.uid));
    if (!snap.exists()) {
      alert("No cloud data found yet.");
      return;
    }

    const data = snap.data();

    if (data.appStore) {
      const remoteAppStore = app.normaliseStore(data.appStore);
      app.saveStore(remoteAppStore);
    } else {
      // fallback for older documents
      const remoteAppStore = app.normaliseStore(data);
      app.saveStore(remoteAppStore);
    }

    if (data.moneyStore) {
      localStorage.setItem("lifeadmin_money_v1", JSON.stringify(data.moneyStore));
    }

    if (cloudStatus) {
      cloudStatus.textContent = `Last pulled OK • ${currentUser.email || "Google user"}`;
    }

    alert("Pulled from cloud.");
    location.reload();
  } catch (err) {
    alert("Pull failed: " + (err?.message || "unknown"));
  }
}

  fb.onAuthStateChanged(fb.auth, (user) => {
    currentUser = user || null;
    updateUi();
  });

  btnLogin?.addEventListener("click", signInNow);
  btnLogout?.addEventListener("click", signOutNow);
  btnSignInGoogle?.addEventListener("click", signInNow);
  btnSignOut?.addEventListener("click", signOutNow);
  btnPush?.addEventListener("click", pushNow);
  btnPull?.addEventListener("click", pullNow);
  btnSyncNow?.addEventListener("click", pullNow);

  setCloudSync?.addEventListener("change", async (e) => {
    if (e.target.checked && !currentUser) {
      await pullNow ();
    }
  });

  window.addEventListener("lifeadmin:datachanged", () => {
    if (currentUser) pushNow();
  });

  updateUi();
})();