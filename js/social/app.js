// The Square — entry point. Mounts the social layer into the Library page.
import * as api from './api.js';
import { initBase } from './api.js';
import * as auth from './auth.js';
import { getPubkey, exportNsec } from './auth.js';
import { nip19, hexToBytes } from './nostr.js';
import {
  state, loadFeed, submitPost, updateCount, setSession, renderIdentity,
  openModal, closeModal, toggleNotifyPop, pollNotifications, requireSignIn, esc, shortPk, postCard,
  startFeedLive,
} from './feed.js';

const $ = (id) => document.getElementById(id);

// ─── sign-in flow ───────────────────────────────────────────────────────────
function signInModal() {
  const card = $('sqModalCard');
  card.innerHTML = '';
  openModal();
  const close = document.createElement('button');
  close.className = 'sq-modal-close';
  close.textContent = '✕';
  close.onclick = closeModal;

  const h = document.createElement('h3');
  h.textContent = '✦ Enter the Soul Economy';
  const p = document.createElement('p');
  p.textContent =
    'Your soul key is your identity — no email, no password, no owner. ' +
    'It is forged in your browser and never leaves your device.';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Your display name (e.g. Grand Code Pope)';
  input.maxLength = 40;
  input.value = localStorage.getItem('soulUserName') || '';

  const go = document.createElement('button');
  go.className = 'sq-primary';
  go.textContent = 'Forge my Soul Key';
  go.onclick = () => {
    const name = input.value.trim() || 'Anonymous Soul';
    showBackup(name);
  };

  const or = document.createElement('p');
  or.style.textAlign = 'center';
  or.style.marginTop = '16px';
  or.style.color = '#666';
  or.innerHTML = '<a href="#" id="sqHaveKey" style="color:#8B5CF6">I already have a soul key</a>';

  card.append(close, h, p, input, go, or);
  setTimeout(() => {
    const have = $('sqHaveKey');
    if (have) have.onclick = (e) => { e.preventDefault(); importModal(); };
    input.focus();
    input.onkeydown = (e) => { if (e.key === 'Enter') go.click(); };
  }, 0);
}

function showBackup(name) {
  let id;
  try {
    id = auth.createIdentity(name);
  } catch (e) {
    alert('Could not forge key: ' + e.message);
    return;
  }
  const card = $('sqModalCard');
  card.innerHTML = '';
  const close = document.createElement('button');
  close.className = 'sq-modal-close';
  close.textContent = '✕';
  close.onclick = closeModal;

  const h = document.createElement('h3');
  h.textContent = '🗝 Your Soul Key';
  const p = document.createElement('p');
  p.className = 'sq-warn';
  p.textContent =
    'Save this NOW. It is the only way to reclaim your identity. ' +
    'Whoever holds this key IS you. We cannot recover it for you.';
  const box = document.createElement('div');
  box.className = 'sq-nsec-box';
  box.textContent = id.nsec;

  const dl = document.createElement('button');
  dl.className = 'sq-ghost';
  dl.style.cssText =
    'font-size:.72rem;padding:7px 16px;border-radius:16px;border:1px solid rgba(255,255,255,.15);color:#B8B8B8;margin-bottom:14px;display:block';
  dl.textContent = '⬇ Download key file';
  dl.onclick = () => {
    const blob = new Blob([`SOUL KEY — keep private\n\n${id.nsec}\n`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'my-soul-key.txt';
    a.click();
  };

  const label = document.createElement('label');
  label.className = 'sq-check';
  const chk = document.createElement('input');
  chk.type = 'checkbox';
  const span = document.createElement('span');
  span.textContent = 'I have saved my soul key safely';
  label.append(chk, span);

  const go = document.createElement('button');
  go.className = 'sq-primary';
  go.textContent = '✦ Enter the Square';
  go.disabled = true;
  chk.onchange = () => (go.disabled = !chk.checked);
  go.onclick = () => finishSignIn(name, id.pk);

  card.append(close, h, p, box, dl, label, go);
}

function importModal() {
  const card = $('sqModalCard');
  card.innerHTML = '';
  openModal();
  const close = document.createElement('button');
  close.className = 'sq-modal-close';
  close.textContent = '✕';
  close.onclick = closeModal;
  const h = document.createElement('h3');
  h.textContent = '🗝 Claim your soul';
  const p = document.createElement('p');
  p.textContent = 'Paste your soul key (nsec…) to reclaim your identity.';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'nsec1…';
  input.style.fontFamily = 'monospace';
  const go = document.createElement('button');
  go.className = 'sq-primary';
  go.textContent = '✦ Enter the Square';
  go.onclick = async () => {
    try {
      const id = auth.importNsec(input.value);
      const name = localStorage.getItem('soulUserName') || 'Returned Soul';
      await finishSignIn(name, id.pk, { silentProfile: true });
    } catch (e) {
      p.textContent = '✗ ' + e.message;
      p.style.color = '#F43F5E';
    }
  };
  card.append(close, h, p, input, go);
  setTimeout(() => { input.focus(); input.onkeydown = (e) => { if (e.key === 'Enter') go.click(); }; }, 0);
}

async function finishSignIn(name, pk, opts = {}) {
  try {
    localStorage.setItem('soulUserName', name);
    localStorage.setItem('soulUser', name);
    localStorage.setItem('soulEmail', shortPk(pk));
    if (!opts.silentProfile) {
      const prof = await auth.signEvent({
        kind: 0,
        tags: [],
        content: JSON.stringify({ name, display_name: name, about: '', npub: safeNpub(pk) }),
      });
      api.postEvent(prof).catch(() => {});
      import('./nostr.js').then((n) => n.publishToRelays(prof)).catch(() => {});
    }
    if (typeof window.updateAuthUI === 'function') window.updateAuthUI();
    setSession(pk);
    renderIdentity();
    closeModal();
    const st = document.getElementById('sqStatus');
    if (st) st.textContent = 'welcome to the Economy, ' + name;
    loadFeed();
  } catch (e) {
    alert('Sign-in failed: ' + e.message);
  }
}

function safeNpub(pk) {
  try {
    return nip19.npubEncode(pk);
  } catch {
    return '';
  }
}

function signOut() {
  auth.clearIdentity();
  localStorage.removeItem('soulUser');
  localStorage.removeItem('soulEmail');
  localStorage.removeItem('soulUserName');
  location.reload();
}

// ─── wire the page ──────────────────────────────────────────────────────────
async function runSearch(q) {
  const feed = $('sqFeed');
  if (!feed) return;
  feed.innerHTML = '<div class="sq-empty">searching the Economy…</div>';
  let data;
  try {
    data = await api.search(q);
  } catch (e) {
    feed.innerHTML = '<div class="sq-empty">search failed — try again</div>';
    return;
  }
  const souls = data.souls || [];
  const posts = data.posts || [];
  $('sqMore').hidden = true;
  if (!souls.length && !posts.length) {
    feed.innerHTML = '<div class="sq-empty">no souls answered “' + esc(q) + '”</div>';
    return;
  }
  feed.innerHTML = '';
  if (souls.length) {
    const h = document.createElement('div');
    h.className = 'sq-search-head';
    h.textContent = '◈ SOULS';
    feed.appendChild(h);
    const grid = document.createElement('div');
    grid.className = 'sq-search-grid';
    for (const s of souls) {
      const a = document.createElement('a');
      a.className = 'sq-search-card';
      a.href = 'p/' + encodeURIComponent(s.slug) + '.html';
      a.innerHTML = '<strong>' + esc(s.name) + '</strong><span>' + esc(s.type || 'soul') + '</span>';
      grid.appendChild(a);
    }
    feed.appendChild(grid);
  }
  if (posts.length) {
    const h = document.createElement('div');
    h.className = 'sq-search-head';
    h.textContent = '◈ WORDS';
    feed.appendChild(h);
    posts.forEach((p, i) => feed.appendChild(postCard(p, i)));
  }
}

async function wire() {
  await initBase();

  try {
    fetch('/api/hit', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: location.pathname }),
    }).catch(() => {});
  } catch (e) { /* non-fatal */ }
  // legacy nav Sign In / Sign Out → real soul identity
  window.loginWithGitHub = () => (state.me ? openProfileSelf() : signInModal());
  window.__soulSignIn = signInModal;
  window.__soulSignOut = signOut;
  const out = $('btnSignout');
  if (out) out.onclick = signOut;
  const signIn = $('btnSignin');
  if (signIn) signIn.onclick = () => (state.me ? openProfileSelf() : signInModal());

  function openProfileSelf() {
    import('./feed.js').then((f) => f.openProfile(state.me));
  }

  // composer
  const ta = $('sqText');
  if (ta) ta.addEventListener('input', updateCount);
  const post = $('sqPost');
  if (post) post.onclick = submitPost;

  // tabs
  document.querySelectorAll('.sq-tab').forEach((t) => {
    t.onclick = () => {
      document.querySelectorAll('.sq-tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      state.scope = t.dataset.scope || 'global';
      const sq = $('sqSearch');
      if (sq) sq.value = '';
      loadFeed();
    };
  });

  // square search (D1 FTS over souls + posts)
  const sq = $('sqSearch');
  if (sq) {
    let debounce = 0;
    sq.addEventListener('input', () => {
      clearTimeout(debounce);
      const q = sq.value.trim();
      debounce = setTimeout(() => {
        if (!q) { loadFeed(); return; }
        runSearch(q);
      }, 300);
    });
    sq.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { sq.value = ''; loadFeed(); }
    });
  }

  // load more
  const more = $('sqMore');
  if (more) more.onclick = () => loadFeed({ append: true });

  // bell
  const bell = $('sqBell');
  if (bell) bell.onclick = () => (state.me ? toggleNotifyPop() : requireSignIn());

  // modal chrome
  $('sqModal').addEventListener('click', (e) => {
    if (e.target === $('sqModal')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // resume session if key already present
  const pk = getPubkey();
  if (pk) {
    if (!localStorage.getItem('soulUser')) {
      localStorage.setItem('soulUser', localStorage.getItem('soulUserName') || 'soul');
      if (typeof window.updateAuthUI === 'function') window.updateAuthUI();
    }
    setSession(pk);
  } else {
    renderIdentity();
  }

  loadFeed();
  startFeedLive();
  if (state.me) pollNotifications();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
else wire();
