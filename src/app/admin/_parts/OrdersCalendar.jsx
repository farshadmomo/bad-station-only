"use client";

// ════════ Orders calendar ════════
// Jalali month grid (native Intl persian calendar — no library). One small
// colored rect per order on its created_at day, colored by status. RTL.
import { useEffect, useMemo, useState } from "react";
import { STATUS, STATUS_COLOR } from "@/app/lib/orders-shared";
import { fa } from "@/app/lib/products";

// persian week starts Saturday; JS getDay(): Sun=0…Sat=6 → shift so Sat=0
const WEEKDAYS = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
const colIdx = (date) => (date.getDay() + 1) % 7;

// local YYYY-MM-DD key (matches a Date to the day an order was created, locally)
const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const PF = new Intl.DateTimeFormat("en-US-u-ca-persian", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});
function pParts(date) {
  const o = {};
  for (const p of PF.formatToParts(date)) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day };
}
const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};
// first Gregorian Date of the Jalali month that `anchor` falls in
const firstOfMonth = (anchor) => addDays(anchor, -(pParts(anchor).d - 1));

export default function OrdersCalendar() {
  const [orders, setOrders] = useState([]);
  const [phase, setPhase] = useState("loading"); // loading | ready | error
  const [anchor, setAnchor] = useState(() => new Date());

  useEffect(() => {
    let alive = true;
    setPhase("loading");
    fetch("/api/orders", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!alive) return;
        setOrders(d.orders || []);
        setPhase("ready");
      })
      .catch(() => alive && setPhase("error"));
    return () => {
      alive = false;
    };
  }, []);

  // orders grouped by local day key
  const byDay = useMemo(() => {
    const m = new Map();
    for (const o of orders) {
      const k = dayKey(new Date(o.created_at));
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(o);
    }
    return m;
  }, [orders]);

  // build the month: leading blanks + day cells
  const view = useMemo(() => {
    const first = firstOfMonth(anchor);
    const month = pParts(first).m;
    const days = [];
    for (let d = new Date(first); pParts(d).m === month; d = addDays(d, 1)) days.push(new Date(d));
    const cells = [];
    for (let i = 0; i < colIdx(first); i++) cells.push(null);
    for (const d of days) cells.push(d);
    return { first, days, cells };
  }, [anchor]);

  const monthLabel = view.first.toLocaleDateString("fa-IR", { month: "long", year: "numeric" });
  const todayKey = dayKey(new Date());

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header>
        <p className="stencil spray-soft text-xs text-crimson" dir="ltr">
          / CALENDAR
        </p>
        <h1 className="mt-3 font-display text-4xl text-concrete sm:text-5xl">تقویمِ سفارش‌ها</h1>
        <p className="mt-2 text-sm text-concrete-dim">هر مستطیل، یه سفارش. رنگ، وضعیتش.</p>
      </header>

      {/* month nav */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          data-hot
          onClick={() => setAnchor(addDays(firstOfMonth(anchor), -1))}
          aria-label="ماهِ قبل"
          className="chip min-h-11 rounded-full px-4 text-sm"
        >
          ‹ قبل
        </button>
        <h2 className="font-display text-xl text-concrete">{monthLabel}</h2>
        <button
          data-hot
          onClick={() => setAnchor(addDays(firstOfMonth(anchor), view.days.length))}
          aria-label="ماهِ بعد"
          className="chip min-h-11 rounded-full px-4 text-sm"
        >
          بعد ›
        </button>
      </div>

      {/* legend */}
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {Object.entries(STATUS).map(([k, v]) => (
          <li key={k} className="flex items-center gap-1.5 text-xs text-concrete-dim">
            <span className="h-3 w-3 rounded-sm" style={{ background: STATUS_COLOR[k] || "var(--line)" }} />
            {v.label}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {phase === "loading" && (
          <div className="h-96 animate-pulse rounded-sm border border-line bg-black-2" aria-hidden="true" />
        )}

        {phase === "error" && (
          <div className="rounded-sm border border-line bg-black-2 p-10 text-center">
            <p className="font-display text-2xl text-concrete">بارگیری نشد.</p>
            <p className="mt-2 text-sm text-concrete-dim">داده‌ها نیومد.</p>
          </div>
        )}

        {phase === "ready" && (
          <div className="rounded-sm border border-line bg-black-2 p-2 sm:p-3">
            {/* weekday headers */}
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((w) => (
                <div key={w} className="pb-1 text-center text-[0.7rem] text-concrete-dim">
                  {w}
                </div>
              ))}
            </div>
            {/* day cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {view.cells.map((d, i) => {
                if (!d) return <div key={`b${i}`} className="min-h-20 rounded-sm" />;
                const k = dayKey(d);
                const dayOrders = byDay.get(k) || [];
                const isToday = k === todayKey;
                return (
                  <div
                    key={k}
                    className="min-h-20 rounded-sm border bg-black-3 p-1.5"
                    style={{ borderColor: isToday ? "var(--crimson)" : "var(--line)" }}
                  >
                    <div className="tnum mb-1 text-left text-[0.7rem] text-concrete-dim">
                      {fa(pParts(d).d)}
                    </div>
                    <div className="flex max-h-16 flex-wrap content-start gap-1 overflow-y-auto">
                      {dayOrders.map((o) => (
                        <span
                          key={o.id}
                          className="h-2.5 w-3.5 rounded-[2px]"
                          style={{ background: STATUS_COLOR[o.status] || "var(--line)" }}
                          title={`${o.code} · ${STATUS[o.status]?.label ?? o.status}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
