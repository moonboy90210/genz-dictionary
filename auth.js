// ============================================================
// GZ.DICT — AUTH MODULE (session only, data via Realtime DB)
// ============================================================

const GZAuth = (() => {
  const SESSION_KEY = "gz_session";
  const TIMEOUT_MS  = 20 * 60 * 1000;
  const ADMIN_USERNAME = "@admin19";
  const ADMIN_EMAIL    = "timone427@gmail.com";

  let _timer = null;

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (Date.now() - s.lastActive > TIMEOUT_MS) { clearSession(); return null; }
      return s;
    } catch { return null; }
  }

  function setSession(user) {
    const s = { ...user, lastActive: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    resetTimer();
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    if (_timer) clearTimeout(_timer);
  }

  function resetTimer() {
    if (_timer) clearTimeout(_timer);
    _timer = setTimeout(() => { clearSession(); location.href = "login.html"; }, TIMEOUT_MS);
  }

  function touchSession() {
    const s = getSession();
    if (s) { s.lastActive = Date.now(); sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); resetTimer(); }
  }

  document.addEventListener("click", touchSession);
  document.addEventListener("keydown", touchSession);

  function isAdmin(session) {
    return session?.username === ADMIN_USERNAME && session?.email === ADMIN_EMAIL;
  }

  function isLoggedIn() { return !!getSession(); }

async function login(username, email) {
  const uname = username.trim().startsWith("@")
    ? username.trim().toLowerCase()
    : "@" + username.trim().toLowerCase();
  const mail = email.trim().toLowerCase();
  if (uname === ADMIN_USERNAME && mail === ADMIN_EMAIL) {
    setSession({ username: ADMIN_USERNAME, email: ADMIN_EMAIL, isAdmin: true, stars: 0 });
    return { ok: true, redirect: "admin.html" };
  }
  const user = await GZData.getUser(uname);
  if (!user || user.email?.toLowerCase() !== mail) {
    return { ok: false, error: "No account found with those credentials." };
  }
  setSession({ ...user, isAdmin: false });
  return { ok: true, redirect: "profile.html" };
}

  async function signup(username, email) {
    let uname = username.trim().toLowerCase();
    if (!uname.startsWith("@")) uname = "@" + uname;
    const mail = email.trim().toLowerCase();

    if (uname === ADMIN_USERNAME) return { ok: false, error: "That username is reserved." };
    if (!mail.includes("@")) return { ok: false, error: "Enter a valid email." };

    if (await GZData.userExists(uname)) return { ok: false, error: "Username already taken." };
    if (await GZData.emailExists(mail))  return { ok: false, error: "Email already registered." };

    const user = { username: uname, email: mail, stars: 0, joinedAt: Date.now() };
    await GZData.createUser(user);
    setSession({ ...user, isAdmin: false });
    return { ok: true, redirect: "profile.html" };
  }

  function logout() { clearSession(); location.href = "index.html"; }

  function requireAuth() {
    const s = getSession();
    if (!s) { location.href = "login.html"; return null; }
    return s;
  }

  function requireAdmin() {
    const s = getSession();
    if (!s || !isAdmin(s)) { location.href = "index.html"; return null; }
    return s;
  }

  async function refreshSession() {
    const s = getSession();
    if (!s || isAdmin(s)) return;
    const user = await GZData.getUser(s.username);
    if (user) setSession({ ...user, isAdmin: false });
  }

  return {
    getSession, setSession, clearSession,
    isAdmin, isLoggedIn,
    login, signup, logout,
    requireAuth, requireAdmin, refreshSession
  };
})();