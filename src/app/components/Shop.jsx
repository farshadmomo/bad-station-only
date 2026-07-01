"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { toman, fa } from "../lib/products";
import { useCart } from "./CartProvider";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Shop() {
  const root = useRef(null);
  const [cat, setCat] = useState("all");
  const [data, setData] = useState(null); // { products, categories } | null while loading
  const [failed, setFailed] = useState(false);

  // pull the live catalogue (stock + reservations live in the DB now)
  useEffect(() => {
    let alive = true;
    fetch("/api/catalogue", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const products = data?.products ?? [];
  const categories = data?.categories ?? [];
  const list = useMemo(
    () => (cat === "all" ? products : products.filter((p) => p.cat === cat)),
    [cat, products]
  );

  // reveal the heading + filter once — keep it out of the [cat,data] effect so
  // re-running (catalogue load / chip click) can't re-hide it at opacity 0
  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set(".section-head", { opacity: 1, y: 0 });
        return;
      }
      gsap.from(".section-head", {
        y: 40, opacity: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: ".section-head", start: "top 85%", once: true },
      });
    },
    { scope: root }
  );

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set(".product-card", { opacity: 1, y: 0 });
        return;
      }
      if (!data) return; // wait for cards to exist before revealing
      gsap.from(".product-card", {
        y: 48, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.07,
        scrollTrigger: { trigger: ".product-grid", start: "top 80%" },
      });
    },
    { scope: root, dependencies: [cat, data] }
  );

  return (
    <section id="shop" ref={root} className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="section-head">
        <p className="stencil spray-soft text-sm text-crimson" dir="ltr">/ THE SHOP</p>
        <h2 className="mt-2 font-display text-5xl leading-tight text-concrete sm:text-7xl">
          چیزایی که <span className="text-crimson">بد</span> می‌خوایشون
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-7 text-concrete-dim">
          بریز تو سبد، نهایی کن، با چند کلیک سفارش بده. یه کدِ پیگیری می‌گیری و
          قدم‌به‌قدم می‌بینی سفارشت کجاست.
        </p>
      </div>

      {/* category filter */}
      {categories.length > 0 && (
        <div className="section-head mt-9 flex flex-wrap gap-2" role="tablist" aria-label="دسته‌بندی محصولات">
          {categories.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={cat === c.id}
              data-on={cat === c.id}
              data-hot
              onClick={() => setCat(c.id)}
              className="chip min-h-11 rounded-full px-5 text-sm"
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {failed ? (
        <p className="mt-12 text-center text-sm text-concrete-dim">
          فروشگاه الان لود نشد. صفحه رو تازه کن.
        </p>
      ) : !data ? (
        /* skeleton while the catalogue loads */
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-sm border border-line bg-black-2">
              <div className="aspect-[3/4] w-full animate-pulse bg-black-3 motion-reduce:animate-none" />
              <div className="space-y-2 p-3 sm:p-5">
                <div className="h-5 w-2/3 animate-pulse rounded bg-black-3 motion-reduce:animate-none" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-black-3 motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* grid — two columns on mobile */
        <div className="product-grid mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3">
          {list.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProductCard({ p }) {
  const { add, openCart } = useCart();
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState("");

  const out = p.available <= 0;
  const low = !out && p.available <= 2;

  const quickAdd = async (e) => {
    e.preventDefault();
    if (out) return;
    const r = await add({ id: p.id, color: p.colors[0], size: p.sizes[0], qty: 1 });
    if (r?.error) {
      setErr(r.error);
      setTimeout(() => setErr(""), 2500);
      return;
    }
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="product-card reveal group flex flex-col overflow-hidden rounded-sm border border-line bg-black-2">
      {/* image + info link to the detail page */}
      <Link href={`/product/${p.id}`} data-hot className="flex flex-1 flex-col">
        <div className="relative overflow-hidden border-b border-line bg-black">
          {p.tag && (
            <span className="absolute top-2.5 right-2.5 z-10 rounded-sm bg-crimson px-2 py-0.5 text-[11px] text-concrete sm:px-2.5 sm:py-1 sm:text-xs">
              {p.tag}
            </span>
          )}
          <img
            src={p.img}
            alt={p.alt}
            loading="lazy"
            className="aspect-[3/4] w-full object-cover grayscale-[0.5] transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:grayscale-0"
            style={out ? { opacity: 0.55 } : undefined}
          />
        </div>

        <div className="flex flex-1 flex-col p-3 sm:p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-lg leading-tight text-concrete sm:text-2xl">{p.name}</h3>
          </div>
          {p.tagline && (
            <p className="mt-0.5 text-[12px] text-crimson sm:text-[13px]">{p.tagline}</p>
          )}
          <p className="mt-1.5 hidden text-[13px] leading-6 text-concrete-dim sm:line-clamp-2 sm:block">
            {p.note}
          </p>
          <div className="mt-3 flex items-baseline justify-between gap-2 sm:mt-auto sm:pt-3">
            <span className="tnum text-sm text-concrete-dim" dir="rtl">
              {toman(p.price)}<span className="mr-1 text-xs">تومان</span>
            </span>
            {out ? (
              <span className="text-[11px] text-concrete-dim">ناموجود</span>
            ) : low ? (
              <span className="text-[11px] text-crimson">تنها {fa(p.available)} تا مونده</span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* quick add */}
      <div className="p-3 pt-0 sm:p-5 sm:pt-0">
        <button
          onClick={quickAdd}
          data-hot
          disabled={out}
          className="min-h-11 w-full rounded-sm border border-crimson bg-black px-3 text-[13px] text-concrete transition-colors hover:bg-crimson disabled:cursor-not-allowed disabled:border-line disabled:text-concrete-dim disabled:hover:bg-black sm:text-sm"
          style={added ? { background: "var(--crimson)" } : undefined}
        >
          {out ? "ناموجود" : err ? err : added ? "ریخت تو سبد ✓" : "بریز تو سبد"}
        </button>
      </div>
    </article>
  );
}
