// ============================================================
// GZ.DICT — LOGIN PAGE
// ============================================================

// Theme
const themeToggle = document.getElementById('themeToggle');
const saved = localStorage.getItem('gz_theme') || 'dark';
document.documentElement.setAttribute('data-theme', saved);
themeToggle.addEventListener('click', () => {
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('gz_theme', t);
});

// Redirect if already logged in
const existing = GZAuth.getSession();
if (existing) {
  location.href = GZAuth.isAdmin(existing) ? 'admin.html' : 'profile.html';
}

// Tabs
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
  });
});

// Login
document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const email = document.getElementById('loginEmail').value.trim();
  const err = document.getElementById('loginError');
  err.textContent = '';
  if (!username || !email) { err.textContent = 'Both fields are required.'; return; }
  const res = GZAuth.login(username, email);
  if (!res.ok) { err.textContent = res.error; return; }
  location.href = res.redirect;
});

// Signup
document.getElementById('signupForm').addEventListener('submit', e => {
  e.preventDefault();
  const username = document.getElementById('signupUsername').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const err = document.getElementById('signupError');
  err.textContent = '';
  if (!username || !email) { err.textContent = 'Both fields are required.'; return; }
  const res = GZAuth.signup(username, email);
  if (!res.ok) { err.textContent = res.error; return; }
  location.href = res.redirect;
});