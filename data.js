// ============================================================
// GZ.DICT — DATA LAYER (Firebase Realtime Database)
// ============================================================

const DB_URL = "https://gen-z-dict-default-rtdb.firebaseio.com";

const GZData = (() => {

  async function dbGet(path) {
    const res = await fetch(`${DB_URL}/${path}.json`);
    return res.ok ? res.json() : null;
  }

  async function dbSet(path, data) {
    await fetch(`${DB_URL}/${path}.json`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  async function dbPush(path, data) {
    const res = await fetch(`${DB_URL}/${path}.json`, {
      method: "POST",
      body: JSON.stringify(data)
    });
    const json = await res.json();
    return json.name; // Firebase-generated key
  }

  async function dbPatch(path, data) {
    await fetch(`${DB_URL}/${path}.json`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  }

  async function dbDelete(path) {
    await fetch(`${DB_URL}/${path}.json`, { method: "DELETE" });
  }

  // Convert Firebase object (keyed by push ID) to array
  function toArray(obj) {
    if (!obj) return [];
    return Object.entries(obj).map(([id, val]) => ({ ...val, id }));
  }

  // ---- SLANGS ----
  async function getApprovedSlangs() {
    const data = await dbGet("slangs");
    return toArray(data).filter(s => s.status === "approved");
  }

  async function getSlangsByLetter(letter) {
    const all = await getApprovedSlangs();
    return all.filter(s => s.letter?.toUpperCase() === letter.toUpperCase());
  }

  async function getSlangsForUser(username) {
    const all = await getApprovedSlangs();
    return all.filter(s => s.uploadedBy === username);
  }

  async function updateSlang(id, fields) {
    await dbPatch(`slangs/${id}`, fields);
  }

  async function deleteSlang(id) {
    await dbDelete(`slangs/${id}`);
  }

  async function addApprovedSlang(slang) {
    const id = await dbPush("slangs", { ...slang, status: "approved" });
    return id;
  }

  // ---- PENDING ----
  async function getPending() {
    const data = await dbGet("pending");
    return toArray(data);
  }

  async function addPendingSlang(slang) {
    await dbPush("pending", { ...slang, status: "pending" });
  }

  async function approvePending(id) {
    const data = await dbGet(`pending/${id}`);
    if (!data) return;
    // Move to slangs
    await dbPush("slangs", { ...data, status: "approved" });
    await dbDelete(`pending/${id}`);
    // Award star to uploader
    if (data.uploadedBy) {
      const user = await dbGet(`users/${encodeUsername(data.uploadedBy)}`);
      if (user) {
        await dbPatch(`users/${encodeUsername(data.uploadedBy)}`, {
          stars: (user.stars || 0) + 1
        });
      }
    }
  }

  async function rejectPending(id) {
    await dbDelete(`pending/${id}`);
  }

  // ---- USERS ----
  // Firebase keys can't have special chars — encode the @ in username
  function encodeUsername(u) {
    return u.replace("@", "__at__");
  }
  function decodeUsername(u) {
    return u.replace("__at__", "@");
  }

  async function getUsers() {
    const data = await dbGet("users");
    if (!data) return [];
    return Object.entries(data).map(([key, val]) => ({
      ...val,
      username: val.username || decodeUsername(key)
    }));
  }

  async function getUser(username) {
    return dbGet(`users/${encodeUsername(username)}`);
  }

  async function createUser(user) {
    await dbSet(`users/${encodeUsername(user.username)}`, user);
  }

  async function updateUserStars(username, stars) {
    await dbPatch(`users/${encodeUsername(username)}`, { stars: Number(stars) });
  }

  async function deleteUser(username) {
    await dbDelete(`users/${encodeUsername(username)}`);
  }

  async function userExists(username) {
    const u = await getUser(username);
    return u !== null;
  }

  async function emailExists(email) {
    const users = await getUsers();
    return users.some(u => u.email?.toLowerCase() === email.toLowerCase());
  }

  function genId() {
    return "s" + Date.now() + Math.random().toString(36).slice(2, 6);
  }

  return {
    getApprovedSlangs, getSlangsByLetter, getSlangsForUser,
    updateSlang, deleteSlang, addApprovedSlang,
    getPending, addPendingSlang, approvePending, rejectPending,
    getUsers, getUser, createUser, updateUserStars, deleteUser,
    userExists, emailExists, encodeUsername, genId
  };
})();