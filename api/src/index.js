import { verifyEvent } from 'nostr-tools';
import { FamilyRoom } from './chat.mjs';
import { FeedRoom } from './feed.mjs';
import { handleShop } from './shop.mjs';

export { FamilyRoom, FeedRoom };

// ─── Soul Economy API ────────────────────────────────────────────────────────
// Stateless Nostr-native backend. Every write is a signed Nostr event;
// we verify the signature server-side, index it into D1, and serve fast reads.
// The client ALSO publishes to public relays — this DB is a fast mirror, the
// relays are the soul's memory. If we die, the data survives.

const ALLOWED_KINDS = new Set([0, 1, 3, 5, 7, 10000]);
const MAX_CONTENT = 4000;
const MAX_FEED_LIMIT = 50;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function tag(ev, name) {
  const t = (ev.tags || []).find((x) => Array.isArray(x) && x[0] === name);
  return t && t[1] ? String(t[1]) : null;
}
function tags(ev, name) {
  return (ev.tags || [])
    .filter((x) => Array.isArray(x) && x[0] === name && x[1])
    .map((x) => String(x[1]));
}
function eTagWithMarker(ev, marker) {
  const t = (ev.tags || []).find(
    (x) => Array.isArray(x) && x[0] === 'e' && x[1] && (!x[3] || x[3] === marker)
  );
  return t ? t[1] : null;
}

// Rate limit: sliding hourly window per key, persisted in D1.
async function rateLimit(env, key, max, windowMs) {
  const now = Date.now();
  const row = await env.DB.prepare(
    'SELECT window_start, count FROM rate_limits WHERE key = ?'
  )
    .bind(key)
    .first();
  if (!row || now - row.window_start > windowMs) {
    await env.DB.prepare(
      'INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1) ' +
        'ON CONFLICT(key) DO UPDATE SET window_start = ?, count = 1'
    )
      .bind(key, now, now)
      .run();
    return true;
  }
  if (row.count >= max) return false;
  await env.DB.prepare(
    'UPDATE rate_limits SET count = count + 1 WHERE key = ?'
  )
    .bind(key)
    .run();
  return true;
}

async function notify(env, owner, type, actor, targetId, snippet) {
  if (!owner || owner === actor) return;
  await env.DB.prepare(
    'INSERT INTO notifications (owner, type, actor, target_id, snippet, created_at) VALUES (?,?,?,?,?,?)'
  )
    .bind(owner, type, actor, targetId || '', String(snippet || '').slice(0, 200), Math.floor(Date.now() / 1000))
    .run();
}

async function authorExists(env, pubkey) {
  return !!(await env.DB.prepare('SELECT 1 FROM users WHERE pubkey = ?')
    .bind(pubkey)
    .first());
}

// Tell open feed tabs a new post landed (FeedRoom DO).
// MUST be awaited by the write path: fire-and-forget work after the response
// can be evicted before the DO subrequest completes (verified: poke works,
// un-awaited call lost the broadcast).
async function broadcastFeed(env, payload) {
  try {
    const stub = env.FEEDROOM.idFromName('square');
    await env.FEEDROOM.get(stub).fetch('https://feed.internal/api/feed/ws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.log('[feed] broadcast failed', e && e.message);
    /* realtime is best-effort — never fail the write over it */
  }
}

async function ensureUser(env, pubkey) {
  if (await authorExists(env, pubkey)) return;
  await env.DB.prepare(
    'INSERT OR IGNORE INTO users (pubkey, name, npub, created_at, updated_at) VALUES (?,?,?,?,?)'
  )
    .bind(pubkey, pubkey.slice(0, 8), pubkey, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000))
    .run();
}

// ─── Write path ──────────────────────────────────────────────────────────────
async function handleEvent(request, env) {
  let ev;
  try {
    ev = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid json' }, 400);
  }
  if (!ev || typeof ev !== 'object') return json({ ok: false, error: 'no event' }, 400);
  if (!ALLOWED_KINDS.has(ev.kind)) return json({ ok: false, error: 'kind not allowed' }, 400);
  if (typeof ev.content === 'string' && ev.content.length > MAX_CONTENT)
    return json({ ok: false, error: 'content too long' }, 413);

  let valid = false;
  try {
    valid = verifyEvent(ev);
  } catch {
    valid = false;
  }
  if (!valid) return json({ ok: false, error: 'invalid signature' }, 401);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(env, `pk:${ev.pubkey}`, 120, 3600_000)))
    return json({ ok: false, error: 'rate limit (identity)' }, 429);
  if (!(await rateLimit(env, `ip:${ip}`, 400, 3600_000)))
    return json({ ok: false, error: 'rate limit (ip)' }, 429);

  const now = Math.floor(Date.now() / 1000);
  const DB = env.DB;

  if (ev.kind === 0) {
    let prof = {};
    try {
      prof = JSON.parse(ev.content || '{}');
    } catch {
      prof = {};
    }
    await DB.prepare(
      `INSERT INTO users (pubkey, name, display_name, about, picture, npub, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(pubkey) DO UPDATE SET
         name=excluded.name, display_name=excluded.display_name, about=excluded.about,
         picture=excluded.picture, updated_at=excluded.updated_at`
    )
      .bind(
        ev.pubkey,
        String(prof.display_name || prof.name || '').slice(0, 80),
        String(prof.display_name || '').slice(0, 80),
        String(prof.about || '').slice(0, 500),
        String(prof.picture || '').slice(0, 400),
        String(prof.npub || '').slice(0, 80),
        ev.created_at || now,
        now
      )
      .run();
    return json({ ok: true, id: ev.id, kind: 0 });
  }

  if (ev.kind === 1) {
    const allE = tags(ev, 'e');
    const eWithMarker = (m) =>
      (ev.tags || []).find((t) => t[0] === 'e' && t[1] && t[3] === m)?.[1] || null;
    const rootId = eWithMarker('root') || allE[0] || null;
    const parent = eWithMarker('reply') || (allE.length > 1 ? allE[allE.length - 1] : null);
    const isReply = !!parent;
    const soulSlug = tag(ev, 'soul');
    const realm = tag(ev, 'realm');

    await ensureUser(env, ev.pubkey);
    const res = await env.DB.prepare(
      `INSERT OR IGNORE INTO posts (id, pubkey, created_at, content, kind, root_id, parent_id, soul_slug, realm)
       VALUES (?,?,?,?,1,?,?,?,?)`
    )
      .bind(
        ev.id,
        ev.pubkey,
        ev.created_at || now,
        ev.content || '',
        isReply ? rootId || parent : null,
        parent,
        soulSlug,
        realm
      )
      .run();

    if (res.meta?.changes > 0) {
      await env.DB.prepare('INSERT INTO posts_fts (doc_id, content, author) VALUES (?,?,?)')
        .bind(ev.id, (ev.content || '').slice(0, 8000), ev.pubkey)
        .run()
        .catch(() => {});
      await broadcastFeed(env, { type: 'feed', action: 'new', id: ev.id, reply: isReply, pubkey: ev.pubkey });
      let parentAuthor = null;
      if (parent) {
        await env.DB.prepare('UPDATE posts SET reply_count = reply_count + 1 WHERE id = ?')
          .bind(parent)
          .run();
        parentAuthor = (
          await env.DB.prepare('SELECT pubkey FROM posts WHERE id = ?').bind(parent).first()
        )?.pubkey;
        if (parentAuthor) await notify(env, parentAuthor, 'reply', ev.pubkey, parent, ev.content);
      }
      for (const p of tags(ev, 'p')) {
        if (p !== ev.pubkey && p !== parentAuthor)
          await notify(env, p, 'mention', ev.pubkey, parent || ev.id, ev.content);
      }
    }
    return json({ ok: true, id: ev.id, kind: 1, reply: isReply });
  }

  if (ev.kind === 3) {
    const followees = [
      ...new Set([...tags(ev, 'p'), ...(ev.tags || []).filter((t) => t[0] === 'pubkey').map((t) => t[1]).filter(Boolean)]),
    ].slice(0, 5000);
    const existing = await DB.prepare('SELECT followee FROM follows WHERE follower = ?')
      .bind(ev.pubkey)
      .all();
    const prev = new Set((existing.results || []).map((r) => r.followee));
    const next = new Set(followees);
    const added = [...next].filter((f) => !prev.has(f)).slice(0, 200);

    await DB.prepare('DELETE FROM follows WHERE follower = ?').bind(ev.pubkey).run();
    for (const f of followees) {
      await DB.prepare(
        'INSERT OR IGNORE INTO follows (follower, followee, created_at) VALUES (?,?,?)'
      )
        .bind(ev.pubkey, f, ev.created_at || now)
        .run();
    }
    for (const f of added) {
      await ensureUser(env, f);
      await notify(env, f, 'follow', ev.pubkey, ev.pubkey, 'followed you');
    }
    return json({ ok: true, id: ev.id, kind: 3, following: followees.length });
  }

  if (ev.kind === 5) {
    const targets = tags(ev, 'e');
    for (const t of targets) {
      const post = await DB.prepare('SELECT pubkey FROM posts WHERE id = ?').bind(t).first();
      if (post && post.pubkey === ev.pubkey) {
        await DB.prepare('UPDATE posts SET deleted = 1 WHERE id = ?').bind(t).run();
      }
    }
    return json({ ok: true, id: ev.id, kind: 5, deleted: targets.length });
  }

  if (ev.kind === 7) {
    const target = tags(ev, 'e')[0];
    if (!target) return json({ ok: false, error: 'reaction needs e tag' }, 400);
    const content = String(ev.content || '+').slice(0, 16);
    const res = await DB.prepare(
      'INSERT OR IGNORE INTO reactions (event_id, pubkey, target_id, content, created_at) VALUES (?,?,?,?,?)'
    )
      .bind(ev.id, ev.pubkey, target, content, ev.created_at || now)
      .run();

    if (res.meta?.changes > 0) {
      const post = await DB.prepare('SELECT pubkey, plt FROM posts WHERE id = ?').bind(target).first();
      if (post) {
        if (content === '+') {
          await DB.prepare('UPDATE posts SET like_count = like_count + 1 WHERE id = ?')
            .bind(target)
            .run();
        } else if (content === 'P+' || content === 'L+' || content === 'T+') {
          let plt = { p: 0, l: 0, t: 0 };
          try {
            plt = { ...plt, ...JSON.parse(post.plt || '{}') };
          } catch {}
          const k = content[0].toLowerCase();
          plt[k] = (Number(plt[k]) || 0) + 1;
          await DB.prepare('UPDATE posts SET plt = ? WHERE id = ?')
            .bind(JSON.stringify(plt), target)
            .run();
        }
        await notify(env, post.pubkey, 'react', ev.pubkey, target, content);
      }
    }
    return json({ ok: true, id: ev.id, kind: 7 });
  }

  if (ev.kind === 10000) {
    const muted = tags(ev, 'p');
    await DB.prepare('DELETE FROM mutes WHERE owner = ?').bind(ev.pubkey).run();
    for (const m of muted.slice(0, 5000)) {
      await DB.prepare('INSERT OR IGNORE INTO mutes (owner, muted, created_at) VALUES (?,?,?)')
        .bind(ev.pubkey, m, now)
        .run();
    }
    return json({ ok: true, id: ev.id, kind: 10000, muted: muted.length });
  }

  return json({ ok: false, error: 'unhandled kind' }, 400);
}

// ─── Read path ───────────────────────────────────────────────────────────────
const POST_SELECT = `
  SELECT p.id, p.pubkey, p.created_at, p.content, p.root_id, p.parent_id,
         p.soul_slug, p.realm, p.reply_count, p.like_count, p.repost_count, p.plt,
         u.name, u.display_name, u.picture, u.about
  FROM posts p
  LEFT JOIN users u ON u.pubkey = p.pubkey`;

async function handleFeed(url, env) {
  const scope = url.searchParams.get('scope') || 'global';
  const me = url.searchParams.get('me') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10) || 20, MAX_FEED_LIMIT);
  const before = parseInt(url.searchParams.get('before') || '0', 10) || 0;
  const soul = url.searchParams.get('soul') || '';

  const where = ['p.deleted = 0', 'p.hidden = 0', 'p.parent_id IS NULL'];
  const binds = [];
  if (before > 0) {
    where.push('p.created_at < ?');
    binds.push(before);
  }
  if (soul) {
    where.push('p.soul_slug = ?');
    binds.push(soul);
  }
  if (scope === 'following' && me) {
    where.push('(p.pubkey = ? OR p.pubkey IN (SELECT followee FROM follows WHERE follower = ?))');
    binds.push(me, me);
    where.push('p.pubkey NOT IN (SELECT muted FROM mutes WHERE owner = ?)');
    binds.push(me);
  }
  const sql = `${POST_SELECT} WHERE ${where.join(' AND ')} ORDER BY p.created_at DESC, p.id DESC LIMIT ?`;
  binds.push(limit + 1);
  const res = await env.DB.prepare(sql).bind(...binds).all();
  const rows = res.results || [];
  const hasMore = rows.length > limit;
  const posts = rows.slice(0, limit);
  return json({ posts, next_before: hasMore && posts.length ? posts[posts.length - 1].created_at : null });
}

async function handleThread(url, env) {
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  const root = await env.DB.prepare(
    `${POST_SELECT} WHERE p.id = ? AND p.deleted = 0`
  )
    .bind(id)
    .first();
  const parentId = root ? root.id : id;
  const replies = await env.DB.prepare(
    `${POST_SELECT} WHERE p.deleted = 0 AND (p.root_id = ? OR p.parent_id = ? OR p.id = ?)
     ORDER BY p.created_at ASC LIMIT 300`
  )
    .bind(parentId, parentId, id)
    .all();
  return json({ root: root || null, replies: replies.results || [] });
}

async function handleProfile(url, env) {
  const pubkey = url.searchParams.get('pubkey');
  if (!pubkey) return json({ error: 'pubkey required' }, 400);
  const me = url.searchParams.get('me') || '';
  const user =
    (await env.DB.prepare('SELECT * FROM users WHERE pubkey = ?').bind(pubkey).first()) || null;
  const counts = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM posts WHERE pubkey = ? AND deleted = 0 AND parent_id IS NULL) AS posts,
       (SELECT COUNT(*) FROM follows WHERE followee = ?) AS followers,
       (SELECT COUNT(*) FROM follows WHERE follower = ?) AS following`
  )
    .bind(pubkey, pubkey, pubkey)
    .first();
  let is_following = 0;
  if (me) {
    is_following = (
      await env.DB.prepare('SELECT 1 AS x FROM follows WHERE follower = ? AND followee = ?')
        .bind(me, pubkey)
        .first()
    )
      ? 1
      : 0;
  }
  const recent = await env.DB.prepare(
    `${POST_SELECT} WHERE p.pubkey = ? AND p.deleted = 0 AND p.parent_id IS NULL
     ORDER BY p.created_at DESC LIMIT 20`
  )
    .bind(pubkey)
    .all();
  return json({ user, counts, is_following, recent: recent.results || [] });
}

async function handleNotify(url, env) {
  const me = url.searchParams.get('me');
  if (!me) return json({ error: 'me required' }, 400);
  const rows = await env.DB.prepare(
    `SELECT n.*, u.name, u.display_name, u.picture
     FROM notifications n
     LEFT JOIN users u ON u.pubkey = n.actor
     WHERE n.owner = ?
     ORDER BY n.created_at DESC LIMIT 50`
  )
    .bind(me)
    .all();
  const unread = await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM notifications WHERE owner = ? AND is_read = 0'
  )
    .bind(me)
    .first();
  return json({ notifications: rows.results || [], unread: unread?.c || 0 });
}

// NIP-98 style auth: a signed kind-27235 event bound to this URL + method.
async function verifyNostrAuth(body, requestUrl, method) {
  const auth = body && body.auth;
  if (!auth) return null;
  let ok = false;
  try {
    ok = verifyEvent(auth);
  } catch {
    ok = false;
  }
  if (!ok || auth.kind !== 27235) return null;
  const u = tag(auth, 'u');
  const m = tag(auth, 'method');
  if (m !== method) return null;
  if (u !== requestUrl) return null;
  const age = Math.floor(Date.now() / 1000) - (auth.created_at || 0);
  if (age > 600 || age < -60) return null;
  return auth.pubkey;
}

async function handleNotifyRead(request, env, url) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid json' }, 400);
  }
  const pubkey = await verifyNostrAuth(body, url.toString(), 'POST');
  if (!pubkey) return json({ ok: false, error: 'auth failed' }, 401);
  const ids = (body.ids || []).slice(0, 200);
  if (ids.length) {
    for (const id of ids) {
      await env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE owner = ? AND id = ?')
        .bind(pubkey, Number(id))
        .run();
    }
  } else {
    await env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE owner = ?')
      .bind(pubkey)
      .run();
  }
  return json({ ok: true });
}

async function handleFollows(url, env) {
  const pubkey = url.searchParams.get('pubkey');
  if (!pubkey) return json({ error: 'pubkey required' }, 400);
  const res = await env.DB.prepare(
    'SELECT followee FROM follows WHERE follower = ? ORDER BY created_at DESC LIMIT 5000'
  )
    .bind(pubkey)
    .all();
  return json({ followees: (res.results || []).map((r) => r.followee) });
}

function ftsQuery(q) {
  return q
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => '"' + t.replace(/"/g, '""') + '"*')
    .join(' ');
}

async function handleSearch(url, env) {
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
  if (!q) return json({ posts: [], souls: [] });
  let posts = [];
  let souls = [];
  try {
    const pr = await env.DB.prepare(
      `SELECT p.id, p.pubkey, p.content, p.created_at, p.soul_slug, p.reply_count, p.like_count, u.name, u.display_name, u.picture
       FROM posts_fts f
       JOIN posts p ON p.id = f.doc_id
       LEFT JOIN users u ON u.pubkey = p.pubkey
       WHERE f MATCH ? AND p.deleted = 0 AND p.parent_id IS NULL
       ORDER BY f.rank LIMIT 30`
    )
      .bind(ftsQuery(q))
      .all();
    posts = pr.results || [];
  } catch (e) {
    posts = [];
  }
  if (!posts.length) {
    const like = `%${q.replace(/[%_]/g, ' ')}%`;
    const res = await env.DB.prepare(
      `${POST_SELECT} WHERE p.deleted = 0 AND p.parent_id IS NULL AND p.content LIKE ?
       ORDER BY p.created_at DESC LIMIT 30`
    )
      .bind(like)
      .all();
    posts = res.results || [];
  }
  try {
    const sr = await env.DB.prepare(
      `SELECT slug, name, type FROM souls_fts WHERE souls_fts MATCH ? ORDER BY rank LIMIT 12`
    )
      .bind(ftsQuery(q))
      .all();
    souls = sr.results || [];
  } catch (e) {
    souls = [];
  }
  return json({ posts, souls });
}

async function handleHit(request, env) {
  let path = '/';
  try {
    path = String((await request.json()).path || '/').slice(0, 200);
  } catch (e) {}
  if (!path.startsWith('/')) path = '/' + path;
  const day = new Date().toISOString().slice(0, 10);
  await env.DB.prepare(
    'INSERT INTO page_views (day, path, hits) VALUES (?,?,1) ON CONFLICT(day,path) DO UPDATE SET hits = hits + 1'
  )
    .bind(day, path)
    .run();
  return json({ ok: true });
}

async function handleNewsletter(request, env) {
  let email = '';
  try {
    email = String((await request.json()).email || '').trim().toLowerCase();
  } catch (e) {}
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    return json({ ok: false, error: 'invalid email' }, 400);
  const res = await env.DB.prepare(
    'INSERT OR IGNORE INTO subscribers (email, created_at, source) VALUES (?,?,?)'
  )
    .bind(email, Date.now(), 'site')
    .run();
  return json({ ok: true, dup: !(res.meta?.changes > 0) });
}

async function handleStats(env) {
  const byDay = await env.DB.prepare(
    'SELECT day, SUM(hits) AS hits FROM page_views GROUP BY day ORDER BY day DESC LIMIT 30'
  ).all();
  const total = await env.DB.prepare('SELECT COALESCE(SUM(hits),0) AS hits FROM page_views').first();
  const subs = await env.DB.prepare('SELECT COUNT(*) AS n FROM subscribers').first();
  const posts = await env.DB.prepare('SELECT COUNT(*) AS n FROM posts WHERE deleted = 0').first();
  return json({
    totalViews: (total && total.hits) || 0,
    subscribers: (subs && subs.n) || 0,
    posts: (posts && posts.n) || 0,
    byDay: byDay.results || [],
  });
}

// POST /api/ask — "Ask this Soul": persona chat via Workers AI (free tier).
// Client sends the public persona (name/desc); strict in-character prompt; IP-limited.
async function handleAsk(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(env, `ask:${ip}`, 30, 3600_000)))
    return json({ ok: false, error: 'rate limit (ask)' }, 429);
  if (!env.AI) return json({ ok: false, error: 'ai_not_configured' }, 503);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid json' }, 400);
  }
  const strip = (s) => String(s || '').replace(/[\u0000-\u001f]/g, '').trim();
  const q = strip(body?.q).slice(0, 400);
  const name = strip(body?.name).slice(0, 80);
  const desc = strip(body?.desc).slice(0, 600);
  const slug = String(body?.slug || '').replace(/[^a-z0-9-]/g, '').slice(0, 80);
  if (!q) return json({ ok: false, error: 'no question' }, 400);
  const soul = name || 'this soul';
  const system =
    `You are "${soul}", a soul from the Soulverse — the Digital Library of Souls of BUYASOUL ` +
    `(buyasoul.online), built by Craig Jones, the Grand Code Pope. ` +
    (desc ? `Your essence: ${desc}. ` : '') +
    `Answer AS this soul in first person: warm, wise, brief (max 3 sentences), always in character. ` +
    `Plain text only — no markdown, no lists, no quotes.`;
  try {
    const out = await env.AI.run(env.AI_MODEL || '@cf/meta/llama-3.1-8b-instruct-fp8', {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: q },
      ],
      max_tokens: 220,
      temperature: 0.85,
    });
    const answer = String((out && out.response) || '').trim();
    if (!answer) return json({ ok: false, error: 'empty response' }, 502);
    return json({ ok: true, answer, soul, slug });
  } catch (e) {
    return json({ ok: false, error: 'ai_error: ' + (e.message || 'unknown') }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS, status: 204 });
    try {
      // FamilyChat — chat room (Durable Object) + compat healthz
      if (url.pathname === '/healthz')
        return new Response('FamilyChat room alive', {
          headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8' },
        });
      if (url.pathname === '/ws') {
        if ((request.headers.get('Upgrade') || '').toLowerCase() !== 'websocket')
          return new Response('WebSocket upgrade required', { status: 426, headers: CORS });
        const stub = env.ROOM.idFromName('family');
        return env.ROOM.get(stub).fetch(request);
      }
      // Shop API (port of chat/api.mjs)
      if (url.pathname.startsWith('/api/v1/')) return await handleShop(request, env, url);

      if (url.pathname === '/api/health') return json({ ok: true, at: Date.now() });
      if (url.pathname === '/api/events' && request.method === 'POST')
        return await handleEvent(request, env);
      if (url.pathname === '/api/feed/ws') {
        if ((request.headers.get('Upgrade') || '').toLowerCase() !== 'websocket')
          return new Response('WebSocket upgrade required', { status: 426, headers: CORS });
        const stub = env.FEEDROOM.idFromName('square');
        return env.FEEDROOM.get(stub).fetch(request);
      }
      if (url.pathname === '/api/feed') return await handleFeed(url, env);
      if (url.pathname === '/api/thread') return await handleThread(url, env);
      if (url.pathname === '/api/profile') return await handleProfile(url, env);
      if (url.pathname === '/api/notify') return await handleNotify(url, env);
      if (url.pathname === '/api/follows') return await handleFollows(url, env);
      if (url.pathname === '/api/notify/read' && request.method === 'POST')
        return await handleNotifyRead(request, env, url);
      if (url.pathname === '/api/search') return await handleSearch(url, env);
      if (url.pathname === '/api/hit' && request.method === 'POST') return await handleHit(request, env);
      if (url.pathname === '/api/newsletter' && request.method === 'POST')
        return await handleNewsletter(request, env);
      if (url.pathname === '/api/stats') return await handleStats(env);
      if (url.pathname === '/api/ask' && request.method === 'POST') return await handleAsk(request, env);
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return json({ ok: false, error: 'not found' }, 404);
    } catch (e) {
      return json({ ok: false, error: String((e && e.message) || e) }, 500);
    }
  },
};
