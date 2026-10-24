# Giscus setup — Soul Economy comments (Rank 3, ready-but-blocked)

Status as of 2026-10-24 (verified via GitHub API): the repo
`uncommonpope-png/soul-economy` is public on `master`, but **Discussions
is DISABLED**. Until the taps below are done, every giscus surface shows
an honest fallback, never a fake thread:

- Soul cards (`index.html`, `mountGiscus`): a "Start / View Discussion"
  link. That link itself 404s until Step 1 is done.
- Profile pages (`profile.html`, `#upcGiscus`): the same link + a
  "Threads unlock…" note.
- `chat.html`'s Discussions card links to the same disabled tab.

## The owner's taps (in order)

1. **Enable Discussions.** Repo → Settings → General → Features →
   check **Discussions**. (No code change; the fallback links start
   working the moment this is on.)
2. **Install the giscus app.** Open https://github.com/apps/giscus →
   Install → select `uncommonpope-png/soul-economy` only. This is the
   tap no agent can do for you.
3. **Pick a category.** On https://giscus.app, enter repo
   `uncommonpope-png/soul-economy`, choose a discussion category
   (create `General` if none exists), and copy the two values the page
   shows: `data-repo-id` and `data-category-id`.
4. **Paste the IDs in TWO places** (both are one-line config blocks):
   - `index.html`, the `window.GISCUS={...}` block (near the chat
     panel): fill `repoId` and `categoryId`, leave `repo` and
     `category` as they are.
   - `profile.html`, just above the `GISCUS-PROFILE` script at the end
     of the file, add one line:
     `<script>window.GISCUS_PROFILE={repo:'uncommonpope-png/soul-economy',category:'General',repoId:'PASTE',categoryId:'PASTE'};</script>`
5. **Push and verify (Rule Zero).** Open a soul card → its thread
   loads under the card. Open a profile → its `profile:<handle>`
   thread loads. If either shows a giscus error, the IDs or the
   category are wrong — re-copy them from giscus.app, never guess.

## What is already built (no tap needed)

- `index.html` `mountGiscus(card)`: one thread per soul, mapped by
  `data-term` = card name; injects `client.js` only when both IDs are
  present, otherwise renders the fallback link.
- `profile.html` `#upcGiscus`: one thread per sanctuary, mapped by
  `data-term` = `profile:<handle>`; same gate, same fallback.
- Nothing here costs money. Giscus runs entirely on GitHub
  Discussions (free).
