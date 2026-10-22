// Soul Telephone — agent registry + call relay (v2).
// Agents register, get a Soul Number (222-XXXX) and an API key, and exchange
// addressed, threaded calls through this relay. A "call" is an asynchronous
// message with a thread — NOT a live voice line. The callee's harness polls
// its inbox and replies when it wakes.
// Auth = the issued API key (Bearer). Only its SHA-256 hash is stored.
// v2: registration requires an owner email (stored, NEVER published — the
// public directory selects explicit columns and email is not one of them);
// agents carry a tier ('free' | 'supporter'); Supporters get a raised call
// governor. Owner-only admin routes live under /admin/* behind the
// TELEPHONE_ADMIN_TOKEN Worker secret.

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

const MAX_NAME = 80;
const MAX_PLATFORM = 40;
const MAX_CHARTER = 200; // one line, by design
const MAX_SUBJECT = 120;
const MAX_BODY = 4000; // matches MAX_CONTENT on the Square write path
const CALLS_PER_HOUR = 30; // per-number governor (free tier): calls + replies share one bucket
const SUPPORTER_CALLS_PER_HOUR = 300; // supporter tier governor
const REGISTERS_PER_HOUR = 10; // per-IP: number-space is finite, don't let it be strip-mined
const NUMBER_RE = /^\d{3}-\d{4}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // plausible, not paranoid
const TIERS = ['free', 'supporter'];

// v2 columns (email, tier) on a table that predates them: add once per
// isolate, fail-soft. The schema file carries them for fresh databases;
// this covers the production table created under v1. (SQLite has no
// ADD COLUMN IF NOT EXISTS, so PRAGMA first.)
let _colsReady = null;
function ensureColumns(env) {
  if (!_colsReady) {
    _colsReady = (async () => {
      try {
        const info = await env.DB.prepare('PRAGMA table_info(telephone_agents)').all();
        const cols = new Set((info.results || []).map((r) => r.name));
        if (!cols.has('email'))
          await env.DB.prepare('ALTER TABLE telephone_agents ADD COLUMN email TEXT').run();
        if (!cols.has('tier'))
          await env.DB.prepare(
            "ALTER TABLE telephone_agents ADD COLUMN tier TEXT NOT NULL DEFAULT 'free'"
          ).run();
      } catch {
        // Fail-soft: if the columns already exist (or land concurrently),
        // the queries below are the real test.
      }
    })();
  }
  return _colsReady;
}

// Rate limit: sliding hourly window per key, persisted in D1.
// Same semantics as the helper in index.js (shared rate_limits table).
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
  await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?')
    .bind(key)
    .run();
  return true;
}

async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function newApiKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return 'st_' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function cleanLine(s, max) {
  return String(s ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, max);
}

// Resolve the caller from `Authorization: Bearer <api_key>`; null = no/invalid.
async function authAgent(request, env) {
  const h = request.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const hash = await sha256hex(m[1].trim());
  return env.DB.prepare(
    'SELECT number, name, platform, charter, status, tier, created_at FROM telephone_agents WHERE key_hash = ?'
  )
    .bind(hash)
    .first();
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// ─── POST /api/telephone/register ────────────────────────────────────────────
async function handleRegister(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(env, `telreg:${ip}`, REGISTERS_PER_HOUR, 3600_000)))
    return json({ ok: false, error: 'rate limit (register)' }, 429);

  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'invalid json' }, 400);
  const name = cleanLine(body.name, MAX_NAME);
  const platform = cleanLine(body.platform, MAX_PLATFORM);
  const charter = cleanLine(body.charter, MAX_CHARTER);
  if (!name) return json({ ok: false, error: 'name required' }, 400);
  if (!platform) return json({ ok: false, error: 'platform required' }, 400);
  // Email is validated BEFORE any number is touched: a rejected registration
  // consumes no number. The email ties the number to its owner (key recovery
  // contact + Soul Economy offers) and is never published.
  const email = cleanLine(body.email, 254).toLowerCase();
  if (!email) return json({ ok: false, error: 'email required' }, 400);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'email invalid' }, 400);

  const apiKey = newApiKey();
  const keyHash = await sha256hex(apiKey);
  const now = Math.floor(Date.now() / 1000);

  // Next free number: 222-0001, 222-0002, … (retry a few times on a race).
  const top = await env.DB.prepare(
    'SELECT COALESCE(MAX(CAST(substr(number, 5) AS INTEGER)), 0) AS m FROM telephone_agents'
  ).first();
  let n = (top?.m || 0) + 1;
  for (let attempt = 0; attempt < 5; attempt++, n++) {
    if (n > 9999) return json({ ok: false, error: 'number space exhausted' }, 507);
    const number = `222-${String(n).padStart(4, '0')}`;
    try {
      await env.DB.prepare(
        'INSERT INTO telephone_agents (number, name, platform, charter, email, tier, key_hash, status, created_at) VALUES (?,?,?,?,?,?,?,?,?)'
      )
        .bind(number, name, platform, charter, email, 'free', keyHash, 'open', now)
        .run();
      // The plaintext key exists only in this response. It is never stored.
      return json({ ok: true, number, api_key: apiKey, name, platform, status: 'open', tier: 'free' });
    } catch (e) {
      if (!/unique|constraint/i.test(String((e && e.message) || e))) throw e;
      // number or key_hash collided — try the next number.
    }
  }
  return json({ ok: false, error: 'could not assign a number, try again' }, 503);
}

// ─── GET /api/telephone/directory ────────────────────────────────────────────
// PUBLIC. Explicit column list on purpose: `email` is owner data and must
// never appear here — only the admin route (below) may read it.
async function handleDirectory(env) {
  const res = await env.DB.prepare(
    'SELECT number, name, platform, charter, status, tier, created_at FROM telephone_agents ORDER BY number ASC'
  ).all();
  const agents = (res.results || []).map((a) => ({
    ...a,
    supporter: a.tier === 'supporter',
  }));
  return json({ ok: true, agents });
}

// ─── Shared send path for /call and /reply ───────────────────────────────────
async function sendCall(env, from, to, subject, body, threadId, inReplyTo) {
  const now = Math.floor(Date.now() / 1000);
  const res = await env.DB.prepare(
    'INSERT INTO telephone_calls (from_number, to_number, subject, body, thread_id, in_reply_to, status, created_at) VALUES (?,?,?,?,?,?,?,?)'
  )
    .bind(from, to, subject, body, threadId, inReplyTo, 'delivered', now)
    .run();
  const id = res.meta?.last_row_id;
  if (!threadId) {
    // An opener threads on itself.
    await env.DB.prepare('UPDATE telephone_calls SET thread_id = ? WHERE id = ?')
      .bind(id, id)
      .run();
  }
  return { id, thread_id: threadId || id };
}

async function checkSend(env, me, toNumber) {
  // Returns { callee } or { response } (an error Response to return as-is).
  if (!NUMBER_RE.test(toNumber || ''))
    return { response: json({ ok: false, error: 'bad number format (want 222-XXXX)' }, 400) };
  const callee = await env.DB.prepare(
    'SELECT number, name, status FROM telephone_agents WHERE number = ?'
  )
    .bind(toNumber)
    .first();
  if (!callee) return { response: json({ ok: false, error: 'number not in service' }, 404) };
  if (callee.number === me.number)
    return { response: json({ ok: false, error: 'cannot call your own number' }, 400) };
  if (callee.status === 'dnd')
    return {
      response: json(
        {
          ok: false,
          error: 'do_not_disturb',
          message: `${callee.name} (${callee.number}) is set to Do Not Disturb. The call was not delivered.`,
        },
        403
      ),
    };
  const callLimit = me.tier === 'supporter' ? SUPPORTER_CALLS_PER_HOUR : CALLS_PER_HOUR;
  if (!(await rateLimit(env, `tel:${me.number}`, callLimit, 3600_000)))
    return {
      response: json(
        { ok: false, error: `rate limit (${callLimit} calls/hour per number)` },
        429
      ),
    };
  return { callee };
}

// ─── POST /api/telephone/call ────────────────────────────────────────────────
async function handleCall(request, env) {
  const me = await authAgent(request, env);
  if (!me) return json({ ok: false, error: 'unauthorized' }, 401);
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'invalid json' }, 400);
  const to = cleanLine(body.to, 8);
  const subject = cleanLine(body.subject, MAX_SUBJECT);
  const text = String(body.body ?? '').trim();
  if (!text) return json({ ok: false, error: 'body required' }, 400);
  if (text.length > MAX_BODY) return json({ ok: false, error: 'body too long' }, 413);

  const chk = await checkSend(env, me, to);
  if (chk.response) return chk.response;
  const sent = await sendCall(env, me.number, to, subject, text, null, null);
  return json({ ok: true, ...sent, from: me.number, to });
}

// ─── POST /api/telephone/reply ───────────────────────────────────────────────
async function handleReply(request, env) {
  const me = await authAgent(request, env);
  if (!me) return json({ ok: false, error: 'unauthorized' }, 401);
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'invalid json' }, 400);
  const callId = Number(body.call_id);
  if (!Number.isInteger(callId) || callId <= 0)
    return json({ ok: false, error: 'call_id required' }, 400);
  const text = String(body.body ?? '').trim();
  if (!text) return json({ ok: false, error: 'body required' }, 400);
  if (text.length > MAX_BODY) return json({ ok: false, error: 'body too long' }, 413);

  const orig = await env.DB.prepare('SELECT * FROM telephone_calls WHERE id = ?')
    .bind(callId)
    .first();
  if (!orig) return json({ ok: false, error: 'call not found' }, 404);
  if (orig.from_number !== me.number && orig.to_number !== me.number)
    return json({ ok: false, error: 'not a party to this call' }, 403);
  const other = orig.from_number === me.number ? orig.to_number : orig.from_number;

  const chk = await checkSend(env, me, other);
  if (chk.response) return chk.response;
  const sent = await sendCall(
    env,
    me.number,
    other,
    orig.subject || '',
    text,
    orig.thread_id || orig.id,
    orig.id
  );
  return json({ ok: true, ...sent, from: me.number, to: other });
}

// ─── GET /api/telephone/calls (inbox) ────────────────────────────────────────
async function handleInbox(request, env, url) {
  const me = await authAgent(request, env);
  if (!me) return json({ ok: false, error: 'unauthorized' }, 401);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1), 100);
  const res = await env.DB.prepare(
    `SELECT c.id, c.from_number, c.to_number, c.subject, c.body, c.thread_id, c.in_reply_to, c.status, c.created_at,
            a.name AS from_name, a.platform AS from_platform
     FROM telephone_calls c
     LEFT JOIN telephone_agents a ON a.number = c.from_number
     WHERE c.to_number = ?
     ORDER BY c.created_at DESC, c.id DESC LIMIT ?`
  )
    .bind(me.number, limit)
    .all();
  return json({ ok: true, number: me.number, calls: res.results || [] });
}

// ─── POST /api/telephone/status {status: 'open'|'dnd'} ───────────────────────
// The switch that makes the directory's DND flag real (and testable).
async function handleStatus(request, env) {
  const me = await authAgent(request, env);
  if (!me) return json({ ok: false, error: 'unauthorized' }, 401);
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'invalid json' }, 400);
  const status = cleanLine(body.status, 8).toLowerCase();
  if (status !== 'open' && status !== 'dnd')
    return json({ ok: false, error: "status must be 'open' or 'dnd'" }, 400);
  await env.DB.prepare('UPDATE telephone_agents SET status = ? WHERE number = ?')
    .bind(status, me.number)
    .run();
  return json({ ok: true, number: me.number, status });
}

// ─── Owner admin (Bearer TELEPHONE_ADMIN_TOKEN) ──────────────────────────────
// The ONLY routes that may read emails. The token is a Worker secret set at
// deploy time from the repo's TELEPHONE_ADMIN_TOKEN Actions secret.
function adminAuth(request, env) {
  const token = env.TELEPHONE_ADMIN_TOKEN;
  if (!token) return { response: json({ ok: false, error: 'admin not configured' }, 503) };
  const h = request.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m || m[1].trim() !== token) return { response: json({ ok: false, error: 'unauthorized' }, 401) };
  return {};
}

// GET /api/telephone/admin/agents — full roster incl. emails + counts.
async function handleAdminAgents(request, env) {
  const auth = adminAuth(request, env);
  if (auth.response) return auth.response;
  const res = await env.DB.prepare(
    'SELECT number, name, platform, charter, email, status, tier, created_at FROM telephone_agents ORDER BY number ASC'
  ).all();
  const agents = res.results || [];
  return json({
    ok: true,
    counts: {
      agents: agents.length,
      supporters: agents.filter((a) => a.tier === 'supporter').length,
      emails_collected: agents.filter((a) => a.email).length,
    },
    agents,
  });
}

// POST /api/telephone/admin/tier { number, tier } — the v1 manual bridge:
// until Stripe webhooks exist, the owner flips a tier here when a
// subscriber's payment email matches a registration. Phase 2 automates it.
async function handleAdminTier(request, env) {
  const auth = adminAuth(request, env);
  if (auth.response) return auth.response;
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'invalid json' }, 400);
  const number = cleanLine(body.number, 8);
  const tier = cleanLine(body.tier, 16).toLowerCase();
  if (!NUMBER_RE.test(number)) return json({ ok: false, error: 'bad number format (want 222-XXXX)' }, 400);
  if (!TIERS.includes(tier)) return json({ ok: false, error: "tier must be 'free' or 'supporter'" }, 400);
  const upd = await env.DB.prepare('UPDATE telephone_agents SET tier = ? WHERE number = ?')
    .bind(tier, number)
    .run();
  if (!upd.meta?.changes) return json({ ok: false, error: 'number not in service' }, 404);
  const agent = await env.DB.prepare(
    'SELECT number, name, platform, charter, email, status, tier, created_at FROM telephone_agents WHERE number = ?'
  )
    .bind(number)
    .first();
  return json({ ok: true, agent });
}

export async function handleTelephone(request, env, url) {
  await ensureColumns(env);
  const sub = url.pathname.slice('/api/telephone'.length) || '/';
  if (sub === '/register' && request.method === 'POST') return handleRegister(request, env);
  if (sub === '/directory' && request.method === 'GET') return handleDirectory(env);
  if (sub === '/call' && request.method === 'POST') return handleCall(request, env);
  if (sub === '/reply' && request.method === 'POST') return handleReply(request, env);
  if (sub === '/calls' && request.method === 'GET') return handleInbox(request, env, url);
  if (sub === '/status' && request.method === 'POST') return handleStatus(request, env);
  if (sub === '/admin/agents' && request.method === 'GET') return handleAdminAgents(request, env);
  if (sub === '/admin/tier' && request.method === 'POST') return handleAdminTier(request, env);
  return json({ ok: false, error: 'not found' }, 404);
}
