"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CATEGORIES, PRODUCTS, toman } from "../lib/products";
import { useCart } from "./CartProvider";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Shop() {
  const root = useRef(null);
  const [cat, setCat] = useState("all");

  const list = useMemo(
    () => (cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === cat)),
    [cat]
  );

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.from(".section-head", {
        y: 40, opacity: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: ".section-head", start: "top 85%" },
      });
      if (reduce) {
        gsap.set(".product-card", { opacity: 1, y: 0 });
        return;
      }
      gsap.from(".product-card", {
        y: 48, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08,
        scrollTrigger: { trigger: ".product-grid", start: "top 78%" },
      });
    },
    { scope: root, dependencies: [cat] }
  );

  return (
    <section id="shop" ref={root} className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="section-head">
        <p className="font-stamp text-sm tracking-[0.3em] text-crimson" dir="ltr">/ THE SHOP</p>
        <h2 className="mt-2 font-display text-5xl leading-tight text-concrete sm:text-7xl">
          چیزایی که <span className="text-crimson">به‌زور</span> نشونت می‌دیم
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-7 text-concrete-dim">
          آره، سبدِ خرید هم داریم. بریز توش، نهایی کن، بعدش با ما حرف بزن. بلدیم
          سایت بسازیم؛ فقط حسش رو نداریم.
        </p>
      </div>

      {/* category filter */}
      <div className="section-head mt-9 flex flex-wrap gap-2" role="tablist" aria-label="دسته‌بندی محصولات">
        {CATEGORIES.map((c) => (
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

      {/* grid */}
      <div className="product-grid mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}

function ProductCard({ p }) {
  const { add, openCart } = useCart();
  const [color, setColor] = useState(p.colors[0]);
  const [size, setSize] = useState(p.sizes[0]);
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    add({
      id: p.id,
      name: p.name,
      price: p.price,
      img: p.img,
      color,
      size,
      qty: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="product-card reveal group flex flex-col overflow-hidden rounded-sm border border-line bg-black-2">
      {/* image */}
      <div className="relative overflow-hidden border-b border-line bg-black">
        {p.tag && (
          <span className="absolute top-3 right-3 z-10 rounded-sm bg-crimson px-2.5 py-1 text-xs text-concrete">
            {p.tag}
          </span>
        )}
        <img
          src={p.img}
          alt={p.alt}
          loading="lazy"
          className="aspect-[3/4] w-full object-cover grayscale-[0.5] transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:grayscale-0"
        />
      </div>

      {/* content — on its own solid tile so every control reads off the concrete wall */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* info */}
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-2xl text-concrete">{p.name}</h3>
          <span className="tnum shrink-0 text-sm text-concrete-dim" dir="rtl">
            {toman(p.price)}<span className="mr-1 text-xs">تومان</span>
          </span>
        </div>
        <p className="mt-1.5 text-[13px] leading-6 text-concrete-dim">{p.note}</p>

        {/* colors */}
        {p.colors.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {p.colors.map((c) => (
              <button
                key={c}
                data-hot
                data-on={color === c}
                onClick={() => setColor(c)}
                className="chip swatch min-h-9 rounded-full px-3 text-xs"
                aria-pressed={color === c}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* sizes */}
        <div className="mt-2 mb-4 flex flex-wrap gap-2">
          {p.sizes.map((s) => (
            <button
              key={s}
              data-hot
              data-on={size === s}
              onClick={() => setSize(s)}
              className="chip min-h-9 min-w-9 rounded-sm px-3 text-xs tnum"
              aria-pressed={size === s}
              dir="ltr"
            >
              {s}
            </button>
          ))}
        </div>

        {/* add */}
        <button
          onClick={onAdd}
          onDoubleClick={openCart}
          data-hot
          className="mt-auto min-h-11 rounded-sm border border-crimson bg-black px-5 text-sm text-concrete transition-colors hover:bg-crimson"
          style={added ? { background: "var(--crimson)" } : undefined}
        >
          {added ? "ریختم تو سبد. حالا برو." : "بریز تو سبد"}
        </button>
      </div>
    </article>
  );
}
