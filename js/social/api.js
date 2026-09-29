// API client for the Soul Economy worker. Graceful: every call times out fast
// so the UI can fall back to direct relay reads.
// Same-origin when served by the unified soul-economy worker; falls back to the
// legacy API worker on static hosts (GitHub Pages mirror) and local dev.
const LEGACY = 'https://soul-economy-api.uncommonpope.workers.dev';
const LOCAL = ['localhost', '127.0.0.1', ''].includes(location.hostname);
export let API = LOCAL ? LEGACY : '';

export async function initBase() {
  if (LOCAL) return API;
  try {
    const r = await fetch('/api/health', { method: 'GET' });
    if (r.ok) { API = ''; return API; }
  } catch (e) { /* fall through */ }
  API = LEGACY;
  return API;
}

async function request(path, { method = 'GET', body = null, timeout = 7000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(API + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(t);
  }
}

export function health() {
  return request('/api/health', { timeout: 5000 });
}
export function feed({ scope = 'global', me = '', limit = 20, before = 0, soul = '' } = {}) {
  const q = new URLSearchParams({ scope, limit: String(limit) });
  if (me) q.set('me', me);
  if (before) q.set('before', String(before));
  if (soul) q.set('soul', soul);
  return request(`/api/feed?${q}`);
}
export function thread(id) {
  return request(`/api/thread?id=${encodeURIComponent(id)}`);
}
export function profile(pubkey, me = '') {
  const q = `?pubkey=${encodeURIComponent(pubkey)}${me ? `&me=${encodeURIComponent(me)}` : ''}`;
  return request(`/api/profile${q}`);
}
export function notify(me) {
  return request(`/api/notify?me=${encodeURIComponent(me)}`);
}
export function follows(pubkey) {
  return request(`/api/follows?pubkey=${encodeURIComponent(pubkey)}`);
}
export function notifyRead(ids, authEvent) {
  return request('/api/notify/read', { method: 'POST', body: { ids, auth: authEvent } });
}
export function postEvent(event) {
  return request('/api/events', { method: 'POST', body: event, timeout: 9000 });
}
export function search(q) {
  return request(`/api/search?q=${encodeURIComponent(q)}`);
}
