// auth.js
// Firebase Auth manages sessions — tokens are stored by the Firebase SDK
// in IndexedDB automatically. No sessionStorage manipulation needed.

import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where, // ✅ explicitly import these
} from "./firebase.js";

const ADMIN_EMAIL = "timone427@gmail.com";
const ADMIN_USERNAME = "@admin19";
const TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

let _currentUser = null;
let _sessionData = null;
let _inactiveTimer = null;

// ---- session listeners ----
function onSessionReady(callback) {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      _currentUser = null;
      _sessionData = null;
      callback(null);
      return;
    }
    _currentUser = firebaseUser;
    const snap = await getDoc(doc(db, "users", firebaseUser.uid));
    _sessionData = snap.exists()
      ? { uid: firebaseUser.uid, ...snap.data() }
      : null;
    callback(_sessionData);
    _resetTimer();
  });
}

function getSession() {
  return _sessionData;
}

function isAdmin(session) {
  const s = session || _sessionData;
  return (
    s?.isAdmin === true &&
    s?.email === ADMIN_EMAIL &&
    s?.username === ADMIN_USERNAME
  );
}

// ---- inactivity timer ----
function _resetTimer() {
  if (_inactiveTimer) clearTimeout(_inactiveTimer);
  _inactiveTimer = setTimeout(async () => {
    await signOut(auth);
    location.href = "login.html";
  }, TIMEOUT_MS);
}
function _touchSession() {
  if (_currentUser) _resetTimer();
}
document.addEventListener("click", _touchSession);
document.addEventListener("keydown", _touchSession);

// ---- login ----
async function login(username, email) {
  // Normalize username and email the same way as signup
  let uname = username.trim().toLowerCase();
  if (!uname.startsWith("@")) uname = "@" + uname;
  const mail = email.trim().toLowerCase();

  try {
    // Sign in with Firebase Auth using email + derived password
    const cred = await signInWithEmailAndPassword(
      auth,
      mail,
      _derivePassword(uname, mail),
    );

    // Fetch the user’s own profile doc by UID (matches signup logic)
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (!snap.exists()) {
      return { ok: false, error: "Profile not found." };
    }

    // Optionally verify username/email match what was stored
    const data = snap.data();
    if (data.username !== uname || data.email !== mail) {
      return { ok: false, error: "Username/email mismatch." };
    }

    return { ok: true, redirect: "profile.html" };
  } catch (e) {
    console.error("Login error:", e);
    if (e.code === "auth/wrong-password") {
      return { ok: false, error: "Incorrect password." };
    }
    if (e.code === "auth/user-not-found") {
      return { ok: false, error: "No account found." };
    }
    return { ok: false, error: "Login failed. Try again." };
  }
}

// ---- signup ----
async function signup(username, email) {
  let uname = username.trim().toLowerCase();
  if (!uname.startsWith("@")) uname = "@" + uname;
  const mail = email.trim().toLowerCase();

  if (uname === ADMIN_USERNAME)
    return { ok: false, error: "That username is reserved." };
  if (!mail.includes("@")) return { ok: false, error: "Enter a valid email." };

  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      mail,
      _derivePassword(uname, mail),
    );

    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      username: uname,
      email: mail,
      stars: 0,
      isAdmin: false,
      joinedAt: Date.now(),
    });

    return { ok: true, redirect: "profile.html" };
  } catch (e) {
    if (e.code === "auth/email-already-in-use")
      return { ok: false, error: "Email already registered." };
    return { ok: false, error: "Signup failed. Try again." };
  }
}

// ---- logout ----
async function logout() {
  await signOut(auth);
  location.href = "index.html";
}

// ---- guards ----
function requireAuth(onReady) {
  onSessionReady((session) => {
    if (!session) {
      location.href = "login.html";
      return;
    }
    if (isAdmin(session)) {
      location.href = "admin.html";
      return;
    }
    onReady(session);
  });
}
function requireAdmin(onReady) {
  onSessionReady((session) => {
    if (!session || !isAdmin(session)) {
      location.href = "index.html";
      return;
    }
    onReady(session);
  });
}
function requireGuest(onReady) {
  onSessionReady((session) => {
    if (session) {
      location.href = isAdmin(session) ? "admin.html" : "profile.html";
      return;
    }
    onReady();
  });
}

// ---- password derivation ----
function _derivePassword(username, email) {
  return btoa(`${username}::${email}::gz-dict-2025`).slice(0, 32);
}
function _adminPassword() {
  return document.querySelector('meta[name="gz-ap"]')?.content || "";
}

export {
  onSessionReady,
  getSession,
  isAdmin,
  login,
  signup,
  logout,
  requireAuth,
  requireAdmin,
  requireGuest,
};
