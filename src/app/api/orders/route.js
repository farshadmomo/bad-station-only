// ════════ /api/orders ════════
// POST  → create an order (public; links user_id when a session exists)
// GET   → list all orders, newest first (admin only)
import { cookies } from "next/headers";
import { q, q1, pool } from "@/app/lib/db";
import { getSession, requireAdmin } from "@/app/lib/session";
import { makeOrderCode, SHIPPING } from "@/app/lib/orders-shared";
import { getProduct } from "@/app/lib/catalogue";

// normalise persian/arabic digits to latin (mirrors CartDrawer)
const normDigits = (s) =>
  String(s ?? "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

const toInt = (v, fallback = 0) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : fallback;
};

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "بدنه‌ی نامعتبر." }, { status: 400 });
    }

    const name = String(body.customer_name ?? "").trim();
    const phone = normDigits(body.phone).replace(/\D/g, "");
    const address = String(body.address ?? "").trim();
    const note = String(body.note ?? "").trim() || null;
    const rawItems = Array.isArray(body.items) ? body.items : [];

    // validation — mirror the cart form
    if (name.length < 2)
      return Response.json({ error: "اسمت رو بنویس. لازمش داریم." }, { status: 400 });
    if (!/^09\d{9}$/.test(phone))
      return Response.json({ error: "شماره‌ی موبایل درست بده (۰۹...)." }, { status: 400 });
    if (address.length < 8)
      return Response.json({ error: "آدرسِ کامل‌تر. کجا بفرستیم؟" }, { status: 400 });
    if (rawItems.length === 0)
      return Response.json({ error: "سبد خالیه." }, { status: 400 });

    // ── trust the server catalogue, NOT the client ──
    // price/name/img come from getProduct(); color/size validated against the
    // product; qty clamped. Unknown product id → reject. This prevents the
    // client from forging prices or totals.
    const items = [];
    for (const it of rawItems) {
      const product = await getProduct(String(it?.id ?? ""));
      if (!product) {
        return Response.json(
          { error: "یکی از محصولا تو فروشگاه نیست. سبدت رو تازه کن." },
          { status: 400 }
        );
      }
      const color =
        it?.color != null && product.colors.includes(String(it.color))
          ? String(it.color)
          : product.colors[0] ?? null;
      const size =
        it?.size != null && product.sizes.includes(String(it.size))
          ? String(it.size)
          : product.sizes[0] ?? null;
      items.push({
        id: product.id,
        name: product.name,
        color,
        size,
        qty: Math.max(1, Math.min(99, toInt(it?.qty, 1))),
        price: product.price, // canonical price only
        img: product.img,
      });
    }

    // totals are derived server-side; client-supplied amounts are ignored
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = SHIPPING;
    const total = subtotal + shipping;

    const session = await getSession();
    const userId = session?.uid ?? null;

    // the buyer's cart (so we can clear it in the same transaction)
    const store = await cookies();
    const token = store.get("bad_cart")?.value || null;
    const cartRow = userId
      ? await q1(`SELECT id FROM carts WHERE user_id = $1`, [userId])
      : token
        ? await q1(`SELECT id FROM carts WHERE token = $1`, [token])
        : null;

    // one transaction: insert order, draw down stock, clear the cart, log event
    const client = await pool.connect();
    let order = null;
    try {
      for (let attempt = 0; attempt < 6; attempt++) {
        const code = makeOrderCode();
        try {
          await client.query("BEGIN");
          const res = await client.query(
            `INSERT INTO orders
               (code, user_id, customer_name, phone, address, note, items, subtotal, shipping, total, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, 'received')
             RETURNING id, code, status`,
            [code, userId, name, phone, address, note, JSON.stringify(items), subtotal, shipping, total]
          );
          order = res.rows[0];

          // draw down stock per line (never below zero)
          for (const it of items) {
            await client.query(
              `UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2`,
              [it.qty, it.id]
            );
          }

          // empty the buyer's cart (items cascade with the cart)
          if (cartRow) await client.query(`DELETE FROM carts WHERE id = $1`, [cartRow.id]);

          await client.query(
            `INSERT INTO order_events (order_id, status, note) VALUES ($1, 'received', $2)`,
            [order.id, "سفارشت بد نشست. ثبتش کردیم."]
          );
          await client.query("COMMIT");
          break;
        } catch (err) {
          await client.query("ROLLBACK").catch(() => {});
          order = null;
          if (err && err.code === "23505") continue; // duplicate code → retry
          throw err;
        }
      }
    } finally {
      client.release();
    }

    if (!order)
      return Response.json({ error: "ثبتِ سفارش نشد. دوباره تلاش کن." }, { status: 500 });

    return Response.json({ code: order.code, status: order.status }, { status: 201 });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: "دسترسی نداری." }, { status: 401 });

    const orders = await q(
      `SELECT id, code, user_id, customer_name, phone, address, note,
              items, subtotal, shipping, total, status, created_at, updated_at
         FROM orders
        ORDER BY created_at DESC, id DESC`
    );
    return Response.json({ orders });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}
