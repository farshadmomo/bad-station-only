"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { STATUS, STATUS_FLOW, statusIndex } from "@/app/lib/orders-shared";
import { toman, fa } from "@/app/lib/products";
import Stepper from "./Stepper";

gsap.registerPlugin(useGSAP);

function faDate(iso, withTime = false) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return withTime
      ? d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" })
      : d.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export default function TrackBoard() {
  const params = useSearchParams();
  const root = useRef(null);
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | loading | found | notfound | error
  const [order, setOrder] = useState(null);
  const [me, setMe] = useState(undefined); // undefined = loading, null = guest
  const [myOrders, setMyOrders] = useState([]);
  const detailRef = useRef(null);

  // account-first: who am i, and do i have orders?
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "same-origin" });
        const meData = meRes.ok ? await meRes.json() : { user: null };
        if (!alive) return;
        setMe(meData.user ?? null);
        if (meData.user) {
          const r = await fetch("/api/orders/mine", { credentials: "same-origin" });
          if (r.ok && alive) {
            const d = await r.json();
            setMyOrders(d.orders ?? []);
          }
        }
      } catch {
        if (alive) setMe(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // open one of "my orders" in the detail view (reuses OrderView)
  const openOrder = (o) => {
    setOrder(o);
    setCode(o.code);
    setPhase("found");
    window.history.replaceState(null, "", `${window.location.pathname}?code=${encodeURIComponent(o.code)}`);
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  async function lookup(raw) {
    const c = (raw || "").trim().toUpperCase();
    if (!c) return;
    setPhase("loading");
    try {
      const res = await fetch(`/api/orders/track?code=${encodeURIComponent(c)}`);
      if (res.status === 404) {
        setOrder(null);
        setPhase("notfound");
        return;
      }
      if (!res.ok) {
        setPhase("error");
        return;
      }
      const data = await res.json();
      setOrder(data);
      setPhase("found");
    } catch {
      setPhase("error");
    }
  }

  // auto look-up when arriving with ?code= in the URL (shareable links)
  useEffect(() => {
    const fromUrl = params.get("code");
    if (fromUrl) {
      setCode(fromUrl.toUpperCase());
      lookup(fromUrl);
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    // reflect the code in the URL without a navigation, so the look-up is shareable
    const url = `${window.location.pathname}?code=${encodeURIComponent(c)}`;
    window.history.replaceState(null, "", url);
    lookup(c);
  };

  // tasteful reveal once an order resolves
  useGSAP(
    () => {
      if (phase !== "found") return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set(".track-reveal", { opacity: 1, y: 0 });
        return;
      }
      gsap.from(".track-reveal", {
        y: 24,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.08,
      });
    },
    { scope: root, dependencies: [phase, order?.code] }
  );

  const isClosed = (o) => o.status === "delivered" || o.status === "canceled";
  const activeOrders = myOrders.filter((o) => !isClosed(o));
  const closedOrders = myOrders.filter(isClosed);

  return (
    <div ref={root}>
      {/* eyebrow + heading */}
      <header>
        <p className="stencil spray-soft text-xs text-crimson" dir="ltr">
          / TRACK ORDER
        </p>
        <h1 className="mt-3 font-display text-5xl leading-tight text-concrete sm:text-6xl">
          سفارشت <span className="text-crimson">کجاست؟</span>
        </h1>
        <p className="mt-3 max-w-md text-sm leading-7 text-concrete-dim">
          {me
            ? "سفارش‌هات این‌جان. روی هرکدوم بزن تا ببینی کجای راهه."
            : "کدِ سفارش رو بزن، لحظه‌ای ببین کجا کارِ. هرجا باشه، بد داره می‌رسه دستت."}
        </p>
      </header>

      {/* ── account-first: my orders ── */}
      {me && myOrders.length > 0 && (
        <section className="mt-9">
          <h2 className="font-display text-2xl text-concrete">سفارش‌های من</h2>

          {activeOrders.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 font-display text-sm text-concrete-dim">
                در جریان <span className="tnum">({fa(activeOrders.length)})</span>
              </h3>
              <ul className="space-y-3">
                {activeOrders.map((o) => (
                  <MyOrderCard key={o.code} order={o} active={order?.code === o.code} onOpen={() => openOrder(o)} />
                ))}
              </ul>
            </div>
          )}

          {closedOrders.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 font-display text-sm text-concrete-dim">
                بسته‌شده <span className="tnum">({fa(closedOrders.length)})</span>
              </h3>
              <ul className="space-y-3">
                {closedOrders.map((o) => (
                  <MyOrderCard key={o.code} order={o} active={order?.code === o.code} onOpen={() => openOrder(o)} />
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ── code lookup (default for guests, fallback for members) ── */}
      <section className={me && myOrders.length > 0 ? "mt-12 border-t border-line pt-9" : "mt-9"}>
        {me && myOrders.length > 0 ? (
          <h2 className="font-display text-xl text-concrete-dim">یا با کدِ سفارش پیگیری کن</h2>
        ) : me === null ? (
          <p className="text-sm leading-7 text-concrete-dim">
            <a href="/login" data-hot className="text-crimson underline-offset-4 hover:underline">
              وارد شو
            </a>{" "}
            تا همه‌ی سفارش‌هات یه‌جا باشن، یا همین‌جا با کدِ سفارش پیگیری کن.
          </p>
        ) : null}

        <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="track-code" className="sr-only">
              کدِ سفارش
            </label>
            <input
              id="track-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BAD-7F3K9"
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              className="field tnum min-h-12 w-full rounded-sm px-4 text-center font-stamp text-lg tracking-[0.3em] placeholder:tracking-[0.3em]"
            />
          </div>
          <button
            type="submit"
            data-hot
            disabled={phase === "loading"}
            className="min-h-12 rounded-sm bg-crimson px-7 text-base text-concrete transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 sm:min-w-40"
          >
            {phase === "loading" ? "یه لحظه…" : "ردگیری کن"}
          </button>
        </form>
      </section>

      {/* screen-reader status announcer */}
      <p className="sr-only" role="status" aria-live="polite">
        {phase === "loading"
          ? "در حال جستجو"
          : phase === "found"
          ? `وضعیت: ${STATUS[order?.status]?.label ?? ""}`
          : phase === "notfound"
          ? "سفارش پیدا نشد"
          : phase === "error"
          ? "خطا در جستجو"
          : ""}
      </p>

      {/* states */}
      <div ref={detailRef} className="mt-12 scroll-mt-28">
        {phase === "loading" && <SkeletonOrder />}
        {phase === "error" && <ErrorState onRetry={() => lookup(code)} />}
        {phase === "notfound" && <NotFound code={code} />}
        {phase === "found" && order && <OrderView order={order} />}
      </div>
    </div>
  );
}

function OrderView({ order }) {
  const canceled = order.status === "canceled";
  const meta = STATUS[order.status] || { label: order.status, voice: "" };
  // oldest → newest, top to bottom: ثبت شد … ارسال شد … تحویل شد
  const timeline = [...(order.timeline || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  return (
    <div className="space-y-10">
      {/* status hero */}
      <section
        className="track-reveal rounded-sm border bg-black-2 p-5 sm:p-7"
        style={{ borderColor: canceled ? "var(--crimson)" : "var(--line)" }}
      >
        {canceled ? (
          <div className="text-center sm:text-right">
            <p className="stencil spray-soft text-xs text-crimson" dir="ltr">
              / CANCELED
            </p>
            <p className="mt-2 font-display text-4xl text-concrete">این سفارش لغو شد.</p>
            <p className="mt-2 text-sm leading-7 text-concrete-dim">{meta.voice}</p>
          </div>
        ) : (
          <>
            <Stepper status={order.status} />
            <div className="mt-7 border-t border-line pt-5">
              <p className="stencil text-[11px] text-crimson" dir="ltr">
                / {String(order.status).toUpperCase()}
              </p>
              <p className="mt-2 font-display text-3xl leading-snug text-concrete sm:text-4xl">
                {meta.voice}
              </p>
            </div>
          </>
        )}
      </section>

      {/* summary */}
      <section className="track-reveal">
        <SummaryCard order={order} />
      </section>

      {/* timeline */}
      {timeline.length > 0 && (
        <section className="track-reveal">
          <h2 className="font-display text-2xl text-concrete">مسیرِ سفارش</h2>
          <Timeline events={timeline} />
        </section>
      )}
    </div>
  );
}

function SummaryCard({ order }) {
  return (
    <div className="rounded-sm border border-line bg-black-2 p-5 sm:p-6">
      {/* code + date */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-xs text-concrete-dim">کدِ سفارش</p>
          <p className="font-stamp text-2xl tracking-[0.2em] text-crimson" dir="ltr">
            {order.code}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-concrete-dim">تاریخِ ثبت</p>
          <p className="tnum text-sm text-concrete">{faDate(order.created_at)}</p>
        </div>
      </div>

      {/* items */}
      <ul className="mt-4 space-y-3">
        {(order.items || []).map((it, idx) => (
          <li key={idx} className="flex gap-3">
            {it.img ? (
              <img
                src={it.img}
                alt=""
                loading="lazy"
                className="h-16 w-14 shrink-0 border border-line object-cover"
              />
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-base leading-tight text-concrete">{it.name}</p>
                <p className="tnum shrink-0 text-sm text-concrete-dim">
                  {toman((it.price || 0) * (it.qty || 1))}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-concrete-dim">
                {it.color ? <span>{it.color}</span> : null}
                {it.color && it.size ? " · " : ""}
                {it.size ? (
                  <span>
                    سایز <span dir="ltr">{it.size}</span>
                  </span>
                ) : null}
                {" · "}
                <span className="tnum">×{fa(it.qty || 1)}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* total */}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <span className="font-display text-lg text-concrete">جمعِ کل</span>
        <span className="tnum font-display text-xl text-crimson">
          {toman(order.total || 0)} <span className="text-sm text-concrete-dim">تومان</span>
        </span>
      </div>
    </div>
  );
}

function Timeline({ events }) {
  return (
    <ol className="mt-4">
      {events.map((e, i) => {
        const m = STATUS[e.status] || {};
        const label = e.label || m.label || e.status;
        const voice = e.voice || m.voice || "";
        const last = i === events.length - 1;
        const canceled = e.status === "canceled";
        return (
          <li key={i} className="flex gap-4 pb-6">
            {/* rail */}
            <div className="flex flex-col items-center">
              <span
                className="mt-1 h-3 w-3 shrink-0 rounded-sm"
                style={{ background: last ? "var(--crimson)" : "var(--line-bright)" }}
              />
              {!last && <span className="w-px flex-1" style={{ background: "var(--line)" }} />}
            </div>
            <div className="-mt-0.5 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className={`font-display text-lg ${canceled ? "text-crimson" : "text-concrete"}`}>
                  {label}
                </p>
                <p className="tnum text-xs text-concrete-dim">{faDate(e.created_at, true)}</p>
              </div>
              {voice && <p className="mt-0.5 text-sm leading-6 text-concrete-dim">{voice}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function MyOrderCard({ order, active, onOpen }) {
  const canceled = order.status === "canceled";
  const idx = statusIndex(order.status);
  const total = STATUS_FLOW.length;
  const pct = canceled ? 100 : Math.round(((idx + 1) / total) * 100);
  const meta = STATUS[order.status] || { label: order.status };
  const firstImg = (order.items || [])[0]?.img;

  return (
    <li>
      <button
        onClick={onOpen}
        data-hot
        aria-pressed={active}
        className="flex w-full items-center gap-4 rounded-sm border bg-black-2 p-3 text-right transition-colors hover:border-[var(--line-bright)] sm:p-4"
        style={{ borderColor: active ? "var(--crimson)" : "var(--line)" }}
      >
        {firstImg && (
          <img src={firstImg} alt="" className="h-16 w-14 shrink-0 border border-line object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span className="font-stamp text-lg tracking-[0.2em] text-crimson" dir="ltr">
              {order.code}
            </span>
            <span
              className="rounded-sm border px-2 py-0.5 text-xs"
              style={{
                borderColor: canceled ? "var(--crimson)" : "var(--line-bright)",
                color: canceled ? "var(--crimson)" : "var(--concrete)",
              }}
            >
              {meta.label}
            </span>
          </div>
          {/* mini progress */}
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: "var(--crimson)" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-concrete-dim">
            <span>{canceled ? "لغو شده" : `قدمِ ${fa(idx + 1)} از ${fa(total)}`}</span>
            <span className="tnum">{toman(order.total || 0)} تومان</span>
          </div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-concrete-dim">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </li>
  );
}

function NotFound({ code }) {
  return (
    <div className="rounded-sm border border-line bg-black-2 p-8 text-center">
      <p className="stencil spray-soft text-xs text-crimson" dir="ltr">
        / NOT FOUND
      </p>
      <p className="mt-3 font-display text-3xl text-concrete">این کد رو پیدا نکردیم.</p>
      <p className="mt-2 text-sm leading-7 text-concrete-dim">
        {code ? (
          <>
            کدِ «
            <span className="font-stamp tracking-wider text-concrete" dir="ltr">
              {code}
            </span>
            » تو سیستم نیست.{" "}
          </>
        ) : null}
        یه بار دیگه چکش کن. شایدم تازه ثبت شده و چند لحظه‌ی دیگه بالا میاد.
      </p>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="rounded-sm border border-line bg-black-2 p-8 text-center">
      <p className="font-display text-2xl text-concrete">یه چیزی این وسط قاطی شد.</p>
      <p className="mt-2 text-sm text-concrete-dim">ارتباط برقرار نشد. دوباره امتحان کن.</p>
      <button
        onClick={onRetry}
        data-hot
        className="mt-5 min-h-11 rounded-sm border border-crimson px-6 text-sm text-concrete transition-colors hover:bg-crimson"
      >
        دوباره
      </button>
    </div>
  );
}

function SkeletonOrder() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-28 animate-pulse rounded-sm border border-line bg-black-2" />
      <div className="h-52 animate-pulse rounded-sm border border-line bg-black-2" />
    </div>
  );
}
