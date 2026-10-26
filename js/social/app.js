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
  status,
  resolveScope, getSoulAttachment, setSoulAttachment, clearSoulAttachment,
  findSoul, searchSouls, buildSoulCardEl,
  getTradeDraft, setTradeDraft, clearTradeDraft, buildTradeCardEl,
  setTrustFilter, applyTrustFilter,
} from './feed.js';
import * as trade from './trade.js';
import * as trust from './trust.js';

const $ = (id) => document.getElementById(id);

// Trade preview UI reset (used by both the soul picker and the trade
// panel: one attachment per post, so each side clears the other).
function clearTradePreviewUI() {
  clearTradeDraft();
  const preview = $('sqTradePreview');
  if (preview) preview.innerHTML = '';
}

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
      const d = s.description ? String(s.description) : '';
      a.innerHTML =
        '<strong>' + esc(s.name) + '</strong><span>' + esc(s.type || 'soul') + '</span>' +
        (d ? '<em>' + esc(d.slice(0, 140)) + (d.length > 140 ? '…' : '') + '</em>' : '');
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

const attach = $('sqAttach');
const file = $('sqFile');
if (attach && file) {
  attach.onclick = () => file.click();
  file.onchange = async () => {
    const f = file.files && file.files[0];
    file.value = '';
    if (!f) return;
    if (!f.type || !f.type.startsWith('image/')) return status('images only');
    if (f.size > 4 * 1024 * 1024) return status('image too big — 4MB max');
    attach.disabled = true;
    attach.textContent = '⏳';
    status('uploading…');
    try {
      const data = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(',')[1] || '');
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      const res = await fetch('https://soul-economy.uncommonpope.workers.dev/api/feed/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: f.type, name: String(f.name || '').slice(0, 80), data }),
      });
      const j = await res.json().catch(() => ({}));
      if (!j.ok) throw new Error(j.error || 'HTTP ' + res.status);
      const box = $('sqText');
      const md = `![${String(f.name || 'image').replace(/[[\]()]/g, '')}](${j.url})`;
      const cur = box.value || '';
      box.value = (cur ? cur + (cur.endsWith('\n') ? '' : '\n') + md : md).slice(0, 4000);
      updateCount();
      status('image attached ✓');
    } catch (e) {
      status('upload failed — ' + (e.message || ''));
    } finally {
      attach.disabled = false;
      attach.textContent = '🖼';
    }
  };
}

  // soul attachment picker (v1: one soul per post — the server keeps only
  // the first soul tag, so picking a new soul replaces the current one;
  // the picker note says so. Search by catalog name, live card preview.)
  const soulBtn = $('sqSoulBtn');
  const soulPicker = $('sqSoulPicker');
  if (soulBtn && soulPicker) {
    soulBtn.onclick = () => {
      soulPicker.hidden = !soulPicker.hidden;
      if (!soulPicker.hidden) {
        const s = $('sqSoulSearch');
        if (s) s.focus();
      }
    };
    const soulSearch = $('sqSoulSearch');
    const soulResults = $('sqSoulResults');
    const soulPreview = $('sqSoulPreview');
    const renderSoulPreview = async () => {
      if (!soulPreview) return;
      soulPreview.innerHTML = '';
      const attached = getSoulAttachment();
      if (!attached) return;
      let item = null;
      try {
        item = await findSoul(attached);
      } catch {}
      if (item) soulPreview.appendChild(buildSoulCardEl(item, attached, { filterButton: false }));
      else {
        const note = document.createElement('div');
        note.className = 'sq-soul-pick-note';
        note.textContent = 'Attached ◈ ' + attached + ' — one soul per post for now.';
        soulPreview.appendChild(note);
      }
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'sq-empty-btn';
      rm.textContent = '✕ Remove attachment';
      rm.onclick = () => {
        clearSoulAttachment();
        renderSoulPreview();
      };
      soulPreview.appendChild(rm);
    };
    if (soulSearch && soulResults) {
      let deb = 0;
      soulSearch.addEventListener('input', () => {
        clearTimeout(deb);
        deb = setTimeout(async () => {
          const q = soulSearch.value.trim();
          soulResults.innerHTML = '';
          if (!q) return;
          let hits = [];
          try {
            hits = await searchSouls(q);
          } catch {
            hits = [];
          }
          if (!hits.length) {
            soulResults.textContent = 'No souls match that name.';
            return;
          }
          for (const { slug, item } of hits) {
            const row = document.createElement('button');
            row.type = 'button';
            row.className = 'sq-soul-pick-row';
            row.textContent = '◈ ' + item.name + (item.plt ? ' · PLT ' + item.plt : '');
            row.onclick = () => {
              if (!setSoulAttachment(slug)) {
                status('could not attach that soul');
                return;
              }
              clearTradePreviewUI();
              soulResults.innerHTML = '';
              soulSearch.value = '';
              renderSoulPreview();
              status('soul attached ✓');
            };
            soulResults.appendChild(row);
          }
        }, 200);
      });
    }
    renderSoulPreview();
  }

  // trade panel (Layer 3 v1: package your own soul as a tradeable
  // artifact — one attachment per post, so packaging a trade clears a
  // catalog soul attachment, and picking a soul clears a trade draft).
  const tradeBtn = $('sqTradeBtn');
  const tradePanel = $('sqTradePanel');
  const renderTradePreview = () => {
    const preview = $('sqTradePreview');
    if (!preview) return;
    preview.innerHTML = '';
    const draft = getTradeDraft();
    if (!draft) return;
    const author = {
      pubkey: state.me || '',
      display_name: localStorage.getItem('soulUserName') || '',
      name: '',
    };
    preview.appendChild(buildTradeCardEl(draft, author, { filterButton: false, sigState: 'preview' }));
    const note = document.createElement('div');
    note.className = 'sq-soul-pick-note';
    const s = draft.soul || {};
    const soulMode = s.soul_md !== null && s.soul_md !== undefined
      ? 'soul included in the post'
      : draft.soul_md_held
        ? 'soul too big for the post — held by you, share the full .trade.json'
        : 'no soul text attached';
    const memMode = s.seshat_json !== null && s.seshat_json !== undefined
      ? 'memory included in the post'
      : draft.seshat_held
        ? 'memory too big for the post — held by you, share the full .trade.json'
        : 'no memory state attached';
    note.textContent = `Trade preview (${soulMode}; ${memMode}). One attachment per post.`;
    preview.appendChild(note);
    const dl = document.createElement('button');
    dl.type = 'button';
    dl.className = 'sq-empty-btn';
    dl.textContent = '⬇ Download full .trade.json';
    dl.onclick = async () => {
      const soulMd = ($('sqTradeSoulMd') || {}).value || '';
      let seshatObj = null;
      const raw = (($('sqTradeSeshat') || {}).value || '').trim();
      if (raw) {
        try { seshatObj = JSON.parse(raw); } catch { seshatObj = null; }
      }
      const full = await trade.fullContentCopy(draft, soulMd, seshatObj);
      const blob = new Blob([JSON.stringify(full, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = draft.slug + '.trade.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    };
    preview.appendChild(dl);
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'sq-empty-btn';
    rm.textContent = '✕ Remove trade';
    rm.onclick = () => {
      clearTradePreviewUI();
      status('trade removed');
    };
    preview.appendChild(rm);
  };
  if (tradeBtn && tradePanel) {
    tradeBtn.onclick = () => {
      tradePanel.hidden = !tradePanel.hidden;
      if (!tradePanel.hidden) {
        const n = $('sqTradeTitle');
        if (n) n.focus();
      }
    };
    const soulFile = $('sqTradeSoulFile');
    const soulMdText = $('sqTradeSoulMd');
    if (soulFile && soulMdText) {
      soulFile.onchange = async () => {
        const f = soulFile.files && soulFile.files[0];
        soulFile.value = '';
        if (!f) return;
        const name = (f.name || '').toLowerCase();
        try {
          if (name.endsWith('.zip')) {
            status('that is a zip — unzip it first, then pick the .md or .json inside');
            return;
          }
          if (name.endsWith('.md')) {
            soulMdText.value = await f.text();
            status('soul text loaded — package to attach');
            return;
          }
          if (name.endsWith('.json')) {
            const parsed = JSON.parse(await f.text());
            if (parsed && parsed.type === trade.TRADE_TYPE && parsed.soul) {
              const s = parsed.soul;
              const ps = s.plt_score || {};
              const setVal = (id, v) => { const el = $(id); if (el) el.value = v; };
              setVal('sqTradeTitle', s.title || '');
              setVal('sqTradeAuthor', s.author || '');
              setVal('sqTradeP', ps.p !== undefined ? ps.p : '');
              setVal('sqTradeL', ps.l !== undefined ? ps.l : '');
              setVal('sqTradeT', ps.t !== undefined ? ps.t : '');
              setVal('sqTradeTip', (parsed.trade || {}).stripe_tip_url || '');
              soulMdText.value = s.soul_md || '';
              const st = $('sqTradeSeshat');
              if (st) st.value = s.seshat_json ? JSON.stringify(s.seshat_json, null, 2) : '';
              status('trade file loaded — re-package to sign it as yours');
              return;
            }
            const st = $('sqTradeSeshat');
            if (st) st.value = JSON.stringify(parsed, null, 2);
            status('memory file loaded — package to attach');
            return;
          }
          status('pick a .md soul file or a .json memory/trade file');
        } catch {
          status('could not read that file');
        }
      };
    }
    const seshatFile = $('sqTradeSeshatFile');
    const seshatText = $('sqTradeSeshat');
    if (seshatFile && seshatText) {
      seshatFile.onchange = async () => {
        const f = seshatFile.files && seshatFile.files[0];
        seshatFile.value = '';
        if (!f) return;
        try {
          seshatText.value = await f.text();
          status('seshat file loaded — package to attach');
        } catch {
          status('could not read that file');
        }
      };
    }
    const pkg = $('sqTradePackage');
    if (pkg) {
      pkg.onclick = async () => {
        if (!state.me) {
          status('sign in to package a trade — your key signs it');
          requireSignIn();
          return;
        }
        const title = ($('sqTradeTitle') || {}).value || '';
        const authorName = ($('sqTradeAuthor') || {}).value || '';
        const p = ($('sqTradeP') || {}).value;
        const l = ($('sqTradeL') || {}).value;
        const t = ($('sqTradeT') || {}).value;
        const tip = ($('sqTradeTip') || {}).value || '';
        const soulMd = ($('sqTradeSoulMd') || {}).value || '';
        const seshatRaw = (($('sqTradeSeshat') || {}).value || '').trim();
        let seshatObj = null;
        if (seshatRaw) {
          try {
            seshatObj = JSON.parse(seshatRaw);
            if (typeof seshatObj !== 'object' || seshatObj === null || Array.isArray(seshatObj)) {
              status('seshat must be a JSON object');
              return;
            }
          } catch {
            status('seshat is not valid JSON');
            return;
          }
        }
        pkg.disabled = true;
        try {
          const { artifact, modes } = await trade.buildArtifact({
            title, author: authorName, p, l, t, tip, soulMd, seshatObj,
            authorPubkey: state.me, createdAt: Math.floor(Date.now() / 1000),
          });
          // Detached signature: sign the notarization event (kind 1, tag
          // trade-sig, content 'TRADE-SIG ' + artifact hash). If the key
          // cannot sign it (e.g. extension refusal), packaging continues
          // with sig empty — the post signature still binds the artifact.
          let signedNote = '';
          try {
            const hash = await trade.artifactHash(artifact);
            const template = trade.notarizationTemplate(state.me, artifact.created_at, hash);
            const signed = await auth.signEvent(template);
            artifact.sig = signed.sig;
            artifact.sig_created_at = signed.created_at;
          } catch {
            artifact.sig = '';
            artifact.sig_created_at = 0;
            signedNote = ' (artifact proof not signed — post signature still binds it)';
          }
          setTradeDraft(artifact);
          clearSoulAttachment();
          const soulPreview = $('sqSoulPreview');
          if (soulPreview) soulPreview.innerHTML = '';
          renderTradePreview();
          status(
            `trade packaged ✓ — soul ${modes.soulMd}, memory ${modes.seshat}${signedNote}`,
          );
        } catch (e) {
          status('trade package failed — ' + (e.message || ''));
        } finally {
          pkg.disabled = false;
        }
      };
    }
    renderTradePreview();
  }

  // tabs — scope persists: URL ?scope= wins over stored sqScope, and every
  // click writes both (replaceState, no reload). Click still clears search
  // and reloads the feed, exactly as before.
  const applyScope = (scope) => {
    const next = scope === 'following' ? 'following' : 'global';
    state.scope = next;
    document.querySelectorAll('.sq-tab').forEach((x) => x.classList.toggle('active', x.dataset.scope === next));
    try {
      localStorage.setItem('sqScope', next);
    } catch {}
    try {
      const u = new URL(location.href);
      if (next === 'following') u.searchParams.set('scope', 'following');
      else u.searchParams.delete('scope');
      history.replaceState(null, '', u);
    } catch {}
  };
  document.querySelectorAll('.sq-tab').forEach((t) => {
    t.onclick = () => {
      applyScope(t.dataset.scope || 'global');
      const sq = $('sqSearch');
      if (sq) sq.value = '';
      loadFeed();
    };
  });

  // ─── WEB OF TRUST v1 (Layer 2, client-side only) ─────────────────────
  // Dropdown with exactly three states; persistence mirrors scope
  // (sqTrustMode + ?trust=, URL wins). Changing it re-applies to the
  // already-rendered feed — no refetch. The graph is built on demand
  // only (default 'all' never fetches). Fail-open: any unavailable /
  // empty / error graph shows all posts + a note, never a blank feed.
  // Markup + CSS are created here (not in square.html) so this lands
  // without touching the file Layer 3 is working in; moving them into
  // square.html later is a zero-behavior change.
  if (!$('sqTrustCss')) {
    const st = document.createElement('style');
    st.id = 'sqTrustCss';
    st.textContent = '.sq-trust-select{padding:8px 10px;border-radius:10px;border:1px solid rgba(139,92,246,0.35);background:rgba(255,255,255,0.04);color:#fff;font-family:inherit;font-size:0.82rem;cursor:pointer}'
      + '.sq-trust-note{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 14px;margin-bottom:12px;border:1px solid rgba(139,92,246,0.35);border-radius:12px;background:rgba(139,92,246,0.07);font-size:0.82rem}'
      + '.sq-trust-note button{color:#00D4FF;border:1px solid rgba(0,212,255,0.3);border-radius:20px;padding:4px 12px;background:none;cursor:pointer;font-size:0.72rem}';
    document.head.appendChild(st);
  }
  let trustSelect = $('sqTrustFilter');
  if (!trustSelect) {
    trustSelect = document.createElement('select');
    trustSelect.id = 'sqTrustFilter';
    trustSelect.className = 'sq-trust-select';
    trustSelect.title = 'Filter the feed by trust';
    for (const [v, label] of [['all', 'All Posts'], ['trusted', 'Trusted Network'], ['following', 'Following Only']]) {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = label;
      trustSelect.appendChild(o);
    }
    const tabsEl = document.querySelector('.sq-tabs');
    if (tabsEl) tabsEl.insertBefore(trustSelect, $('sqSearch') || null);
  }
  const persistTrustMode = (mode) => {
    try { localStorage.setItem(trust.TRUST_MODE_KEY, mode); } catch {}
    try {
      const u = new URL(location.href);
      if (mode === 'all') u.searchParams.delete('trust');
      else u.searchParams.set('trust', mode);
      history.replaceState(null, '', u);
    } catch {}
  };
  const resetTrustToAll = () => {
    trustSelect.value = 'all';
    persistTrustMode('all');
    setTrustFilter({ mode: 'all', onShowAll: resetTrustToAll });
    applyTrustFilter();
    status('');
  };
  const applyTrustMode = async (mode) => {
    persistTrustMode(mode);
    if (mode === 'all') {
      setTrustFilter({ mode: 'all', onShowAll: resetTrustToAll });
      applyTrustFilter();
      status('');
      return;
    }
    if (!state.me) {
      setTrustFilter({ mode, sets: null, fallbackNote: 'connect', onShowAll: resetTrustToAll });
      applyTrustFilter();
      return;
    }
    const cached = trust.readTrustCache(localStorage, state.me);
    if (cached && trust.isTrustCacheFresh(cached)) {
      setTrustFilter({
        mode,
        sets: { following: trust.buildFollowingSet(state.me, cached.following), trusted: new Set(cached.trusted) },
        onShowAll: resetTrustToAll,
      });
      applyTrustFilter();
      return;
    }
    status('building trusted network…');
    let r;
    try {
      r = await trust.fetchTrustGraph({ me: state.me, followsFn: (pk) => api.follows(pk), cached });
    } catch {
      r = { status: 'unavailable' };
    }
    if (r.status === 'ok' || r.status === 'stale-cache') {
      if (r.status === 'ok') trust.writeTrustCache(localStorage, { me: state.me, following: r.following, trusted: r.trusted, builtAt: Date.now() });
      setTrustFilter({ mode, sets: r.sets, onShowAll: resetTrustToAll });
      status(r.status === 'stale-cache' ? 'trusted network (cached)…' : '');
    } else if (r.status === 'empty') {
      setTrustFilter({ mode, sets: null, fallbackNote: 'empty', onShowAll: resetTrustToAll });
      status('');
    } else {
      setTrustFilter({ mode, sets: null, fallbackNote: 'unavailable', onShowAll: resetTrustToAll });
      status('');
    }
    applyTrustFilter();
  };
  trustSelect.onchange = () => applyTrustMode(trustSelect.value);

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

  // restore scope before the first load: URL ?scope= wins, else stored
  // sqScope, else global. The active tab follows the restored scope.
  let storedScope = null;
  try {
    storedScope = localStorage.getItem('sqScope');
  } catch {}
  let urlScope = null;
  try {
    urlScope = new URLSearchParams(location.search).get('scope');
  } catch {}
  applyScope(resolveScope(urlScope, storedScope));

  // WEB OF TRUST v1: restore the trust mode (URL ?trust= wins, else
  // stored sqTrustMode, else 'all'). A restored restricted mode
  // re-applies once the first feed lands (applyTrustMode re-applies
  // to the current DOM, and loadFeed() re-applies it on every render).
  let storedTrust = null;
  try { storedTrust = localStorage.getItem(trust.TRUST_MODE_KEY); } catch {}
  let urlTrust = null;
  try { urlTrust = new URLSearchParams(location.search).get('trust'); } catch {}
  const restoredTrust = trust.resolveTrustMode(urlTrust, storedTrust);
  trustSelect.value = restoredTrust;
  persistTrustMode(restoredTrust);

  loadFeed();
  if (restoredTrust !== 'all') applyTrustMode(restoredTrust);
  startFeedLive();
  if (state.me) pollNotifications();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
else wire();
