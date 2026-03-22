// data.js — add this method inside the GZData IIFE,
// alongside the other pending functions.
// profile.js calls GZData.getPendingForUser(username)

async function getPendingForUser(username) {
  const q    = query(collection(db, "pending"), where("uploadedBy", "==", username));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Also add it to the return object at the bottom of GZData:
// return {
//   ...
//   getPending, getPendingForUser, addPendingSlang, approvePending, rejectPending,
//   ...
// };