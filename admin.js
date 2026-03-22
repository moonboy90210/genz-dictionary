// ============================================================
// GZ.DICT — ADMIN PAGE
// ============================================================

// Theme
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('gz_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.addEventListener('click', () => {
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('gz_theme', t);
});

// Auth guard
const session = GZAuth.requireAdmin();
if (!session) throw new Error('Redirected');

document.getElementById('logoutBtn').addEventListener('click', () => GZAuth.logout());

// Tabs
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab + 'Panel').classList.add('active');
    renderAll();
  });
});

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderAll() {
  renderPending();
  renderApproved();
  renderUsers();
}

// PENDING
async   function renderPending() {
  const list = await GZData.getPending();
  document.getElementById('pendingBadge').textContent = list.length;
  const el = document.getElementById('pendingList');
  if (!list.length) { el.innerHTML = `<p style="color:var(--text2);padding:1.5rem">No pending submissions.</p>`; return; }
  el.innerHTML = '';
  list.forEach(s => {
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = `
      <div>
        <div class="admin-item-word">${escHtml(s.word)}</div>
        <div class="admin-item-meaning">${escHtml(s.meaning)}</div>
        <div class="admin-item-example">"${escHtml(s.example)}"</div>
        <div class="admin-item-meta">Submitted by ${escHtml(s.uploadedBy || '—')}</div>
      </div>
      <div class="admin-actions">
        <button class="btn-approve" data-id="${s.id}">✓ APPROVE</button>
        <button class="btn-reject" data-id="${s.id}">✕ REJECT</button>
      </div>`;
   item.querySelector('.btn-approve').addEventListener('click', async () => {
  await GZData.approvePending(s.id);
  await renderAll();
});
    item.querySelector('.btn-reject').addEventListener('click', () => {
      GZData.rejectPending(s.id);
      renderAll();
    });
    el.appendChild(item);
  });
}

// APPROVED SLANGS
async function renderApproved() {
  const all = await GZData.getApprovedSlangs();
  const list = all.sort((a, b) => a.word.localeCompare(b.word));
  const el = document.getElementById('approvedList');
  if (!list.length) { el.innerHTML = `<p style="color:var(--text2);padding:1.5rem">No slangs yet.</p>`; return; }
  el.innerHTML = '';
  list.forEach(s => {
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = `
      <div>
        <div class="admin-item-word">${escHtml(s.word)}</div>
        <div class="admin-item-meaning">${escHtml(s.meaning)}</div>
        <div class="admin-item-example">"${escHtml(s.example)}"</div>
        <div class="admin-item-meta">${s.uploadedBy ? `by ${escHtml(s.uploadedBy)}` : 'GZ.DICT'} · ▲${s.likes||0} ▼${s.dislikes||0}</div>
      </div>
      <div class="admin-actions">
        <button class="btn-edit" data-id="${s.id}">✏ EDIT</button>
        <button class="btn-delete" data-id="${s.id}">✕ DELETE</button>
      </div>`;
   item.querySelector('.btn-edit').addEventListener('click', () => openEdit(s));
item.querySelector('.btn-delete').addEventListener('click', async () => {
  if (confirm(`Delete "${s.word}"?`)) { await GZData.deleteSlang(s.id); await renderAll(); }
});
    el.appendChild(item);
  });
}

// USERS
async function renderUsers() {
  const users = await GZData.getUsers();
  const el = document.getElementById('usersList');
  if (!users.length) { el.innerHTML = `<p style="color:var(--text2);padding:1.5rem">No registered users yet.</p>`; return; }
  el.innerHTML = '';
  users.forEach(u => {
    const item = document.createElement('div');
    item.className = 'user-item';
    item.innerHTML = `
      <div class="user-info">
        <span class="user-username">${escHtml(u.username)}</span>
        <span class="user-email">${escHtml(u.email)}</span>
      </div>
      <div class="user-stars-edit">
        <span>⭐</span>
        <input type="number" class="star-input" value="${u.stars||0}" min="0" data-user="${escHtml(u.username)}" />
        <button class="btn-star-save" data-user="${escHtml(u.username)}">SAVE</button>
        <button class="btn-delete" data-user="${escHtml(u.username)}" style="margin-left:.5rem">✕</button>
      </div>`;
item.querySelector('.btn-star-save').addEventListener('click', async () => {
  const val = item.querySelector('.star-input').value;
  await GZData.updateUserStars(u.username, val);
  await renderUsers();
});
item.querySelector('.btn-delete').addEventListener('click', async () => {
  if (confirm(`Delete user ${u.username}?`)) { await GZData.deleteUser(u.username); await renderAll(); }
});
    el.appendChild(item);
  });
}

// ADMIN ADD SLANG
document.getElementById('adminAddForm').addEventListener('submit', async e => {
  e.preventDefault();
  const word = document.getElementById('adminWord').value.trim();
  const meaning = document.getElementById('adminMeaning').value.trim();
  const example = document.getElementById('adminExample').value.trim();
  const err = document.getElementById('adminError');
  const suc = document.getElementById('adminSuccess');
  err.textContent = ''; suc.textContent = '';
  if (!word || !meaning || !example) { err.textContent = 'All fields required.'; return; }
  await GZData.addApprovedSlang({
    word, meaning, example,
    letter: word[0].toUpperCase(),
    likes: 0, dislikes: 0, comments: [],
    uploadedBy: null, status: 'approved',
    submittedAt: Date.now()
  });
  suc.textContent = `✓ "${word}" added to dictionary.`;
  document.getElementById('adminAddForm').reset();
  await renderAll();
});

// EDIT MODAL
const editModal = document.getElementById('editModal');
function openEdit(s) {
  document.getElementById('editId').value = s.id;
  document.getElementById('editWord').value = s.word;
  document.getElementById('editMeaning').value = s.meaning;
  document.getElementById('editExample').value = s.example;
  editModal.classList.add('open');
}
document.getElementById('closeEditBtn').addEventListener('click', () => editModal.classList.remove('open'));
editModal.addEventListener('click', e => { if (e.target === editModal) editModal.classList.remove('open'); });
document.getElementById('saveEditBtn').addEventListener('click', async () => {
  const id = document.getElementById('editId').value;
  const word = document.getElementById('editWord').value.trim();
  const meaning = document.getElementById('editMeaning').value.trim();
  const example = document.getElementById('editExample').value.trim();
  if (!word || !meaning || !example) return;
 await GZData.updateSlang(id, { word, meaning, example, letter: word[0].toUpperCase() });
  editModal.classList.remove('open');
  await renderAll();
});

// Init
async function renderAll() {
  await Promise.all([renderPending(), renderApproved(), renderUsers()]);
}