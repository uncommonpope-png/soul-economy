-- Soul Economy backend schema — run in Supabase SQL Editor (or `psql`).
-- Idempotent-ish: safe to run once on an empty project.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Identity (auth.users comes with Supabase Auth)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  handle     text unique not null,
  avatar     text,
  bio        text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalog (seeded from data/catalog.json by seed.mjs)
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  slug            text primary key,
  name            text not null,
  type            text,
  icon            text,
  image           text,
  "desc"          text,
  details         text,
  mode            text not null default 'pwyp',          -- pwyp | fixed | free
  price_cents     int,                                   -- fixed mode only
  suggested_cents int,                                   -- PWYP suggestion
  min_cents       int not null default 0,                -- PWYP floor
  license         text,
  payout_pct      numeric not null default 60,           -- Oracle's share of each sale
  featured        boolean not null default false,
  tags            text[] not null default '{}',
  contents        text[] not null default '{}',
  requirements    text,
  install         text,
  version         text,
  size            text,
  download        text,
  sort            int not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders + licenses (money path)
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  items              jsonb not null default '[]',         -- [{slug, qty, cents}]
  amount_cents       int not null default 0,
  currency           text not null default 'usd',
  status             text not null default 'created',     -- created | paid
  stripe_payment_id  text,
  solana_tx          text,
  licenses           jsonb not null default '[]',         -- [{slug, key, created_at}]
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);

-- ---------------------------------------------------------------------------
-- Social (Phase 3 — auth-required endpoints)
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  author     uuid not null references public.profiles (id) on delete cascade,
  soul       text,
  kind       text not null default 'text',                -- text | link | image | video | poll
  body       text not null,
  url        text,
  vis        text not null default 'public',              -- public | followers | private
  created_at timestamptz not null default now(),
  edited_at  timestamptz
);

create table if not exists public.likes (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.follows (
  follower   uuid not null references public.profiles (id) on delete cascade,
  target     uuid not null references public.profiles (id) on delete cascade,
  kind       text not null default 'person',              -- person | soul | agent | group
  created_at timestamptz not null default now(),
  primary key (follower, target, kind)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists products_active_sort_idx on public.products (active, sort);
create index if not exists products_type_idx      on public.products (type);
create index if not exists orders_status_idx      on public.orders (status);
create index if not exists posts_author_idx       on public.posts (author);
create index if not exists posts_created_idx      on public.posts (created_at desc);
create index if not exists likes_post_idx         on public.likes (post_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products
  for select using (active = true);

drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read" on public.profiles
  for select using (true);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "posts public read" on public.posts;
create policy "posts public read" on public.posts
  for select using (vis = 'public');

drop policy if exists "posts auth write" on public.posts;
create policy "posts auth write" on public.posts
  for insert with check (auth.uid() = author);

drop policy if exists "likes auth write" on public.likes;
create policy "likes auth write" on public.likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "follows auth write" on public.follows;
create policy "follows auth write" on public.follows
  for insert with check (auth.uid() = follower);

-- Orders: no anon/authenticated access (the API service reads/writes them).
-- The REST order-status endpoint is served by the app with the service key.