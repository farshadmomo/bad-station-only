// ════════ /api/orders/[id] ════════
// PATCH → admin sets a new status (+ optional note). Records a timeline event.
import { q, q1 } from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/session";
import { STATUS, STATUS_FLOW } from "@/app/lib/orders-shared";

const VALID_STATUS = new Set([...STATUS_FLOW, "canceled"]);

export async function PATCH(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: "دسترسی نداری." }, { status: 401 });

    const { id } = await params; // params is a Promise in Next 16
    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0)
      return Response.json({ error: "شناسه‌ی نامعتبر." }, { status: 400 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      return Response.json({ error: "بدنه‌ی نامعتبر." }, { status: 400 });

    const status = body.status;
    if (!VALID_STATUS.has(status))
      return Response.json({ error: "وضعیتِ نامعتبر." }, { status: 400 });

    const note = String(body.note ?? "").trim() || STATUS[status]?.voice || null;

    const updated = await q1(
      `UPDATE orders
          SET status = $1, updated_at = now()
        WHERE id = $2
        RETURNING id, status`,
      [status, orderId]
    );
    if (!updated)
      return Response.json({ error: "سفارش پیدا نشد." }, { status: 404 });

    await q(
      `INSERT INTO order_events (order_id, status, note) VALUES ($1, $2, $3)`,
      [updated.id, status, note]
    );

    return Response.json({ ok: true, status: updated.status });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}
