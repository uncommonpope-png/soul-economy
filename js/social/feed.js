// The Square — feed, composer, replies, PLT reactions, profile, notifications.
import * as api from './api.js';
import { signEvent, getPubkey } from './auth.js';
import { publishToRelays, relayFeed, nip19, hexToBytes } from './nostr.js';

export const state = {
  scope: 'global',
  posts: [],
  before: 0,
  me: null,
  notifyTimer: null,
  unread: 0,
};

const $ = (id) => document.getElementById(id);

// ─── helpers ────────────────────────────────────────────────────────────────
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

export function timeAgo(ts) {
  const d = Math.max(0, Math.floor(Date.now() / 1000) - Number(ts || 0));
  if (d < 60) return d + 's';
  if (d < 3600) return Math.floor(d / 60) + 'm';
  if (d < 86400) return Math.floor(d / 3600) + 'h';
  if (d < 86400 * 30) return Math.floor(d / 86400) + 'd';
  return new Date(ts * 1000).toLocaleDateString();
}

export function shortPk(pk) {
  try {
    return nip19.npubEncode(pk).slice(0, 12) + '…';
  } catch {
    return (pk || '').slice(0, 10) + '…';
  }
}

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

export function nameOf(p) {
  return (p.display_name || p.name || shortPk(p.pubkey)).slice(0, 40);
}

function avatarEl(p, cls = 'sq-avatar') {
  const d = document.createElement('div');
  d.className = cls;
  const hue = hashHue(p.pubkey);
  d.style.background = `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 60) % 360} 70% 30%))`;
  if (p.picture) {
    const img = document.createElement('img');
    img.src = esc(p.picture);
    img.alt = '';
    img.onerror = () => img.remove();
    d.appendChild(img);
  } else {
    d.textContent = (nameOf(p) || '??').slice(0, 2).toUpperCase();
  }
  return d;
}

// my reactions, per device (server holds the counts)
function myReactions() {
  try {
    return JSON.parse(localStorage.getItem('sqReactions') || '{}');
  } catch {
    return {};
  }
}
function saveReaction(id, content) {
  const m = myReactions();
  m[id] = [...new Set([...(m[id] || []), content])];
  localStorage.setItem('sqReactions', JSON.stringify(m));
}

export function status(msg) {
  const el = $('sqStatus');
  if (el) el.textContent = msg || '';
}

// ─── feed loading ───────────────────────────────────────────────────────────
export async function loadFeed({ append = false } = {}) {
  const feedEl = $('sqFeed');
  if (!feedEl) return;
  if (!append) {
    state.before = 0;
    feedEl.innerHTML = '';
    status('pulling…');
  }
  try {
    const data = await api.feed({
      scope: state.scope,
      me: state.me || '',
      limit: 20,
      before: append ? state.before : 0,
    });
    const posts = data.posts || [];
    if (!append) state.posts = posts;
    else state.posts = state.posts.concat(posts);
    state.before = data.next_before || 0;
    $('sqMore').hidden = !data.next_before;
    if (!append) feedEl.innerHTML = '';
    if (!posts.length && !append) renderEmpty();
    posts.forEach((p, i) => feedEl.appendChild(postCard(p, i)));
    status(api.API.includes('workers.dev') ? 'live · signed · sovereign' : '');
    return;
  } catch (e) {
    console.warn('[square] API down, falling back to relays', e);
    status('relays (offline mode)…');
    if (append) return;
    const events = await relayFeed({ limit: 20 });
    feedEl.innerHTML = '';
    if (!events.length) {
      renderEmpty('The Square is unreachable right now. The souls will return.');
      return;
    }
    events.forEach((ev, i) => {
      const el = postCard(
        {
          id: ev.id, pubkey: ev.pubkey, created_at: ev.created_at, content: ev.content,
          root_id: null, parent_id: null, reply_count: 0, like_count: 0, plt: '{}',
          name: '', display_name: '', picture: '', about: '',
        },
        i
      );
      feedEl.appendChild(el);
    });
    $('sqMore').hidden = true;
  }
}

function renderEmpty(msg) {
  const feedEl = $('sqFeed');
  const d = document.createElement('div');
  d.className = 'sq-empty';
  d.textContent = msg || 'The Square is silent. Be the first voice.';
  feedEl.appendChild(d);
}

// ─── realtime (edge only) ───────────────────────────────────────────────────
// Open feed tabs listen on the FeedRoom DO; a new post shows a refresh pill.
// Local static / GH Pages origins skip it (no backend there) — zero console noise.
let liveStarted = false;
let liveTries = 0;
export function startFeedLive() {
  if (liveStarted) return;
  if (typeof location === 'undefined' || !location.hostname.endsWith('.workers.dev')) return;
  liveStarted = true;
  const connect = () => {
    let ws;
    try {
      ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/api/feed/ws');
    } catch (e) {
      return;
    }
    ws.onopen = () => {
      liveTries = 0;
    };
    ws.onmessage = (ev) => {
      let m;
      try {
        m = JSON.parse(ev.data);
      } catch (e) {
        return;
      }
      if (m && m.type === 'feed' && m.action === 'new') {
        if (m.pubkey && m.pubkey === state.me) return; // own post already refreshed
        showNewPill();
      }
    };
    ws.onerror = () => {
      try {
        ws.close();
      } catch (e) {}
    };
    ws.onclose = () => {
      if (liveTries++ < 5) setTimeout(connect, 2000 + liveTries * 1500);
    };
  };
  connect();
}

function showNewPill() {
  const feedEl = $('sqFeed');
  if (!feedEl || $('sqNewPill')) return;
  const pill = document.createElement('button');
  pill.id = 'sqNewPill';
  pill.type = 'button';
  pill.textContent = '✦ a soul just spoke — tap to refresh';
  pill.style.cssText =
    'display:block;width:100%;margin:8px 0;padding:10px;font:700 .8rem inherit;letter-spacing:.04em;' +
    'color:#00D4FF;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.35);border-radius:30px;cursor:pointer';
  pill.onclick = () => {
    pill.remove();
    loadFeed();
  };
  feedEl.prepend(pill);
}

// ─── post card ──────────────────────────────────────────────────────────────
export function postCard(p, index = 0) {
  const art = document.createElement('article');
  art.className = 'sq-post';
  art.dataset.id = p.id;
  art.style.animationDelay = Math.min(index * 40, 300) + 'ms';

  art.appendChild(avatarEl(p));

  const main = document.createElement('div');
  main.className = 'sq-post-main';

  const head = document.createElement('div');
  head.className = 'sq-post-head';
  const nm = document.createElement('span');
  nm.className = 'sq-name';
  nm.textContent = nameOf(p);
  nm.onclick = () => openProfile(p.pubkey);
  const hd = document.createElement('span');
  hd.className = 'sq-handle';
  hd.textContent = shortPk(p.pubkey);
  const tm = document.createElement('span');
  tm.className = 'sq-time';
  tm.textContent = timeAgo(p.created_at);
  head.append(nm, hd, tm);

  const body = document.createElement('div');
  body.className = 'sq-post-body';
  fillBody(body, p.content || '');
  if (p.soul_slug) {
    const chip = document.createElement('span');
    chip.className = 'sq-soul-chip';
    chip.textContent = '◈ ' + p.soul_slug;
    body.appendChild(document.createElement('br'));
    body.appendChild(chip);
  }

  const acts = document.createElement('div');
  acts.className = 'sq-post-actions';
  acts.appendChild(actionBtn('sq-reply', '💬', p.reply_count || 0, async () => toggleReplies(p, main)));
  acts.appendChild(actionBtn('sq-like', '♥', p.like_count || 0, () => react(p, '+')));
  acts.appendChild(actionBtn('sq-p', 'P', pltOf(p).p, () => react(p, 'P+')));
  acts.appendChild(actionBtn('sq-l', 'L', pltOf(p).l, () => react(p, 'L+')));
  acts.appendChild(actionBtn('sq-t', 'T', pltOf(p).t, () => react(p, 'T+')));

  const mine = myReactions()[p.id] || [];
  acts.querySelectorAll('.sq-act').forEach((b) => {
    if (mine.includes(b.dataset.kind)) b.classList.add('on');
  });

  const plt = pltOf(p);
  const mini = document.createElement('span');
  mini.className = 'sq-plt-mini';
  mini.innerHTML = `<b class="p">P${plt.p}</b> <b class="l">L${plt.l}</b> <b class="t">T${plt.t}</b>`;
  acts.appendChild(mini);

  main.append(head, body, acts);
  art.appendChild(main);
  return art;
}

function pltOf(p) {
  try {
    const o = JSON.parse(p.plt || '{}');
    return { p: Number(o.p) || 0, l: Number(o.l) || 0, t: Number(o.t) || 0 };
  } catch {
    return { p: 0, l: 0, t: 0 };
  }
}

const MEDIA_RE = /!\[([^\]]*)\]\((https:\/\/soul-economy\.uncommonpope\.workers\.dev\/media\/[^)\s]+)\)/g;
function fillBody(el, content) {
  const text = String(content || '');
  const frag = document.createDocumentFragment();
  let last = 0;
  let m;
  let n = 0;
  MEDIA_RE.lastIndex = 0;
  while ((m = MEDIA_RE.exec(text)) && n < 6) {
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    const img = document.createElement('img');
    img.src = m[2];
    img.alt = m[1] || 'image';
    img.loading = 'lazy';
    img.onclick = () => window.open(m[2], '_blank', 'noopener');
    frag.appendChild(img);
    last = m.index + m[0].length;
    n++;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  el.textContent = '';
  el.appendChild(frag);
}

function actionBtn(kind, icon, count, handler) {
  const b = document.createElement('button');
  b.className = 'sq-act ' + kind;
  b.dataset.kind = kind === 'sq-like' ? '+' : kind === 'sq-p' ? 'P+' : kind === 'sq-l' ? 'L+' : kind === 'sq-t' ? 'T+' : 'reply';
  b.innerHTML = `${icon} <span>${Number(count) || 0}</span>`;
  b.onclick = async (e) => {
    e.stopPropagation();
    if (kind === 'sq-reply') return handler();
    if (!state.me) return requireSignIn();
    await handler();
  };
  return b;
}

// ─── reactions ──────────────────────────────────────────────────────────────
async function react(post, content) {
  const mine = myReactions()[post.id] || [];
  if (mine.includes(content)) return;
  try {
    const ev = await signEvent({ kind: 7, tags: [['e', post.id]], content });
    await api.postEvent(ev);
    publishToRelays(ev);
    saveReaction(post.id, content);
    const card = document.querySelector(`.sq-post[data-id="${post.id}"]`);
    if (card) {
      const btn = card.querySelector(`.sq-act[data-kind="${content}"]`);
      if (btn) {
        btn.classList.add('on');
        const sp = btn.querySelector('span');
        sp.textContent = (Number(sp.textContent) || 0) + 1;
      }
      const mini = card.querySelector('.sq-plt-mini');
      if (mini && content !== '+') {
        const k = content[0].toLowerCase();
        const b = mini.querySelector('b.' + k);
        if (b) b.textContent = k.toUpperCase() + ((Number(b.textContent.slice(1)) || 0) + 1);
      }
    }
  } catch (e) {
    console.warn('[square] react failed', e);
    status('reaction failed — ' + (e.message || ''));
  }
}

// ─── replies ────────────────────────────────────────────────────────────────
async function toggleReplies(p, main) {
  const existing = main.querySelector('.sq-replies');
  if (existing) {
    existing.remove();
    return;
  }
  const box = document.createElement('div');
  box.className = 'sq-replies';
  box.innerHTML = '<div class="sq-notify-empty">loading replies…</div>';
  main.appendChild(box);

  let root = p;
  let replies = [];
  try {
    const data = await api.thread(p.id);
    root = data.root || p;
    replies = (data.replies || []).filter((r) => r.id !== p.id);
  } catch (e) {
    box.innerHTML = '<div class="sq-notify-empty">offline — replies unavailable</div>';
    return;
  }
  box.innerHTML = '';
  replies.forEach((r) => box.appendChild(replyItem(r)));

  const rbox = document.createElement('div');
  rbox.className = 'sq-reply-box';
  const input = document.createElement('input');
  input.placeholder = state.me ? 'Speak your reply…' : 'Sign in to reply';
  const btn = document.createElement('button');
  btn.textContent = 'Reply';
  btn.onclick = async () => {
    if (!state.me) return requireSignIn();
    const text = input.value.trim();
    if (!text) return;
    btn.disabled = true;
    try {
      const tags = [
        ['e', root.id, '', 'root'],
        ['e', p.id, '', 'reply'],
        ['p', p.pubkey],
        ['t', 'soul-economy'],
      ];
      const ev = await signEvent({ kind: 1, tags, content: text });
      await api.postEvent(ev);
      publishToRelays(ev);
      input.value = '';
      const item = replyItem({
        id: ev.id, pubkey: ev.pubkey, created_at: ev.created_at, content: text,
        name: localStorage.getItem('soulUserName') || '', display_name: localStorage.getItem('soulUserName') || '', picture: '',
      });
      box.insertBefore(item, rbox);
      const c = main.querySelector('.sq-act.sq-reply span');
      if (c) c.textContent = (Number(c.textContent) || 0) + 1;
    } catch (e) {
      status('reply failed — ' + (e.message || ''));
    } finally {
      btn.disabled = false;
    }
  };
  rbox.append(input, btn);
  box.appendChild(rbox);
}

function replyItem(r) {
  const d = document.createElement('div');
  d.className = 'sq-reply-item';
  d.appendChild(avatarEl(r));
  const wrap = document.createElement('div');
  wrap.style.flex = '1';
  const head = document.createElement('div');
  head.className = 'sq-post-head';
  const nm = document.createElement('span');
  nm.className = 'sq-name';
  nm.style.fontSize = '0.82rem';
  nm.textContent = nameOf(r);
  nm.onclick = () => openProfile(r.pubkey);
  const tm = document.createElement('span');
  tm.className = 'sq-time';
  tm.textContent = timeAgo(r.created_at);
  head.append(nm, tm);
  const body = document.createElement('div');
  body.className = 'sq-post-body';
  body.style.fontSize = '0.85rem';
  body.textContent = r.content || '';
  wrap.append(head, body);
  d.appendChild(wrap);
  return d;
}

// ─── compose ────────────────────────────────────────────────────────────────
export async function submitPost() {
  const ta = $('sqText');
  const text = (ta.value || '').trim();
  if (!text) return;
  if (!state.me) return requireSignIn();
  const btn = $('sqPost');
  btn.disabled = true;
  btn.textContent = '✦ Signing…';
  try {
    const ev = await signEvent({ kind: 1, tags: [['t', 'soul-economy']], content: text });
    await api.postEvent(ev);
    publishToRelays(ev);
    ta.value = '';
    updateCount();
    await loadFeed();
    status('posted ✓');
  } catch (e) {
    console.error(e);
    status('post failed — ' + (e.message || ''));
  } finally {
    btn.disabled = false;
    btn.textContent = '✦ Post';
  }
}

export function updateCount() {
  const ta = $('sqText');
  const c = $('sqCount');
  if (!ta || !c) return;
  const n = (ta.value || '').length;
  c.textContent = `${n} / 4000`;
  c.classList.toggle('warn', n > 3600);
}

// ─── profile ────────────────────────────────────────────────────────────────
export async function openProfile(pubkey) {
  const card = $('sqModalCard');
  card.innerHTML = '<div class="sq-notify-empty">loading soul…</div>';
  openModal();
  let data = null;
  try {
    data = await api.profile(pubkey, state.me || '');
  } catch {}
  const u = (data && data.user) || { pubkey, name: '', display_name: '', about: '' };
  const counts = (data && data.counts) || { posts: 0, followers: 0, following: 0 };
  const isFollowing = data && data.is_following;

  card.innerHTML = '';
  const close = document.createElement('button');
  close.className = 'sq-modal-close';
  close.textContent = '✕';
  close.onclick = closeModal;

  const h = document.createElement('div');
  h.className = 'sq-profile-head';
  h.appendChild(avatarEl({ pubkey, ...u }));
  const info = document.createElement('div');
  const nm = document.createElement('h3');
  nm.textContent = nameOf({ pubkey, ...u });
  const handle = document.createElement('div');
  handle.className = 'sq-handle';
  handle.textContent = shortPk(pubkey);
  info.append(nm, handle);
  h.appendChild(info);

  const stats = document.createElement('div');
  stats.className = 'sq-profile-stats';
  stats.innerHTML = `
    <span><b>${counts.posts || 0}</b>posts</span>
    <span><b>${counts.followers || 0}</b>followers</span>
    <span><b>${counts.following || 0}</b>following</span>`;

  const about = document.createElement('p');
  about.textContent = u.about || 'This soul has not spoken of themselves yet.';

  card.append(close, h, stats, about);

  if (pubkey !== state.me) {
    const fb = document.createElement('button');
    fb.className = 'sq-follow-btn' + (isFollowing ? ' following' : '');
    fb.textContent = isFollowing ? 'Following' : '✦ Follow';
    fb.onclick = () => toggleFollow(pubkey, fb);
    card.appendChild(fb);
  }

  const recent = (data && data.recent) || [];
  if (recent.length) {
    const hr = document.createElement('p');
    hr.className = 'sq-warn';
    hr.style.marginTop = '18px';
    hr.textContent = 'RECENT WORDS';
    card.appendChild(hr);
    recent.slice(0, 5).forEach((r) => {
      const line = document.createElement('div');
      line.className = 'sq-notify-item';
      line.innerHTML = `<span class="sq-n-type">◈</span><span>${esc((r.content || '').slice(0, 160))}</span>`;
      card.appendChild(line);
    });
  }
}

export async function toggleFollow(pubkey, btn) {
  if (!state.me) return requireSignIn();
  if (pubkey === state.me) return;
  btn.disabled = true;
  try {
    const data = await api.follows(state.me);
    const set = new Set(data.followees || []);
    const wasFollowing = set.has(pubkey);
    if (wasFollowing) set.delete(pubkey);
    else set.add(pubkey);
    const ev = await signEvent({ kind: 3, tags: [...set].map((p) => ['p', p]) });
    await api.postEvent(ev);
    publishToRelays(ev);
    btn.classList.toggle('following', !wasFollowing);
    btn.textContent = wasFollowing ? '✦ Follow' : 'Following';
  } catch (e) {
    status('follow failed — ' + (e.message || ''));
  } finally {
    btn.disabled = false;
  }
}

// ─── notifications ──────────────────────────────────────────────────────────
export async function pollNotifications() {
  if (!state.me) return;
  try {
    const data = await api.notify(state.me);
    state.unread = data.unread || 0;
    const badge = $('sqBellCount');
    badge.textContent = state.unread > 99 ? '99+' : String(state.unread);
    badge.hidden = !state.unread;
  } catch {}
}

export async function toggleNotifyPop() {
  const wrap = $('sqBellWrap');
  const old = wrap.querySelector('.sq-notify-pop');
  if (old) {
    old.remove();
    return;
  }
  const pop = document.createElement('div');
  pop.className = 'sq-notify-pop';
  pop.innerHTML = '<div class="sq-notify-empty">loading…</div>';
  wrap.appendChild(pop);
  let data;
  try {
    data = await api.notify(state.me);
  } catch {
    pop.innerHTML = '<div class="sq-notify-empty">notifications unreachable</div>';
    return;
  }
  const rows = data.notifications || [];
  pop.innerHTML = '';
  if (!rows.length) {
    pop.innerHTML = '<div class="sq-notify-empty">No whispers yet. Engage the Square.</div>';
    return;
  }
  const icons = { reply: '💬', mention: '@', follow: '✦', react: '♥' };
  rows.forEach((n) => {
    const item = document.createElement('div');
    item.className = 'sq-notify-item' + (n.is_read ? '' : ' unread');
    item.innerHTML = `<span class="sq-n-type">${icons[n.type] || '◈'}</span><span><b>${esc(n.display_name || n.name || shortPk(n.actor)).slice(0, 20)}</b> ${notifyVerb(n.type)} · ${timeAgo(n.created_at)}</span>`;
    item.onclick = async () => {
      pop.remove();
      if (n.target_id && n.type !== 'follow') {
        const card = document.querySelector(`.sq-post[data-id="${n.target_id}"]`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else if (n.type === 'reply') openProfile(n.actor);
      } else openProfile(n.actor);
    };
    pop.appendChild(item);
  });
  if (data.unread) {
    try {
      const auth = await signEvent({
        kind: 27235,
        tags: [['u', api.API + '/api/notify/read'], ['method', 'POST']],
        content: '',
      });
      await api.notifyRead([], auth);
      const badge = $('sqBellCount');
      badge.hidden = true;
      badge.textContent = '0';
      state.unread = 0;
      pop.querySelectorAll('.unread').forEach((x) => x.classList.remove('unread'));
    } catch {}
  }
}

function notifyVerb(type) {
  return { reply: 'replied to you', mention: 'mentioned you', follow: 'followed you', react: 'reacted to your post' }[type] || 'notified you';
}

// ─── modal ──────────────────────────────────────────────────────────────────
export function openModal() {
  $('sqModal').hidden = false;
}
export function closeModal() {
  $('sqModal').hidden = true;
}

// ─── session ────────────────────────────────────────────────────────────────
export function setSession(pubkey) {
  state.me = pubkey;
  renderIdentity();
  pollNotifications();
  if (state.notifyTimer) clearInterval(state.notifyTimer);
  state.notifyTimer = setInterval(pollNotifications, 30000);
}

export function renderIdentity() {
  const el = $('sqIdentity');
  if (!el) return;
  if (!state.me) {
    el.innerHTML = '';
    const b = document.createElement('button');
    b.textContent = '✦ Enter the Economy';
    b.onclick = () => window.__soulSignIn && window.__soulSignIn();
    el.appendChild(b);
    return;
  }
  el.innerHTML = '';
  const name = document.createElement('span');
  name.className = 'sq-me-name';
  name.textContent = localStorage.getItem('soulUserName') || shortPk(state.me);
  name.onclick = () => openProfile(state.me);
  const out = document.createElement('button');
  out.className = 'sq-ghost';
  out.textContent = 'Sign Out';
  out.onclick = () => window.__soulSignOut && window.__soulSignOut();
  el.append(name, out);
}

export function requireSignIn() {
  if (window.__soulSignIn) window.__soulSignIn();
}
