// Soul-Trading v1 — pure helpers (no DOM). Spec:
// ~/workspace/platform-program/soul-trading-spec.md
// Artifact type: buyasoul-trade-artifact. It travels as ONE marker line
// inside a signed kind-1 Square post (Worker content cap is 4000 chars,
// and D1 posts do not return raw tags, so content is the only channel
// that survives verbatim):
//   ◈TRADE <base64url of the artifact JSON>
// Binding, two layers:
//  (1) The enclosing kind-1 event is signature-verified server-side, and
//      the artifact's author_pubkey must equal the event's pubkey.
//  (2) Detached signature: at package time the author signs a
//      notarization event (kind 1, tag ['t','trade-sig'], content
//      'TRADE-SIG ' + artifact-hash) with the EXISTING signEvent
//      primitive (local key or NIP-07). artifact.sig holds that event's
//      hex signature and sig_created_at its created_at, so anyone can
//      reconstruct the event and verify the signature without the post.
//      When signing is unavailable/refused, sig stays empty and the card
//      falls back to layer (1) — it never fakes a signature.

export const TRADE_MARKER_PREFIX = '◈TRADE ';
export const TRADE_TYPE = 'buyasoul-trade-artifact';
export const TRADE_VERSION = 1;
// Package-time marker budget: leaves room for post text under the
// Worker's 4000-char content cap (submitPost enforces the total too).
export const MARKER_BUDGET = 3400;
export const MAX_CONTENT = 4000;
export const MAX_TIP_LEN = 500;
export const MAX_TITLE_LEN = 80;
export const MAX_AUTHOR_LEN = 80;
export const NOTAR_TAG = 'trade-sig';
export const NOTAR_CONTENT_PREFIX = 'TRADE-SIG ';

export function slugifyTradeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function isValidTradeSlug(slug) {
  return (
    typeof slug === 'string' &&
    slug.length >= 1 &&
    slug.length <= 80 &&
    /^[a-z0-9][a-z0-9-]*$/.test(slug)
  );
}

export function isValidTipUrl(tip) {
  if (tip === '' || tip === null || tip === undefined) return true;
  if (typeof tip !== 'string' || tip.length > MAX_TIP_LEN) return false;
  try {
    const u = new URL(tip);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

// Scores are seller claims in 0..1, stored rounded to 2 decimals.
export function clampScore(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 1) return null;
  return Math.round(n * 100) / 100;
}

// True Value = Profit + Love − Tax, always recomputed, never trusted.
export function trueValue(p, l, t) {
  return Math.round((p + l - t) * 100) / 100;
}

export function formatPlt(p, l, t) {
  const f = (x) => (Math.round(x * 100) / 100).toString();
  return `${f(p)}/${f(l)}/${f(t)}`;
}

export function isHex64(s) {
  return typeof s === 'string' && /^[0-9a-f]{64}$/.test(s);
}
export function isHex128(s) {
  return typeof s === 'string' && /^[0-9a-f]{128}$/.test(s);
}

async function sha256Hex(text) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (subtle) {
    const data = new TextEncoder().encode(text);
    const digest = await subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  const nc = await import('node:crypto');
  return nc.createHash('sha256').update(text, 'utf8').digest('hex');
}

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 =
    typeof btoa === 'function'
      ? btoa(bin)
      : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlDecode(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin =
    typeof atob === 'function'
      ? atob(b64 + pad)
      : Buffer.from(b64 + pad, 'base64').toString('binary');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// Canonical artifact for hashing: fixed field order, sig fields removed.
// Verification rebuilds this exact shape, so key order in a foreign file
// cannot break the hash.
export function canonicalArtifact(a) {
  const s = (a && a.soul) || {};
  const ps = (s.plt_score) || {};
  const tr = (a && a.trade) || {};
  return {
    type: TRADE_TYPE,
    v: TRADE_VERSION,
    author_pubkey: a.author_pubkey,
    created_at: a.created_at,
    slug: a.slug,
    soul: {
      title: s.title,
      author: s.author,
      plt_score: { p: ps.p, l: ps.l, t: ps.t },
      soul_md: s.soul_md,
      seshat_json: s.seshat_json,
    },
    trade: {
      stripe_tip_url: tr.stripe_tip_url,
      plt_valuation: tr.plt_valuation,
    },
    soul_md_sha256: a.soul_md_sha256,
    seshat_sha256: a.seshat_sha256,
    soul_md_held: a.soul_md_held,
    seshat_held: a.seshat_held,
  };
}

export async function artifactHash(artifact) {
  return sha256Hex(JSON.stringify(canonicalArtifact(artifact)));
}

export function notarizationContent(hash) {
  return NOTAR_CONTENT_PREFIX + hash;
}

export function notarizationTemplate(authorPubkey, createdAt, hash) {
  return {
    kind: 1,
    pubkey: authorPubkey,
    created_at: createdAt,
    tags: [[NOTAR_TAG]],
    content: notarizationContent(hash),
  };
}

// Rebuild the notarization event parts for verification. Returns null
// when the artifact carries no signature.
export async function notarizationParts(artifact) {
  if (!artifact || !artifact.sig || !artifact.sig_created_at) return null;
  const hash = await artifactHash(artifact);
  return {
    template: notarizationTemplate(artifact.author_pubkey, artifact.sig_created_at, hash),
    sig: artifact.sig,
  };
}

// Build a trade artifact. soulMd is text ("" when none); seshatObj is a
// parsed JSON object (null when none). authorPubkey is "" at draft time
// and filled by the composer (package requires sign-in, so it is set).
// Embedding budget: both parts embedded when the marker fits MARKER_BUDGET;
// otherwise seshat drops to held first (the soul itself is the product),
// then soul_md. Returns { artifact, marker, modes }.
export async function buildArtifact({
  title, author, p, l, t, tip, soulMd, seshatObj, authorPubkey, createdAt,
}) {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle || cleanTitle.length > MAX_TITLE_LEN) {
    throw new Error('soul title must be 1–80 chars');
  }
  const slug = slugifyTradeName(cleanTitle);
  if (!isValidTradeSlug(slug)) {
    throw new Error('soul title must slugify to letters, numbers, or dashes');
  }
  const cleanAuthor = String(author || '').trim().slice(0, MAX_AUTHOR_LEN);
  const cp = clampScore(p);
  const cl = clampScore(l);
  const ct = clampScore(t);
  if (cp === null || cl === null || ct === null) {
    throw new Error('P, L, and T must each be numbers from 0 to 1');
  }
  const cleanTip = String(tip || '').trim();
  if (!isValidTipUrl(cleanTip)) {
    throw new Error('tip link must be an https URL (or empty)');
  }
  const md = soulMd ? String(soulMd) : '';
  if (seshatObj !== null && seshatObj !== undefined && (typeof seshatObj !== 'object' || Array.isArray(seshatObj))) {
    throw new Error('seshat must be a JSON object');
  }
  const soulHash = md ? await sha256Hex(md) : null;
  const seshatHash = seshatObj ? await sha256Hex(JSON.stringify(seshatObj)) : null;
  const artifact = {
    type: TRADE_TYPE,
    v: TRADE_VERSION,
    author_pubkey: authorPubkey || '',
    created_at: createdAt || Math.floor(Date.now() / 1000),
    slug,
    soul: {
      title: cleanTitle,
      author: cleanAuthor,
      plt_score: { p: cp, l: cl, t: ct },
      soul_md: md || null,
      seshat_json: seshatObj || null,
    },
    trade: {
      stripe_tip_url: cleanTip,
      plt_valuation: trueValue(cp, cl, ct),
    },
    sig: '',
    sig_created_at: 0,
    soul_md_sha256: soulHash,
    seshat_sha256: seshatHash,
    soul_md_held: false,
    seshat_held: false,
  };
  let marker = encodeMarker(artifact);
  const modes = { soulMd: md ? 'embedded' : 'none', seshat: seshatObj ? 'embedded' : 'none' };
  if (marker.length > MARKER_BUDGET && artifact.soul.seshat_json) {
    artifact.soul.seshat_json = null;
    artifact.seshat_held = true;
    modes.seshat = 'held';
    marker = encodeMarker(artifact);
  }
  if (marker.length > MARKER_BUDGET && artifact.soul.soul_md) {
    artifact.soul.soul_md = null;
    artifact.soul_md_held = true;
    modes.soulMd = 'held';
    marker = encodeMarker(artifact);
  }
  return { artifact, marker, modes };
}

// Structural validation (draft-tolerant: author_pubkey may be "" before
// publish; render verification tightens it). Returns error strings.
export function validateArtifact(a) {
  const errs = [];
  if (!a || typeof a !== 'object') return ['artifact is not an object'];
  if (a.type !== TRADE_TYPE) errs.push(`unknown trade type ${a.type}`);
  if (a.v !== TRADE_VERSION) errs.push(`unsupported trade version ${a.v}`);
  if (a.author_pubkey !== '' && !isHex64(a.author_pubkey)) {
    errs.push('author_pubkey is invalid');
  }
  if (typeof a.created_at !== 'number' || a.created_at < 0) {
    errs.push('created_at is invalid');
  }
  if (!isValidTradeSlug(a.slug)) errs.push('slug is invalid');
  const s = a.soul || {};
  if (typeof s.title !== 'string' || !s.title.trim() || s.title.length > MAX_TITLE_LEN) {
    errs.push('soul title must be 1–80 chars');
  } else if (slugifyTradeName(s.title) !== a.slug) {
    errs.push('slug does not match soul title');
  }
  if (typeof s.author !== 'string' || s.author.length > MAX_AUTHOR_LEN) {
    errs.push('soul author is invalid');
  }
  const ps = s.plt_score || {};
  for (const k of ['p', 'l', 't']) {
    if (typeof ps[k] !== 'number' || ps[k] < 0 || ps[k] > 1) {
      errs.push(`plt_score.${k} must be a number from 0 to 1`);
    }
  }
  if (typeof ps.p === 'number' && typeof ps.l === 'number' && typeof ps.t === 'number') {
    if ((a.trade || {}).plt_valuation !== trueValue(ps.p, ps.l, ps.t)) {
      errs.push('plt_valuation does not match P + L − T');
    }
  }
  if (!isValidTipUrl((a.trade || {}).stripe_tip_url || '')) {
    errs.push('tip link must be an https URL (or empty)');
  }
  if (a.sig !== '' && !isHex128(a.sig)) errs.push('sig is invalid');
  if (typeof a.sig_created_at !== 'number' || a.sig_created_at < 0) {
    errs.push('sig_created_at is invalid');
  }
  if (a.soul_md_sha256 !== null && !isHex64(a.soul_md_sha256)) {
    errs.push('soul_md hash is invalid');
  }
  if (a.seshat_sha256 !== null && !isHex64(a.seshat_sha256)) {
    errs.push('seshat hash is invalid');
  }
  if (s.soul_md !== null && typeof s.soul_md !== 'string') {
    errs.push('soul_md must be text or null');
  }
  if (s.seshat_json !== null && (typeof s.seshat_json !== 'object' || Array.isArray(s.seshat_json))) {
    errs.push('seshat_json must be an object or null');
  }
  return errs;
}

// Render-time verification: structural validation PLUS pubkey binding to
// the enclosing event. Crypto (notarization signature) is checked
// separately by the caller, which owns the event-verification primitive.
export function verifyTradeArtifact(artifact, eventPubkey) {
  const errors = validateArtifact(artifact);
  if (!isHex64(artifact && artifact.author_pubkey)) {
    errors.push('author_pubkey is invalid');
  } else if (artifact.author_pubkey !== eventPubkey) {
    errors.push('author_pubkey does not match the posting key');
  }
  return { ok: errors.length === 0, errors };
}

export function encodeMarker(artifact) {
  return TRADE_MARKER_PREFIX + b64urlEncode(JSON.stringify(artifact));
}

export function decodeMarker(line) {
  try {
    const b64 = line.slice(TRADE_MARKER_PREFIX.length).trim();
    if (!b64) return null;
    const obj = JSON.parse(b64urlDecode(b64));
    return obj && typeof obj === 'object' ? obj : null;
  } catch {
    return null;
  }
}

// Split post content into { text, artifact, markerFound }. The marker must
// be its own line; only the first marker line is consumed.
export function extractTradeMarker(content) {
  const text = String(content || '');
  const lines = text.split('\n');
  const idx = lines.findIndex((ln) => ln.startsWith(TRADE_MARKER_PREFIX));
  if (idx === -1) return { text, artifact: null, markerFound: false };
  const artifact = decodeMarker(lines[idx]);
  const rest = [...lines.slice(0, idx), ...lines.slice(idx + 1)];
  const out = rest.join('\n').replace(/\n+$/, '');
  return { text: out, artifact, markerFound: true };
}

export function stripTradeMarker(content) {
  return extractTradeMarker(content).text;
}

// Recompute embedded-content hashes for a download-time check. Held parts
// are skipped (their content is not in the post). Returns false on any
// embedded mismatch.
export async function contentHashesMatch(artifact) {
  const s = (artifact && artifact.soul) || {};
  if (s.soul_md !== null && s.soul_md !== undefined) {
    if (!artifact.soul_md_sha256) return false;
    if ((await sha256Hex(s.soul_md)) !== artifact.soul_md_sha256) return false;
  }
  if (s.seshat_json !== null && s.seshat_json !== undefined) {
    if (!artifact.seshat_sha256) return false;
    if ((await sha256Hex(JSON.stringify(s.seshat_json))) !== artifact.seshat_sha256) return false;
  }
  return true;
}

// Do the hashes in a full artifact (e.g. a seller-shared .trade.json)
// match the hashes committed in the posted artifact? Used before merging
// held parts on Claim. Strict: a posted null hash with full content
// present is a mismatch (that content was not part of the posted trade).
export async function hashesMatch(posted, full) {
  const ps = (posted && posted.soul) || {};
  const fs = (full && full.soul) || {};
  if (posted.soul_md_sha256) {
    if (!fs.soul_md) return false;
    if ((await sha256Hex(fs.soul_md)) !== posted.soul_md_sha256) return false;
  } else if (fs.soul_md) {
    return false;
  }
  if (posted.seshat_sha256) {
    if (!fs.seshat_json) return false;
    if ((await sha256Hex(JSON.stringify(fs.seshat_json))) !== posted.seshat_sha256) return false;
  } else if (fs.seshat_json) {
    return false;
  }
  return true;
}

// Full-content copy for the seller's out-of-band share: same metadata as
// the posted artifact, but with the held parts filled in from the panel
// and fresh hashes. The detached signature is CLEARED here on purpose —
// it covered the artifact exactly as posted; a buyer hash-gates this file
// against the posted artifact (hashesMatch) instead of re-verifying it.
export async function fullContentCopy(draft, soulMd, seshatObj) {
  const md = soulMd ? String(soulMd) : '';
  const copy = {
    ...draft,
    soul: {
      ...(draft.soul || {}),
      soul_md: md || null,
      seshat_json: seshatObj || null,
    },
    sig: '',
    sig_created_at: 0,
    soul_md_sha256: md ? await sha256Hex(md) : null,
    seshat_sha256: seshatObj ? await sha256Hex(JSON.stringify(seshatObj)) : null,
    soul_md_held: false,
    seshat_held: false,
  };
  return copy;
}

// Pure record for a Sanctuary claim (storage itself lives in feed.js).
export function claimRecord(artifact, post, nowSec) {
  const s = artifact.soul || {};
  const ps = s.plt_score || {};
  return {
    type: TRADE_TYPE,
    slug: artifact.slug,
    title: s.title,
    author: s.author,
    author_pubkey: artifact.author_pubkey,
    plt_score: { p: ps.p, l: ps.l, t: ps.t },
    plt_valuation: (artifact.trade || {}).plt_valuation,
    soul_md: s.soul_md,
    seshat_json: s.seshat_json,
    tip: (artifact.trade || {}).stripe_tip_url || '',
    claimed_at: nowSec || Math.floor(Date.now() / 1000),
    from_post: post ? post.id : '',
  };
}
