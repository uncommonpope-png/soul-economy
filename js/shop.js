/* Soul Economy Shop — pay-what-you-want + free option.
   Additive module. Owns: per-card Buy buttons, cart, Stripe checkout,
   free minting, license delivery, `?shop=thanks&order=` polling. */
(function () {
  'use strict';
  const API_BASE =
    location.hostname === 'soul-economy.uncommonpope.workers.dev'
      ? ''
      : 'https://soul-economy.uncommonpope.workers.dev';
  const CART_KEY = 'soulCartV1';
  const HOME =
    location.origin + location.pathname.replace(/\/p\/[^/]+\.html$/, '/index.html').replace(/\/$/, '/index.html');

  let productsMap = null;
  let productsAt = 0;
  const PRODUCT_TTL = 5 * 60 * 1000;
  let cart = loadCart();

  function slugify(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }
  function money(cents) {
    return '$' + ((cents || 0) / 100).toFixed(2);
  }
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || { items: [] }; }
    catch (e) { return { items: [] }; }
  }
  function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateBadge(); }
  function cartQty() { return cart.items.reduce((n, i) => n + i.qty, 0); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function injectStyle() {
    if (document.getElementById('shop-style')) return;
    const st = document.createElement('style');
    st.id = 'shop-style';
    st.textContent = `
.shop-buy{display:inline-block;margin-left:auto;padding:7px 16px;font-size:0.72rem;font-weight:700;letter-spacing:.04em;color:#fff;border:1px solid rgba(255,209,102,.45);border-radius:30px;background:linear-gradient(135deg,rgba(255,209,102,.16),rgba(0,212,255,.12));cursor:pointer;transition:.3s cubic-bezier(.22,1,.36,1)}
.shop-buy:hover{border-color:#FFD166;box-shadow:0 0 22px rgba(255,209,102,.28);transform:translateY(-1px)}
.shop-free{margin-left:8px;padding:7px 10px;font-size:.7rem;font-weight:600;color:#34d399;border:1px solid rgba(52,211,153,.35);border-radius:30px;background:rgba(52,211,153,.06);cursor:pointer;transition:.3s}
.shop-free:hover{border-color:#34d399;box-shadow:0 0 16px rgba(52,211,153,.2)}
#shopCartBtn{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;font-size:.85rem;font-weight:600;color:#FFD166;border:1px solid rgba(255,209,102,.35);border-radius:30px;background:rgba(255,209,102,.05);cursor:pointer;transition:.3s;position:relative;z-index:1}
#shopCartBtn:hover{border-color:#FFD166;box-shadow:0 0 24px rgba(255,209,102,.25)}
#shopCartCount{min-width:18px;height:18px;padding:0 5px;border-radius:20px;background:linear-gradient(135deg,#FF6B9D,#8B5CF6);color:#fff;font-size:.68rem;font-weight:800;display:inline-flex;align-items:center;justify-content:center}
.shop-modal{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background:rgba(4,4,8,.72);backdrop-filter:blur(6px);padding:20px;font-family:'Inter',system-ui,sans-serif}
.shop-modal.open{display:flex}
.shop-panel{width:min(560px,100%);max-height:86vh;overflow:auto;background:linear-gradient(160deg,#12121a,#0a0a10);border:1px solid rgba(255,209,102,.22);border-radius:20px;padding:24px;color:#fff;box-shadow:0 18px 80px rgba(0,0,0,.7)}
.shop-panel h3{margin:0 0 4px;font-size:1.15rem;letter-spacing:.02em;background:linear-gradient(135deg,#FFD166,#00D4FF);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.shop-panel .sub{color:#9a9aa8;font-size:.78rem;margin-bottom:16px}
.shop-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid rgba(255,255,255,.06);font-size:.85rem}
.shop-row .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#eee}
.shop-row input{width:88px;padding:7px 10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#FFD166;font-size:.85rem;text-align:right}
.shop-row .rm{background:none;border:none;color:#666;cursor:pointer;font-size:.85rem;padding:4px 6px}
.shop-row .rm:hover{color:#FF6B9D}
.shop-total{display:flex;justify-content:space-between;align-items:center;padding:14px 0 6px;border-top:1px solid rgba(255,255,255,.08);margin-top:6px;font-weight:700;font-size:1rem}
.shop-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.shop-actions button{flex:1;min-width:150px;padding:12px 16px;font-size:.85rem;font-weight:700;border-radius:30px;border:1px solid transparent;cursor:pointer;transition:.3s}
#payBtn{background:linear-gradient(135deg,#FFD166,#F59E0B);color:#0a0a0f}
#freeBtn{background:rgba(52,211,153,.1);border-color:rgba(52,211,153,.4);color:#34d399}
.shop-note{font-size:.72rem;color:#7d7d8c;text-align:center;margin-top:12px;line-height:1.6}
.shop-close{position:absolute;top:14px;right:18px;background:none;border:none;color:#888;font-size:1.4rem;cursor:pointer}
.shop-keys{font-family:ui-monospace,Consolas,monospace;font-size:.78rem;line-height:1.9}
.shop-key{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.06);border:1px solid rgba(0,212,255,.25);border-radius:10px;padding:8px 12px;margin:6px 0;color:#9be8ff}
.shop-key b{color:#fff;letter-spacing:.06em}
.shop-key button{margin-left:auto;background:rgba(0,212,255,.12);border:1px solid rgba(0,212,255,.3);color:#00D4FF;border-radius:8px;padding:4px 10px;font-size:.72rem;cursor:pointer}
.shop-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:100000;background:#17171f;border:1px solid rgba(255,209,102,.4);color:#FFD166;padding:11px 20px;border-radius:40px;font-size:.8rem;box-shadow:0 10px 40px rgba(0,0,0,.6);animation:shopIn .3s ease}
@keyframes shopIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`;
    document.head.appendChild(st);
  }

  function toast(msg, ms) {
    const t = document.createElement('div');
    t.className = 'shop-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms || 3800);
  }

  async function api(path, opts) {
    const r = await fetch(API_BASE + path, Object.assign({
      headers: { 'content-type': 'application/json' },
      mode: 'cors'
    }, opts));
    let j = null;
    try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error((j && (j.error || j.hint)) || ('http ' + r.status));
    return j;
  }

  async function getProducts() {
    if (productsMap && Date.now() - productsAt < PRODUCT_TTL) return productsMap;
    let rows = null;
    try {
      const j = await api('/api/v1/products');
      rows = j.data;
    } catch (e) {
      rows = fallbackProducts();
    }
    productsMap = new Map(rows.filter(Boolean).map(r => [r.slug, r]));
    productsAt = Date.now();
    return productsMap;
  }

  function fallbackProducts() {
    const row = [];
    const seed = window.items || [];
    for (let i = 0; i < seed.length; i++) {
      const it = seed[i];
      row.push({
        slug: slugify(it.name), name: it.name, type: it.type, icon: it.icon,
        image: it.image, desc: it.desc, details: it.details,
        suggested_cents: (it.suggested || (it.type === 'pack' || it.type === 'soul' ? 199 : 99)),
        min_cents: it.min || 0, download: it.download, contents: it.contents || []
      });
    }
    return row;
  }

  /* ---------- card enhancement ---------- */
  function enhanceCards() {
    document.querySelectorAll('#resourceGrid .card, .card[data-slug]').forEach(card => {
      if (card.querySelector('.shop-buy')) return;
      const nm = card.getAttribute('data-id') || (card.querySelector('.card-title') || {}).textContent || '';
      const slug = slugify(nm);
      if (!slug) return;
      const footer = card.querySelector('.card-footer');
      if (!footer) return;
      const buy = document.createElement('button');
      buy.type = 'button';
      buy.className = 'shop-buy';
      buy.textContent = '🛒 Add';
      buy.setAttribute('data-slug', slug);
      buy.setAttribute('aria-label', 'Add ' + nm + ' to cart');
      buy.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(slug, nm);
      });
      const fr = document.createElement('button');
      fr.type = 'button';
      fr.className = 'shop-free';
      fr.textContent = 'Free';
      fr.setAttribute('data-slug', slug);
      fr.setAttribute('aria-label', 'Get ' + nm + ' free');
      fr.addEventListener('click', (e) => {
        e.stopPropagation();
        mintFree([slug]);
      });
      footer.appendChild(fr);
      footer.appendChild(buy);
    });
  }

  function watchGrid() {
    if (document.getElementById('resourceGrid')) {
      const mo = new MutationObserver(() => enhanceCards());
      mo.observe(document.getElementById('resourceGrid'), { childList: true, subtree: true });
    }
    enhanceCards();
  }

  /* ---------- cart ---------- */
  function addToCart(slug, name) {
    getProducts().then(pmap => {
      const p = pmap.get(slug) || { name, suggested_cents: 99, min_cents: 0 };
      const found = cart.items.find(i => i.slug === slug);
      if (found) found.qty = Math.min((found.qty || 1) + 1, 20);
      else cart.items.push({ slug, name: p.name || name, qty: 1, cents: p.suggested_cents || 99 });
      saveCart();
      openCart();
      toast('✦ ' + (p.name || name) + ' joined your cart');
    }).catch(() => toast('Store is waking up — try again in a moment.'));
  }

  function updateBadge() {
    let b = document.getElementById('shopCartCount');
    const q = cartQty();
    if (q > 0) { if (b) b.textContent = q; }
    else if (b) b.remove();
  }

  /* ---------- UI shells ---------- */
  function modalShell(title, sub) {
    const wrap = document.createElement('div');
    wrap.className = 'shop-modal';
    wrap.innerHTML = `<div class="shop-panel"><button class="shop-close" aria-label="Close">✕</button>
      <h3>${esc(title)}</h3><div class="sub">${esc(sub)}</div><div class="shop-body"></div></div>`;
    wrap.querySelector('.shop-close').addEventListener('click', () => { wrap.remove(); });
    wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });
    document.body.appendChild(wrap);
    return { wrap, body: wrap.querySelector('.shop-body') };
  }

  function openCart() {
    const m = modalShell('Your Souls', 'Pay-what-you-want. Free is welcome — paying keeps the blood flowing.');
    const body = m.body;
    const render = () => {
      body.innerHTML = '';
      if (!cart.items.length) {
        body.innerHTML = '<p style="color:#9a9aa8;font-size:.85rem;text-align:center;padding:30px 0">Cart empty. Add a soul from the Library.</p>';
        return;
      }
      cart.items.forEach((it, idx) => {
        const row = document.createElement('div');
        row.className = 'shop-row';
        row.innerHTML = `<span class="nm">${esc(it.name)}</span>
          <input type="number" min="0" step="0.01" value="${(it.cents / 100).toFixed(2)}" aria-label="Amount">
          <button class="rm" aria-label="Remove">✕</button>`;
        const inp = row.querySelector('input');
        inp.addEventListener('change', () => {
          let v = parseFloat(inp.value);
          if (isNaN(v) || v < 0) v = 0;
          it.cents = Math.round(v * 100);
          if (v > 0 && v < 0.5) { it.cents = Math.max(it.cents, 50); } // Stripe min
          saveCart();
          render();
        });
        row.querySelector('.rm').addEventListener('click', () => {
          cart.items.splice(idx, 1);
          saveCart();
          render();
        });
        body.appendChild(row);
      });
      const total = cart.items.reduce((n, i) => n + i.cents * i.qty, 0);
      const t = document.createElement('div');
      t.className = 'shop-total';
      t.innerHTML = `<span>Total</span><span style="color:#00D4FF">${money(total)}</span>`;
      body.appendChild(t);
      const acts = document.createElement('div');
      acts.className = 'shop-actions';
      acts.innerHTML = `<button id="payBtn">Pay ${money(total)} with Card</button><button id="freeBtn">Get All Free</button>`;
      const payBtn = acts.querySelector('#payBtn');
      const freeBtn = acts.querySelector('#freeBtn');
      payBtn.addEventListener('click', () => checkoutCard(cart.items));
      freeBtn.addEventListener('click', () => checkoutFree(cart.items));
      body.appendChild(acts);
      const note = document.createElement('div');
      note.className = 'shop-note';
      note.innerHTML = 'Free = immediate. Card goes through Stripe (owned by nobody). Solana tipping arrives with Phase 2.';
      body.appendChild(note);
    };
    m.wrap.classList.add('open');
    render();
  }

  function checkoutCard(items) {
    const payload = {
      items: items.map(i => ({ slug: i.slug, qty: i.qty, cents: i.cents })),
      return_to: HOME
    };
    payBtnBusy(true);
    api('/api/v1/checkout', { method: 'POST', body: JSON.stringify(payload) })
      .then(j => {
        if (j.url) location.href = j.url;
        else toast('No checkout url yet — try again in a moment.');
      })
      .catch(e => {
        payBtnBusy(false);
        toast(e.message === 'zero_total' ? 'Nothing to pay — use Get Free.' : 'Store is waking up — retry in ~15s.');
      });
  }

  let _payBtnEl = null;
  function payBtnBusy(on) {
    const b = _payBtnEl || document.getElementById('payBtn');
    if (!b) return;
    if (on) { _payBtnEl = b; const o = b.textContent; b.textContent = 'Opening checkout…'; b.disabled = true; b._orig = o; }
    else { b.textContent = b._orig || 'Pay with Card'; b.disabled = false; }
  }

  function checkoutFree(items) {
    const slugs = items.map(i => i.slug);
    mintFree(slugs, () => { cart.items = []; saveCart(); });
  }

  function mintFree(slugs, done) {
    const m = modalShell('Awakening free', 'No card, no fees. The soul is yours.');
    m.wrap.classList.add('open');
    m.body.innerHTML = '<p style="color:#9a9aa8;font-size:.85rem">Minting your keys…</p>';
    const keys = [];
    const chain = slugs.reduce((acc, s) => acc.then(() =>
      api('/api/v1/mint-free', { method: 'POST', body: JSON.stringify({ slug: s }) })
        .then(j => { if (j.data && j.data.licenses) keys.push(...j.data.licenses); })
        .catch(e => { throw e; })
    ), Promise.resolve());
    chain.then(() => {
      if (keys.length) renderKeys(m, keys);
      else m.body.innerHTML = '<p style="color:#FF6B9D;font-size:.85rem">Store is waking up — retry in ~15s.</p>';
      if (done) done();
    }).catch(e => {
      m.body.innerHTML = '<p style="color:#FF6B9D;font-size:.85rem">' + esc(e.message) + ' — store waking up? Retry in a moment.</p>';
    });
  }

  function renderKeys(m, keys) {
    const slugKey = {};
    keys.forEach(k => { slugKey[k.slug] = k.key; });
    m.body.innerHTML = `<div class="shop-keys">
      <p style="color:#9a9aa8;font-size:.8rem;margin-bottom:12px">Your license keys — copy or download, then awaken your souls.</p>
      ${keys.map(k => `<div class="shop-key"><span>${esc(k.slug)}</span><b>${esc(k.key)}</b><button data-copy="${esc(k.key)}">Copy</button></div>`).join('')}
      <button id="dlKeys" style="width:100%;margin-top:14px;padding:12px;border-radius:30px;border:1px solid rgba(0,212,255,.4);background:rgba(0,212,255,.1);color:#00D4FF;font-weight:700;cursor:pointer">⬇ Download keys (.txt)</button>
      <button id="closeKeys" style="width:100%;margin-top:8px;padding:10px;border:none;background:none;color:#666;cursor:pointer;font-size:.8rem">Close</button>
    </div>`;
    m.body.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => {
      navigator.clipboard.writeText(b.getAttribute('data-copy')).then(() => {
        b.textContent = '✓ Copied';
        setTimeout(() => { b.textContent = 'Copy'; }, 1400);
      });
    }));
    m.body.querySelector('#dlKeys').addEventListener('click', () => {
      const txt = keys.map(k => k.slug + ' :: ' + k.key).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
      a.download = 'soul-keys.txt';
      a.click();
    });
    m.body.querySelector('#closeKeys').addEventListener('click', () => m.wrap.remove());
  }

  /* ---------- payment return handling ---------- */
  function handleReturn() {
    const q = new URLSearchParams(location.search);
    const order = q.get('order');
    const shop = q.get('shop');
    if (!shop || !order || shop !== 'thanks') {
      if (shop === 'cancel') toast('The blood can wait. The souls are still free.');
      return;
    }
    const m = modalShell('Checking your payment', 'Confirming with the Treasury…');
    m.wrap.classList.add('open');
    m.body.innerHTML = '<p style="color:#9a9aa8;font-size:.85rem">Awakening your souls…</p>';
    let tries = 0;
    const poll = setInterval(() => {
      tries++;
      api('/api/v1/orders/' + encodeURIComponent(order))
        .then(j => {
          if (j.data && j.data.status === 'paid') {
            clearInterval(poll);
            renderKeys(m, j.data.licenses || []);
            cart.items = [];
            saveCart();
          } else if (tries > 30) {
            clearInterval(poll);
            m.body.innerHTML = '<p style="color:#FFD166;font-size:.85rem">Payment should be confirmed — reload this page and your keys will appear.</p>';
          }
        })
        .catch(() => {
          if (tries > 30) {
            clearInterval(poll);
            m.body.innerHTML = '<p style="color:#FFD166;font-size:.85rem">Store is still waking up — check your licenses in a moment.</p>';
          }
        });
    }, 2000);
    history.replaceState(null, '', HOME);
  }

  /* ---------- nav cart button ---------- */
  function addNavBtn() {
    const target = document.getElementById('ssDockToggle');
    const nav = target ? target.parentNode : null;
    if (!nav) return;
    const btn = document.createElement('button');
    btn.id = 'shopCartBtn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open your cart');
    btn.innerHTML = `🛒 <span id="shopCartCount" style="display:inline-flex;visibility:hidden">0</span>`;
    btn.addEventListener('click', openCart);
    nav.insertBefore(btn, target);
    updateBadge();
  }

  /* ---------- product-page buttons ---------- */
  function bindPageButtons() {
    document.querySelectorAll('[data-shop-slug], [data-shop-free]').forEach((b) => {
      if (b.dataset.hooked) return;
      b.dataset.hooked = '1';
      const slug = b.getAttribute('data-shop-slug') || b.getAttribute('data-shop-free');
      const name = b.getAttribute('data-name') || slug;
      if (b.hasAttribute('data-shop-slug')) b.addEventListener('click', () => addToCart(slug, name));
      else b.addEventListener('click', () => mintFree([slug]));
    });
  }

  function init() {
    injectStyle();
    addNavBtn();
    bindPageButtons();
    watchGrid();
    handleReturn();
    setInterval(() => {
      const b = document.getElementById('shopCartCount');
      if (!b) return;
      const q = cartQty();
      if (q > 0) b.textContent = q;
    }, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();