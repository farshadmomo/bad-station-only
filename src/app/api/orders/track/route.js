// ════════ /api/orders/track?code=BAD-XXXXX ════════
// public order tracking. Case-insensitive code match. Returns a hyped timeline.
import { q, q1 } from "@/app/lib/db";
import { STATUS } from "@/app/lib/orders-shared";

export async function GET(req) {
  try {
    const code = String(req.nextUrl.searchParams.get("code") ?? "").trim();
    if (!code) return Response.json({ error: "کدِ سفارش رو بده." }, { status: 400 });

    const order = await q1(
      `SELECT id, code, customer_name, total, status, created_at, items
         FROM orders
        WHERE UPPER(code) = UPPER($1)
        LIMIT 1`,
      [code]
    );
    if (!order)
      return Response.json({ error: "همچین سفارشی پیدا نشد." }, { status: 404 });

    const events = await q(
      `SELECT status, note, created_at
         FROM order_events
        WHERE order_id = $1
        ORDER BY created_at ASC, id ASC`,
      [order.id]
    );

    const timeline = events.map((e) => ({
      status: e.status,
      label: STATUS[e.status]?.label ?? e.status,
      voice: STATUS[e.status]?.voice ?? "",
      note: e.note ?? null,
      created_at: e.created_at,
    }));

    // first name only — keep it friendly, not fully identifying
    const firstName =
      String(order.customer_name ?? "").trim().split(/\s+/)[0] || order.customer_name;

    return Response.json({
      code: order.code,
      status: order.status,
      customer_name: firstName,
      total: order.total,
      created_at: order.created_at,
      items: order.items,
      timeline,
    });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}
