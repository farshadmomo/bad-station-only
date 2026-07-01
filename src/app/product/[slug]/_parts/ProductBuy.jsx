"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { toman, fa } from "@/app/lib/products";
import { useCart } from "@/app/components/CartProvider";

// The buy box: colour swatches + size chips + quantity stepper + add button.
// Reflects the picked colour/size/qty into the cart line, then opens the cart.
export default function ProductBuy({ product }) {
  const { add, openCart } = useCart();
  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState("");
  const btnRef = useRef(null);

  const avail = product.available ?? 0;
  const out = avail <= 0;
  const low = !out && avail <= 2;
  const max = Math.min(avail, 9); // stepper never exceeds what's in stock

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(max, q + 1));

  const onAdd = async () => {
    if (out) return;
    setErr("");
    const r = await add({ id: product.id, color, size, qty });
    if (r?.error) {
      setErr(r.error);
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && btnRef.current) {
      gsap.fromTo(btnRef.current, { scale: 0.96 }, { scale: 1, duration: 0.45, ease: "power3.out" });
    }
    openCart();
  };

  return (
    <div className="rounded-sm border border-line bg-black-2 p-5 sm:p-6">
      {/* colour */}
      <fieldset>
        <legend className="mb-2.5 text-xs text-concrete-dim">
          رنگ: <span className="text-concrete">{color}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {product.colors.map((c) => (
            <button
              key={c}
              type="button"
              data-hot
              data-on={color === c}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className="chip swatch min-h-11 rounded-full px-4 text-sm"
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>

      {/* size */}
      <fieldset className="mt-5">
        <legend className="mb-2.5 text-xs text-concrete-dim">
          سایز: <span className="text-concrete">{size}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              data-hot
              data-on={size === s}
              aria-pressed={size === s}
              onClick={() => setSize(s)}
              dir={/[A-Za-z]/.test(s) ? "ltr" : "rtl"}
              className="chip min-h-11 min-w-11 rounded-sm px-4 text-sm tnum"
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      {/* quantity + running total */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-concrete-dim">تعداد</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-hot
              onClick={dec}
              disabled={qty <= 1}
              aria-label="کم‌کردنِ تعداد"
              className="chip flex min-h-11 min-w-11 items-center justify-center rounded-sm text-lg leading-none disabled:opacity-40"
            >
              −
            </button>
            <span className="tnum min-w-8 text-center text-lg text-concrete" aria-live="polite">
              {fa(qty)}
            </span>
            <button
              type="button"
              data-hot
              onClick={inc}
              disabled={out || qty >= max}
              aria-label="زیادکردنِ تعداد"
              className="chip flex min-h-11 min-w-11 items-center justify-center rounded-sm text-lg leading-none disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        <div className="text-left" dir="rtl">
          <p className="text-[11px] text-concrete-dim">جمعِ کل</p>
          <p className="tnum text-lg text-concrete">
            {toman(product.price * qty)}
            <span className="mr-1 text-xs text-concrete-dim">تومان</span>
          </p>
        </div>
      </div>

      {/* stock cue */}
      {out ? (
        <p className="mt-4 text-center text-sm text-concrete-dim">فعلاً ناموجوده. بعداً سر بزن.</p>
      ) : low ? (
        <p className="mt-4 text-center text-sm text-crimson">تنها {fa(avail)} تا مونده.</p>
      ) : null}

      {/* add to cart */}
      <button
        ref={btnRef}
        type="button"
        data-hot
        onClick={onAdd}
        disabled={out}
        className="mt-5 flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-sm border border-crimson px-5 font-display text-lg text-concrete transition-colors hover:bg-crimson disabled:cursor-not-allowed disabled:border-line disabled:text-concrete-dim disabled:hover:bg-transparent"
        style={added ? { background: "var(--crimson)" } : undefined}
      >
        {out ? (
          "ناموجود"
        ) : added ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            ریخت تو سبد. بزن بریم.
          </>
        ) : (
          "بریز تو سبد"
        )}
      </button>

      {err && <p role="alert" className="mt-2 text-center text-sm text-crimson">{err}</p>}

      <p aria-live="polite" className="sr-only">
        {added ? "به سبدِ خرید اضافه شد" : ""}
      </p>
    </div>
  );
}
