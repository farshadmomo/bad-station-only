"use client";

// ════════ Admin analytics ════════
// Fetches /api/analytics?range=… and renders KPI cards + lightweight inline
// SVG / CSS charts. No chart library. Three-color brand (crimson / concrete /
// black), RTL Persian, money via toman(), counts via fa().
import { useEffect, useMemo, useState } from "react";
import { toman, fa } from "@/app/lib/products";
import { STATUS_COLOR } from "@/app/lib/orders-shared";

const RANGES = [
  { id: "today", label: "امروز" },
  { id: "7d", label: "۷ روز" },
  { id: "30d", label: "۳۰ روز" },
  { id: "month", label: "این ماه" },
  { id: "all", label: "همه‌وقت" },
];

// hatched "void" for the lost/outcome portion of the income-vs-outcome bar
const HATCH = "repeating-linear-gradient(135deg, var(--concrete) 0 1.5px, transparent 1.5px 5px)";

// 8.27 → "۸٫۳"
function faDecimal(n, digits = 1) {
  return fa(Number(n).toFixed(digits).replace(".", "٫"));
}

// "2026-06-28" → Jalali short label in Persian digits
function faDayLabel(iso) {
  try {
    const [y, m, d] = String(iso).split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("fa-IR", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return fa(iso);
  }
}

export default function Analytics() {
  const [range, setRange] = useState("30d");
  const [metric, setMetric] = useState("revenue"); // time-series measure
  const [data, setData] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | ready | error
  const [tick, setTick] = useState(0); // retry trigger
  const [reveal, setReveal] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    let alive = true;
    setPhase("loading");
    setReveal(false);
    fetch(`/api/analytics?range=${range}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!alive) return;
        setData(d);
        setPhase("ready");
        requestAnimationFrame(() => alive && setReveal(true));
      })
      .catch(() => alive && setPhase("error"));
    return () => {
      alive = false;
    };
  }, [range, tick]);

  const shown = reduce || reveal;
  const empty = phase === "ready" && data && data.totals.orders === 0;

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header>
        <p className="stencil spray-soft text-xs text-crimson" dir="ltr">
          / ANALYTICS
        </p>
        <h1 className="mt-3 font-display text-4xl text-concrete sm:text-5xl">تحلیل‌ها</h1>
        <p className="mt-2 text-sm text-concrete-dim">نبضِ فروش، بی‌حاشیه.</p>
      </header>

      {/* range selector */}
      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="بازه‌ی زمانی">
        <span className="stencil ml-1 text-[0.7rem] text-concrete-dim" dir="ltr">
          / RANGE
        </span>
        {RANGES.map((r) => (
          <button
            key={r.id}
            data-hot
            data-on={range === r.id}
            aria-pressed={range === r.id}
            onClick={() => setRange(r.id)}
            className="chip min-h-11 rounded-full px-4 text-sm"
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {phase === "loading" && <AnalyticsSkeleton />}

        {phase === "error" && (
          <Panel className="p-10 text-center">
            <p className="font-display text-2xl text-concrete">بارگیری نشد.</p>
            <p className="mt-2 text-sm text-concrete-dim">داده‌های تحلیلی نیومد. دوباره امتحان کن.</p>
            <button
              onClick={() => setTick((t) => t + 1)}
              data-hot
              className="mt-5 min-h-11 rounded-sm border border-crimson px-6 text-sm text-concrete transition-colors hover:bg-crimson"
            >
              دوباره
            </button>
          </Panel>
        )}

        {empty && (
          <Panel className="p-10 text-center">
            <p className="font-display text-2xl text-concrete">هنوز داده‌ای نیست.</p>
            <p className="mt-2 text-sm text-concrete-dim">
              تو این بازه سفارشی ثبت نشده. بازه‌ی زمانی رو بازتر کن.
            </p>
          </Panel>
        )}

        {phase === "ready" && data && !empty && (
          <Report data={data} metric={metric} setMetric={setMetric} shown={shown} reduce={reduce} />
        )}
      </div>
    </main>
  );
}

function Report({ data, metric, setMetric, shown, reduce }) {
  const { totals, split, byStatus, series, products, categories } = data;
  const deliveredPct = totals.orders > 0 ? Math.round((totals.delivered / totals.orders) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="درآمد" value={`${toman(split.income)}`} unit="تومان" sub={`${fa(totals.orders)} سفارش`} accent />
        <Kpi label="سفارش‌ها" value={fa(totals.orders)} sub={`در این بازه`} />
        <Kpi label="تحویل‌شده" value={fa(totals.delivered)} sub={`${fa(deliveredPct)}٪ از کل`} />
        <Kpi
          label="نسبتِ درآمد به ازدست‌رفته"
          value={split.ratio == null ? "بدونِ ضرر" : `${faDecimal(split.ratio)} : ۱`}
          sub={split.outcome > 0 ? `${toman(split.outcome)} ازدست‌رفته` : "هیچ سفارشی لغو نشد"}
        />
      </div>

      {/* ── time series ── */}
      <section>
        <SectionHead
          title="روند فروش"
          hint={metric === "revenue" ? "درآمدِ روزانه (تومان)" : "تعدادِ سفارشِ روزانه"}
          right={
            <div className="flex gap-1.5" role="group" aria-label="معیارِ نمودار">
              {[
                { id: "revenue", label: "درآمد" },
                { id: "orders", label: "سفارش" },
              ].map((m) => (
                <button
                  key={m.id}
                  data-hot
                  data-on={metric === m.id}
                  aria-pressed={metric === m.id}
                  onClick={() => setMetric(m.id)}
                  className="chip min-h-9 rounded-full px-3 text-xs"
                >
                  {m.label}
                </button>
              ))}
            </div>
          }
        />
        <Panel className="p-4 sm:p-5">
          <TimeSeriesChart series={series} metric={metric} shown={shown} reduce={reduce} />
        </Panel>
      </section>

      {/* ── income vs outcome ── */}
      <section>
        <SectionHead title="درآمد در برابرِ ازدست‌رفته" hint="پولِ نگه‌داشته در برابرِ پولِ لغوشده" />
        <Panel className="p-4 sm:p-5">
          <SplitBar split={split} shown={shown} reduce={reduce} />
        </Panel>
      </section>

      {/* ── status distribution ── */}
      <section>
        <SectionHead title="پراکندگیِ وضعیت" hint="سهمِ هر وضعیت از کلِ سفارش‌ها" />
        <Panel className="p-4 sm:p-5">
          <StatusDist byStatus={byStatus} total={totals.orders} shown={shown} reduce={reduce} />
        </Panel>
      </section>

      {/* ── products + categories ── */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionHead title="پرفروش‌ها" hint="بر اساسِ فروش (تومان)" />
          <Panel className="p-4 sm:p-5">
            {products.length === 0 ? (
              <p className="py-6 text-center text-sm text-concrete-dim">فروشی ثبت نشده.</p>
            ) : (
              <>
                <HBarList
                  items={products.map((p) => ({ key: p.id, label: p.name, value: p.revenue }))}
                  fmt={(v) => `${toman(v)}`}
                  shown={shown}
                  reduce={reduce}
                />
                <ProductTable products={products} />
              </>
            )}
          </Panel>
        </section>

        <section>
          <SectionHead title="دسته‌بندی‌ها" hint="سهمِ فروشِ هر دسته" />
          <Panel className="p-4 sm:p-5">
            {categories.length === 0 ? (
              <p className="py-6 text-center text-sm text-concrete-dim">فروشی ثبت نشده.</p>
            ) : (
              <HBarList
                items={categories.map((c) => ({
                  key: c.cat,
                  label: c.label,
                  value: c.revenue,
                  meta: `${fa(c.qty)} عدد`,
                }))}
                fmt={(v) => `${toman(v)}`}
                shown={shown}
                reduce={reduce}
              />
            )}
          </Panel>
        </section>
      </div>
    </div>
  );
}

/* ───────────────────────── primitives ───────────────────────── */

function Panel({ children, className = "" }) {
  return <div className={`rounded-sm border border-line bg-black-2 ${className}`}>{children}</div>;
}

function SectionHead({ title, hint, right }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="font-display text-xl text-concrete">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-concrete-dim">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

function Kpi({ label, value, unit, sub, accent }) {
  return (
    <div className="rounded-sm border border-line bg-black-2 px-4 py-3.5">
      <p className="text-xs leading-5 text-concrete-dim">{label}</p>
      <p className={`tnum mt-1 font-display text-2xl leading-tight ${accent ? "text-crimson" : "text-concrete"}`}>
        {value}
        {unit && <span className="mr-1 text-xs text-concrete-dim">{unit}</span>}
      </p>
      {sub && <p className="tnum mt-1 text-xs text-concrete-dim">{sub}</p>}
    </div>
  );
}

/* ───────────────────────── time series ───────────────────────── */

function TimeSeriesChart({ series, metric, shown, reduce }) {
  const W = 720;
  const H = 240;
  const padX = 10;
  const padTop = 14;
  const padBottom = 6;
  const plotH = H - padTop - padBottom;

  const view = useMemo(() => {
    const n = Math.max(series.length, 1);
    const vals = series.map((d) => (metric === "revenue" ? d.revenue : d.orders));
    const max = Math.max(1, ...vals);
    const step = (W - padX * 2) / n;
    const barW = Math.max(2, Math.min(step * 0.62, 46));
    // oldest (index 0) sits at the RIGHT — correct reading order for RTL
    const bars = series.map((d, i) => {
      const v = metric === "revenue" ? d.revenue : d.orders;
      const h = (v / max) * plotH;
      const centerX = W - (padX + (i + 0.5) * step);
      return { x: centerX - barW / 2, y: padTop + (plotH - h), h, w: barW, v, day: d.day };
    });
    return { bars, max };
  }, [series, metric]);

  const gridY = [padTop, padTop + plotH / 2, padTop + plotH];
  const last = series[series.length - 1];
  const first = series[0];
  const fmt = (v) => (metric === "revenue" ? `${toman(v)} تومان` : `${fa(v)} سفارش`);

  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex items-baseline justify-between text-xs text-concrete-dim">
        <span className="tnum">بیشینه: {fmt(view.max)}</span>
        <span>{fa(series.length)} روز</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ height: "auto", display: "block" }}
        role="img"
        aria-label={`نمودارِ ${metric === "revenue" ? "درآمد" : "تعدادِ سفارش"} روزانه، بیشینه ${fmt(view.max)}`}
      >
        {gridY.map((gy, i) => (
          <line key={i} x1={padX} x2={W - padX} y1={gy} y2={gy} stroke="var(--line)" strokeWidth="1" />
        ))}
        {view.bars.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={Math.max(b.h, 0)}
            rx="1.5"
            fill="var(--crimson)"
            style={{
              transformBox: "fill-box",
              transformOrigin: "bottom",
              transform: shown ? "scaleY(1)" : "scaleY(0)",
              transition: reduce ? "none" : `transform 600ms cubic-bezier(0.22,1,0.36,1) ${Math.min(i * 10, 300)}ms`,
            }}
          >
            <title>
              {faDayLabel(b.day)} — {fmt(b.v)}
            </title>
          </rect>
        ))}
      </svg>
      {/* time axis: oldest at right, newest at left (RTL) */}
      <div className="mt-1.5 flex justify-between text-[0.7rem] text-concrete-dim">
        <span className="tnum">{first ? faDayLabel(first.day) : ""}</span>
        <span className="tnum">{last ? faDayLabel(last.day) : ""}</span>
      </div>
    </figure>
  );
}

/* ───────────────────────── income vs outcome ───────────────────────── */

function SplitBar({ split, shown, reduce }) {
  const total = split.income + split.outcome;
  const pct = total > 0 ? (split.income / total) * 100 : 100;
  const trans = reduce ? "none" : "transform 700ms cubic-bezier(0.22,1,0.36,1)";

  return (
    <div>
      <div
        className="flex h-4 w-full overflow-hidden rounded-full border border-line"
        role="img"
        aria-label={`درآمد ${toman(split.income)} تومان، ازدست‌رفته ${toman(split.outcome)} تومان`}
      >
        <div
          style={{
            width: `${pct}%`,
            background: "var(--crimson)",
            transformOrigin: "right",
            transform: shown ? "scaleX(1)" : "scaleX(0)",
            transition: trans,
          }}
          title={`درآمد: ${toman(split.income)} تومان`}
        />
        <div
          style={{ width: `${100 - pct}%`, background: HATCH }}
          title={`ازدست‌رفته: ${toman(split.outcome)} تومان`}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ background: "var(--crimson)" }} />
          <span className="text-concrete-dim">درآمد</span>
          <span className="tnum text-concrete">{toman(split.income)}</span>
          <span className="tnum text-xs text-concrete-dim">({faDecimal(pct, 0)}٪)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-line" style={{ background: HATCH }} />
          <span className="text-concrete-dim">ازدست‌رفته</span>
          <span className="tnum text-concrete">{toman(split.outcome)}</span>
          <span className="tnum text-xs text-concrete-dim">({faDecimal(100 - pct, 0)}٪)</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── status distribution ───────────────────────── */

function StatusDist({ byStatus, total, shown, reduce }) {
  const color = (s) => STATUS_COLOR[s.status] || "var(--line)";

  return (
    <div>
      <div
        className="flex h-4 w-full overflow-hidden rounded-full border border-line"
        role="img"
        aria-label={`پراکندگیِ وضعیتِ ${fa(total)} سفارش`}
      >
        {byStatus.map((s) => {
          const pct = total > 0 ? (s.orders / total) * 100 : 0;
          if (s.orders <= 0) return null;
          return (
            <div
              key={s.status}
              style={{
                width: `${pct}%`,
                minWidth: 4,
                background: color(s),
                transition: reduce ? "none" : "opacity 500ms ease, width 600ms cubic-bezier(0.22,1,0.36,1)",
                opacity: shown ? 1 : 0,
              }}
              title={`${s.label}: ${fa(s.orders)}`}
            />
          );
        })}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {byStatus.map((s) => {
          const pct = total > 0 ? Math.round((s.orders / total) * 100) : 0;
          return (
            <li key={s.status} className="flex items-center gap-2 text-sm">
              <span className="h-3 w-3 shrink-0 rounded-sm border border-line" style={{ background: color(s) }} />
              <span className="min-w-0 truncate text-concrete-dim">{s.label}</span>
              <span className="tnum mr-auto text-concrete">{fa(s.orders)}</span>
              <span className="tnum text-xs text-concrete-dim">{fa(pct)}٪</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ───────────────────────── horizontal bars ───────────────────────── */

function HBarList({ items, fmt, shown, reduce }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((it, idx) => {
        const pct = it.value > 0 ? Math.max(2, (it.value / max) * 100) : 0;
        return (
          <li key={it.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-concrete">{it.label}</span>
              <span className="tnum shrink-0 text-concrete-dim">{fmt(it.value)}</span>
            </div>
            <div className="relative mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-black-3">
              <div
                className="absolute inset-y-0 right-0 rounded-full"
                style={{
                  width: `${pct}%`,
                  background: "var(--crimson)",
                  transformOrigin: "right",
                  transform: shown ? "scaleX(1)" : "scaleX(0)",
                  transition: reduce ? "none" : `transform 650ms cubic-bezier(0.22,1,0.36,1) ${Math.min(idx * 40, 240)}ms`,
                }}
              />
            </div>
            {it.meta && <p className="tnum mt-1 text-[0.7rem] text-concrete-dim">{it.meta}</p>}
          </li>
        );
      })}
    </ul>
  );
}

function ProductTable({ products }) {
  return (
    <div className="mt-5 overflow-x-auto border-t border-line pt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-concrete-dim">
            <th scope="col" className="pb-2 text-right font-normal">محصول</th>
            <th scope="col" className="pb-2 text-left font-normal">تعداد</th>
            <th scope="col" className="pb-2 text-left font-normal">فروش</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t border-line/60">
              <td className="py-2 text-concrete">
                {p.name}
                <span className="mr-1 text-xs text-concrete-dim">· {p.catLabel}</span>
              </td>
              <td className="tnum py-2 text-left text-concrete-dim">{fa(p.qty)}</td>
              <td className="tnum py-2 text-left text-concrete">{toman(p.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────────────────── skeleton ───────────────────────── */

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-sm border border-line bg-black-2" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-sm border border-line bg-black-2" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-sm border border-line bg-black-2" />
        <div className="h-72 animate-pulse rounded-sm border border-line bg-black-2" />
      </div>
    </div>
  );
}
