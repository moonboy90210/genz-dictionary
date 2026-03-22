// profile.js — user profile page
import { GZData }              from "./data.js";
import { requireAuth, logout } from "./auth.js";

// ============================================================
// THEME
// ============================================================
const root        = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const savedTheme  = localStorage.getItem("gz_theme") || "dark";
root.setAttribute("data-theme", savedTheme);

themeToggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("gz_theme", next);
});

// ============================================================
// GUARD — must be logged in, not admin
// ============================================================
requireAuth((session) => {
  initPage(session);
});

// ============================================================
// PAGE INIT
// ============================================================
function initPage(session) {

  // ---- Logout ----
  document.getElementById("logoutBtn").addEventListener("click", logout);

  // ---- Populate profile header ----
  const initial = session.username.replace("@", "").charAt(0).toUpperCase();
  document.getElementById("profileAvatar").textContent   = initial;
  document.getElementById("profileUsername").textContent = session.username;
  document.getElementById("profileEmail").textContent    = session.email;
  document.getElementById("starCount").textContent       = session.stars || 0;

  // ---- Upload form ----
  document.getElementById("uploadForm").addEventListener("submit", async e => {
    e.preventDefault();

    const word    = document.getElementById("slangWord").value.trim();
    const meaning = document.getElementById("slangMeaning").value.trim();
    const example = document.getElementById("slangExample").value.trim();
    const errEl   = document.getElementById("uploadError");
    const sucEl   = document.getElementById("uploadSuccess");
    const btn     = e.target.querySelector("button[type=submit]");

    errEl.textContent = "";
    sucEl.textContent = "";

    if (!word || !meaning || !example) {
      errEl.textContent = "All fields are required.";
      return;
    }

    if (word.length > 60) {
      errEl.textContent = "Slang word must be under 60 characters.";
      return;
    }

    btn.textContent = "SUBMITTING...";
    btn.disabled    = true;

    try {
      await GZData.addPendingSlang({
        word,
        meaning,
        example,
        letter:      word[0].toUpperCase(),
        uploadedBy:  session.username,
        uploaderUid: session.uid,
        status:      "pending"
      });

      sucEl.textContent = "✓ Submitted! Awaiting admin approval.";
      e.target.reset();
      await renderMySubmissions(session);

    } catch (err) {
      errEl.textContent = "Submission failed. Please try again.";
      console.error(err);
    }

    btn.textContent = "SUBMIT FOR REVIEW →";
    btn.disabled    = false;
  });

  // ---- Initial submissions render ----
  renderMySubmissions(session);

  // ---- Refresh live star count from Firestore ----
  refreshStars(session);
}

// ============================================================
// MY SUBMISSIONS
// ============================================================
async function renderMySubmissions(session) {
  const grid = document.getElementById("mySlangGrid");
  grid.innerHTML = `<div class="empty-state" style="padding:1.5rem">
    <span style="color:var(--text2);font-size:.85rem">Loading submissions...</span>
  </div>`;

  const [approved, pending] = await Promise.all([
    GZData.getSlangsForUser(session.username),
    GZData.getPendingForUser(session.username)
  ]);

  const all = [...approved, ...pending].sort(
    (a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)
  );

  grid.innerHTML = "";

  if (!all.length) {
    grid.innerHTML = `<div class="empty-state">
      <strong>No submissions yet.</strong>Upload your first slang above!
    </div>`;
    return;
  }

  all.forEach(s => {
    const card       = document.createElement("div");
    card.className   = "slang-card";
    card.innerHTML   = `
      <span class="slang-status status-${s.status}">${s.status.toUpperCase()}</span>
      <div class="slang-word">${escHtml(s.word)}</div>
      <div class="slang-meaning">${escHtml(s.meaning)}</div>
      <div class="slang-example">"${escHtml(s.example)}"</div>
    `;
    grid.appendChild(card);
  });
}

// ============================================================
// REFRESH STARS
// ============================================================
async function refreshStars(session) {
  try {
    const fresh = await GZData.getUser(session.uid);
    if (fresh) {
      document.getElementById("starCount").textContent = fresh.stars || 0;
    }
  } catch (err) {
    console.error("Could not refresh stars:", err);
  }
}

// ============================================================
// HELPERS
// ============================================================
function escHtml(str) {
  return String(str || "")
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;");
}