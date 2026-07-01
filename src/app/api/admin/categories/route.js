// ════════ /api/admin/categories ════════
// Admin-only category CRUD.
//   GET            → all categories
//   POST   {…}     → create (id slug from label when absent)
//   PATCH  {id,…}  → update label / sort
//   DELETE ?id=    → delete (products.cat is set NULL by FK, never broken)
import { q, q1 } from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/session";

function slugify(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9؀-ۿ-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || `c-${Date.now().toString(36)}`;
}

const toSort = (v) => Math.max(0, Math.round(Number(v)) || 0);

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: "دسترسی نداری." }, { status: 401 });
    const categories = await q(`SELECT id, label, sort FROM categories ORDER BY sort, label`);
    return Response.json({ categories });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: "دسترسی نداری." }, { status: 401 });

    const body = await req.json().catch(() => null);
    const label = String(body?.label ?? "").trim();
    if (label.length < 1) return Response.json({ error: "عنوانِ دسته رو بنویس." }, { status: 400 });
    const sort = toSort(body.sort);
    const base = slugify(body.id || label);

    for (let n = 1; n <= 50; n++) {
      const id = n === 1 ? base : `${base}-${n}`;
      try {
        const row = await q1(
          `INSERT INTO categories (id, label, sort) VALUES ($1, $2, $3) RETURNING id`,
          [id, label, sort]
        );
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

    const sets = [];
    const vals = [];
    if ("label" in body) {
      const label = String(body.label ?? "").trim();
      if (label.length < 1) return Response.json({ error: "عنوان خالیه." }, { status: 400 });
      vals.push(label);
      sets.push(`label = $${vals.length}`);
    }
    if ("sort" in body) {
      vals.push(toSort(body.sort));
      sets.push(`sort = $${vals.length}`);
    }
    if (sets.length === 0) return Response.json({ error: "چیزی برای تغییر نبود." }, { status: 400 });

    vals.push(id);
    const row = await q1(
      `UPDATE categories SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING id`,
      vals
    );
    if (!row) return Response.json({ error: "دسته پیدا نشد." }, { status: 404 });
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
    const row = await q1(`DELETE FROM categories WHERE id = $1 RETURNING id`, [id]);
    if (!row) return Response.json({ error: "دسته پیدا نشد." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}
