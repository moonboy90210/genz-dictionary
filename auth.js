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
  doc, getDoc, setDoc
} from "./firebase.js";

const ADMIN_EMAIL    = "timone427@gmail.com";
const ADMIN_USERNAME = "@admin19";
// 20 minute inactivity timeout
const TIMEOUT_MS     = 20 * 60 * 1000;

let _currentUser  = null;  // Firebase Auth user object
let _sessionData  = null;  // GZ profile data (username, stars, isAdmin)
let _inactiveTimer = null;

// ---- session listeners ----

// Called by each page on load to get the current auth state
function onSessionReady(callback) {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      _currentUser = null;
      _sessionData = null;
      callback(null);
      return;
    }
    _currentUser = firebaseUser;
    // Load GZ profile from Firestore
    const snap = await getDoc(doc(db, "users", firebaseUser.uid));
    _sessionData = snap.exists() ? { uid: firebaseUser.uid, ...snap.data() } : null;
    callback(_sessionData);
    _resetTimer();
  });
}

function getSession() {
  return _sessionData;
}

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

function _touchSession() {
  if (_currentUser) _resetTimer();
}

document.addEventListener("click",   _touchSession);
document.addEventListener("keydown",  _touchSession);

// ---- login ----

async function login(username, email) {
  const uname = username.trim().startsWith("@")
    ? username.trim().toLowerCase()
    : "@" + username.trim().toLowerCase();
  const mail = email.trim().toLowerCase();

  // Admin uses a fixed Firebase Auth account you create manually in the console
  if (uname === ADMIN_USERNAME && mail === ADMIN_EMAIL) {
    try {
      await signInWithEmailAndPassword(auth, mail, _adminPassword());
      return { ok: true, redirect: "admin.html" };
    } catch {
      return { ok: false, error: "Invalid admin credentials." };
    }
  }

  // Regular users — look up their email in Firestore first, then sign in
  try {
    // Find the Firestore user document by username to get their email
    const snap = await getDocs(
      query(collection(db, "users"), where("username", "==", uname))
    );
    if (snap.empty) return { ok: false, error: "No account found with that username." };

    const userData = snap.docs[0].data();
    if (userData.email !== mail) return { ok: false, error: "Email does not match." };

    await signInWithEmailAndPassword(auth, mail, _derivePassword(uname, mail));
    return { ok: true, redirect: "profile.html" };
  } catch (e) {
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

  // Check username taken
  const existing = await getDocs(
    query(collection(db, "users"), where("username", "==", uname))
  );
  if (!existing.empty) return { ok: false, error: "Username already taken." };

  try {
    const cred = await createUserWithEmailAndPassword(
      auth, mail, _derivePassword(uname, mail)
    );
    // Store GZ profile in Firestore under the Firebase Auth UID
    await setDoc(doc(db, "users", cred.user.uid), {
      uid:        cred.user.uid,
      username:   uname,
      email:      mail,
      stars:      0,
      isAdmin:    false,
      joinedAt:   Date.now()
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
// Since your signup only takes username + email (no password field),
// we derive a deterministic password. Upgrade to real password field for prod.

function _derivePassword(username, email) {
  // Simple but consistent — enough for username+email-only auth
  return btoa(`${username}::${email}::gz-dict-2025`).slice(0, 32);
}

function _adminPassword() {
  // Admin account password — set this manually in Firebase Console
  // Auth > Users > timone427@gmail.com > Reset password
  // Then hardcode that password here or put it in a meta tag set by Netlify env
  return document.querySelector('meta[name="gz-ap"]')?.content || "";
}

export {
  onSessionReady, getSession, isAdmin,
  login, signup, logout,
  requireAuth, requireAdmin, requireGuest
};