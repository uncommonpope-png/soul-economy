// Worker-side REAL order check for Soul Economy book downloads.
// See ~/workspace/platform-program/order-check-spec.md (spec is the contract;
// this module is the implementation).
//
// Design in one paragraph: POST /api/order-check takes a Stripe checkout
// session id, asks Stripe (read-only) whether that session paid and which
// price it paid for, and mints a stateless HMAC-signed, pack-scoped,
// 30-day download token. NOTHING here can deny a download: every failure
// mode (no secret, Stripe down, lookup fails, bad input) answers with
// verified:false + fallback:true, and the page falls back to the existing
// soft gate exactly. No D1, no migration, no stored state.
//
// Public Stripe identifiers (NOT secrets — they are the products' public
// price ids, already visible in checkout URLs):
//   Complete Library $19 -> price_1UU98zDShQE8HQTtlMSvQqS6
//   Scorer Pack      $49 -> price_1UU996DShQE8HQTtKmc9jqBn
//
// Secrets (env vars, never in code):
//   STRIPE_SECRET_KEY     — already used by shop.mjs; read-only use here
//                           (a restricted key with checkout_sessions:read
//                           is sufficient and preferred).
//   DOWNLOAD_TOKEN_SECRET — optional signing secret for tokens. If unset,
//                           minting returns verified packs with token:null.

export const PACK_PRICES = {
  complete: 'price_1UU98zDShQE8HQTtlMSvQqS6',
  scorer: 'price_1UU996DShQE8HQTtKmc9jqBn',
};

export const PACK_ORDER = ['complete', 'scorer'];
export const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days, matches soft gate
export const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{8,}$/;

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

// Map a Stripe checkout session object to packs. Pure function — the unit
// under test. Returns { verified, packs }.
export function sessionToPacks(session) {
  if (!session || typeof session !== 'object') return { verified: false, packs: [] };
  if (session.payment_status !== 'paid') return { verified: false, packs: [] };
  const found = new Set();
  const items = session.line_items && Array.isArray(session.line_items.data)
    ? session.line_items.data
    : [];
  for (const item of items) {
    const priceId = item && item.price && item.price.id;
    for (const pack of PACK_ORDER) {
      if (priceId === PACK_PRICES[pack]) found.add(pack);
    }
  }
  // Paid but no known price: verified, but no pack claimed. The caller
  // falls back to the soft gate — never a denial, never a wrong pack.
  return { verified: true, packs: PACK_ORDER.filter((p) => found.has(p)) };
}

// ─── Token (stateless HMAC-SHA256, WebCrypto — works in Workers + Node) ───
function b64urlEncode(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  const b64 = typeof btoa === 'function'
    ? btoa(s)
    : Buffer.from(s, 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  if (typeof atob === 'function') {
    const bin = atob(padded);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  }
  return new Uint8Array(Buffer.from(padded, 'base64'));
}

async function hmacKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}

export async function mintToken(packs, sessionId, secret, nowSeconds) {
  if (!secret) return null;
  const now = nowSeconds || Math.floor(Date.now() / 1000);
  const payload = {
    v: 1,
    packs: PACK_ORDER.filter((p) => packs.includes(p)),
    exp: now + TOKEN_TTL_SECONDS,
    sid: String(sessionId || '').slice(0, 12),
  };
  const enc = new TextEncoder();
  const payloadPart = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadPart));
  return payloadPart + '.' + b64urlEncode(new Uint8Array(sig));
}

export async function verifyToken(token, secret, nowSeconds) {
  const fail = { verified: false, packs: [] };
  if (!token || !secret || typeof token !== 'string') return fail;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return fail;
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0])));
  } catch {
    return fail;
  }
  if (!payload || payload.v !== 1 || !Array.isArray(payload.packs)) return fail;
  if (!payload.packs.every((p) => PACK_ORDER.includes(p))) return fail;
  if (typeof payload.exp !== 'number') return fail;
  const now = nowSeconds || Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return fail;
  try {
    const key = await hmacKey(secret);
    const sig = b64urlDecode(parts[1]);
    const ok = await crypto.subtle.verify(
      'HMAC', key, sig, new TextEncoder().encode(parts[0])
    );
    if (!ok) return fail;
  } catch {
    return fail;
  }
  return { verified: true, packs: [...payload.packs], expires_at: payload.exp };
}

// ─── Stripe lookup (fetch injected for the harness) ─────────────────────────
async function fetchSession(sessionId, stripeSecret, fetchImpl) {
  const doFetch = fetchImpl || fetch;
  const url = 'https://api.stripe.com/v1/checkout/sessions/' +
    encodeURIComponent(sessionId) + '?expand[]=line_items.data.price';
  const res = await doFetch(url, {
    headers: { Authorization: 'Bearer ' + stripeSecret },
  });
  if (!res || !res.ok) return { error: 'session_lookup_failed' };
  let body;
  try {
    body = await res.json();
  } catch {
    return { error: 'session_lookup_failed' };
  }
  return { session: body };
}

// POST /api/order-check — the handler wired into the router.
export async function handleOrderCheck(request, env, fetchImpl) {
  let body;
  try {
    body = await request.json();
  } catch {
    // Malformed request: client treats 400 exactly like fallback.
    return json({ ok: false, error: 'invalid json', fallback: true }, 400);
  }
  const sessionId = String((body && body.session_id) || '').slice(0, 200);
  if (!SESSION_ID_RE.test(sessionId)) {
    return json({ ok: false, error: 'invalid session_id', fallback: true }, 400);
  }
  if (!env.STRIPE_SECRET_KEY) {
    return json({ ok: true, verified: false, packs: [], fallback: true, reason: 'stripe_not_configured' });
  }
  let lookup;
  try {
    lookup = await fetchSession(sessionId, env.STRIPE_SECRET_KEY, fetchImpl);
  } catch {
    lookup = { error: 'stripe_unreachable' };
  }
  if (lookup.error) {
    // HARD RULE: lookup failure is fallback, never denial. HTTP 200.
    return json({ ok: true, verified: false, packs: [], fallback: true, reason: lookup.error });
  }
  const { verified, packs } = sessionToPacks(lookup.session);
  if (!verified) return json({ ok: true, verified: false, packs: [] });
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + TOKEN_TTL_SECONDS;
  const token = await mintToken(packs, sessionId, env.DOWNLOAD_TOKEN_SECRET, now);
  return json({
    ok: true,
    verified: true,
    packs,
    token,
    token_issued: token !== null,
    ...(token === null ? { reason: 'token_secret_not_configured' } : {}),
    expires_at: expiresAt,
  });
}

// POST /api/order-check/verify — token check for future server-side use.
export async function handleOrderCheckVerify(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: true, verified: false, packs: [] });
  }
  const token = String((body && body.token) || '');
  if (!env.DOWNLOAD_TOKEN_SECRET) {
    return json({ ok: true, verified: false, packs: [], fallback: true, reason: 'token_secret_not_configured' });
  }
  const v = await verifyToken(token, env.DOWNLOAD_TOKEN_SECRET);
  if (!v.verified) return json({ ok: true, verified: false, packs: [] });
  return json({ ok: true, verified: true, packs: v.packs, expires_at: v.expires_at });
}
