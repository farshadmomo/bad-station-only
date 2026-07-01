# BAD STATION — Build Spec (shared contract for all agents)

You are building part of **Bad Station**, an RTL Persian streetwear shop (Next.js 16, App Router, **JavaScript not TS**, Tailwind v4, GSAP + Lenis). Read this whole file before writing code. Stay strictly inside YOUR file ownership (see end). The orchestrator owns the marketing pages and shared libs; do not edit files you don't own.

App root: `D:\vscode projects\bad-station-only\my-app`. Dev server: `npm run dev` → http://localhost:3000 .

## 0. Concept & voice (CRITICAL — get this right)
The brand name «بَد» is a **slang intensifier** meaning *insanely / so / crazy-good* — NOT "bad mood". It's a pun: the name says "bad", the product is "bad-good". Tone = hyped, confident, playful, gen-z street. Examples of the voice:
- «بد خوبه» (it's insanely good) · «بد بهت میاد» (looks so good on you) · «بددد می‌خوایش» (you want it so bad) · «بد حال می‌ده» (it slaps) · «بد بپوش، بد بدرخش».
- Do NOT write gloomy/grumpy copy ("حسش نیست", "حالمون بده"). That's the OLD concept — it's gone.
- Persian copy, RTL. Use casual but clean Persian. Keep «بَد» (with the zebar) for the wordmark; «بد» elsewhere is fine.

## 1. Tech / Next.js 16 gotchas (this is NOT the Next.js you know)
- Route handlers live at `src/app/api/**/route.js`. Export async `GET/POST/PATCH/...`. Return `Response.json(...)`.
- **`params` is a Promise** in pages AND route handlers: `export async function GET(req, { params }) { const { id } = await params; }`. In a client page: `const { id } = use(params)`.
- **`cookies()` is async**: `const store = await cookies()` (from `next/headers`). Our `session.js` already wraps this.
- Route handlers are NOT cached by default (good for dynamic APIs). Don't add `force-static`.
- Client interactivity needs `"use client"` at the top of the component file.
- Plain JS. No TypeScript. Use `.jsx` for components, `.js` for routes/pages/libs.
- Images: plain `<img>` is fine (the project already uses it). Assets live in `/public`.

## 2. Design system (match it exactly)
Three colours only, OKLCH, defined in `src/app/globals.css` and exposed as Tailwind tokens:
- `text-concrete` (primary light text), `text-concrete-dim` (secondary), `text-crimson` (the only accent).
- Surfaces: `bg-black`, `bg-black-2`, `bg-black-3`. Borders: `border-line` (and `--line-bright`).
- Fonts (CSS vars / utility classes): `.font-display` (Lalezar, Persian display), `.font-stamp` (Bebas, Latin micro-labels), body is Vazirmatn. `.tnum` = tabular figures.
- **Spray signature** (use with restraint, this is the brand's one bold move): add class `spray` (heavy, for big display words / the «بَد» wordmark) or `spray-soft` (light, for small eyebrows). `spray-halo` adds a faint crimson mist behind a wordmark. `.stencil` = sprayable Latin stamp label. The SVG filters are defined in `layout.js`.
- Background: the whole site floats over a darkened concrete wall (`body::before`, image `/background/phil-cruz-...jpg`). Sections use `.concrete` / `.panel-wall`. Don't add page backgrounds that hide it; use `bg-black-2` tiles/cards for readable content over the wall.
- Reusable bits in CSS: `.chip` (filter/size pills), `.field` (form inputs, has focus + `aria-invalid` styles), `.thin-scroll`, `#nav.nav-solid`.

### Hard design bans (do not violate)
- No gradient text (`background-clip:text`). Use solid color + the `spray` filter for flair.
- **No em dashes (—) in any copy.** Use «،» «:» «؛» «.» or parentheses.
- No glassmorphism-by-default, no decorative side-stripe borders, no emoji as icons (use inline SVG).
- Touch targets ≥ 44px. Visible `:focus-visible`. Respect `prefers-reduced-motion`.
- Mobile-first. Test at 390px wide. No horizontal scroll.

## 3. Shared libraries already written (import these — do not reimplement)
- Import alias: `@/*` → `./src/*` (configured in jsconfig). So use `@/app/lib/db`, `@/app/lib/session`, `@/app/lib/products`, etc. (Relative imports also fine.)
- `src/app/lib/db.js` → `import { q, q1, pool } from "@/app/lib/db";`. `q(sql, params)` → rows[]; `q1(sql, params)` → first row | null.
- `src/app/lib/session.js` → `getSession()` (→ `{uid,email,name,is_admin}` | null), `setSessionCookie(payload)`, `clearSessionCookie()`, `requireAdmin()` (→ session | null). All async. Cookie name `bad_session`, JWT via jose.
- `src/app/lib/orders-shared.js` → `STATUS` (map status→{label,voice}), `STATUS_FLOW` (ordered array), `statusIndex(s)`, `makeOrderCode()` (→ `"BAD-7F3K9"`), `STATUS_LABELS`.
- `src/app/lib/products.js` → `PRODUCTS`, `CATEGORIES`, `getProduct(id)`, `related(id,n)`, `searchProducts(q)`, `toman(n)`, `fa(n)`.

Product shape: `{ id, name, cat, price, img, images:[], alt, tagline, note, story, details:[], material, care, fit, colors:[], sizes:[], tag? }`. `id` is the URL slug.

## 4. Database (Postgres, already migrated + admin seeded)
Tables:
- `users(id, email unique, name, password_hash, google_sub unique, avatar_url, is_admin, created_at)`
- `orders(id, code unique, user_id→users, customer_name, phone, address, note, items jsonb, subtotal, shipping, total, status default 'received', created_at, updated_at)`
- `order_events(id, order_id→orders ON DELETE CASCADE, status, note, created_at)`
Status pipeline: `received → confirmed → packing → shipped → delivered` (+ `canceled`). Admin user seeded from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env.local`.

## 5. API contract (the seam between agents)
All under `src/app/api`. JSON in/out. On error return `{ error: "..." }` + proper status.

**Orders**
- `POST /api/orders` — body `{ customer_name, phone, address, note?, items:[{id,name,color,size,qty,price,img}], subtotal, shipping, total }`. Creates order with a unique `code` (use `makeOrderCode()`, retry on collision), inserts an initial `order_events` row with status `received`, links `user_id` if a session exists. → `201 { code, status:'received' }`.
- `GET /api/orders/track?code=BAD-XXXXX` — public. → `{ code, status, customer_name (first name only ok), total, created_at, items, timeline:[{status,label,voice,created_at}] }` or `404 {error}`. Case-insensitive code match.
- `GET /api/orders` — **admin only** (`requireAdmin()`), newest first. → `{ orders:[...] }` (include items, contact, status). `401` if not admin.
- `PATCH /api/orders/[id]` — **admin only**. body `{ status, note? }`. Validates status ∈ pipeline∪{canceled}, updates `orders.status` + `updated_at`, inserts `order_events`. → `{ ok:true, status }`.

**Auth**
- `POST /api/auth/signup` — `{ name, email, password }`. Hash with bcryptjs (cost 10). Reject duplicate email (409). Set `is_admin=true` if email === `ADMIN_EMAIL`. Set session cookie. → `{ user:{id,email,name,is_admin} }`.
- `POST /api/auth/login` — `{ email, password }`. Verify bcrypt. 401 on bad creds. Set session cookie. → `{ user }`.
- `POST /api/auth/logout` — clears cookie. → `{ ok:true }`.
- `GET /api/auth/me` — → `{ user }` from session, or `{ user:null }`.
- `GET /api/auth/google` — if `GOOGLE_CLIENT_ID` set, 302 to Google's consent (scope `openid email profile`, `GOOGLE_REDIRECT_URI`, a `state` cookie for CSRF). If not configured, redirect back to `/login?google=unconfigured`.
- `GET /api/auth/google/callback` — verify `state`, exchange `code` at Google token endpoint, verify the id_token (jose + Google JWKS `https://www.googleapis.com/oauth2/v3/certs`), upsert user by `google_sub`/email, set session cookie, 302 to `/`.

Validation: phone `^09\d{9}$` after normalising Persian/Arabic digits to latin; name ≥ 2 chars; address ≥ 8. Mirror what the cart form does.

## 6. Run / verify
`npm run dev`. The orchestrator runs the server + Playwright; you don't need to. But your code MUST compile (valid JS, correct imports, `"use client"` where needed). Keep components self-contained.

## 7. FILE OWNERSHIP — stay in your lane
- **Backend agent**: everything under `src/app/api/**`. May add `src/app/lib/google.js` if needed. Nothing else.
- **Auth-UI agent**: `src/app/login/page.js`, `src/app/signup/page.js`, `src/app/components/AccountMenu.jsx`. Nothing else.
- **Admin+Track agent**: `src/app/admin/**`, `src/app/track/**`. Nothing else.
- **Product-detail agent**: `src/app/product/[slug]/**` and any component used only there (put in `src/app/product/[slug]/_parts/`). Nothing else.
- The orchestrator owns: `globals.css`, `layout.js`, `page.js`, all `src/app/lib/*`, and `components/{Experience,Hero,Shop,About,Lookbook,CartDrawer,Search}.jsx`. Do not touch these.

Match the existing code's style (look at `components/Shop.jsx` and `CartDrawer.jsx` for conventions: RTL, Persian copy, GSAP via `useGSAP`, `data-hot` on interactive els for the custom cursor, `toman()`/`fa()` for numbers).
