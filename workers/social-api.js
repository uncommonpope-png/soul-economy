/* workers/social-api.js — Soul Economy shared truth layer (v1, SIP-social)
 *
 * Cloudflare Worker + D1 (`soul_social`, see workers/social-schema.sql).
 * Free-tier only: no KV, no Durable Objects, polling-friendly endpoints.
 * Local-first contract: the frontend works offline without this Worker;
 * everything here is additive sync. Kill flag lives client-side.
 *
 * Deploy:
 *   wrangler d1 create soul_social
 *   wrangler d1 execute soul_social --file workers/social-schema.sql
 *   wrangler deploy workers/social-api.js --name soul-social \
 *     --var ORIGIN:https://uncommonpope-png.github.io \
 *     --var SESSION_SECRET:<openssl rand -hex 32> \
 *     --d1 DB=soul_social
 * Auth: POST /auth/session {gh_token} (verified via api.github.com/user)
 *       → {token} JWT (HMAC-SHA256, 30d). Send as Authorization: Bearer.
 *
 * v1 scope: follows, posts, reactions, replies, remix/version/issues,
 * groups+members, events+rsvps, DM threads/messages, notifications,
 * blocks/mutes/reports, tips, tombstones, batch /sync, pull surfaces.
 * Out of v1 (stay local): collections, legacy Discussions-tab threads,
 * profile registry (already syncs via PRs).
 */

const EMOJIS = ['\u2764\uFE0F', '\uD83D\uDD25', '\uD83E\uDDE0', '\uD83D\uDC41\uFE0F', '\u26A1', '\u2728', '\uD83D\uDE02', '\uD83C\uDF11'];
const POST_KINDS = ['text', 'link', 'image', 'video', 'poll'];
const VIS = ['public', 'followers', 'private'];
const GROUP_VIS = ['PUBLIC', 'PRIVATE', 'INVITE ONLY'];
const FOLLOW_KINDS = ['person', 'soul', 'agent', 'project', 'world', 'group'];
const ISSUE_STATES = ['OPEN', 'IN PROGRESS', 'RESOLVED', 'CLOSED'];

const now = () => Date.now();
const sstr = (v, n) => String(v == null ? '' : v).slice(0, n || 300);
const normHandle = h => String(h || '').trim().replace(/^@/, '').toLowerCase().slice(0, 39);
const normName = n => String(n || '').trim().slice(0, 80);
const okUrl = u => { u = String(u || ''); return /^https:\/\//i.test(u) ? u.slice(0, 300) : ''; };
const uid = () => now().toString(36) + Math.random().toString(36).slice(2, 8);

function cors(env, req) {
  const o = req.headers.get('Origin') || '';
  const allow = [env.ORIGIN || 'https://uncommonpope-png.github.io', 'http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:8000'];
  const ok = allow.includes(o) ? o : allow[0];
  return { 'Access-Control-Allow-Origin': ok, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Content-Type': 'application/json' };
}
const json = (env, req, obj, status) => new Response(JSON.stringify(obj), { status: status || 200, headers: cors(env, req) });
const ok = (env, req, data) => json(env, req, { ok: true, data });
const bad = (env, req, error, status) => json(env, req, { ok: false, error }, status || 400);

/* ---- JWT (HMAC-SHA256, stateless) ---- */
function b64url(bytes) {
  let s = '';
  const b = new Uint8Array(bytes);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(s) {
  s = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function mintToken(env, handle) {
  const body = b64url(new TextEncoder().encode(JSON.stringify({ h: handle, iat: now(), exp: now() + 30 * 864e5 })));
  const sig = b64url(await crypto.subtle.sign('HMAC', await hmacKey(env.SESSION_SECRET || 'dev'), new TextEncoder().encode(body)));
  return body + '.' + sig;
}
async function verifyToken(env, req) {
  try {
    const h = req.headers.get('Authorization') || '';
    const t = h.startsWith('Bearer ') ? h.slice(7) : '';
    const parts = t.split('.');
    if (parts.length !== 2) return null;
    const okV = await crypto.subtle.verify('HMAC', await hmacKey(env.SESSION_SECRET || 'dev'), unb64url(parts[1]), new TextEncoder().encode(parts[0]));
    if (!okV) return null;
    const p = JSON.parse(new TextDecoder().decode(unb64url(parts[0])));
    if (!p.h || p.exp < now()) return null;
    return normHandle(p.h);
  } catch (e) { return null; }
}

/* ---- rate limit (D1-backed) ---- */
async function checkRate(db, key, limit) {
  const w = Math.floor(now() / 6e4);
  const k = 'rl:' + key + ':' + w;
  const row = await db.prepare('SELECT count, reset FROM hits WHERE key_=?').bind(k).first();
  if (!row || row.reset !== w) {
    await db.prepare('INSERT INTO hits(key_,count,reset) VALUES(?,?,?) ON CONFLICT(key_) DO UPDATE SET count=1,reset=?').bind(k, 1, w, w).run();
    return true;
  }
  if (row.count >= limit) return false;
  await db.prepare('UPDATE hits SET count=count+1 WHERE key_=?').bind(k).run();
  return true;
}

/* ---- social helpers ---- */
async function getFollows(db, me) {
  const r = await db.prepare("SELECT target, kind FROM follows WHERE follower=?").bind(me).all();
  const people = [], souls = [], groups = [];
  (r.results || []).forEach(x => {
    if (x.kind === 'person') people.push(x.target);
    else if (x.kind === 'soul') souls.push(x.target);
    else if (x.kind === 'group') groups.push(x.target);
  });
  return { people, souls, groups };
}
async function blockedEither(db, a, b) {
  if (!a || !b) return false;
  const r = await db.prepare('SELECT 1 FROM blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?) LIMIT 1').bind(a, b, b, a).first();
  return !!r;
}
async function mutedBy(db, me, author) {
  if (!me || !author) return false;
  const r = await db.prepare('SELECT 1 FROM mutes WHERE muter=? AND muted=?').bind(me, author).first();
  return !!r;
}
async function groupVisible(db, g, me) {
  if (!g || g.vis === 'PUBLIC') return true;
  if (!me) return false;
  const m = await db.prepare('SELECT 1 FROM members WHERE group_id=? AND user_=?').bind(g.id, me).first();
  return !!m;
}
async function canSeePost(db, p, me, following) {
  if (p.deleted) return false;
  if (await blockedEither(db, me, p.author)) return false;
  if (await mutedBy(db, me, p.author)) return false;
  if (p.group_id) {
    const g = await db.prepare('SELECT * FROM groups WHERE id=?').bind(p.group_id).first();
    if (!g) return false;
    return groupVisible(db, g, me);
  }
  if (p.vis === 'public') return true;
  if (!me) return false;
  if (p.author === me) return true;
  if (p.vis === 'private') return false;
  return following.people.includes(p.author);
}
async function notify(db, user, kind, ref, actor) {
  if (!user || user === actor) return;
  await db.prepare('INSERT INTO notifications(id,user_,kind,ref,actor,created,seen) VALUES(?,?,?,?,?,?,0)')
    .bind(uid(), user, kind, String(ref || '').slice(0, 120), String(actor || '').slice(0, 40), now()).run();
}
function extractMentions(body) {
  const out = [];
  const re = /(^|\s)@([A-Za-z0-9-]{1,39})/g;
  let m;
  while ((m = re.exec(String(body || '')))) out.push(m[2].toLowerCase());
  return [...new Set(out)].slice(0, 5);
}

/* ---- write ops (shared by direct routes + /sync batch) ---- */
async function applyOp(db, me, op) {
  const t = now();
  const needLen = (v, n, what) => { if (!String(v || '').trim()) throw { status: 400, msg: what + ' required' }; return sstr(v, n); };
  switch (op.op) {
    case 'follow': {
      const target = op.kind === 'person' ? normHandle(op.target) : normName(op.target);
      if (!target) throw { status: 400, msg: 'target required' };
      if (!FOLLOW_KINDS.includes(op.kind || 'person')) throw { status: 400, msg: 'bad kind' };
      if ((op.kind || 'person') === 'person' && target === me) throw { status: 400, msg: 'cannot follow self' };
      await db.prepare('INSERT INTO follows(follower,target,kind,created) VALUES(?,?,?,?) ON CONFLICT(follower,target,kind) DO NOTHING')
        .bind(me, target, op.kind || 'person', t).run();
      if ((op.kind || 'person') === 'person') await notify(db, target, 'follow', me, me);
      return { followed: target };
    }
    case 'unfollow': {
      const target = op.kind === 'person' ? normHandle(op.target) : normName(op.target);
      await db.prepare('DELETE FROM follows WHERE follower=? AND target=? AND kind=?').bind(me, target, op.kind || 'person').run();
      return { unfollowed: target };
    }
    case 'post': {
      const body = needLen(op.body, 500, 'body');
      if (!POST_KINDS.includes(op.kind || 'text')) throw { status: 400, msg: 'bad kind' };
      if (!VIS.includes(op.vis || 'public')) throw { status: 400, msg: 'bad vis' };
      const id = sstr(op.id || uid(), 40);
      const url = (op.kind && op.kind !== 'text') ? (okUrl(op.url) || (() => { throw { status: 400, msg: 'url required' }; })()) : '';
      const gid = sstr(op.group_id || '', 40);
      if (gid) {
        const g = await db.prepare('SELECT * FROM groups WHERE id=?').bind(gid).first();
        if (!g) throw { status: 404, msg: 'no group' };
        if (!(await groupVisible(db, g, me))) throw { status: 403, msg: 'not a member' };
      }
      await db.prepare('INSERT INTO posts(id,author,soul,kind,body,url,vis,group_id,created,edited,deleted) VALUES(?,?,?,?,?,?,?,?,?,?,0)')
        .bind(id, me, normName(op.soul || ''), op.kind || 'text', body, url, op.vis || 'public', gid, op.created || t, 0).run();
      for (const h of extractMentions(body)) {
        const u = await db.prepare('SELECT handle FROM users WHERE handle=?').bind(h).first();
        if (u) await notify(db, h, 'mention', id, me);
      }
      return { id };
    }
    case 'react': {
      if (!EMOJIS.includes(op.emoji)) throw { status: 400, msg: 'bad emoji' };
      const p = await db.prepare('SELECT id FROM posts WHERE id=? AND deleted=0').bind(sstr(op.post_id)).first();
      if (!p) throw { status: 404, msg: 'no post' };
      const key = [sstr(op.post_id), me, op.emoji];
      const ex = await db.prepare('SELECT 1 FROM reactions WHERE post_id=? AND user_=? AND emoji=?').bind(...key).first();
      if (ex) await db.prepare('DELETE FROM reactions WHERE post_id=? AND user_=? AND emoji=?').bind(...key).run();
      else await db.prepare('INSERT INTO reactions(post_id,user_,emoji,created) VALUES(?,?,?,?)').bind(...key, t).run();
      return { toggled: !ex };
    }
    case 'reply': {
      const body = needLen(op.body, 500, 'reply');
      const id = sstr(op.id || uid(), 40);
      await db.prepare('INSERT INTO replies(id,post_id,parent_id,author,body,created,edited,deleted) VALUES(?,?,?,?,?,?,?,0)')
        .bind(id, sstr(op.post_id), sstr(op.parent_id || ''), me, body, op.created || t, 0).run();
      const p = await db.prepare('SELECT author FROM posts WHERE id=?').bind(sstr(op.post_id)).first();
      if (p) await notify(db, p.author, 'reply', sstr(op.post_id), me);
      return { id };
    }
    case 'remix': {
      const name = needLen(op.name, 80, 'name');
      await db.prepare('INSERT INTO remixes(id,name,parent,by_,created) VALUES(?,?,?,?,?)')
        .bind(sstr(op.id || uid(), 40), name, normName(op.parent), me, op.created || t).run();
      return { ok: true };
    }
    case 'version': {
      await db.prepare('INSERT INTO versions(id,soul,v,note,by_,created) VALUES(?,?,?,?,?,?)')
        .bind(sstr(op.id || uid(), 40), normName(op.soul), sstr(op.v || '', 12), sstr(op.note || '', 140), me, op.created || t).run();
      return { ok: true };
    }
    case 'issue': {
      const title = needLen(op.title, 80, 'title');
      await db.prepare('INSERT INTO issues(id,soul,title,body,state,by_,created,edited) VALUES(?,?,?,?,?,?,?,0)')
        .bind(sstr(op.id || uid(), 40), normName(op.soul), title, sstr(op.body || '', 300), 'OPEN', me, op.created || t).run();
      return { ok: true };
    }
    case 'issue_state': {
      if (!ISSUE_STATES.includes(op.state)) throw { status: 400, msg: 'bad state' };
      await db.prepare('UPDATE issues SET state=?, edited=? WHERE id=?').bind(op.state, t, sstr(op.id)).run();
      return { ok: true };
    }
    case 'group_create': {
      const name = needLen(op.name, 40, 'name');
      if (!GROUP_VIS.includes(op.vis || 'PUBLIC')) throw { status: 400, msg: 'bad vis' };
      const id = sstr(op.id || uid(), 40);
      await db.prepare('INSERT INTO groups(id,name,descr,vis,by_,created) VALUES(?,?,?,?,?,?)')
        .bind(id, name, sstr(op.desc || '', 200), op.vis || 'PUBLIC', me, op.created || t).run();
      await db.prepare('INSERT INTO members(group_id,user_,created) VALUES(?,?,?) ON CONFLICT DO NOTHING').bind(id, me, t).run();
      return { id };
    }
    case 'group_join': {
      const g = await db.prepare('SELECT * FROM groups WHERE id=?').bind(sstr(op.id)).first();
      if (!g) throw { status: 404, msg: 'no group' };
      if (g.vis === 'INVITE ONLY') throw { status: 403, msg: 'invite only' };
      await db.prepare('INSERT INTO members(group_id,user_,created) VALUES(?,?,?) ON CONFLICT DO NOTHING').bind(g.id, me, t).run();
      return { ok: true };
    }
    case 'group_leave': {
      await db.prepare('DELETE FROM members WHERE group_id=? AND user_=?').bind(sstr(op.id), me).run();
      return { ok: true };
    }
    case 'event_create': {
      const title = needLen(op.title, 60, 'title');
      const id = sstr(op.id || uid(), 40);
      await db.prepare('INSERT INTO events(id,title,when_,where_,by_,created) VALUES(?,?,?,?,?,?)')
        .bind(id, title, sstr(op.when || '', 40), sstr(op.where || '', 40), me, op.created || t).run();
      await db.prepare('INSERT INTO rsvps(event_id,user_,created) VALUES(?,?,?) ON CONFLICT DO NOTHING').bind(id, me, t).run();
      return { id };
    }
    case 'rsvp': {
      const v = await db.prepare('SELECT id FROM events WHERE id=?').bind(sstr(op.id)).first();
      if (!v) throw { status: 404, msg: 'no event' };
      const ex = await db.prepare('SELECT 1 FROM rsvps WHERE event_id=? AND user_=?').bind(v.id, me).first();
      if (ex) await db.prepare('DELETE FROM rsvps WHERE event_id=? AND user_=?').bind(v.id, me).run();
      else await db.prepare('INSERT INTO rsvps(event_id,user_,created) VALUES(?,?,?)').bind(v.id, me, t).run();
      return { going: !ex };
    }
    case 'dm': {
      const to = normHandle(op.to);
      if (!to || to === me) throw { status: 400, msg: 'bad recipient' };
      if (await blockedEither(db, me, to)) throw { status: 403, msg: 'blocked' };
      const body = needLen(op.body, 300, 'body');
      const a = me < to ? me : to, b = me < to ? to : me;
      const tid = a + '|' + b;
      await db.prepare('INSERT INTO threads(id,user_a,user_b,updated) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET updated=?')
        .bind(tid, a, b, t, t).run();
      const id = sstr(op.id || uid(), 40);
      await db.prepare('INSERT INTO messages(id,thread,author,body,created) VALUES(?,?,?,?,?)')
        .bind(id, tid, me, body, op.created || t).run();
      await notify(db, to, 'dm', tid, me);
      return { id, thread: tid };
    }
    case 'tip': {
      await db.prepare('INSERT INTO tips(id,to_,amt,note,by_,created) VALUES(?,?,?,?,?,?)')
        .bind(sstr(op.id || uid(), 40), normHandle(op.to), sstr(op.amt || '', 12), sstr(op.note || '', 140), me, op.created || t).run();
      return { ok: true };
    }
    case 'report': {
      await db.prepare('INSERT INTO reports(id,kind,ref,by_,created) VALUES(?,?,?,?,?)')
        .bind(sstr(op.id || uid(), 40), sstr(op.kind || 'shout', 20), sstr(op.ref || '', 120), me, op.created || t).run();
      return { ok: true };
    }
    case 'block': {
      const h = normHandle(op.handle);
      if (!h || h === me) throw { status: 400, msg: 'bad handle' };
      await db.prepare('INSERT INTO blocks(blocker,blocked,created) VALUES(?,?,?) ON CONFLICT DO NOTHING').bind(me, h, t).run();
      return { ok: true };
    }
    case 'unblock': {
      await db.prepare('DELETE FROM blocks WHERE blocker=? AND blocked=?').bind(me, normHandle(op.handle)).run();
      return { ok: true };
    }
    case 'mute': {
      const h = normHandle(op.handle);
      if (!h || h === me) throw { status: 400, msg: 'bad handle' };
      await db.prepare('INSERT INTO mutes(muter,muted,created) VALUES(?,?,?) ON CONFLICT DO NOTHING').bind(me, h, t).run();
      return { ok: true };
    }
    case 'unmute': {
      await db.prepare('DELETE FROM mutes WHERE muter=? AND muted=?').bind(me, normHandle(op.handle)).run();
      return { ok: true };
    }
    case 'edit_post': {
      const p = await db.prepare('SELECT author FROM posts WHERE id=?').bind(sstr(op.id)).first();
      if (!p) throw { status: 404, msg: 'no post' };
      if (p.author !== me) throw { status: 403, msg: 'not yours' };
      await db.prepare('UPDATE posts SET body=?, edited=? WHERE id=?').bind(sstr(op.body || '', 500), t).run();
      return { ok: true };
    }
    case 'delete_post': {
      const p = await db.prepare('SELECT author FROM posts WHERE id=?').bind(sstr(op.id)).first();
      if (!p) throw { status: 404, msg: 'no post' };
      if (p.author !== me) throw { status: 403, msg: 'not yours' };
      await db.prepare('UPDATE posts SET deleted=1 WHERE id=?').bind(sstr(op.id)).run();
      await db.prepare('INSERT INTO deletes(ref_kind,ref_id,by_,created) VALUES(?,?,?,?) ON CONFLICT DO NOTHING').bind('post', sstr(op.id), me, t).run();
      return { ok: true };
    }
    case 'edit_reply': {
      const r = await db.prepare('SELECT author FROM replies WHERE id=?').bind(sstr(op.id)).first();
      if (!r) throw { status: 404, msg: 'no reply' };
      if (r.author !== me) throw { status: 403, msg: 'not yours' };
      await db.prepare('UPDATE replies SET body=?, edited=? WHERE id=?').bind(sstr(op.body || '', 500), t).run();
      return { ok: true };
    }
    case 'delete_reply': {
      const r = await db.prepare('SELECT author FROM replies WHERE id=?').bind(sstr(op.id)).first();
      if (!r) throw { status: 404, msg: 'no reply' };
      if (r.author !== me) throw { status: 403, msg: 'not yours' };
      await db.prepare('UPDATE replies SET deleted=1 WHERE id=?').bind(sstr(op.id)).run();
      await db.prepare('INSERT INTO deletes(ref_kind,ref_id,by_,created) VALUES(?,?,?,?) ON CONFLICT DO NOTHING').bind('reply', sstr(op.id), me, t).run();
      return { ok: true };
    }
    case 'notes_seen': {
      await db.prepare('UPDATE notifications SET seen=1 WHERE user_=? AND seen=0').bind(me).run();
      return { ok: true };
    }
    default: throw { status: 400, msg: 'unknown op' };
  }
}

/* ---- read: feed assembly ---- */
async function readFeed(db, me, q) {
  const mode = q.get('mode') || 'all';
  const facet = q.get('facet') || 'all';
  const limit = Math.min(parseInt(q.get('limit') || '40', 10) || 40, 60);
  const cur = q.get('cursor') || '';
  let following = { people: [], souls: [], groups: [] };
  if (me) following = await getFollows(db, me);
  let rows;
  if (cur) {
    const [ct, ci] = cur.split('|');
    rows = (await db.prepare('SELECT * FROM posts WHERE deleted=0 AND (created < ? OR (created = ? AND id < ?)) ORDER BY created DESC, id DESC LIMIT 120')
      .bind(+ct || now(), +ct || now(), ci || '').results) || [];
  } else {
    rows = (await db.prepare('SELECT * FROM posts WHERE deleted=0 ORDER BY created DESC, id DESC LIMIT 120').bind().results) || [];
  }
  let userSet = null;
  const out = [];
  for (const p of rows) {
    if (out.length >= limit) break;
    if (mode === 'mine' && p.author !== me) continue;
    if (mode === 'following' && !(p.author === me || following.people.includes(p.author) || following.souls.includes(p.soul))) continue;
    if (facet === 'people') {
      if (!userSet) {
        const us = (await db.prepare('SELECT handle FROM users').all()).results || [];
        userSet = new Set(us.map(x => x.handle));
      }
      if (p.author !== me && !userSet.has(p.author)) continue;
    }
    if (facet === 'groups' && !p.group_id) continue;
    if (!(await canSeePost(db, p, me, following))) continue;
    out.push({ id: p.id, u: p.author, soul: p.soul, k: p.kind, b: p.body, url: p.url, vis: p.vis, g: p.group_id, t: p.created, m: p.author === me ? 1 : 0 });
  }
  const last = out.length ? out[out.length - 1] : null;
  return { items: out, cursor: last ? last.t + '|' + last.id : null };
}

/* ---- link reader: public URL -> draft soul card (never writes) ---- */
const READ_HOSTS = ['github.com', 'huggingface.co', 'x.com', 'twitter.com', 'youtube.com', 'youtu.be', 'instagram.com', 'tiktok.com', 'facebook.com', 'linkedin.com', 'reddit.com', 'twitch.tv'];
function readHostKind(host) {
  const h = String(host || '').toLowerCase();
  if (READ_HOSTS.includes(h)) return h;
  if (h.endsWith('.myshopify.com')) return 'myshopify';
  return null;
}
function blockedHost(h) {
  h = String(h || '').toLowerCase();
  if (['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(h)) return true;
  if (h.endsWith('.internal') || h.endsWith('.local')) return true;
  return /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(h);
}
function decodeEnt(s) {
  return String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function ogMeta(html, key) {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let m = html.match(new RegExp('<meta[^>]+(?:property|name)=["\'](?:og:|twitter:)?' + k + '["\'][^>]*?content=["\']([^"\']{1,500})["\']', 'i'));
  if (!m) m = html.match(new RegExp('<meta[^>]+?content=["\']([^"\']{1,500})["\'][^>]*?(?:property|name)=["\'](?:og:|twitter:)?' + k + '["\']', 'i'));
  return m ? decodeEnt(m[1]).trim() : '';
}
function pageTitle(html) {
  const m = html.match(/<title[^>]*>([^<]{1,120})<\/title>/i);
  return m ? decodeEnt(m[1]).trim() : '';
}
function stripTags(s, n) {
  return String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n || 220);
}
async function fetchTextCapped(rawUrl, ms) {
  const ctl = new AbortController();
  const to = setTimeout(() => { try { ctl.abort(); } catch (e) {} }, ms || 8000);
  try {
    const r = await fetch(rawUrl, { signal: ctl.signal, headers: { 'User-Agent': 'SoulEconomy-link-reader/1.0', Accept: 'text/html,application/json' }, redirect: 'follow' });
    if (!r.ok) throw { status: 502, msg: 'fetch failed (' + r.status + ')' };
    const buf = await r.arrayBuffer();
    if (buf.byteLength > 1048576) throw { status: 413, msg: 'page too large' };
    return new TextDecoder().decode(buf);
  } finally { clearTimeout(to); }
}
async function readLink(url, raw) {
  let u;
  try { u = new URL(raw); } catch (e) { throw { status: 400, msg: 'bad url' }; }
  if (u.protocol !== 'https:') throw { status: 400, msg: 'https only' };
  if (blockedHost(u.hostname)) throw { status: 400, msg: 'host blocked' };
  const kind = readHostKind(u.hostname);
  if (!kind) throw { status: 400, msg: 'unsupported host in v1' };
  // GitHub fast path: repo API (clean data, no scraping)
  if (kind === 'github.com') {
    const m = u.pathname.match(/^\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
    if (!m) throw { status: 400, msg: 'expected github.com/owner/repo' };
    const r = await fetch('https://api.github.com/repos/' + m[1] + '/' + m[2], { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'SoulEconomy-link-reader/1.0' } });
    if (!r.ok) throw { status: 502, msg: 'github lookup failed' };
    const j = await r.json();
    const nm = String(j.full_name || j.name || m[2]);
    return {
      name: nm.slice(0, 80),
      type: /dataset|data/i.test(nm + ' ' + String(j.description || '')) ? 'pack' : 'skill',
      desc: stripTags(j.description || '', 220) || ('GitHub repo by @' + String(j.owner && j.owner.login || m[1])),
      image: '', stars: j.stargazers_count || 0,
      source: 'github', sourceUrl: raw
    };
  }
  // Shopify fast path: products.js JSON (title, price, image, body)
  if (kind === 'myshopify') {
    const m = u.pathname.match(/\/products\/([a-z0-9-]+)/i);
    if (!m) throw { status: 400, msg: 'expected .../products/<handle>' };
    const r = await fetch(u.origin + '/products/' + m[1] + '.js', { headers: { Accept: 'application/json', 'User-Agent': 'SoulEconomy-link-reader/1.0' } });
    if (!r.ok) throw { status: 502, msg: 'shopify lookup failed' };
    const j = await r.json();
    const price = j.price ? (Number(j.price) / 100) : null;
    return {
      name: String(j.title || m[1]).slice(0, 80),
      type: 'pack',
      desc: (stripTags(j.description || '', 180) + (price != null ? ' — $' + price : '')).slice(0, 220),
      image: String((j.images && j.images[0]) || ''),
      source: 'shopify', sourceUrl: raw
    };
  }
  // HuggingFace + social: OG/Twitter meta with graceful degrade
  const html = await fetchTextCapped(raw, 8000);
  const name = ogMeta(html, 'title') || pageTitle(html) || u.hostname;
  const desc = ogMeta(html, 'description') || '';
  const image = ogMeta(html, 'image');
  const p = u.pathname.toLowerCase();
  const type = (kind === 'huggingface.co' && (p.includes('/datasets/') || p.includes('/spaces/'))) ? 'pack' : 'soul';
  return {
    name: name.slice(0, 80),
    type,
    desc: desc.slice(0, 220) || ('Shared via ' + kind),
    image: /^https:\/\//i.test(image) ? image.slice(0, 300) : '',
    source: kind === 'huggingface.co' ? 'huggingface' : 'web', sourceUrl: raw
  };
}

/* ---- router ---- */
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env, req) });
    const db = env.DB;
    const path = url.pathname.replace(/\/social\/?/, '/');
    const seg = (path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean));
    try {
      // public reads
      if (req.method === 'GET' && (seg[0] === 'feed' || seg.length === 0)) {
        const me = await verifyToken(env, req);
        return ok(env, req, await readFeed(db, me, url.searchParams));
      }
      if (req.method === 'GET' && seg[0] === 'health') return ok(env, req, { t: now() });
      if (req.method === 'GET' && seg[0] === 'trending') {
        const metric = url.searchParams.get('metric') || 'hot';
        const f = (await db.prepare("SELECT soul, COUNT(*) c FROM follows WHERE kind='soul' AND soul<>'' GROUP BY soul").all()).results || [];
        const m = {};
        f.forEach(r => { m[r.soul] = { soul: r.soul, follows: r.c, posts: 0 }; });
        const p = (await db.prepare("SELECT soul, COUNT(*) c FROM posts WHERE deleted=0 AND soul<>'' GROUP BY soul").all()).results || [];
        p.forEach(r => { (m[r.soul] = m[r.soul] || { soul: r.soul, follows: 0, posts: 0 }).posts = r.c; });
        let arr = Object.values(m);
        const sc = x => metric === 'follow' ? x.follows : metric === 'posts' ? x.posts : x.follows * 3 + x.posts;
        arr.sort((a, b) => sc(b) - sc(a));
        return ok(env, req, arr.slice(0, 20));
      }
      if (req.method === 'GET' && seg[0] === 'people') {
        const rows = (await db.prepare('SELECT u.handle, u.avatar, u.created, COUNT(f.target) c FROM users u LEFT JOIN follows f ON f.target=u.handle AND f.kind=? GROUP BY u.handle ORDER BY u.created DESC LIMIT 50').bind('person').results) || [];
        return ok(env, req, rows);
      }
      if (req.method === 'GET' && seg[0] === 'soul') {
        const me = await verifyToken(env, req);
        const nm = normName(url.searchParams.get('name'));
        const following = me ? await getFollows(db, me) : { people: [], souls: [], groups: [] };
        const cf = await db.prepare("SELECT COUNT(*) c FROM follows WHERE target=? AND kind='soul'").bind(nm).first();
        const cp = await db.prepare('SELECT * FROM posts WHERE soul=? AND deleted=0 ORDER BY created DESC LIMIT 10').bind(nm).all();
        const posts = [];
        for (const p of (cp.results || [])) if (await canSeePost(db, p, me, following)) posts.push({ id: p.id, u: p.author, k: p.kind, b: p.body, url: p.url, t: p.created });
        const iss = (await db.prepare('SELECT * FROM issues WHERE soul=? ORDER BY created DESC LIMIT 10').bind(nm).all()).results || [];
        const ver = (await db.prepare('SELECT * FROM versions WHERE soul=? ORDER BY created DESC LIMIT 10').bind(nm).all()).results || [];
        const rem = (await db.prepare('SELECT * FROM remixes WHERE parent=? ORDER BY created DESC LIMIT 10').bind(nm).all()).results || [];
        return ok(env, req, { follows: (cf && cf.c) || 0, posts, issues: iss, versions: ver, remixes: rem });
      }
      if (req.method === 'GET' && seg[0] === 'of-day') {
        const ds = new Date().toISOString().slice(0, 10);
        let seed = 0;
        for (let i = 0; i < ds.length; i++) seed = (seed * 31 + ds.charCodeAt(i)) >>> 0;
        const souls = (await db.prepare("SELECT DISTINCT soul s FROM (SELECT soul FROM follows WHERE kind='soul' AND soul<>'' UNION SELECT soul FROM posts WHERE deleted=0 AND soul<>'')").all()).results || [];
        const f = (await db.prepare("SELECT target t, COUNT(*) c FROM follows WHERE kind='person' GROUP BY target ORDER BY c DESC LIMIT 1").all()).results || [];
        return ok(env, req, {
          date: ds,
          soul: souls.length ? souls[seed % souls.length].s : null,
          creator: f.length ? f[0].t : null
        });
      }
      if (req.method === 'GET' && seg[0] === 'read-link') {
        const ip = req.headers.get('CF-Connecting-IP') || 'local';
        if (!(await checkRate(db, 'rl:' + ip, 10))) return bad(env, req, 'rate limited', 429);
        try {
          return ok(env, req, await readLink(url, url.searchParams.get('url') || ''));
        } catch (e) { return bad(env, req, (e && e.msg) || 'read failed', (e && e.status) || 400); }
      }
      if (req.method === 'GET' && seg[0] === 'groups') {
        const me = await verifyToken(env, req);
        const rows = (await db.prepare('SELECT g.*, COUNT(m.user_) mc FROM groups g LEFT JOIN members m ON m.group_id=g.id GROUP BY g.id ORDER BY g.created DESC LIMIT 50').all()).results || [];
        const out = [];
        for (const g of rows) {
          if (!(await groupVisible(db, g, me))) continue;
          let mine = false;
          if (me) mine = !!(await db.prepare('SELECT 1 FROM members WHERE group_id=? AND user_=?').bind(g.id, me).first());
          out.push({ id: g.id, name: g.name, desc: g.descr, vis: g.vis, by: g.by_, members: g.mc, mine });
        }
        return ok(env, req, out);
      }
      if (req.method === 'GET' && seg[0] === 'events') {
        const rows = (await db.prepare('SELECT e.*, COUNT(r.user_) rc FROM events e LEFT JOIN rsvps r ON r.event_id=e.id GROUP BY e.id ORDER BY e.created DESC LIMIT 30').all()).results || [];
        return ok(env, req, rows);
      }
      // authed reads
      if (req.method === 'GET' && seg[0] === 'notes') {
        const me = await verifyToken(env, req);
        if (!me) return bad(env, req, 'auth', 401);
        const rows = (await db.prepare('SELECT * FROM notifications WHERE user_=? ORDER BY created DESC LIMIT 30').bind(me).all()).results || [];
        const un = await db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_=? AND seen=0').bind(me).first();
        return ok(env, req, { items: rows, unread: (un && un.c) || 0 });
      }
      if (req.method === 'GET' && seg[0] === 'inbox') {
        const me = await verifyToken(env, req);
        if (!me) return bad(env, req, 'auth', 401);
        const rows = (await db.prepare('SELECT * FROM threads WHERE user_a=? OR user_b=? ORDER BY updated DESC LIMIT 30').bind(me, me).all()).results || [];
        const out = [];
        for (const t of rows) {
          const other = t.user_a === me ? t.user_b : t.user_a;
          if (await blockedEither(db, me, other)) continue;
          const last = await db.prepare('SELECT * FROM messages WHERE thread=? ORDER BY created DESC LIMIT 1').bind(t.id).first();
          out.push({ id: t.id, with: other, last: last || null });
        }
        return ok(env, req, out);
      }
      if (req.method === 'GET' && seg[0] === 'thread') {
        const me = await verifyToken(env, req);
        if (!me) return bad(env, req, 'auth', 401);
        const withU = normHandle(url.searchParams.get('with'));
        if (!withU) return bad(env, req, 'with required');
        if (await blockedEither(db, me, withU)) return bad(env, req, 'blocked', 403);
        const a = me < withU ? me : withU, b = me < withU ? withU : me;
        const rows = (await db.prepare('SELECT * FROM messages WHERE thread=? ORDER BY created DESC LIMIT 50').bind(a + '|' + b).all()).results || [];
        return ok(env, req, rows.reverse());
      }
      if (req.method === 'GET' && seg[0] === 'me') {
        const me = await verifyToken(env, req);
        if (!me) return bad(env, req, 'auth', 401);
        const following = await getFollows(db, me);
        const fr = await db.prepare("SELECT COUNT(*) c FROM follows WHERE target=? AND kind='person'").bind(me).first();
        return ok(env, req, { handle: me, following, followers: (fr && fr.c) || 0 });
      }
      if (req.method === 'GET' && seg[0] === 'pull') {
        const me = await verifyToken(env, req);
        const since = +(url.searchParams.get('since') || 0);
        const out = {};
        const following = me ? await getFollows(db, me) : { people: [], souls: [], groups: [] };
        const posts = (await db.prepare('SELECT * FROM posts WHERE created>? OR edited>? ORDER BY created LIMIT 200').bind(since, since).all()).results || [];
        out.posts = [];
        for (const p of posts) if (await canSeePost(db, p, me, following)) out.posts.push(p);
        const del = (await db.prepare('SELECT * FROM deletes WHERE created>?').bind(since).all()).results || [];
        out.deletes = del;
        if (me) {
          out.notes = (await db.prepare('SELECT * FROM notifications WHERE user_=? AND created>? ORDER BY created').bind(me, since).all()).results || [];
          const msgs = (await db.prepare('SELECT m.* FROM messages m JOIN threads t ON t.id=m.thread WHERE (t.user_a=? OR t.user_b=?) AND m.created>? ORDER BY m.created LIMIT 200').bind(me, me, since).all()).results || [];
          out.messages = [];
          for (const m of msgs) {
            const other = m.author === me ? null : m.author;
            if (other && await blockedEither(db, me, other)) continue;
            out.messages.push(m);
          }
        }
        out.serverTime = now();
        return ok(env, req, out);
      }
      // auth: mint session from a verified GitHub token
      if (req.method === 'POST' && seg[0] === 'auth' && seg[1] === 'session') {
        const body = await req.json().catch(() => ({}));
        if (!body.gh_token) return bad(env, req, 'gh_token required');
        const gu = await fetch('https://api.github.com/user', { headers: { Authorization: 'Bearer ' + body.gh_token, Accept: 'application/vnd.github+json', 'User-Agent': 'soul-economy' } });
        if (!gu.ok) return bad(env, req, 'github verify failed', 401);
        const gj = await gu.json();
        const handle = normHandle(gj.login);
        if (!handle) return bad(env, req, 'no login', 401);
        await db.prepare('INSERT INTO users(handle,avatar,bio,created) VALUES(?,?,?,?) ON CONFLICT(handle) DO UPDATE SET avatar=?')
          .bind(handle, String(gj.avatar_url || '').slice(0, 200), '', now(), String(gj.avatar_url || '').slice(0, 200)).run();
        return ok(env, req, { token: await mintToken(env, handle), handle });
      }
      // batch sync + direct writes (authed)
      const me = await verifyToken(env, req);
      if (!me) return bad(env, req, 'auth', 401);
      const ip = req.headers.get('CF-Connecting-IP') || 'local';
      if (req.method === 'POST' && seg[0] === 'sync') {
        if (!(await checkRate(db, 'w:' + me, 120))) return bad(env, req, 'rate limited', 429);
        const body = await req.json().catch(() => ({}));
        const ops = Array.isArray(body.ops) ? body.ops.slice(0, 50) : [];
        const results = [];
        for (const op of ops) {
          try {
            if (op.op === 'dm' && !(await checkRate(db, 'dm:' + me, 10))) throw { status: 429, msg: 'dm rate limited' };
            results.push({ op: op.op, ok: true, data: await applyOp(db, me, op) });
          } catch (e) { results.push({ op: (op && op.op) || '?', ok: false, error: (e && e.msg) || 'failed' }); }
        }
        return ok(env, req, { results });
      }
      if (req.method === 'POST' && seg.length === 1) {
        if (!(await checkRate(db, 'w:' + me + ':' + ip, 60))) return bad(env, req, 'rate limited', 429);
        const body = await req.json().catch(() => ({}));
        body.op = seg[0].replace(/-/g, '_');
        try {
          return ok(env, req, await applyOp(db, me, body));
        } catch (e) { return bad(env, req, (e && e.msg) || 'failed', (e && e.status) || 400); }
      }
      return bad(env, req, 'not found', 404);
    } catch (e) { return bad(env, req, 'server error', 500); }
  }
};
