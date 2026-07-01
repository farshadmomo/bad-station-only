// ════════ /api/analytics ════════
// GET → aggregated order analytics (admin only).
// Optional ?range=today|7d|30d|month|all  (default 30d), filters by created_at.
// All money columns are BIGINT in Postgres → they come back as strings, so we
// coerce every money value to Number before returning JSON.
import { q } from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/session";
import { STATUS, STATUS_FLOW } from "@/app/lib/orders-shared";
import { getProducts, getCategories } from "@/app/lib/catalogue";

// every status, in pipeline order, with canceled last
const ALL_STATUSES = [...STATUS_FLOW, "canceled"];

// Whitelisted lower-bound expressions, keyed by validated range. These are
// fixed SQL fragments (never interpolated user input) so they're injection-safe.
// Day-aligned boundaries keep the summary, status, product and per-day series
// all consistent with one another.
const RANGE_LOWER = {
  today: "date_trunc('day', now())",
  "7d": "date_trunc('day', now()) - interval '6 days'",
  "30d": "date_trunc('day', now()) - interval '29 days'",
  month: "date_trunc('month', now())",
  all: null, // no lower bound
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export async function GET(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: "دسترسی نداری." }, { status: 401 });

    // id→product and cat→label maps, sourced from the DB catalogue (was hardcoded)
    const [allProducts, cats] = await Promise.all([
      getProducts({ includeArchived: true }),
      getCategories(),
    ]);
    const prodMap = new Map(allProducts.map((p) => [p.id, p]));
    const catLabelMap = new Map(cats.map((c) => [c.id, c.label]));
    const catLabel = (id) => catLabelMap.get(id) ?? "متفرقه";

    let range = new URL(request.url).searchParams.get("range") || "30d";
    if (!(range in RANGE_LOWER)) range = "30d";

    const lower = RANGE_LOWER[range];
    const where = lower ? `created_at >= ${lower}` : "TRUE";

    // ── 1) revenue + count, broken down by status ──
    const statusRows = await q(
      `SELECT status,
              COUNT(*)::int                AS orders,
              COALESCE(SUM(total), 0)      AS revenue
         FROM orders
        WHERE ${where}
        GROUP BY status`
    );

    // ── 2) per-day series (gap-filled so the axis is continuous) ──
    // revenue here = kept money (non-canceled); orders = all orders that day.
    const seriesLower =
      range === "all"
        ? "date_trunc('day', COALESCE((SELECT MIN(created_at) FROM orders), now()))"
        : lower;
    const seriesRows = await q(
      `WITH days AS (
         SELECT generate_series(
                  ${seriesLower},
                  date_trunc('day', now()),
                  interval '1 day'
                ) AS day
       ),
       agg AS (
         SELECT date_trunc('day', created_at) AS day,
                COUNT(*)::int                 AS orders,
                COALESCE(SUM(total) FILTER (WHERE status <> 'canceled'), 0) AS revenue
           FROM orders
          WHERE ${where}
          GROUP BY 1
       )
       SELECT to_char(d.day, 'YYYY-MM-DD')   AS day,
              COALESCE(a.orders, 0)::int     AS orders,
              COALESCE(a.revenue, 0)         AS revenue
         FROM days d
         LEFT JOIN agg a ON a.day = d.day
        ORDER BY d.day`
    );

    // ── 3) per-product sales (qty + merchandise revenue), canceled excluded ──
    // Unroll the JSONB items array; guard non-array rows so it never errors.
    const productRows = await q(
      `SELECT it->>'id'                                          AS id,
              COALESCE(SUM((it->>'qty')::int), 0)::int           AS qty,
              COALESCE(SUM((it->>'price')::numeric
                         * (it->>'qty')::int), 0)                AS revenue
         FROM orders o
         CROSS JOIN LATERAL jsonb_array_elements(
           CASE WHEN jsonb_typeof(o.items) = 'array'
                THEN o.items ELSE '[]'::jsonb END
         ) AS it
        WHERE ${where}
          AND o.status <> 'canceled'
        GROUP BY it->>'id'`
    );

    // ── shape the status breakdown (zero-fill every status) ──
    const statusMap = {};
    for (const s of ALL_STATUSES) statusMap[s] = { orders: 0, revenue: 0 };
    for (const r of statusRows) {
      if (!statusMap[r.status]) statusMap[r.status] = { orders: 0, revenue: 0 };
      statusMap[r.status] = { orders: num(r.orders), revenue: num(r.revenue) };
    }

    let totalRevenue = 0;
    let totalOrders = 0;
    let income = 0; // kept money (non-canceled)
    let outcome = 0; // lost money (canceled)
    for (const s of ALL_STATUSES) {
      totalRevenue += statusMap[s].revenue;
      totalOrders += statusMap[s].orders;
      if (s === "canceled") outcome += statusMap[s].revenue;
      else income += statusMap[s].revenue;
    }
    const ratio = outcome > 0 ? income / outcome : null;
    const incomePct = income + outcome > 0 ? (income / (income + outcome)) * 100 : 100;

    const byStatus = ALL_STATUSES.map((s) => ({
      status: s,
      label: STATUS[s]?.label ?? s,
      orders: statusMap[s].orders,
      revenue: statusMap[s].revenue,
    }));

    const series = seriesRows.map((r) => ({
      day: r.day,
      orders: num(r.orders),
      revenue: num(r.revenue),
    }));

    // ── per-product, enriched from the server catalogue ──
    const products = productRows
      .map((r) => {
        const p = prodMap.get(r.id);
        const cat = p?.cat ?? "other";
        return {
          id: r.id,
          name: p?.name ?? r.id,
          cat,
          catLabel: catLabel(cat),
          qty: num(r.qty),
          revenue: num(r.revenue),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    // ── roll products up into categories ──
    const catMap = {};
    for (const p of products) {
      if (!catMap[p.cat]) catMap[p.cat] = { cat: p.cat, label: p.catLabel, qty: 0, revenue: 0 };
      catMap[p.cat].qty += p.qty;
      catMap[p.cat].revenue += p.revenue;
    }
    const categories = Object.values(catMap).sort((a, b) => b.revenue - a.revenue);

    return Response.json({
      range,
      totals: { revenue: totalRevenue, orders: totalOrders, delivered: statusMap.delivered.orders },
      split: { income, outcome, ratio, incomePct },
      byStatus,
      series,
      products,
      categories,
    });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}
