-- ════════ BAD STATION schema ════════
-- Postgres 18. Idempotent: safe to run repeatedly.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  password_hash TEXT,                 -- null for google-only accounts
  google_sub    TEXT UNIQUE,          -- google "sub" claim
  avatar_url    TEXT,
  is_admin      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id            SERIAL PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,        -- public tracking code, e.g. BAD-7F3K9
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- null = guest
  customer_name TEXT NOT NULL,
  phone         TEXT NOT NULL,
  address       TEXT NOT NULL,
  note          TEXT,
  items         JSONB NOT NULL,              -- snapshot: [{id,name,color,size,qty,price,img}]
  subtotal      BIGINT NOT NULL,             -- toman
  shipping      BIGINT NOT NULL,
  total         BIGINT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'received',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_code_idx    ON orders(code);
CREATE INDEX IF NOT EXISTS orders_user_idx    ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);

-- status timeline (one row per status change, newest tells current)
CREATE TABLE IF NOT EXISTS order_events (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_events_order_idx ON order_events(order_id, created_at);

-- ════════ catalogue (was hardcoded in lib/products.js; now admin-editable) ════════
CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY,            -- slug, e.g. "shomiz"
  label      TEXT NOT NULL,               -- persian label
  sort       INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id         TEXT PRIMARY KEY,            -- slug, e.g. "shomiz-katan-bad"
  name       TEXT NOT NULL,
  cat        TEXT REFERENCES categories(id) ON DELETE SET NULL,
  price      BIGINT NOT NULL DEFAULT 0,   -- toman
  img        TEXT,                        -- primary image url
  images     JSONB NOT NULL DEFAULT '[]', -- gallery urls
  alt        TEXT,
  tagline    TEXT,
  note       TEXT,
  story      TEXT,
  details    JSONB NOT NULL DEFAULT '[]',
  material   TEXT,
  care       TEXT,
  fit        TEXT,
  colors     JSONB NOT NULL DEFAULT '[]',
  sizes      JSONB NOT NULL DEFAULT '[]',
  tag        TEXT,
  stock      INTEGER NOT NULL DEFAULT 0,
  archived   BOOLEAN NOT NULL DEFAULT false,
  sort       INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_cat_idx ON products(cat);

-- ════════ server-side carts (per user, or per guest token) ════════
CREATE TABLE IF NOT EXISTS carts (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE, -- null = guest cart
  token      TEXT UNIQUE,                                           -- guest cookie token (null once owned)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id            SERIAL PRIMARY KEY,
  cart_id       INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id    TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color         TEXT,
  size          TEXT,
  qty           INTEGER NOT NULL DEFAULT 1,
  reserved_until TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '2 days',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id, color, size)
);
CREATE INDEX IF NOT EXISTS cart_items_cart_idx    ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS cart_items_product_idx ON cart_items(product_id);
-- active reservations on a product = sum(qty) of cart_items where reserved_until > now()
