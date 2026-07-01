"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { toman, fa } from "../lib/products";
import { STATUS, SHIPPING } from "../lib/orders-shared";

// normalise persian/arabic digits to latin for validation
const normDigits = (s) =>
  s.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

export default function CartDrawer() {
  const { items, count, subtotal, open, closeCart, refresh } = useCart();
  const [stage, setStage] = useState("cart"); // cart | checkout | payment | done
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [card, setCard] = useState({ number: "", exp: "", cvv: "" });
  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const panelRef = useRef(null);

  const total = subtotal + (items.length ? SHIPPING : 0);

  // lock page scroll + Esc to close + focus panel
  useEffect(() => {
    if (open) {
      window.__lenis?.stop?.();
      const t = setTimeout(() => panelRef.current?.focus(), 80);
      const onKey = (e) => e.key === "Escape" && closeCart();
      window.addEventListener("keydown", onKey);
      return () => {
        clearTimeout(t);
        window.removeEventListener("keydown", onKey);
      };
    }
    window.__lenis?.start?.();
  }, [open, closeCart]);

  // reset to cart view shortly after closing (unless an order just landed)
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        if (stage !== "done") {
          setStage("cart");
          setErrors({});
          setPayError("");
        }
      }, 350);
      return () => clearTimeout(t);
    }
  }, [open, stage]);

  // a fresh add after an order leaves the "done" confirmation behind — once a new
  // item lands, swap back to the cart so reopening shows the new line (the "done"
  // screen intentionally stays while the cart is still empty right after ordering)
  useEffect(() => {
    if (items.length > 0 && stage === "done") {
      setStage("cart");
      setOrder(null);
    }
  }, [items.length, stage]);

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = "اسمت رو بنویس. لازمش داریم.";
    const phone = normDigits(form.phone).replace(/\D/g, "");
    if (!/^09\d{9}$/.test(phone)) e.phone = "شماره‌ی موبایل درست بده (۰۹...).";
    if (form.address.trim().length < 8) e.address = "آدرسِ کامل‌تر بده. کجا بفرستیم؟";
    setErrors(e);
    if (Object.keys(e).length) {
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return false;
    }
    return true;
  };

  const toPayment = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setPayError("");
    setStage("payment");
  };

  const placeOrder = async () => {
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          customer_name: form.name.trim(),
          phone: normDigits(form.phone).replace(/\D/g, ""),
          address: form.address.trim(),
          note: form.note.trim() || null,
          items: items.map((l) => ({
            id: l.id, name: l.name, color: l.color, size: l.size, qty: l.qty, price: l.price, img: l.img,
          })),
          subtotal,
          shipping: SHIPPING,
          total,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "یه چیزی این وسط بد شد. دوباره بزن.");
      }
      const data = await res.json();
      // the order tx already emptied the cart server-side — pull that in BEFORE
      // showing "done", so the "fresh add resets done→cart" effect (which keys off
      // items.length>0) doesn't immediately fire on this order's own line.
      await refresh();
      setOrder(data);
      setStage("done");
    } catch (err) {
      setPayError(err.message || "پرداخت ثبت نشد. دوباره امتحان کن.");
    } finally {
      setPaying(false);
    }
  };

  // pretty card number: groups of 4
  const onCardNumber = (v) => {
    const digits = normDigits(v).replace(/\D/g, "").slice(0, 16);
    setCard((c) => ({ ...c, number: digits.replace(/(.{4})/g, "$1 ").trim() }));
  };

  // empty-cart CTA: close the drawer, then head to the shop section
  const goShop = () => {
    closeCart();
    // small delay so the close animation / scroll-unlock settles first
    setTimeout(() => {
      if (window.__lenis && document.getElementById("shop")) {
        window.__lenis.scrollTo("#shop", { offset: -64, duration: 1.2 });
      } else {
        window.location.assign("/#shop");
      }
    }, 80);
  };

  return (
    <>
      {/* scrim */}
      <div
        onClick={closeCart}
        className="fixed inset-0 z-[120] bg-black/60 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        aria-hidden="true"
      />

      {/* panel */}
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="سبدِ خرید"
        className="panel-wall fixed inset-y-0 left-0 z-[130] flex w-full max-w-md flex-col border-l border-line shadow-2xl outline-none transition-transform duration-[420ms] ease-out"
        style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-2xl text-concrete">
            {stage === "done" ? "ثبت شد" : stage === "payment" ? "پرداخت" : "سبدِ خرید"}
            {stage === "cart" && count > 0 && (
              <span className="mr-2 text-base text-concrete-dim">({fa(count)})</span>
            )}
          </h2>
          <button
            onClick={closeCart}
            data-hot
            aria-label="بستنِ سبد"
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-line text-concrete transition-colors hover:border-[var(--line-bright)]"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div data-lenis-prevent className="thin-scroll flex-1 overflow-y-auto px-5 py-5">
          {/* DONE — order received */}
          {stage === "done" && order ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-crimson text-3xl text-crimson">✓</div>
              <p className="mt-5 font-display text-3xl text-concrete">سفارشت ثبت شد.</p>
              <p className="mt-2 text-sm leading-7 text-concrete-dim">
                {STATUS.received.voice} برات می‌فرستیمش.
              </p>

              <div className="mt-6 w-full rounded-sm border border-line bg-black/40 p-4">
                <p className="text-xs text-concrete-dim">کدِ پیگیری</p>
                <p className="tnum mt-1 font-stamp text-3xl tracking-[0.3em] text-crimson" dir="ltr">
                  {order.code}
                </p>
              </div>

              <p className="mt-4 text-xs leading-6 text-concrete-dim">
                این کد رو نگه دار. اگه واردِ حساب شده باشی، تو «سفارش‌های من» هم می‌بینیش
                و قدم‌به‌قدم وضعیتش رو دنبال می‌کنی.
              </p>

              <Link
                href={`/track?code=${order.code}`}
                onClick={closeCart}
                data-hot
                className="mt-5 min-h-11 w-full rounded-sm bg-crimson px-5 py-3 text-sm text-concrete transition-transform hover:-translate-y-0.5"
              >
                پیگیریِ سفارش
              </Link>
              <button
                onClick={() => { setStage("cart"); setOrder(null); closeCart(); }}
                data-hot
                className="mt-3 text-sm text-concrete-dim underline-offset-4 hover:underline"
              >
                باشه، رفتم خرید.
              </button>
            </div>
          ) : items.length === 0 && stage !== "payment" ? (
            /* EMPTY */
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-display text-3xl text-concrete">سبدت خالیه.</p>
              <p className="mt-2 text-sm text-concrete-dim">بریز توش، بد می‌چسبه.</p>
              <button
                onClick={goShop}
                data-hot
                className="mt-6 min-h-11 rounded-sm border border-crimson px-6 text-sm text-concrete transition-colors hover:bg-crimson"
              >
                برو یه چیزی بریز توش
              </button>
            </div>
          ) : stage === "cart" ? (
            /* CART LINES */
            <ul className="space-y-4">
              {items.map((l) => (
                <CartLine key={l.key} l={l} />
              ))}
            </ul>
          ) : stage === "checkout" ? (
            /* CHECKOUT FORM */
            <form id="checkout-form" onSubmit={toPayment} noValidate className="space-y-4">
              <Field
                label="اسمت" id="cf-name" value={form.name} error={errors.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="مثلاً: یه آدمِ خوش‌سلیقه"
              />
              <Field
                label="موبایل" id="cf-phone" value={form.phone} error={errors.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹" inputMode="tel" dir="ltr"
              />
              <Field
                label="آدرس" id="cf-address" value={form.address} error={errors.address}
                onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                placeholder="شهر، خیابون، پلاک، کدپستی" textarea
              />
              <Field
                label="یادداشت (اختیاری)" id="cf-note" value={form.note}
                onChange={(v) => setForm((f) => ({ ...f, note: v }))}
                placeholder="اگه حرفِ خاصی هست…" optional
              />
            </form>
          ) : (
            /* PAYMENT — demo portal (no real gateway yet) */
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-sm border border-line bg-black/40 px-4 py-3">
                <span className="text-sm text-concrete-dim">مبلغِ قابلِ پرداخت</span>
                <span className="tnum font-display text-xl text-crimson">{toman(total)} تومان</span>
              </div>

              <div className="rounded-md border border-line bg-black-2 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="stencil text-xs text-concrete-dim" dir="ltr">SECURE PAY</span>
                  <span className="rounded-sm border border-line px-2 py-0.5 text-[11px] text-concrete-dim">نمونه</span>
                </div>

                <label className="mb-1.5 block text-sm text-concrete">شماره‌ی کارت</label>
                <input
                  value={card.number}
                  onChange={(e) => onCardNumber(e.target.value)}
                  inputMode="numeric" dir="ltr"
                  placeholder="۶۰۳۷ ۹۹۷۵ ۰۰۰۰ ۰۰۰۰"
                  className="field tnum min-h-11 w-full rounded-sm px-3 text-base tracking-widest"
                />

                <div className="mt-3 flex gap-3">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-sm text-concrete">انقضا</label>
                    <input
                      value={card.exp}
                      onChange={(e) => setCard((c) => ({ ...c, exp: normDigits(e.target.value).replace(/[^\d/]/g, "").slice(0, 5) }))}
                      inputMode="numeric" dir="ltr" placeholder="۰۴/۰۸"
                      className="field tnum min-h-11 w-full rounded-sm px-3 text-base"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1.5 block text-sm text-concrete">CVV2</label>
                    <input
                      value={card.cvv}
                      onChange={(e) => setCard((c) => ({ ...c, cvv: normDigits(e.target.value).replace(/\D/g, "").slice(0, 4) }))}
                      inputMode="numeric" dir="ltr" placeholder="۱۲۳"
                      className="field tnum min-h-11 w-full rounded-sm px-3 text-base"
                    />
                  </div>
                </div>

                <p className="mt-3 text-xs leading-6 text-concrete-dim">
                  این یه درگاهِ نمونه‌ست؛ هیچ پولی واقعاً کسر نمی‌شه. درگاهِ بانکیِ واقعی
                  بعداً وصل می‌شه. بزن «پرداخت» تا سفارشت ثبت شه.
                </p>
              </div>

              {payError && <p role="alert" className="text-sm text-crimson">{payError}</p>}
            </div>
          )}
        </div>

        {/* footer / totals */}
        {(stage === "cart" || stage === "checkout" || stage === "payment") && items.length > 0 && (
          <div className="border-t border-line px-5 py-4">
            {stage !== "payment" && (
              <>
                <div className="flex justify-between text-sm text-concrete-dim">
                  <span>جمعِ کالاها</span>
                  <span className="tnum">{toman(subtotal)} تومان</span>
                </div>
                <div className="mt-1 flex justify-between text-sm text-concrete-dim">
                  <span>ارسال</span>
                  <span className="tnum">{toman(SHIPPING)} تومان</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-line pt-2 font-display text-xl text-concrete">
                  <span>جمعِ کل</span>
                  <span className="tnum text-crimson">{toman(total)} تومان</span>
                </div>
              </>
            )}

            {stage === "cart" ? (
              <button
                onClick={() => setStage("checkout")}
                data-hot
                className="mt-4 min-h-12 w-full rounded-sm bg-crimson px-5 text-base text-concrete transition-transform hover:-translate-y-0.5"
              >
                نهایی کردنِ سفارش
              </button>
            ) : stage === "checkout" ? (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStage("cart")}
                  data-hot
                  className="min-h-12 rounded-sm border border-line px-5 text-sm text-concrete hover:border-[var(--line-bright)]"
                >
                  برگرد
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  data-hot
                  className="min-h-12 flex-1 rounded-sm bg-crimson px-5 text-base text-concrete transition-transform hover:-translate-y-0.5"
                >
                  ادامه به پرداخت
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStage("checkout")}
                  disabled={paying}
                  data-hot
                  className="min-h-12 rounded-sm border border-line px-5 text-sm text-concrete hover:border-[var(--line-bright)] disabled:opacity-50"
                >
                  برگرد
                </button>
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={paying}
                  data-hot
                  className="min-h-12 flex-1 rounded-sm bg-crimson px-5 text-base text-concrete transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {paying ? "داریم ثبت می‌کنیم…" : `پرداختِ ${toman(total)} تومان`}
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

// one cart line: editable colour + size (re-checks stock on change) and a qty stepper.
function CartLine({ l }) {
  const { setQty, setVariant, remove } = useCart();
  const [err, setErr] = useState("");
  const out = l.available <= 0;

  const run = async (p) => {
    const r = await p;
    setErr(r?.error || "");
  };

  return (
    <li className="flex gap-3 border-b border-line pb-4">
      <img src={l.img} alt="" className="h-24 w-20 shrink-0 border border-line object-cover" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-tight text-concrete">{l.name}</h3>
          <button
            onClick={() => remove(l.key)}
            data-hot
            aria-label={`حذفِ ${l.name}`}
            className="shrink-0 text-xs text-concrete-dim hover:text-crimson"
          >
            حذف
          </button>
        </div>

        {/* colour + size pickers — changing one re-reserves against stock */}
        <div className="mt-1.5 flex gap-2">
          {l.colors.length > 1 ? (
            <select
              value={l.color ?? ""}
              onChange={(e) => run(setVariant(l.key, { color: e.target.value }))}
              aria-label="رنگ"
              className="field min-h-8 flex-1 rounded-sm px-2 text-xs text-concrete"
            >
              {l.colors.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-concrete-dim">{l.color}</span>
          )}
          {l.sizes.length > 1 ? (
            <select
              value={l.size ?? ""}
              onChange={(e) => run(setVariant(l.key, { size: e.target.value }))}
              aria-label="سایز"
              dir="ltr"
              className="field min-h-8 flex-1 rounded-sm px-2 text-xs text-concrete"
            >
              {l.sizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-concrete-dim">سایز <span dir="ltr">{l.size}</span></span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => run(setQty(l.key, l.qty - 1))}
              data-hot aria-label="یکی کمتر"
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-line text-concrete hover:border-[var(--line-bright)]"
            >−</button>
            <span className="tnum w-6 text-center text-sm text-concrete">{fa(l.qty)}</span>
            <button
              onClick={() => run(setQty(l.key, l.qty + 1))}
              disabled={l.qty >= l.available}
              data-hot aria-label="یکی بیشتر"
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-line text-concrete hover:border-[var(--line-bright)] disabled:opacity-40"
            >+</button>
          </div>
          <span className="tnum text-sm text-concrete-dim">{toman(l.qty * l.price)}</span>
        </div>

        {(err || out) && (
          <p role="alert" className="mt-1 text-xs text-crimson">{err || "ناموجود"}</p>
        )}
      </div>
    </li>
  );
}

function Field({ label, id, value, onChange, error, placeholder, textarea, optional, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-concrete">
        {label} {!optional && <span className="text-crimson">*</span>}
      </label>
      {textarea ? (
        <textarea
          id={id} value={value} onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error} rows={3} placeholder={placeholder}
          className="field w-full resize-none rounded-sm px-3 py-2.5 text-sm"
          {...rest}
        />
      ) : (
        <input
          id={id} value={value} onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error} placeholder={placeholder}
          className="field min-h-11 w-full rounded-sm px-3 text-sm"
          {...rest}
        />
      )}
      {error && <p role="alert" className="mt-1 text-xs text-crimson">{error}</p>}
    </div>
  );
}
