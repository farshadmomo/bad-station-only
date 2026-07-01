// ════════ /api/cart ════════
// Server cart with stock reservations. Identity = session uid, else a guest
// token in the httpOnly `bad_cart` cookie. A line holds stock for 2 days
// (reserved_until); expired lines are ignored and lazily swept.
//
//   GET    → { items }                      current cart, joined to products
//   POST   {id,color,size,qty}              add qty to a line (stock-checked)
//   PATCH  {key, qty?, color?, size?}        edit a line (qty 0 removes)
//   DELETE {key} | ?all=1                    remove one line / clear the cart
//
// available(line) = stock − reservations held by OTHER carts (a cart never
// blocks itself). 409 «تموم شد، ناموجوده.» when a change would exceed it.
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { pool, q, q1 } from "@/app/lib/db";
import { getSession } from "@/app/lib/session";

export const dynamic = "force-dynamic";

const COOKIE = "bad_cart";
const HOLD = "now() + interval '2 days'";
const OUT = { error: "تموم شد، ناموجوده." };

// resolve (creating if needed) the cart row for this request, plus merge-on-login.
async function resolveCart() {
  const session = await getSession();
  let uid = session?.uid ?? null;
  const store = await cookies();
  const token = store.get(COOKIE)?.value || null;

  // a still-valid cookie for a since-deleted user would FK-fail the cart insert
  // below (→ 500). treat that stale session as a guest instead.
  if (uid && !(await q1(`SELECT 1 FROM users WHERE id = $1`, [uid]))) uid = null;

  if (uid) {
    const cart = await q1(
      `INSERT INTO carts (user_id) VALUES ($1)
         ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
       RETURNING id`,
      [uid]
    );
    // a guest cart followed the user in on login → fold it into theirs
    if (token) {
      const guest = await q1(`SELECT id FROM carts WHERE token = $1`, [token]);
      if (guest && guest.id !== cart.id) await mergeCarts(guest.id, cart.id);
      store.delete(COOKIE); // token cart is gone / not ours anymore
    }
    return cart.id;
  }

  // guest: ensure a token cookie, then find/create that cart
  let tok = token;
  if (!tok) {
    tok = randomUUID();
    store.set(COOKIE, tok, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  const cart = await q1(
    `INSERT INTO carts (token) VALUES ($1)
       ON CONFLICT (token) DO UPDATE SET updated_at = now()
     RETURNING id`,
    [tok]
  );
  return cart.id;
}

// move active guest lines into the user's cart (sum dup variants), drop the guest cart.
// ponytail: merge may push a line past available; the next stock-checked edit corrects it.
async function mergeCarts(fromId, toId) {
  await q(
    `INSERT INTO cart_items (cart_id, product_id, color, size, qty, reserved_until)
       SELECT $2, product_id, color, size, qty, ${HOLD}
         FROM cart_items
        WHERE cart_id = $1 AND reserved_until > now()
     ON CONFLICT (cart_id, product_id, color, size)
       DO UPDATE SET qty = cart_items.qty + EXCLUDED.qty, reserved_until = ${HOLD}`,
    [fromId, toId]
  );
  await q(`DELETE FROM carts WHERE id = $1`, [fromId]); // cart_items cascade
}

// stock free to allocate to a line of `pid` in `cartId` (own cart never counts).
async function availableFor(client, pid, cartId) {
  const pr = await client.query(`SELECT stock FROM products WHERE id = $1 FOR UPDATE`, [pid]);
  if (!pr.rows[0]) return null; // unknown product
  const stock = Number(pr.rows[0].stock);
  const rr = await client.query(
    `SELECT COALESCE(SUM(qty), 0) AS reserved
       FROM cart_items
      WHERE product_id = $1 AND reserved_until > now() AND cart_id <> $2`,
    [pid, cartId]
  );
  return Math.max(stock - Number(rr.rows[0].reserved), 0);
}

// the drawer/badge payload: active lines joined to their product
async function loadCart(cartId) {
  await q(`DELETE FROM cart_items WHERE cart_id = $1 AND reserved_until <= now()`, [cartId]);
  const rows = await q(
    `SELECT ci.id AS key, ci.product_id AS id, ci.color, ci.size, ci.qty,
            p.name, p.price, p.img, p.colors, p.sizes, p.stock,
            COALESCE(o.reserved, 0) AS reserved_other
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN LATERAL (
         SELECT SUM(x.qty) AS reserved
           FROM cart_items x
          WHERE x.product_id = ci.product_id
            AND x.reserved_until > now() AND x.cart_id <> ci.cart_id
       ) o ON true
      WHERE ci.cart_id = $1 AND ci.reserved_until > now()
      ORDER BY ci.created_at, ci.id`,
    [cartId]
  );
  return rows.map((r) => ({
    key: r.key,
    id: r.id,
    name: r.name,
    color: r.color,
    size: r.size,
    qty: Number(r.qty),
    price: Number(r.price),
    img: r.img,
    colors: r.colors ?? [],
    sizes: r.sizes ?? [],
    available: Math.max(Number(r.stock) - Number(r.reserved_other), 0),
  }));
}

const items = async (cartId) => ({ items: await loadCart(cartId) });

export async function GET() {
  try {
    const cartId = await resolveCart();
    return Response.json(await items(cartId), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const id = String(body?.id ?? "");
    const color = body?.color != null ? String(body.color) : null;
    const size = body?.size != null ? String(body.size) : null;
    const qty = Math.max(1, Math.round(Number(body?.qty) || 0));
    if (!id) return Response.json({ error: "محصول نامعتبر." }, { status: 400 });

    const cartId = await resolveCart();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const avail = await availableFor(client, id, cartId);
      if (avail === null) {
        await client.query("ROLLBACK");
        return Response.json({ error: "محصول پیدا نشد." }, { status: 404 });
      }
      const cur = await client.query(
        `SELECT qty FROM cart_items
          WHERE cart_id=$1 AND product_id=$2 AND color IS NOT DISTINCT FROM $3
            AND size IS NOT DISTINCT FROM $4 AND reserved_until > now()`,
        [cartId, id, color, size]
      );
      const total = (cur.rows[0]?.qty ?? 0) + qty;
      if (total > avail) {
        await client.query("ROLLBACK");
        return Response.json(OUT, { status: 409 });
      }
      await client.query(
        `INSERT INTO cart_items (cart_id, product_id, color, size, qty, reserved_until)
           VALUES ($1,$2,$3,$4,$5, ${HOLD})
         ON CONFLICT (cart_id, product_id, color, size)
           DO UPDATE SET qty = EXCLUDED.qty, reserved_until = EXCLUDED.reserved_until`,
        [cartId, id, color, size, total]
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
    return Response.json({ ok: true, ...(await items(cartId)) });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json().catch(() => null);
    const key = Number(body?.key);
    if (!Number.isFinite(key)) return Response.json({ error: "خط نامعتبر." }, { status: 400 });

    const cartId = await resolveCart();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const row = (
        await client.query(`SELECT * FROM cart_items WHERE id=$1 AND cart_id=$2`, [key, cartId])
      ).rows[0];
      if (!row) {
        await client.query("ROLLBACK");
        return Response.json(await items(cartId)); // line gone; just resync
      }

      const color = body?.color != null ? String(body.color) : row.color;
      const size = body?.size != null ? String(body.size) : row.size;
      const qty = body?.qty != null ? Math.round(Number(body.qty) || 0) : row.qty;
      const variantChanged = color !== row.color || size !== row.size;

      if (qty <= 0) {
        await client.query(`DELETE FROM cart_items WHERE id=$1`, [key]);
        await client.query("COMMIT");
        return Response.json({ ok: true, ...(await items(cartId)) });
      }

      const avail = await availableFor(client, row.product_id, cartId);
      if (avail === null) {
        await client.query("ROLLBACK");
        return Response.json({ error: "محصول پیدا نشد." }, { status: 404 });
      }
      if (qty > avail) {
        await client.query("ROLLBACK");
        return Response.json(OUT, { status: 409 });
      }

      if (variantChanged) {
        // drop this line, then merge its qty into the target variant (may already exist)
        await client.query(`DELETE FROM cart_items WHERE id=$1`, [key]);
        await client.query(
          `INSERT INTO cart_items (cart_id, product_id, color, size, qty, reserved_until)
             VALUES ($1,$2,$3,$4,$5, ${HOLD})
           ON CONFLICT (cart_id, product_id, color, size)
             DO UPDATE SET qty = cart_items.qty + EXCLUDED.qty, reserved_until = EXCLUDED.reserved_until`,
          [cartId, row.product_id, color, size, qty]
        );
      } else {
        await client.query(
          `UPDATE cart_items SET qty=$1, reserved_until=${HOLD} WHERE id=$2`,
          [qty, key]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
    return Response.json({ ok: true, ...(await items(cartId)) });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const cartId = await resolveCart();
    if (searchParams.get("all")) {
      await q(`DELETE FROM cart_items WHERE cart_id=$1`, [cartId]);
      return Response.json({ ok: true, ...(await items(cartId)) });
    }
    const body = await req.json().catch(() => null);
    const key = Number(body?.key);
    if (Number.isFinite(key)) await q(`DELETE FROM cart_items WHERE id=$1 AND cart_id=$2`, [key, cartId]);
    return Response.json({ ok: true, ...(await items(cartId)) });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}
