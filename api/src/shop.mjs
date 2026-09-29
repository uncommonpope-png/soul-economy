// Shop API — faithful port of chat/api.mjs (Express) to a Worker fetch handler.
// Same routes, same response shapes, same graceful 503s until Supabase/Stripe
// secrets are pasted into the Worker (wrangler secret put ...).
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,Stripe-Signature,Helius-Signature',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
function fail(status, code, hint) {
  return json({ ok: false, error: code, hint: hint || '' }, status);
}

function makeLicense() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  return 'BUYASOUL-' + hex.match(/.{1,4}/g).join('-');
}

function renderProduct(p) {
  return {
    slug: p.slug,
    name: p.name,
    type: p.type,
    icon: p.icon,
    image: p.image,
    desc: p.desc,
    details: p.details,
    mode: p.mode,
    price_cents: p.price_cents,
    suggested_cents: p.suggested_cents,
    min_cents: p.min_cents || 0,
    license: p.license,
    payout_pct: p.payout_pct,
    featured: p.featured,
    tags: p.tags || [],
    version: p.version,
    size: p.size,
    download: p.download,
    contents: p.contents || [],
    requirements: p.requirements,
    install: p.install,
  };
}

async function hmacHex(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(mac), (x) => x.toString(16).padStart(2, '0')).join('');
}

function eq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const PRODUCT_CACHE_MS = 5 * 60 * 1000;
const ASSET_BASE_URL = 'https://uncommonpope-png.github.io/soul-economy/';
const productCache = { at: 0, data: null };

function clients(env) {
  const supabase =
    env.SUPABASE_URL && env.SUPABASE_ANON_KEY
      ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } })
      : null;
  const supabaseService =
    env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY
      ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
      : null;
  const stripe = env.STRIPE_SECRET_KEY
    ? new Stripe(env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() })
    : null;
  return { supabase, supabaseService, stripe };
}

async function loadProducts(env, supabase, force) {
  if (!supabase) {
    const err = new Error('catalog_not_configured');
    err.status = 503;
    throw err;
  }
  if (!force && productCache.data && Date.now() - productCache.at < PRODUCT_CACHE_MS) {
    return productCache.data;
  }
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('sort', { ascending: true });
  if (error) {
    const err = new Error(error.message);
    err.status = 502;
    throw err;
  }
  productCache.data = data || [];
  productCache.at = Date.now();
  return productCache.data;
}

async function readJson(request, maxBytes) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > maxBytes) {
    const e = new Error('payload_too_large');
    e.status = 413;
    throw e;
  }
  try {
    return await request.json();
  } catch (e) {
    const err = new Error('bad_json');
    err.status = 400;
    throw err;
  }
}

export async function handleShop(request, env, url) {
  const { supabase, supabaseService, stripe } = clients(env);
  const path = url.pathname;
  const method = request.method;
  try {
    // GET /api/v1/meta
    if (path === '/api/v1/meta' && method === 'GET') {
      return json({
        ok: true,
        name: 'soul-economy-api',
        version: env.APP_VERSION || '2.0.0',
        chat: 'FamilyChat room alive',
        configured: {
          products: !!supabase,
          checkout: !!(supabaseService && stripe),
          orders: !!supabaseService,
          solana: env.HELIUS_WEBHOOK_SECRET ? true : false,
        },
      });
    }

    // GET /api/v1/products
    if (path === '/api/v1/products' && method === 'GET') {
      const rows = await loadProducts(env, supabase, false);
      return json({ ok: true, data: rows.map(renderProduct) });
    }

    // GET /api/v1/products/:slug
    if (path.startsWith('/api/v1/products/') && method === 'GET') {
      const slug = decodeURIComponent(path.slice('/api/v1/products/'.length));
      const rows = await loadProducts(env, supabase, false);
      const p = rows.find((r) => r.slug === slug);
      if (!p) return fail(404, 'not_found', 'No soul with that slug.');
      return json({ ok: true, data: renderProduct(p) });
    }

    // POST /api/v1/checkout
    if (path === '/api/v1/checkout' && method === 'POST') {
      if (!supabaseService) return fail(503, 'orders_not_configured', 'Supabase service key missing.');
      if (!stripe) return fail(503, 'checkout_not_configured', 'Stripe key missing.');

      const body = await readJson(request, 128 * 1024);
      const items = Array.isArray(body?.items) ? body.items : null;
      const returnTo = String(body?.return_to || '').slice(0, 500);
      if (!items || items.length === 0) return fail(400, 'empty_cart', 'Add a soul first.');

      const slugs = items.map((i) => String(i.slug).slice(0, 120));
      const all = await loadProducts(env, supabase, false);
      const map = new Map(all.map((p) => [p.slug, p]));
      const missing = slugs.filter((s) => !map.has(s));
      if (missing.length) return fail(400, 'unknown_soul', missing.join(', '));

      const lineItems = [];
      let total = 0;
      for (const it of items) {
        const qty = Math.min(Math.max(parseInt(it.qty, 10) || 1, 1), 20);
        const p = map.get(String(it.slug));
        let cents = Math.min(Math.max(parseInt(it.cents, 10) || 0, 0), 1e8);
        if (p.mode === 'fixed' && p.price_cents) cents = p.price_cents;
        if (cents > 0 && cents < (p.min_cents || 0)) cents = p.min_cents;
        total += cents * qty;
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: p.name.slice(0, 120),
              description: (p.desc || '').slice(0, 250),
              images: p.image
                ? [p.image.startsWith('http') ? p.image : ASSET_BASE_URL + p.image.replace(/^\//, '')]
                : [],
            },
            unit_amount: cents,
          },
          quantity: qty,
        });
      }
      if (total <= 0) return fail(400, 'zero_total', 'Free souls use the Free mint button.');

      const orderId = crypto.randomUUID();
      const { error: insertErr } = await supabaseService.from('orders').insert({
        id: orderId,
        items,
        amount_cents: total,
        currency: 'usd',
        status: 'created',
      });
      if (insertErr) return fail(502, 'order_insert_failed', insertErr.message);

      const base = returnTo || 'https://uncommonpope-png.github.io/soul-economy/';
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        success_url: `${base}?shop=thanks&order=${orderId}`,
        cancel_url: base.split('?')[0] + '?shop=cancel',
        metadata: { order_id: orderId, slugs: slugs.join(',') },
        allow_promotion_codes: true,
      });
      return json({ ok: true, url: session.url, order_id: orderId });
    }

    // POST /api/v1/mint-free
    if (path === '/api/v1/mint-free' && method === 'POST') {
      if (!supabaseService) return fail(503, 'orders_not_configured', 'Supabase service key missing.');
      const body = await readJson(request, 64 * 1024);
      const slug = String(body?.slug || '').slice(0, 120);
      if (!slug) return fail(400, 'no_soul', 'Send a soul slug.');
      const rows = await loadProducts(env, supabase, false);
      const p = rows.find((r) => r.slug === slug);
      if (!p) return fail(404, 'not_found', 'No soul with that slug.');

      const key = makeLicense();
      const { data, error } = await supabaseService
        .from('orders')
        .insert({
          items: [{ slug, qty: 1, cents: 0 }],
          amount_cents: 0,
          currency: 'usd',
          status: 'paid',
          paid_at: new Date().toISOString(),
          licenses: [{ slug, key, created_at: new Date().toISOString() }],
        })
        .select('id,status,licenses')
        .single();
      if (error) return fail(502, 'order_insert_failed', error.message);
      return json({ ok: true, free: true, data: data });
    }

    // POST /api/v1/webhooks/stripe
    if (path === '/api/v1/webhooks/stripe' && method === 'POST') {
      if (!stripe || !env.STRIPE_WEBHOOK_SECRET)
        return fail(503, 'webhook_not_configured', 'Stripe webhook secret missing.');
      const raw = await request.text();
      const sig = request.headers.get('stripe-signature') || '';
      const parts = Object.fromEntries(
        sig.split(',').map((kv) => {
          const i = kv.indexOf('=');
          return [kv.slice(0, i), kv.slice(i + 1)];
        })
      );
      const expected = await hmacHex(env.STRIPE_WEBHOOK_SECRET, `${parts.t || ''}.${raw}`);
      if (!parts.v1 || !eq(parts.v1, expected))
        return fail(400, 'bad_signature', 'Webhook signature mismatch.');
      if (Math.abs(Date.now() / 1000 - Number(parts.t || 0)) > 300)
        return fail(400, 'bad_signature', 'Webhook timestamp outside tolerance.');

      let event;
      try {
        event = JSON.parse(raw);
      } catch (e) {
        return fail(400, 'bad_json', 'Invalid payload.');
      }

      if (event.type === 'checkout.session.completed' && supabaseService) {
        const s = event.data.object;
        const orderId = s.metadata?.order_id;
        if (orderId) {
          const slugs = String(s.metadata?.slugs || '').split(',').filter(Boolean);
          const licenses = slugs.map((slug) => ({
            slug,
            key: makeLicense(),
            created_at: new Date().toISOString(),
          }));
          await supabaseService
            .from('orders')
            .update({
              status: 'paid',
              stripe_payment_id: s.payment_intent || s.id,
              amount_cents: s.amount_total,
              paid_at: new Date().toISOString(),
              licenses,
            })
            .eq('id', orderId);
        }
      }
      return json({ received: true });
    }

    // POST /api/v1/webhooks/solana
    if (path === '/api/v1/webhooks/solana' && method === 'POST') {
      if (!supabaseService) return fail(503, 'orders_not_configured', 'Supabase service key missing.');
      const raw = await request.text();
      if (env.HELIUS_WEBHOOK_SECRET) {
        const sig = String(request.headers.get('helius-signature') || '');
        const expected = await hmacHex(env.HELIUS_WEBHOOK_SECRET, raw);
        if (!sig || !eq(sig, expected))
          return fail(401, 'bad_signature', 'Helius signature mismatch.');
      }
      let body = {};
      try {
        body = JSON.parse(raw);
      } catch (e) {}
      const memo = String(body?.transaction?.meta?.logMessages?.join(' ') || '')
        .replace(/[^a-zA-Z0-9\- ]/g, ' ')
        .match(/soul:[0-9a-fA-F\-]{36}/);
      const orderId = memo ? memo[0].slice(5) : null;
      if (orderId) {
        await supabaseService
          .from('orders')
          .update({
            status: 'paid',
            solana_tx: String(body?.signature || body?.transaction?.signature || '').slice(0, 128),
            paid_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      }
      return json({ received: true });
    }

    // GET /api/v1/orders/:id
    if (path.startsWith('/api/v1/orders/') && method === 'GET') {
      if (!supabaseService) return fail(503, 'orders_not_configured', 'Supabase service key missing.');
      const id = decodeURIComponent(path.slice('/api/v1/orders/'.length));
      const { data, error } = await supabaseService
        .from('orders')
        .select('id,status,amount_cents,currency,licenses,created_at,paid_at')
        .eq('id', id)
        .single();
      if (error || !data) return fail(404, 'not_found', 'No order with that id.');
      return json({ ok: true, data });
    }

    // POST /api/v1/profile
    if (path === '/api/v1/profile' && method === 'POST') {
      if (!supabase || !supabaseService) return fail(503, 'auth_not_configured', 'Supabase keys missing.');
      const auth = String(request.headers.get('authorization') || '');
      if (!auth.startsWith('Bearer ')) return fail(401, 'no_token', 'Send Authorization: Bearer <jwt>.');
      const { data: user, error } = await supabase.auth.getUser(auth.slice(7));
      if (error || !user) return fail(401, 'bad_token', (error && error.message) || 'Session invalid.');
      const meta = user.user_metadata || {};
      const handle = (meta.handle || meta.user_name || meta.name || user.email || 'soul')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 40);
      const avatar = meta.avatar_url || meta.picture || `https://github.com/${handle}.png`;
      await supabaseService
        .from('profiles')
        .upsert(
          { id: user.id, handle, avatar, bio: meta.bio || '', updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        );
      return json({ ok: true, data: { id: user.id, handle, avatar, email: user.email || null } });
    }

    return fail(404, 'not_found', 'Route does not exist.');
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error('[api]', e.message);
    return json({ ok: false, error: e.message || 'server_error', hint: e.hint || '' }, status);
  }
}
