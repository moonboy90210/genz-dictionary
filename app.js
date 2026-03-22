// app.js — index page
import { GZData }                          from "./data.js";
import { onSessionReady, isAdmin }         from "./auth.js";

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
// AUTH STATE — profile button
// ============================================================
const profileWrap = document.getElementById("profileWrap");

onSessionReady((session) => {
  if (session && isAdmin(session)) {
    profileWrap.innerHTML = `<a href="admin.html" class="profile-btn">⚡ Admin</a>`;
  } else if (session) {
    profileWrap.innerHTML = `<a href="profile.html" class="profile-btn">★ ${escHtml(session.username)}</a>`;
  } else {
    profileWrap.innerHTML = `<a href="login.html" class="profile-btn">⊕ Sign In</a>`;
  }
});

// ============================================================
// ALPHABET INDEX
// ============================================================
const ALPHABET     = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const letterNav    = document.getElementById("letterNav");
let   activeLetter = null;

// Build letter buttons then do initial render
(async () => {
  const all               = await GZData.getApprovedSlangs();
  const lettersWithSlangs = new Set(all.map(s => s.letter?.toUpperCase()));

  ALPHABET.forEach(l => {
    const btn = document.createElement("button");
    btn.className   = "letter-btn" + (lettersWithSlangs.has(l) ? " has-slangs" : "");
    btn.textContent = l;

    btn.addEventListener("click", async () => {
      if (activeLetter === l) {
        activeLetter = null;
        btn.classList.remove("active");
        renderSlangList(all, "ALL SLANGS");
      } else {
        document.querySelectorAll(".letter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeLetter = l;
        const filtered = all.filter(s => s.letter?.toUpperCase() === l);
        renderSlangList(filtered, `LETTER — ${l}`);
      }
    });

    letterNav.appendChild(btn);
  });

  // Initial render — reuse already-fetched list
  renderSlangList(all, "ALL SLANGS");
})();

// ============================================================
// SEARCH
// ============================================================
document.getElementById("searchBtn").addEventListener("click", doSearch);
document.getElementById("searchInput").addEventListener("keydown", e => {
  if (e.key === "Enter") doSearch();
});

async function doSearch() {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();

  if (!q) {
    const all = await GZData.getApprovedSlangs();
    document.querySelectorAll(".letter-btn").forEach(b => b.classList.remove("active"));
    activeLetter = null;
    renderSlangList(all, "ALL SLANGS");
    return;
  }

  const all     = await GZData.getApprovedSlangs();
  const results = all.filter(s =>
    s.word?.toLowerCase().includes(q) ||
    s.meaning?.toLowerCase().includes(q)
  );

  document.querySelectorAll(".letter-btn").forEach(b => b.classList.remove("active"));
  activeLetter = null;
  renderSlangList(results, `RESULTS FOR "${q.toUpperCase()}"`);
}

// ============================================================
// RENDER SLANG LIST
// ============================================================
function renderSlangList(list, label) {
  document.getElementById("sectionLabel").textContent = label;
  document.getElementById("slangCount").textContent   =
    `${list.length} SLANG${list.length !== 1 ? "S" : ""}`;

  const grid = document.getElementById("slangGrid");
  grid.innerHTML = "";

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state">
      <strong>Nothing here.</strong>No slangs found. Be the first to add one!
    </div>`;
    return;
  }

  const sorted = [...list].sort((a, b) => a.word.localeCompare(b.word));
  sorted.forEach(s => grid.appendChild(createSlangCard(s)));
}

// ============================================================
// SLANG CARD
// ============================================================
function createSlangCard(slang) {
  const card      = document.createElement("div");
  card.className  = "slang-card";
  card.dataset.id = slang.id;

  card.innerHTML = `
    <div class="slang-word">${escHtml(slang.word)}</div>
    <div class="slang-meaning">${escHtml(slang.meaning)}</div>
    <div class="slang-example">"${escHtml(slang.example)}"</div>
    <div class="slang-meta">
      <span>${slang.uploadedBy ? `by ${escHtml(slang.uploadedBy)}` : "GZ.DICT"}</span>
      <div class="slang-actions">
        <button class="like-btn"         data-id="${slang.id}">▲ <span class="like-count">–</span></button>
        <button class="dislike-btn"      data-id="${slang.id}">▼ <span class="dislike-count">–</span></button>
        <button class="comments-toggle"  data-id="${slang.id}">💬 <span class="comment-count">–</span></button>
      </div>
    </div>
    <div class="comments-section" id="comments-${slang.id}">
      <div class="comment-list" id="clist-${slang.id}"></div>
      <div id="comment-input-${slang.id}"></div>
    </div>
  `;

  // Load vote counts immediately
  loadVotes(slang.id, card);

  // Vote handlers
  card.querySelector(".like-btn").addEventListener("click",    () => handleVote(slang.id, "like",    card));
  card.querySelector(".dislike-btn").addEventListener("click", () => handleVote(slang.id, "dislike", card));

  // Comments — load lazily on first open
  let commentsLoaded = false;
  card.querySelector(".comments-toggle").addEventListener("click", async () => {
    const sec = document.getElementById(`comments-${slang.id}`);
    sec.classList.toggle("open");
    if (!commentsLoaded && sec.classList.contains("open")) {
      commentsLoaded = true;
      await loadComments(slang.id, card);
    }
  });

  return card;
}

// ============================================================
// VOTES
// ============================================================
async function loadVotes(slangId, card) {
  const votes = await GZData.getVotes(slangId);
  card.querySelector(".like-count").textContent    = votes.likes    || 0;
  card.querySelector(".dislike-count").textContent = votes.dislikes || 0;

  // Show user's existing vote if logged in
  const session = getActiveSession();
  if (session) {
    const userVote = await GZData.getUserVote(slangId, session.uid);
    card.querySelector(".like-btn").classList.toggle("active",    userVote === "like");
    card.querySelector(".dislike-btn").classList.toggle("active", userVote === "dislike");
  }
}

async function handleVote(slangId, type, card) {
  const session = getActiveSession();
  if (!session) {
    alert("Sign in to vote on slangs.");
    return;
  }

  const likeActive    = card.querySelector(".like-btn").classList.contains("active");
  const dislikeActive = card.querySelector(".dislike-btn").classList.contains("active");
  const currentVote   = likeActive ? "like" : dislikeActive ? "dislike" : null;

  // Clicking same button toggles it off
  const newVote = currentVote === type ? null : type;
  await GZData.vote(slangId, session.uid, newVote);
  await loadVotes(slangId, card);
}

// ============================================================
// COMMENTS
// ============================================================
async function loadComments(slangId, card) {
  const [comments, session] = await Promise.all([
    GZData.getComments(slangId),
    Promise.resolve(getActiveSession())
  ]);

  const listEl  = document.getElementById(`clist-${slangId}`);
  const inputEl = document.getElementById(`comment-input-${slangId}`);

  // Comment list
  listEl.innerHTML = comments.length
    ? comments.map(c => `
        <div class="comment-item">
          <span class="comment-author">${escHtml(c.author)}</span>
          <span>${escHtml(c.text)}</span>
        </div>`).join("")
    : `<p style="font-size:.75rem;color:var(--text2)">No comments yet.</p>`;

  // Update badge
  card.querySelector(".comment-count").textContent = comments.length;

  // Comment input
  if (session) {
    inputEl.innerHTML = `
      <div class="comment-input-row">
        <input class="comment-input" id="cinput-${slangId}" placeholder="drop a comment..." />
        <button class="comment-submit" id="csubmit-${slangId}">POST</button>
      </div>`;

    document.getElementById(`csubmit-${slangId}`).addEventListener("click", async () => {
      const inp  = document.getElementById(`cinput-${slangId}`);
      const text = inp.value.trim();
      if (!text) return;
      await GZData.addComment(slangId, session.username, text);
      inp.value = "";
      await loadComments(slangId, card);
    });
  } else {
    inputEl.innerHTML = `
      <p class="login-prompt"><a href="login.html">Log in</a> to comment.</p>`;
  }
}

// ============================================================
// HELPERS
// ============================================================

// Synchronous session read — safe after onSessionReady has fired
let _cachedSession = null;
onSessionReady(s => { _cachedSession = s; });
function getActiveSession() { return _cachedSession; }

function escHtml(str) {
  return String(str || "")
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;");
}