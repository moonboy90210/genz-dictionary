// data.js
// Firestore for structured data (slangs, pending, users)
// Realtime DB for live data (likes, dislikes, comments)

import {
  db, rtdb,
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, addDoc,
  serverTimestamp, increment,
  ref, get, set, push, update, remove
} from "./firebase.js";

const GZData = (() => {

  // ---- SLANGS (Firestore) ----

  async function getApprovedSlangs() {
    const q    = query(collection(db, "slangs"), where("status", "==", "approved"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function getSlangsByLetter(letter) {
    const q    = query(
      collection(db, "slangs"),
      where("status", "==", "approved"),
      where("letter", "==", letter.toUpperCase())
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function getSlangsForUser(username) {
    const q    = query(collection(db, "slangs"), where("uploadedBy", "==", username));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function addApprovedSlang(slang) {
    const ref = await addDoc(collection(db, "slangs"), {
      ...slang,
      status:      "approved",
      createdAt:   serverTimestamp()
    });
    return ref.id;
  }

  async function updateSlang(id, fields) {
    await updateDoc(doc(db, "slangs", id), fields);
  }

  async function deleteSlang(id) {
    await deleteDoc(doc(db, "slangs", id));
    // Clean up RTDB votes + comments for this slang
    await remove(ref(rtdb, `votes/${id}`));
    await remove(ref(rtdb, `comments/${id}`));
  }

  // ---- PENDING (Firestore) ----

  async function getPendingForUser(username) {
  const q    = query(collection(db, "pending"), where("uploadedBy", "==", username));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

  async function addPendingSlang(slang) {
    const docRef = await addDoc(collection(db, "pending"), {
      ...slang,
      status:      "pending",
      submittedAt: serverTimestamp()
    });
    return docRef.id;
  }

  async function approvePending(id) {
    const snap = await getDoc(doc(db, "pending", id));
    if (!snap.exists()) return;
    const data = snap.data();

    // Move to slangs collection
    await setDoc(doc(db, "slangs", id), {
      ...data,
      status:     "approved",
      approvedAt: serverTimestamp()
    });
    await deleteDoc(doc(db, "pending", id));

    // Award star to uploader
    if (data.uploadedBy) {
      const userSnap = await getDocs(
        query(collection(db, "users"), where("username", "==", data.uploadedBy))
      );
      if (!userSnap.empty) {
        await updateDoc(userSnap.docs[0].ref, { stars: increment(1) });
      }
    }
  }

  async function rejectPending(id) {
    await deleteDoc(doc(db, "pending", id));
  }

  // ---- USERS (Firestore) ----

  async function getUsers() {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function getUser(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }

  async function getUserByUsername(username) {
    const q    = query(collection(db, "users"), where("username", "==", username));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  }

  async function updateUserStars(uid, stars) {
    await updateDoc(doc(db, "users", uid), { stars: Number(stars) });
  }

  async function deleteUser(uid) {
    await deleteDoc(doc(db, "users", uid));
  }

  // ---- VOTES + COMMENTS (Realtime DB — live updates) ----
  // Votes and comments use RTDB because they update frequently and
  // benefit from real-time syncing without page reloads.

  async function getVotes(slangId) {
    const snap = await get(ref(rtdb, `votes/${slangId}`));
    return snap.val() || { likes: 0, dislikes: 0 };
  }

  async function vote(slangId, uid, type) {
    // type: "like" | "dislike" | null (remove vote)
    const userVoteRef  = ref(rtdb, `votes/${slangId}/users/${uid}`);
    const prevSnap     = await get(userVoteRef);
    const prev         = prevSnap.val(); // "like" | "dislike" | null

    const updates = {};

    // Remove previous vote count
    if (prev === "like")    updates[`votes/${slangId}/likes`]    = increment(-1);
    if (prev === "dislike") updates[`votes/${slangId}/dislikes`] = increment(-1);

    if (type && type !== prev) {
      // Add new vote
      if (type === "like")    updates[`votes/${slangId}/likes`]    = increment(1);
      if (type === "dislike") updates[`votes/${slangId}/dislikes`] = increment(1);
      updates[`votes/${slangId}/users/${uid}`] = type;
    } else {
      // Toggle off
      updates[`votes/${slangId}/users/${uid}`] = null;
    }

    await update(ref(rtdb), updates);
  }

  async function getUserVote(slangId, uid) {
    const snap = await get(ref(rtdb, `votes/${slangId}/users/${uid}`));
    return snap.val(); // "like" | "dislike" | null
  }

  async function getComments(slangId) {
    const snap = await get(ref(rtdb, `comments/${slangId}`));
    const val  = snap.val();
    if (!val) return [];
    return Object.entries(val)
      .filter(([, v]) => v !== null)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => a.at - b.at);
  }

  async function addComment(slangId, author, text) {
    await push(ref(rtdb, `comments/${slangId}`), {
      author,
      text,
      at: Date.now()
    });
  }

  return {
    // slangs
    getApprovedSlangs, getSlangsByLetter, getSlangsForUser,
    addApprovedSlang, updateSlang, deleteSlang,
    // pending
    getPendingForUser, addPendingSlang, approvePending, rejectPending,
    // users
    getUsers, getUser, getUserByUsername, updateUserStars, deleteUser,
    // votes + comments
    getVotes, vote, getUserVote, getComments, addComment
  };
})();

export { GZData };