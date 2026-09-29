// Soul key lifecycle — the user's keypair IS their identity (Nostr-native).
// Local key in localStorage (portable via nsec export) OR NIP-07 extension.
import { newIdentity, signWithHex, nip19, hexToBytes, getPublicKey } from './nostr.js';

const LS_KEY = 'soulKey';

export function getKeyHex() {
  try {
    return localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}

export function getPubkey() {
  const hex = getKeyHex();
  if (hex) {
    try {
      return getPublicKey(hexToBytes(hex));
    } catch {
      return null;
    }
  }
  if (typeof window !== 'undefined' && window.nostr && window.nostr.getPublicKey) {
    try {
      return window.nostr.getPublicKey();
    } catch {
      return null;
    }
  }
  return null;
}

export function hasIdentity() {
  return !!getPubkey();
}

export function createIdentity(name) {
  const id = newIdentity();
  localStorage.setItem(LS_KEY, id.hex);
  id.name = name;
  return id;
}

export function importNsec(nsec) {
  const dec = nip19.decode(nsec.trim());
  if (!dec || dec.type !== 'nsec' || !dec.data) throw new Error('not a valid soul key (nsec)');
  const hex = [...dec.data].map((b) => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(LS_KEY, hex);
  return { hex, pk: getPublicKey(dec.data) };
}

export function exportNsec() {
  const hex = getKeyHex();
  if (!hex) return null;
  return nip19.nsecEncode(hexToBytes(hex));
}

export function clearIdentity() {
  localStorage.removeItem(LS_KEY);
}

// Signs a template event. Prefers the local key, falls back to NIP-07 extension.
export async function signEvent(template) {
  const hex = getKeyHex();
  const base = { created_at: Math.floor(Date.now() / 1000), ...template };
  if (hex) return signWithHex(base, hex);
  if (typeof window !== 'undefined' && window.nostr && window.nostr.signEvent) {
    return await window.nostr.signEvent(base);
  }
  throw new Error('no soul key');
}
