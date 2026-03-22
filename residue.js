// ============================================================
// GZ.DICT — DATA LAYER (localStorage persistence)
// ============================================================

const GZData = (() => {
  const KEYS = { slangs: 'gz_slangs', users: 'gz_users', pending: 'gz_pending' };

  const SEED_SLANGS = [
    { id: 's1', word: 'rizz', meaning: 'Natural ability to attract or charm others, esp. romantically', example: "He walked in and immediately had rizz — everyone was looking.", letter: 'R', likes: 42, dislikes: 2, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's2', word: 'no cap', meaning: 'No lie; for real; used to emphasize truth', example: "That concert was the best night of my life, no cap.", letter: 'N', likes: 38, dislikes: 1, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's3', word: 'slay', meaning: 'To do something exceptionally well; to look amazing', example: "She walked in slaying the fit, everyone was shook.", letter: 'S', likes: 55, dislikes: 3, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's4', word: 'bussin', meaning: "Really good, especially referring to food", example: "Bro these jollof rice hits different, it's bussin fr.", letter: 'B', likes: 31, dislikes: 0, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's5', word: 'vibe check', meaning: 'An assessment of someone\'s energy or mood', example: "He failed the vibe check, we had to leave.", letter: 'V', likes: 27, dislikes: 4, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's6', word: 'understood the assignment', meaning: 'Did exactly what was expected or more; nailed it', example: "That outfit? She understood the assignment.", letter: 'U', likes: 44, dislikes: 1, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's7', word: 'it\'s giving', meaning: 'It resembles or has the energy of something', example: "This whole look is giving main character energy.", letter: 'I', likes: 39, dislikes: 2, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's8', word: 'lowkey', meaning: 'Quietly, subtly, or to a small degree', example: "I lowkey wanna skip school today ngl.", letter: 'L', likes: 60, dislikes: 5, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's9', word: 'ate', meaning: 'Did something perfectly; nailed it completely', example: "She ate that performance and left no crumbs.", letter: 'A', likes: 35, dislikes: 0, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's10', word: 'delulu', meaning: 'Delusional; having unrealistic expectations', example: "Thinking you can date him without rizz? That's delulu.", letter: 'D', likes: 48, dislikes: 6, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's11', word: 'NPC', meaning: 'Someone who acts like a background character with no personality or depth', example: "He just stood there saying nothing — total NPC energy.", letter: 'N', likes: 52, dislikes: 3, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's12', word: 'glow up', meaning: 'A significant positive transformation in appearance or lifestyle', example: "His glow up from last year is unreal fr.", letter: 'G', likes: 41, dislikes: 1, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's13', word: 'rent free', meaning: 'When something or someone occupies your thoughts constantly without invitation', example: "That song has been living in my head rent free for weeks.", letter: 'R', likes: 33, dislikes: 2, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's14', word: 'mid', meaning: 'Average, mediocre, or unremarkable', example: "Everyone hyped the movie but honestly it was mid.", letter: 'M', likes: 29, dislikes: 7, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's15', word: 'era', meaning: 'A phase or period of your life defined by a certain vibe or identity', example: "I\'m fully in my healing era right now.", letter: 'E', likes: 46, dislikes: 2, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's16', word: 'hits different', meaning: 'Has a uniquely stronger or more emotional impact than usual', example: "Listening to that playlist at 2am just hits different.", letter: 'H', likes: 58, dislikes: 1, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's17', word: 'touch grass', meaning: 'A suggestion to go outside and get off the internet', example: "Bro argued about anime for 6 hours straight. Touch grass.", letter: 'T', likes: 63, dislikes: 4, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's18', word: 'ratio', meaning: 'When a reply gets more likes than the original post, implying it won the argument', example: "He got ratioed so hard he deleted the tweet.", letter: 'R', likes: 37, dislikes: 3, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's19', word: 'main character', meaning: 'Acting as if you\'re the protagonist of your own story; self-centered in a fun way', example: "She\'s giving full main character walking through the rain.", letter: 'M', likes: 50, dislikes: 2, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's20', word: 'caught in 4K', meaning: 'Caught doing something (usually bad) with undeniable proof', example: "He said he was home but was caught in 4K at the party.", letter: 'C', likes: 44, dislikes: 1, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's21', word: 'pressed', meaning: 'Upset, bothered, or annoyed about something', example: "Why are you so pressed over a game result?", letter: 'P', likes: 22, dislikes: 2, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's22', word: 'finna', meaning: 'Fixing to; about to do something', example: "I\'m finna head out, catch y\'all later.", letter: 'F', likes: 19, dislikes: 1, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's23', word: 'W', meaning: 'A win; something positive or successful', example: "Getting front-row tickets? That\'s a massive W.", letter: 'W', likes: 67, dislikes: 2, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's24', word: 'L', meaning: 'A loss; a failure or embarrassing moment', example: "Forgetting your wallet on a date? That\'s an L.", letter: 'L', likes: 55, dislikes: 3, comments: [], uploadedBy: null, status: 'approved' },
    { id: 's25', word: 'zero rizz', meaning: 'Completely lacking charm or ability to attract others', example: "He tried to flirt but said \"you remind me of my aunt.\" Zero rizz.", letter: 'Z', likes: 72, dislikes: 1, comments: [], uploadedBy: null, status: 'approved' },
  ];

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  }
  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function getSlangs() {
    let s = load(KEYS.slangs);
    if (!s) { s = SEED_SLANGS; save(KEYS.slangs, s); }
    return s;
  }
  function saveSlangs(s) { save(KEYS.slangs, s); }

  function getUsers() { return load(KEYS.users) || []; }
  function saveUsers(u) { save(KEYS.users, u); }

  function getPending() { return load(KEYS.pending) || []; }
  function savePending(p) { save(KEYS.pending, p); }

  function getApprovedSlangs() { return getSlangs().filter(s => s.status === 'approved'); }

  function getSlangsByLetter(letter) { return getApprovedSlangs().filter(s => s.letter.toUpperCase() === letter.toUpperCase()); }

  function addPendingSlang(slang) {
    const p = getPending();
    p.push(slang);
    savePending(p);
  }

  function approvePending(id) {
    const pending = getPending();
    const idx = pending.findIndex(s => s.id === id);
    if (idx === -1) return;
    const slang = { ...pending[idx], status: 'approved' };
    pending.splice(idx, 1);
    savePending(pending);
    const slangs = getSlangs();
    slangs.push(slang);
    saveSlangs(slangs);
    // Award star to uploader
    if (slang.uploadedBy) {
      const users = getUsers();
      const u = users.find(u => u.username === slang.uploadedBy);
      if (u) { u.stars = (u.stars || 0) + 1; saveUsers(users); }
    }
    return slang;
  }

  function rejectPending(id) {
    const pending = getPending();
    const i = pending.findIndex(s => s.id === id);
    if (i !== -1) { pending.splice(i, 1); savePending(pending); }
  }

  function deleteSlang(id) {
    const slangs = getSlangs().filter(s => s.id !== id);
    saveSlangs(slangs);
  }

  function updateSlang(id, fields) {
    const slangs = getSlangs();
    const idx = slangs.findIndex(s => s.id === id);
    if (idx !== -1) { Object.assign(slangs[idx], fields); saveSlangs(slangs); return slangs[idx]; }
  }

  function updateUserStars(username, stars) {
    const users = getUsers();
    const u = users.find(u => u.username === username);
    if (u) { u.stars = parseInt(stars) || 0; saveUsers(users); }
  }

  function deleteUser(username) {
    const users = getUsers().filter(u => u.username !== username);
    saveUsers(users);
  }

  function genId() { return 's' + Date.now() + Math.random().toString(36).slice(2, 6); }

  return { getSlangs, saveSlangs, getUsers, saveUsers, getPending, savePending, getApprovedSlangs, getSlangsByLetter, addPendingSlang, approvePending, rejectPending, deleteSlang, updateSlang, updateUserStars, deleteUser, genId };
})();

// ============================================================
// GZ.DICT — AUTH MODULE
// ============================================================

const GZAuth = (() => {
  const SESSION_KEY = 'gz_session';
  const TIMEOUT_MS = 20 * 60 * 1000; // 20 min
  const ADMIN_USERNAME = '@admin19';
  const ADMIN_EMAIL = 'timone427@gmail.com';

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
    _timer = setTimeout(() => { clearSession(); location.href = 'login.html'; }, TIMEOUT_MS);
  }

  function touchSession() {
    const s = getSession();
    if (s) { s.lastActive = Date.now(); sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); resetTimer(); }
  }

  // Touch on any user interaction
  document.addEventListener('click', touchSession);
  document.addEventListener('keydown', touchSession);

  function isAdmin(session) {
    return session && session.username === ADMIN_USERNAME && session.email === ADMIN_EMAIL;
  }

  function isLoggedIn() { return !!getSession(); }

  function login(username, email) {
    const uname = username.trim().toLowerCase();
    const mail = email.trim().toLowerCase();

    // Admin check
    if (uname === ADMIN_USERNAME && mail === ADMIN_EMAIL) {
      setSession({ username: ADMIN_USERNAME, email: ADMIN_EMAIL, isAdmin: true, stars: 0 });
      return { ok: true, redirect: 'admin.html' };
    }

    // Regular user check
    const users = GZData.getUsers();
    const user = users.find(u => u.username.toLowerCase() === uname && u.email.toLowerCase() === mail);
    if (!user) return { ok: false, error: 'No account found with those credentials.' };
    setSession({ ...user, isAdmin: false });
    return { ok: true, redirect: 'profile.html' };
  }

  function signup(username, email) {
    let uname = username.trim();
    const mail = email.trim().toLowerCase();

    if (!uname.startsWith('@')) uname = '@' + uname;
    uname = uname.toLowerCase();

    if (uname === ADMIN_USERNAME) return { ok: false, error: 'That username is reserved.' };
    if (!mail || !mail.includes('@')) return { ok: false, error: 'Enter a valid email.' };

    const users = GZData.getUsers();
    if (users.find(u => u.username.toLowerCase() === uname)) return { ok: false, error: 'Username already taken.' };
    if (users.find(u => u.email.toLowerCase() === mail)) return { ok: false, error: 'Email already registered.' };

    const user = { username: uname, email: mail, stars: 0, joinedAt: Date.now() };
    users.push(user);
    GZData.saveUsers(users);
    setSession({ ...user, isAdmin: false });
    return { ok: true, redirect: 'profile.html' };
  }

  function logout() { clearSession(); location.href = 'index.html'; }

  function requireAuth(redirectIfAdmin = false) {
    const s = getSession();
    if (!s) { location.href = 'login.html'; return null; }
    if (redirectIfAdmin && isAdmin(s)) { location.href = 'admin.html'; return null; }
    if (!redirectIfAdmin && isAdmin(s)) return s;
    return s;
  }

  function requireAdmin() {
    const s = getSession();
    if (!s || !isAdmin(s)) { location.href = 'index.html'; return null; }
    return s;
  }

  // Sync star count from storage into session
  function refreshSession() {
    const s = getSession();
    if (!s || s.isAdmin) return;
    const users = GZData.getUsers();
    const u = users.find(u => u.username === s.username);
    if (u) setSession({ ...u, isAdmin: false });
  }

  return { getSession, setSession, clearSession, isAdmin, isLoggedIn, login, signup, logout, requireAuth, requireAdmin, refreshSession };
})();