// Threaded replies — pure helpers (no DOM). Shared by js/social/feed.js.
// A reply is a kind-1 Nostr event whose linkage is its `e` tags; the Worker
// already derives D1 posts.root_id / posts.parent_id from those tags, so
// this module needs no server change and no migration. See
// ~/workspace/platform-program/threaded-replies-spec.md for the full spec.

export const MAX_THREAD_DEPTH = 4;

// Same shape as feed.js isValidSoulSlug: lowercase slug, 1-80 chars.
export function isThreadSoulSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9][a-z0-9-]{1,80}$/.test(slug);
}

// replyTags(rootId, parent, soulSlug?) → Nostr tags for a reply.
// parent: { id, pubkey } — the post being directly answered. When replying
// to a top-level post, rootId === parent.id and both markers carry the same
// id (byte-compatible with every reply posted before threading).
// soulSlug: optional, dropped when invalid — never posted raw.
export function replyTags(rootId, parent, soulSlug) {
  const root = String(rootId || (parent && parent.id) || '');
  const pid = String((parent && parent.id) || root);
  const tags = [];
  if (root) tags.push(['e', root, '', 'root']);
  if (pid) tags.push(['e', pid, '', 'reply']);
  if (parent && parent.pubkey) tags.push(['p', parent.pubkey]);
  tags.push(['t', 'soul-economy']);
  if (isThreadSoulSlug(soulSlug)) tags.push(['soul', soulSlug]);
  return tags;
}

// replyToOf(post) → { rootId, parentId } | { rootId: null, parentId: null }.
// Server posts: prefer the D1 row fields. Relay events (or any post without
// row fields): parse e tags — marker 'reply' → parent, 'root' → root;
// unmarked fallback mirrors the Worker: first e → root, last e → parent.
// No e tags → a top-level post (both null). Never throws.
export function replyToOf(post) {
  try {
    if (!post || typeof post !== 'object') return { rootId: null, parentId: null };
    const rowRoot = post.root_id || null;
    const rowParent = post.parent_id || null;
    if (rowRoot || rowParent) {
      return { rootId: rowRoot || rowParent, parentId: rowParent || rowRoot };
    }
    const tags = Array.isArray(post.tags) ? post.tags : [];
    const eTags = tags.filter((t) => Array.isArray(t) && t[0] === 'e' && t[1]);
    if (!eTags.length) return { rootId: null, parentId: null };
    const marked = (m) => {
      const t = eTags.find((x) => x[3] === m);
      return t ? t[1] : null;
    };
    const root = marked('root') || eTags[0][1];
    const parent = marked('reply') || eTags[eTags.length - 1][1];
    return { rootId: root, parentId: parent };
  } catch {
    return { rootId: null, parentId: null };
  }
}

// buildThreadTree(rootId, rows) → [{ post, children, depth }].
// Siblings sort by created_at ASC (id tiebreak). Depth is capped at
// MAX_THREAD_DEPTH: deeper nodes flatten to the cap, never dropped.
// FAIL-OPEN orphan rule: a row whose parent_id names no row in the set and
// is not the root attaches at depth 1 under the thread root — rendered as
// a normal reply, never an error, never dropped. Rows equal to the root
// itself are skipped (handleThread echoes the root row). Never throws:
// on any surprise input it returns the rows flat at depth 1.
export function buildThreadTree(rootId, rows) {
  try {
    const list = (Array.isArray(rows) ? rows : []).filter(
      (r) => r && r.id != null && String(r.id) !== String(rootId),
    );
    const byId = new Map();
    for (const r of list) if (!byId.has(String(r.id))) byId.set(String(r.id), r);
    const kids = new Map(); // parentKey -> rows
    const top = [];
    for (const r of list) {
      const link = replyToOf(r);
      const parentKey = link.parentId != null ? String(link.parentId) : null;
      if (parentKey && parentKey !== String(rootId) && byId.has(parentKey)) {
        if (!kids.has(parentKey)) kids.set(parentKey, []);
        kids.get(parentKey).push(r);
      } else {
        // Direct reply to root, or orphan (unknown parent) → depth 1.
        top.push(r);
      }
    }
    const byTime = (a, b) =>
      Number(a.created_at || 0) - Number(b.created_at || 0) ||
      String(a.id).localeCompare(String(b.id));
    top.sort(byTime);
    const build = (row, depth) => {
      const node = { post: row, children: [], depth };
      const mine = (kids.get(String(row.id)) || []).slice().sort(byTime);
      for (const c of mine) {
        node.children.push(build(c, Math.min(depth + 1, MAX_THREAD_DEPTH)));
      }
      return node;
    };
    return top.map((r) => build(r, 1));
  } catch {
    return (Array.isArray(rows) ? rows : [])
      .filter((r) => r && r.id != null && String(r.id) !== String(rootId))
      .map((r) => ({ post: r, children: [], depth: 1 }));
  }
}

// flattenThread(nodes) → rows in display order (parent before children).
// Used by the flat-fallback path and by tests.
export function flattenThread(nodes) {
  const out = [];
  const walk = (ns) => {
    for (const n of ns || []) {
      out.push(n.post);
      walk(n.children);
    }
  };
  walk(nodes);
  return out;
}
