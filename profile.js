// ============================================================
// GZ.DICT — PROFILE PAGE
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
GZAuth.refreshSession();
const session = GZAuth.requireAuth();
if (!session) throw new Error('Redirected');

// If admin sneaks here
if (GZAuth.isAdmin(session)) { location.href = 'admin.html'; }

// Populate profile
document.getElementById('profileAvatar').textContent = session.username.replace('@', '').charAt(0).toUpperCase();
document.getElementById('profileUsername').textContent = session.username;
document.getElementById('profileEmail').textContent = session.email;
document.getElementById('starCount').textContent = session.stars || 0;

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => GZAuth.logout());

// Upload form
document.getElementById('uploadForm').addEventListener('submit', e => {
  e.preventDefault();
  const word = document.getElementById('slangWord').value.trim();
  const meaning = document.getElementById('slangMeaning').value.trim();
  const example = document.getElementById('slangExample').value.trim();
  const errEl = document.getElementById('uploadError');
  const sucEl = document.getElementById('uploadSuccess');
  errEl.textContent = ''; sucEl.textContent = '';

  if (!word || !meaning || !example) { errEl.textContent = 'All fields are required.'; return; }

  const slang = {
    id: GZData.genId(),
    word,
    meaning,
    example,
    letter: word[0].toUpperCase(),
    likes: 0,
    dislikes: 0,
    comments: [],
    uploadedBy: session.username,
    status: 'pending',
    submittedAt: Date.now()
  };

  GZData.addPendingSlang(slang);
  sucEl.textContent = '✓ Submitted! Awaiting admin approval.';
  document.getElementById('uploadForm').reset();
  renderMySubmissions();
});

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderMySubmissions() {
  const grid = document.getElementById('mySlangGrid');
  grid.innerHTML = '';

  const approved = GZData.getApprovedSlangs().filter(s => s.uploadedBy === session.username);
  const pending = GZData.getPending().filter(s => s.uploadedBy === session.username);
  const all = [...approved, ...pending].sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));

  if (!all.length) {
    grid.innerHTML = `<div class="empty-state"><strong>No submissions yet.</strong>Upload your first slang above!</div>`;
    return;
  }

  all.forEach(s => {
    const card = document.createElement('div');
    card.className = 'slang-card';
    card.innerHTML = `
      <span class="slang-status status-${s.status}">${s.status.toUpperCase()}</span>
      <div class="slang-word">${escHtml(s.word)}</div>
      <div class="slang-meaning">${escHtml(s.meaning)}</div>
      <div class="slang-example">"${escHtml(s.example)}"</div>
    `;
    grid.appendChild(card);
  });
}

renderMySubmissions();

// Refresh stars from storage
const freshUsers = GZData.getUsers();
const me = freshUsers.find(u => u.username === session.username);
if (me) { document.getElementById('starCount').textContent = me.stars || 0; }