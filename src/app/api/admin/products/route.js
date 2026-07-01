// ════════ /api/admin/products ════════
// Admin-only catalogue CRUD.
//   GET            → all products (incl. archived)
//   POST   {…}     → create (id slug derived from name when absent)
//   PATCH  {id,…}  → partial update
//   DELETE ?id=    → hard delete, or archive if the product appears in any order
import { q, q1 } from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/session";

// editable columns (id handled separately). Order is the insert/return order.
const COLS = [
  "name", "cat", "price", "img", "images", "alt", "tagline", "note", "story",
  "details", "material", "care", "fit", "colors", "sizes", "tag", "stock",
  "archived", "sort",
];
const JSON_FIELDS = new Set(["images", "details", "colors", "sizes"]);
const INT_FIELDS = new Set(["price", "stock", "sort"]);

// slug: lowercase, dashes for whitespace, keep ascii letters/digits + persian. Unique-safe later.
function slugify(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9؀-ۿ-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || `p-${Date.now().toString(36)}`;
}

function coerce(col, v) {
  if (col === "cat") return v ? String(v) : null;
  if (INT_FIELDS.has(col)) return Math.max(0, Math.round(Number(v)) || 0);
  if (col === "archived") return Boolean(v);
  if (JSON_FIELDS.has(col)) return JSON.stringify(Array.isArray(v) ? v : []);
  return v == null ? null : String(v);
}

async function catExists(cat) {
  if (!cat) return true; // null cat is allowed (FK SET NULL)
  return !!(await q1(`SELECT 1 FROM categories WHERE id = $1`, [cat]));
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: "دسترسی نداری." }, { status: 401 });
    const products = await q(`SELECT * FROM products ORDER BY sort, created_at`);
    return Response.json({ products });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: "دسترسی نداری." }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      return Response.json({ error: "بدنه‌ی نامعتبر." }, { status: 400 });

    const name = String(body.name ?? "").trim();
    if (name.length < 1) return Response.json({ error: "اسمِ محصول رو بنویس." }, { status: 400 });

    const cat = body.cat ? String(body.cat) : null;
    if (!(await catExists(cat)))
      return Response.json({ error: "دسته‌بندی پیدا نشد." }, { status: 400 });

    const base = slugify(body.id || name);
    const cols = ["id", ...COLS];
    const vals = [base, ...COLS.map((c) => coerce(c, body[c]))];
    const ph = cols.map((c, i) => (JSON_FIELDS.has(c) ? `$${i + 1}::jsonb` : `$${i + 1}`));
    const sql = `INSERT INTO products (${cols.join(",")}) VALUES (${ph.join(",")}) RETURNING id`;

    // unique id: retry with -2, -3… on PK collision
    for (let n = 1; n <= 50; n++) {
      vals[0] = n === 1 ? base : `${base}-${n}`;
      try {
        const row = await q1(sql, vals);
        return Response.json({ id: row.id }, { status: 201 });
      } catch (err) {
        if (err && err.code === "23505") continue;
        throw err;
      }
    }
    return Response.json({ error: "ثبت نشد. دوباره تلاش کن." }, { status: 500 });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: "دسترسی نداری." }, { status: 401 });

    const body = await req.json().catch(() => null);
    const id = String(body?.id ?? "");
    if (!id) return Response.json({ error: "شناسه لازمه." }, { status: 400 });

    if ("cat" in body && !(await catExists(body.cat ? String(body.cat) : null)))
      return Response.json({ error: "دسته‌بندی پیدا نشد." }, { status: 400 });

    const sets = [];
    const vals = [];
    for (const c of COLS) {
      if (!(c in body)) continue;
      vals.push(coerce(c, body[c]));
      sets.push(JSON_FIELDS.has(c) ? `${c} = $${vals.length}::jsonb` : `${c} = $${vals.length}`);
    }
    if (sets.length === 0) return Response.json({ error: "چیزی برای تغییر نبود." }, { status: 400 });

    vals.push(id);
    const row = await q1(
      `UPDATE products SET ${sets.join(", ")}, updated_at = now() WHERE id = $${vals.length} RETURNING id`,
      vals
    );
    if (!row) return Response.json({ error: "محصول پیدا نشد." }, { status: 404 });
    return Response.json({ id: row.id });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: "دسترسی نداری." }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return Response.json({ error: "شناسه لازمه." }, { status: 400 });

    // appears in any order snapshot? keep history → archive instead of delete.
    const used = await q1(`SELECT 1 FROM orders WHERE items @> $1::jsonb LIMIT 1`, [
      JSON.stringify([{ id }]),
    ]);
    if (used) {
      const row = await q1(
        `UPDATE products SET archived = true, updated_at = now() WHERE id = $1 RETURNING id`,
        [id]
      );
      if (!row) return Response.json({ error: "محصول پیدا نشد." }, { status: 404 });
      return Response.json({ ok: true, archived: true });
    }
    const row = await q1(`DELETE FROM products WHERE id = $1 RETURNING id`, [id]);
    if (!row) return Response.json({ error: "محصول پیدا نشد." }, { status: 404 });
    return Response.json({ ok: true, deleted: true });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}
