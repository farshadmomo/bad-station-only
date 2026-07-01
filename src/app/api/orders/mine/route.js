// ════════ /api/orders/mine ════════
// the logged-in user's own orders, newest first, each with its timeline.
// This is the DEFAULT way a signed-in customer tracks orders; the public
// code lookup (/api/orders/track) is the fallback for guests / other devices.
import { q } from "@/app/lib/db";
import { getSession } from "@/app/lib/session";
import { STATUS } from "@/app/lib/orders-shared";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return Response.json({ error: "اول وارد شو." }, { status: 401 });
    }

    const orders = await q(
      `SELECT id, code, customer_name, total, status, created_at, items
         FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC, id DESC`,
      [session.uid]
    );

    if (orders.length === 0) return Response.json({ orders: [] });

    // pull every event for these orders in one query, then group
    const ids = orders.map((o) => o.id);
    const events = await q(
      `SELECT order_id, status, note, created_at
         FROM order_events
        WHERE order_id = ANY($1::int[])
        ORDER BY created_at ASC, id ASC`,
      [ids]
    );

    const byOrder = new Map();
    for (const e of events) {
      if (!byOrder.has(e.order_id)) byOrder.set(e.order_id, []);
      byOrder.get(e.order_id).push({
        status: e.status,
        label: STATUS[e.status]?.label ?? e.status,
        voice: STATUS[e.status]?.voice ?? "",
        note: e.note ?? null,
        created_at: e.created_at,
      });
    }

    const out = orders.map((o) => ({
      code: o.code,
      status: o.status,
      total: o.total,
      created_at: o.created_at,
      items: o.items,
      timeline: byOrder.get(o.id) ?? [],
    }));

    return Response.json({ orders: out });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}
