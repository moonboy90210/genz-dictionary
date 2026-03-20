// ============================================================
// GZ.DICT — INDEX PAGE
// ============================================================

// Theme
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;
const saved = localStorage.getItem('gz_theme') || 'dark';
root.setAttribute('data-theme', saved);
themeToggle.addEventListener('click', () => {
  const t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', t);
  localStorage.setItem('gz_theme', t);
});

// Profile button
const profileWrap = document.getElementById('profileWrap');
const session = GZAuth.getSession();
if (session && GZAuth.isAdmin(session)) {
  profileWrap.innerHTML = `<a href="admin.html" class="profile-btn">⚡ Admin</a>`;
} else if (session) {
  profileWrap.innerHTML = `<a href="profile.html" class="profile-btn">★${session.username}</a>`;
} else {
  profileWrap.innerHTML = `<a href="login.html" class="profile-btn">⊕ Sign In</a>`;
}

// Build letter nav
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const letterNav = document.getElementById('letterNav');
const approvedSlangs = GZData.getApprovedSlangs();
const lettersWithSlangs = new Set(approvedSlangs.map(s => s.letter.toUpperCase()));

let activeLetter = null;

ALPHABET.forEach(l => {
  const btn = document.createElement('button');
  btn.className = 'letter-btn' + (lettersWithSlangs.has(l) ? ' has-slangs' : '');
  btn.textContent = l;
  btn.addEventListener('click', () => {
    if (activeLetter === l) { activeLetter = null; btn.classList.remove('active'); renderSlangs(null); }
    else {
      document.querySelectorAll('.letter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLetter = l;
      renderSlangs(l);
    }
  });
  letterNav.appendChild(btn);
});

// Search
document.getElementById('searchBtn').addEventListener('click', doSearch);
document.getElementById('searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
function doSearch() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!q) { renderSlangs(null); return; }
  const results = GZData.getApprovedSlangs().filter(s =>
    s.word.toLowerCase().includes(q) || s.meaning.toLowerCase().includes(q)
  );
  document.querySelectorAll('.letter-btn').forEach(b => b.classList.remove('active'));
  activeLetter = null;
  renderSlangList(results, `RESULTS FOR "${q.toUpperCase()}"`);
}

// Render
function renderSlangs(letter) {
  const list = letter ? GZData.getSlangsByLetter(letter) : GZData.getApprovedSlangs();
  const label = letter ? `LETTER — ${letter}` : 'ALL SLANGS';
  renderSlangList(list, label);
}

function renderSlangList(list, label) {
  document.getElementById('sectionLabel').textContent = label;
  document.getElementById('slangCount').textContent = `${list.length} SLANG${list.length !== 1 ? 'S' : ''}`;
  const grid = document.getElementById('slangGrid');
  grid.innerHTML = '';

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state"><strong>Nothing here.</strong>No slangs found. Be the first to add one!</div>`;
    return;
  }

  const sorted = [...list].sort((a, b) => a.word.localeCompare(b.word));
  sorted.forEach(s => grid.appendChild(createSlangCard(s)));
}

function createSlangCard(s) {
  const card = document.createElement('div');
  card.className = 'slang-card';
  card.dataset.id = s.id;

  const likedSet = JSON.parse(localStorage.getItem('gz_liked') || '{}');
  const dislikedSet = JSON.parse(localStorage.getItem('gz_disliked') || '{}');

  card.innerHTML = `
    <div class="slang-word">${escHtml(s.word)}</div>
    <div class="slang-meaning">${escHtml(s.meaning)}</div>
    <div class="slang-example">"${escHtml(s.example)}"</div>
    <div class="slang-meta">
      <span>${s.uploadedBy ? `by ${escHtml(s.uploadedBy)}` : 'GZ.DICT'}</span>
      <div class="slang-actions">
        <button class="like-btn ${likedSet[s.id] ? 'active' : ''}" data-id="${s.id}">▲ <span>${s.likes || 0}</span></button>
        <button class="dislike-btn ${dislikedSet[s.id] ? 'active' : ''}" data-id="${s.id}">▼ <span>${s.dislikes || 0}</span></button>
        <button class="comments-toggle" data-id="${s.id}">💬 ${(s.comments || []).length}</button>
      </div>
    </div>
    <div class="comments-section" id="comments-${s.id}">
      <div class="comment-list" id="clist-${s.id}">
        ${renderCommentList(s.comments || [])}
      </div>
      ${session
        ? `<div class="comment-input-row">
            <input class="comment-input" placeholder="drop a comment..." id="cinput-${s.id}" />
            <button class="comment-submit" data-id="${s.id}">POST</button>
           </div>`
        : `<p class="login-prompt"><a href="login.html">Log in</a> to comment.</p>`
      }
    </div>
  `;

  // Like
  card.querySelector('.like-btn').addEventListener('click', () => handleVote(s.id, 'like'));
  card.querySelector('.dislike-btn').addEventListener('click', () => handleVote(s.id, 'dislike'));

  // Comments toggle
  card.querySelector('.comments-toggle').addEventListener('click', () => {
    const sec = document.getElementById(`comments-${s.id}`);
    sec.classList.toggle('open');
  });

  // Post comment
  if (session) {
    card.querySelector(`.comment-submit`).addEventListener('click', () => {
      const inp = document.getElementById(`cinput-${s.id}`);
      const text = inp.value.trim();
      if (!text) return;
      const slangs = GZData.getSlangs();
      const found = slangs.find(x => x.id === s.id);
      if (found) {
        found.comments = found.comments || [];
        found.comments.push({ author: session.username, text, at: Date.now() });
        GZData.saveSlangs(slangs);
        document.getElementById(`clist-${s.id}`).innerHTML = renderCommentList(found.comments);
        card.querySelector('.comments-toggle').textContent = `💬 ${found.comments.length}`;
        inp.value = '';
      }
    });
  }

  return card;
}

function renderCommentList(comments) {
  if (!comments.length) return '<p style="font-size:.75rem;color:var(--text2)">No comments yet.</p>';
  return comments.map(c => `
    <div class="comment-item">
      <span class="comment-author">${escHtml(c.author)}</span>
      <span>${escHtml(c.text)}</span>
    </div>`).join('');
}

function handleVote(id, type) {
  const liked = JSON.parse(localStorage.getItem('gz_liked') || '{}');
  const disliked = JSON.parse(localStorage.getItem('gz_disliked') || '{}');
  const slangs = GZData.getSlangs();
  const s = slangs.find(x => x.id === id);
  if (!s) return;
  s.likes = s.likes || 0; s.dislikes = s.dislikes || 0;

  if (type === 'like') {
    if (liked[id]) { s.likes--; delete liked[id]; }
    else { s.likes++; liked[id] = true; if (disliked[id]) { s.dislikes--; delete disliked[id]; } }
  } else {
    if (disliked[id]) { s.dislikes--; delete disliked[id]; }
    else { s.dislikes++; disliked[id] = true; if (liked[id]) { s.likes--; delete liked[id]; } }
  }
  localStorage.setItem('gz_liked', JSON.stringify(liked));
  localStorage.setItem('gz_disliked', JSON.stringify(disliked));
  GZData.saveSlangs(slangs);

  // update UI
  const card = document.querySelector(`.slang-card[data-id="${id}"]`);
  if (card) {
    card.querySelector('.like-btn').className = `like-btn${liked[id] ? ' active' : ''}`;
    card.querySelector('.like-btn span').textContent = s.likes;
    card.querySelector('.dislike-btn').className = `dislike-btn${disliked[id] ? ' active' : ''}`;
    card.querySelector('.dislike-btn span').textContent = s.dislikes;
  }
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Initial render
renderSlangs(null);