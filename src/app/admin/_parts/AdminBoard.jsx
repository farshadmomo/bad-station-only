"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { STATUS, STATUS_FLOW } from "@/app/lib/orders-shared";
import { fa } from "@/app/lib/products";
import OrderCard from "./OrderCard";
import Filters from "./Filters";
import Analytics from "./Analytics";
import ProductsManager from "./ProductsManager";
import OrdersCalendar from "./OrdersCalendar";

gsap.registerPlugin(useGSAP);

const FILTERS = [
  { id: "all", label: "همه" },
  ...STATUS_FLOW.map((s) => ({ id: s, label: STATUS[s].label })),
  { id: "canceled", label: STATUS.canceled.label },
];

// work-priority: new orders first, then down the pipeline, canceled last
const PRIORITY = { received: 0, confirmed: 1, packing: 2, shipped: 3, delivered: 4, canceled: 5 };

// normalise persian/arabic digits to latin (mirrors the API/cart)
const normDigits = (s) =>
  String(s ?? "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

function inFlight(c) {
  return (c.received || 0) + (c.confirmed || 0) + (c.packing || 0) + (c.shipped || 0);
}

// lower/upper bounds (Date | null) for a date-range selection
function rangeBounds(range, customFrom, customTo) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const back = (days) => {
    const f = new Date(startToday);
    f.setDate(f.getDate() - days);
    return f;
  };
  switch (range) {
    case "today":
      return { from: startToday, to: null };
    case "7d":
      return { from: back(6), to: null };
    case "30d":
      return { from: back(29), to: null };
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
    case "custom":
      return {
        from: customFrom ? new Date(`${customFrom}T00:00:00`) : null,
        to: customTo ? new Date(`${customTo}T23:59:59.999`) : null,
      };
    case "all":
    default:
      return { from: null, to: null };
  }
}

export default function AdminBoard({ adminName }) {
  const root = useRef(null);
  const [orders, setOrders] = useState([]);
  const [phase, setPhase] = useState("loading"); // loading | ready | error
  const [tab, setTab] = useState("orders"); // orders | products | calendar | analytics

  // task 8 controls
  const [statusFilter, setStatusFilter] = useState("all");
  const [range, setRange] = useState("today"); // default: today
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [sort, setSort] = useState("priority"); // default: work-priority
  const [search, setSearch] = useState("");

  async function load() {
    setPhase("loading");
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) {
        setPhase("error");
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setPhase("ready");
    } catch {
      setPhase("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  // date range → counts/chips/list all compose over this
  const dateFiltered = useMemo(() => {
    const { from, to } = rangeBounds(range, customFrom, customTo);
    if (!from && !to) return orders;
    return orders.filter((o) => {
      const t = new Date(o.created_at);
      if (from && t < from) return false;
      if (to && t > to) return false;
      return true;
    });
  }, [orders, range, customFrom, customTo]);

  // counts reflect the active date range
  const counts = useMemo(() => {
    const c = { all: dateFiltered.length };
    for (const s of [...STATUS_FLOW, "canceled"]) c[s] = 0;
    for (const o of dateFiltered) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [dateFiltered]);

  const statusFiltered = useMemo(
    () =>
      statusFilter === "all"
        ? dateFiltered
        : dateFiltered.filter((o) => o.status === statusFilter),
    [dateFiltered, statusFilter]
  );

  const searched = useMemo(() => {
    const term = normDigits(search).trim().toLowerCase();
    if (!term) return statusFiltered;
    return statusFiltered.filter((o) => {
      const hay = normDigits([o.code, o.customer_name, o.phone].join(" ")).toLowerCase();
      return hay.includes(term);
    });
  }, [statusFiltered, search]);

  const visible = useMemo(() => {
    const list = searched.slice();
    if (sort === "newest") {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sort === "oldest") {
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else {
      // priority: status group, then newest-first within the group
      list.sort((a, b) => {
        const pa = PRIORITY[a.status] ?? 99;
        const pb = PRIORITY[b.status] ?? 99;
        if (pa !== pb) return pa - pb;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }
    return list;
  }, [searched, sort]);

  // optimistic in-place update after a status change
  function applyChange(id, status) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o))
    );
  }

  useGSAP(
    () => {
      if (phase !== "ready" || tab !== "orders") return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set(".admin-card", { opacity: 1, y: 0 });
        return;
      }
      gsap.from(".admin-card", {
        y: 24,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.06,
      });
    },
    { scope: root, dependencies: [phase, tab, visible.length, statusFilter, range, sort, search] }
  );

  const emptySub =
    orders.length === 0
      ? "هنوز سفارشی ثبت نشده."
      : search.trim()
      ? "با این جست‌وجو سفارشی پیدا نشد."
      : dateFiltered.length === 0
      ? "تو این بازه‌ی زمانی سفارشی نیست. بازه رو بازتر کن."
      : "تو این وضعیت سفارشی نیست.";

  return (
    <main ref={root} className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      {/* view toggle */}
      <div
        className="inline-flex flex-wrap rounded-2xl border border-line bg-black-2 p-1"
        role="tablist"
        aria-label="نمای مدیریت"
      >
        <TabBtn active={tab === "orders"} onClick={() => setTab("orders")}>
          سفارش‌ها
        </TabBtn>
        <TabBtn active={tab === "products"} onClick={() => setTab("products")}>
          محصول‌ها
        </TabBtn>
        <TabBtn active={tab === "calendar"} onClick={() => setTab("calendar")}>
          تقویم
        </TabBtn>
        <TabBtn active={tab === "analytics"} onClick={() => setTab("analytics")}>
          تحلیل‌ها
        </TabBtn>
      </div>

      {tab === "analytics" ? (
        <Analytics />
      ) : tab === "products" ? (
        <ProductsManager />
      ) : tab === "calendar" ? (
        <OrdersCalendar />
      ) : (
        <>
          {/* head */}
          <header className="mt-6">
            <p className="stencil spray-soft text-xs text-crimson" dir="ltr">
              / ORDERS DASHBOARD
            </p>
            <h1 className="mt-3 font-display text-4xl text-concrete sm:text-5xl">
              سفارش‌ها
              {adminName ? (
                <span className="text-2xl text-concrete-dim">، {adminName}</span>
              ) : null}
            </h1>
          </header>

          {/* count summary (reflects the active date range) */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="کلِ سفارش‌ها" value={counts.all} accent />
            <Stat label="در جریان" value={inFlight(counts)} />
            <Stat label="تحویل‌شده" value={counts.delivered || 0} />
            <Stat label="لغوشده" value={counts.canceled || 0} />
          </div>

          {/* date range + sort + search */}
          <Filters
            range={range}
            setRange={setRange}
            customFrom={customFrom}
            setCustomFrom={setCustomFrom}
            customTo={customTo}
            setCustomTo={setCustomTo}
            sort={sort}
            setSort={setSort}
            search={search}
            setSearch={setSearch}
          />

          {/* status filter */}
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="فیلترِ وضعیت">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                data-hot
                data-on={statusFilter === f.id}
                aria-pressed={statusFilter === f.id}
                onClick={() => setStatusFilter(f.id)}
                className="chip min-h-11 rounded-full px-4 text-sm"
              >
                {f.label}
                <span className="tnum mr-1.5 text-xs opacity-70">{fa(counts[f.id] ?? 0)}</span>
              </button>
            ))}
          </div>

          {/* body */}
          <div className="mt-8">
            {phase === "loading" && <SkeletonList />}

            {phase === "error" && (
              <Empty
                title="بارگیری نشد."
                sub="ارتباط با سرور برقرار نشد. دوباره امتحان کن."
                action={
                  <button
                    onClick={load}
                    data-hot
                    className="min-h-11 rounded-sm border border-crimson px-6 text-sm text-concrete transition-colors hover:bg-crimson"
                  >
                    دوباره
                  </button>
                }
              />
            )}

            {phase === "ready" && visible.length === 0 && (
              <Empty title="چیزی اینجا نیست." sub={emptySub} />
            )}

            {phase === "ready" && visible.length > 0 && (
              <div className="space-y-5">
                {visible.map((o) => (
                  <OrderCard key={o.id} order={o} onChanged={applyChange} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      data-hot
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-10 rounded-full px-5 text-sm transition-colors ${
        active ? "text-concrete" : "text-concrete-dim hover:text-concrete"
      }`}
      style={active ? { background: "var(--crimson)" } : undefined}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-sm border border-line bg-black-2 px-4 py-3">
      <p className="text-xs text-concrete-dim">{label}</p>
      <p className={`tnum mt-0.5 font-display text-2xl ${accent ? "text-crimson" : "text-concrete"}`}>
        {fa(value)}
      </p>
    </div>
  );
}

function Empty({ title, sub, action }) {
  return (
    <div className="rounded-sm border border-line bg-black-2 p-10 text-center">
      <p className="font-display text-2xl text-concrete">{title}</p>
      {sub && <p className="mt-2 text-sm text-concrete-dim">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-44 animate-pulse rounded-sm border border-line bg-black-2" />
      ))}
    </div>
  );
}
