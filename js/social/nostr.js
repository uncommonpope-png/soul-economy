// Nostr layer — identity signing + relay publishing/fallback reads.
import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  nip19,
  SimplePool,
} from 'https://esm.sh/nostr-tools@2.10.4';

export const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://relay.snort.social',
  'wss://relay.nostr.band',
];

export const WRITE_RELAYS = RELAYS.slice(0, 4);

const pool = new SimplePool();

export function bytesToHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export function hexToBytes(hex) {
  const h = hex.trim().replace(/^0x/, '');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}

export { generateSecretKey, getPublicKey, finalizeEvent, nip19, SimplePool };

export function newIdentity() {
  const sk = generateSecretKey();
  const hex = bytesToHex(sk);
  return { hex, pk: getPublicKey(sk), nsec: nip19.nsecEncode(sk) };
}

export function signWithHex(template, skHex) {
  return finalizeEvent({ ...template }, hexToBytes(skHex));
}

// Fire-and-forget publish — the DB is authoritative, relays are the soul's memory.
export function publishToRelays(event) {
  try {
    const p = pool.publish(WRITE_RELAYS, event);
    Promise.any
      ? Promise.any(p).catch(() => {})
      : Promise.all(p.map((x) => x.catch(() => {})));
    return true;
  } catch (e) {
    console.warn('[soul] relay publish failed', e);
    return false;
  }
}

// Fallback read path when the API is unreachable.
export async function relayFeed({ limit = 20, before = 0, authors = null } = {}) {
  const filter = { kinds: [1], limit };
  filter['#t'] = ['soul-economy'];
  if (before > 0) filter.until = before;
  if (authors && authors.length) filter.authors = authors;
  try {
    const events = await pool.querySync(RELAYS, filter, { maxWait: 4000 });
    return events
      .filter((e) => !before || e.created_at < before)
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, limit);
  } catch (e) {
    console.warn('[soul] relay fallback failed', e);
    return [];
  }
}

export async function relayProfile(pk) {
  try {
    const ev = await pool.querySync(RELAYS, { kinds: [0], authors: [pk], limit: 1 }, { maxWait: 3500 });
    if (!ev.length) return null;
    return JSON.parse(ev[0].content);
  } catch {
    return null;
  }
}
