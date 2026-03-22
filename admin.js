// admin.js — admin panel
import { GZData }               from "./data.js";
import { requireAdmin, logout } from "./auth.js";

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
// GUARD — must be admin
// ============================================================
requireAdmin((session) => {
  initPage(session);
});

// ============================================================
// PAGE INIT
// ============================================================
function initPage(session) {

  // ---- Logout ----
  document.getElementById("logoutBtn").addEventListener("click", logout);

  // ---- Tabs ----
  document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach(t   => t.classList.remove("active"));
      document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab + "Panel").classList.add("active");
    });
  });

  // ---- Admin add slang form ----
  document.getElementById("adminAddForm").addEventListener("submit", async e => {
    e.preventDefault();

    const word    = document.getElementById("adminWord").value.trim();
    const meaning = document.getElementById("adminMeaning").value.trim();
    const example = document.getElementById("adminExample").value.trim();
    const errEl   = document.getElementById("adminError");
    const sucEl   = document.getElementById("adminSuccess");
    const btn     = e.target.querySelector("button[type=submit]");

    errEl.textContent = "";
    sucEl.textContent = "";

    if (!word || !meaning || !example) {
      errEl.textContent = "All fields are required.";
      return;
    }

    btn.textContent = "ADDING...";
    btn.disabled    = true;

    try {
      await GZData.addApprovedSlang({
        word,
        meaning,
        example,
        letter:     word[0].toUpperCase(),
        likes:      0,
        dislikes:   0,
        uploadedBy: null,
        status:     "approved"
      });

      sucEl.textContent = `✓ "${word}" added to dictionary.`;
      e.target.reset();
      await renderApproved();

    } catch (err) {
      errEl.textContent = "Failed to add slang. Try again.";
      console.error(err);
    }

    btn.textContent = "ADD TO DICTIONARY →";
    btn.disabled    = false;
  });

  // ---- Edit modal ----
  document.getElementById("closeEditBtn").addEventListener("click", closeEditModal);
  document.getElementById("editModal").addEventListener("click", e => {
    if (e.target === document.getElementById("editModal")) closeEditModal();
  });

  document.getElementById("saveEditBtn").addEventListener("click", async () => {
    const id      = document.getElementById("editId").value;
    const word    = document.getElementById("editWord").value.trim();
    const meaning = document.getElementById("editMeaning").value.trim();
    const example = document.getElementById("editExample").value.trim();

    if (!word || !meaning || !example) return;

    const btn = document.getElementById("saveEditBtn");
    btn.textContent = "SAVING...";
    btn.disabled    = true;

    try {
      await GZData.updateSlang(id, {
        word,
        meaning,
        example,
        letter: word[0].toUpperCase()
      });
      closeEditModal();
      await renderApproved();
    } catch (err) {
      console.error("Edit failed:", err);
    }

    btn.textContent = "SAVE →";
    btn.disabled    = false;
  });

  // ---- Initial render ----
  renderAll();
}

// ============================================================
// RENDER ALL PANELS
// ============================================================
async function renderAll() {
  await Promise.all([
    renderPending(),
    renderApproved(),
    renderUsers()
  ]);
}

// ============================================================
// PENDING
// ============================================================
async function renderPending() {
  const list    = await GZData.getPending();
  const badge   = document.getElementById("pendingBadge");
  const el      = document.getElementById("pendingList");

  badge.textContent = list.length;

  if (!list.length) {
    el.innerHTML = `<p style="color:var(--text2);padding:1.5rem;font-size:.85rem">
      No pending submissions.
    </p>`;
    return;
  }

  el.innerHTML = "";

  list.forEach(s => {
    const item       = document.createElement("div");
    item.className   = "admin-item";
    item.innerHTML   = `
      <div>
        <div class="admin-item-word">${escHtml(s.word)}</div>
        <div class="admin-item-meaning">${escHtml(s.meaning)}</div>
        <div class="admin-item-example">"${escHtml(s.example)}"</div>
        <div class="admin-item-meta">
          Submitted by ${escHtml(s.uploadedBy || "—")}
        </div>
      </div>
      <div class="admin-actions">
        <button class="btn-approve">✓ APPROVE</button>
        <button class="btn-reject">✕ REJECT</button>
      </div>
    `;

    item.querySelector(".btn-approve").addEventListener("click", async (e) => {
      e.target.textContent = "APPROVING...";
      e.target.disabled    = true;
      try {
        await GZData.approvePending(s.id);
        await renderAll();
      } catch (err) {
        console.error("Approve failed:", err);
        e.target.textContent = "✓ APPROVE";
        e.target.disabled    = false;
      }
    });

    item.querySelector(".btn-reject").addEventListener("click", async (e) => {
      if (!confirm(`Reject "${s.word}"? This cannot be undone.`)) return;
      e.target.textContent = "REJECTING...";
      e.target.disabled    = true;
      try {
        await GZData.rejectPending(s.id);
        await renderAll();
      } catch (err) {
        console.error("Reject failed:", err);
        e.target.textContent = "✕ REJECT";
        e.target.disabled    = false;
      }
    });

    el.appendChild(item);
  });
}

// ============================================================
// APPROVED SLANGS
// ============================================================
async function renderApproved() {
  const all  = await GZData.getApprovedSlangs();
  const list = [...all].sort((a, b) => a.word.localeCompare(b.word));
  const el   = document.getElementById("approvedList");

  if (!list.length) {
    el.innerHTML = `<p style="color:var(--text2);padding:1.5rem;font-size:.85rem">
      No approved slangs yet.
    </p>`;
    return;
  }

  el.innerHTML = "";

  list.forEach(s => {
    const item     = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `
      <div>
        <div class="admin-item-word">${escHtml(s.word)}</div>
        <div class="admin-item-meaning">${escHtml(s.meaning)}</div>
        <div class="admin-item-example">"${escHtml(s.example)}"</div>
        <div class="admin-item-meta">
          ${s.uploadedBy ? `by ${escHtml(s.uploadedBy)}` : "GZ.DICT"}
        </div>
      </div>
      <div class="admin-actions">
        <button class="btn-edit">✏ EDIT</button>
        <button class="btn-delete">✕ DELETE</button>
      </div>
    `;

    item.querySelector(".btn-edit").addEventListener("click", () => openEditModal(s));

    item.querySelector(".btn-delete").addEventListener("click", async (e) => {
      if (!confirm(`Delete "${s.word}" permanently?`)) return;
      e.target.textContent = "DELETING...";
      e.target.disabled    = true;
      try {
        await GZData.deleteSlang(s.id);
        await renderApproved();
      } catch (err) {
        console.error("Delete failed:", err);
        e.target.textContent = "✕ DELETE";
        e.target.disabled    = false;
      }
    });

    el.appendChild(item);
  });
}

// ============================================================
// USERS
// ============================================================
async function renderUsers() {
  const users = await GZData.getUsers();
  const el    = document.getElementById("usersList");

  if (!users.length) {
    el.innerHTML = `<p style="color:var(--text2);padding:1.5rem;font-size:.85rem">
      No registered users yet.
    </p>`;
    return;
  }

  el.innerHTML = "";

  users.forEach(u => {
    // Skip the admin account from the user list
    if (u.isAdmin) return;

    const item     = document.createElement("div");
    item.className = "user-item";
    item.innerHTML = `
      <div class="user-info">
        <span class="user-username">${escHtml(u.username)}</span>
        <span class="user-email">${escHtml(u.email)}</span>
      </div>
      <div class="user-stars-edit">
        <span>⭐</span>
        <input
          type="number"
          class="star-input"
          value="${u.stars || 0}"
          min="0"
          data-uid="${u.id}"
        />
        <button class="btn-star-save" data-uid="${u.id}">SAVE</button>
        <button class="btn-delete"    data-uid="${u.id}" style="margin-left:.5rem">✕</button>
      </div>
    `;

    item.querySelector(".btn-star-save").addEventListener("click", async (e) => {
      const uid   = e.target.dataset.uid;
      const stars = item.querySelector(`.star-input[data-uid="${uid}"]`).value;
      e.target.textContent = "SAVING...";
      e.target.disabled    = true;
      try {
        await GZData.updateUserStars(uid, stars);
        e.target.textContent = "SAVED ✓";
        setTimeout(() => {
          e.target.textContent = "SAVE";
          e.target.disabled    = false;
        }, 1500);
      } catch (err) {
        console.error("Star update failed:", err);
        e.target.textContent = "SAVE";
        e.target.disabled    = false;
      }
    });

    item.querySelector(".btn-delete").addEventListener("click", async (e) => {
      if (!confirm(`Delete user ${u.username}? This cannot be undone.`)) return;
      const uid = e.target.dataset.uid;
      e.target.textContent = "DELETING...";
      e.target.disabled    = true;
      try {
        await GZData.deleteUser(uid);
        await renderUsers();
      } catch (err) {
        console.error("User delete failed:", err);
        e.target.textContent = "✕";
        e.target.disabled    = false;
      }
    });

    el.appendChild(item);
  });
}

// ============================================================
// EDIT MODAL
// ============================================================
function openEditModal(s) {
  document.getElementById("editId").value      = s.id;
  document.getElementById("editWord").value    = s.word;
  document.getElementById("editMeaning").value = s.meaning;
  document.getElementById("editExample").value = s.example;
  document.getElementById("editModal").classList.add("open");
}

function closeEditModal() {
  document.getElementById("editModal").classList.remove("open");
  document.getElementById("saveEditBtn").textContent = "SAVE →";
  document.getElementById("saveEditBtn").disabled    = false;
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