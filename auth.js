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
  doc, getDoc, getDocs, setDoc,
  collection, query, where   // ✅ explicitly import these
} from "./firebase.js";

const ADMIN_EMAIL    = "timone427@gmail.com";
const ADMIN_USERNAME = "@admin19";
const TIMEOUT_MS     = 20 * 60 * 1000; // 20 minutes

let _currentUser   = null;
let _sessionData   = null;
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
    _sessionData = snap.exists() ? { uid: firebaseUser.uid, ...snap.data() } : null;
    callback(_sessionData);
    _resetTimer();
  });
}

function getSession() { return _sessionData; }

function isAdmin(session) {
  const s = session || _sessionData;
  return s?.isAdmin === true &&
         s?.email   === ADMIN_EMAIL &&
         s?.username === ADMIN_USERNAME;
}

// ---- inactivity timer ----
function _resetTimer() {
  if (_inactiveTimer) clearTimeout(_inactiveTimer);
  _inactiveTimer = setTimeout(async () => {
    await signOut(auth);
    location.href = "login.html";
  }, TIMEOUT_MS);
}
function _touchSession() { if (_currentUser) _resetTimer(); }
document.addEventListener("click", _touchSession);
document.addEventListener("keydown", _touchSession);

// ---- login ----
async function login(username, email) {
  const uname = username.trim().startsWith("@")
    ? username.trim().toLowerCase()
    : "@" + username.trim().toLowerCase();
  const mail = email.trim().toLowerCase();

  if (uname === ADMIN_USERNAME && mail === ADMIN_EMAIL) {
    try {
      await signInWithEmailAndPassword(auth, mail, _adminPassword());
      return { ok: true, redirect: "admin.html" };
    } catch {
      return { ok: false, error: "Invalid admin credentials." };
    }
  }

  try {
    const snap = await getDocs(
      query(collection(db, "users"), where("username", "==", uname))
    );
    if (snap.empty) return { ok: false, error: "No account found with that username." };

    const userData = snap.docs[0].data();
    if (userData.email !== mail) return { ok: false, error: "Email does not match." };

    await signInWithEmailAndPassword(auth, mail, _derivePassword(uname, mail));
    return { ok: true, redirect: "profile.html" };
  } catch {
    return { ok: false, error: "Login failed. Check your credentials." };
  }
}

// ---- signup ----
async function signup(username, email) {
  let uname = username.trim().toLowerCase();
  if (!uname.startsWith("@")) uname = "@" + uname;
  const mail = email.trim().toLowerCase();

  if (uname === ADMIN_USERNAME) return { ok: false, error: "That username is reserved." };
  if (!mail.includes("@"))      return { ok: false, error: "Enter a valid email." };

  // ✅ Check if username already exists
  const existing = await getDocs(
    query(collection(db, "users"), where("username", "==", uname))
  );
  if (!existing.empty) return { ok: false, error: "Username already taken." };

  try {
    const cred = await createUserWithEmailAndPassword(
      auth, mail, _derivePassword(uname, mail)
    );

    // ✅ Save profile in Firestore
    await setDoc(doc(db, "users", cred.user.uid), {
      uid:      cred.user.uid,
      username: uname,
      email:    mail,
      stars:    0,
      isAdmin:  false,
      joinedAt: Date.now()
    });

    return { ok: true, redirect: "profile.html" };
  } catch (e) {
    if (e.code === "auth/email-already-in-use") return { ok: false, error: "Email already registered." };
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
    if (!session) { location.href = "login.html"; return; }
    if (isAdmin(session)) { location.href = "admin.html"; return; }
    onReady(session);
  });
}
function requireAdmin(onReady) {
  onSessionReady((session) => {
    if (!session || !isAdmin(session)) { location.href = "index.html"; return; }
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
  onSessionReady, getSession, isAdmin,
  login, signup, logout,
  requireAuth, requireAdmin, requireGuest
};
