"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { toman, fa } from "../lib/products";

const SHIPPING = 90000;

// normalise persian/arabic digits to latin for validation
const normDigits = (s) =>
  s.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

export default function CartDrawer() {
  const { items, count, subtotal, open, closeCart, setQty, remove, clear } = useCart();
  const [stage, setStage] = useState("cart"); // cart | checkout | done
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef(null);

  const total = subtotal + (items.length ? SHIPPING : 0);

  // lock page scroll (Lenis) + Esc to close + focus panel
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

  // reset to cart view shortly after closing
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        if (stage !== "done") setStage("cart");
        setErrors({});
      }, 350);
      return () => clearTimeout(t);
    }
  }, [open, stage]);

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = "اسمت رو بنویس. لازمش داریم.";
    const phone = normDigits(form.phone).replace(/\D/g, "");
    if (!/^09\d{9}$/.test(phone)) e.phone = "شماره‌ی موبایل درست بده (۰۹...).";
    if (form.address.trim().length < 8) e.address = "آدرسِ کامل‌تر. کجا بفرستیم؟";
    setErrors(e);
    if (Object.keys(e).length) {
      const first = document.querySelector('[aria-invalid="true"]');
      first?.focus();
      return false;
    }
    return true;
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const code = "BAD-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    const lines = items
      .map((l) => `• ${l.name} (${l.color}/${l.size}) ×${l.qty} = ${toman(l.qty * l.price)}`)
      .join("\n");
    const summary =
      `سفارشِ بَد استیشن — کدِ ${code}\n${lines}\n` +
      `ارسال: ${toman(SHIPPING)}\nجمع: ${toman(total)} تومان\n` +
      `نام: ${form.name}\nموبایل: ${form.phone}\nآدرس: ${form.address}` +
      (form.note ? `\nیادداشت: ${form.note}` : "");
    setOrder({ code, summary });
    setStage("done");
    clear();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
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
            {stage === "done" ? "تمام شد" : "سبدِ خرید"}
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
          {/* DONE */}
          {stage === "done" && order ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="font-display text-5xl text-crimson">✓</div>
              <p className="mt-4 font-display text-2xl text-concrete">ثبت شد. کدت اینه:</p>
              <p className="tnum mt-1 font-stamp text-3xl tracking-widest text-crimson" dir="ltr">
                {order.code}
              </p>
              <p className="mt-4 text-sm leading-7 text-concrete-dim">
                خلاصه‌ی سفارش رو کپی کن و برامون بفرست تا موجودی و زمانِ ارسال رو
                تأیید کنیم. نگفتیم ذوق کن.
              </p>
              <button
                onClick={copy}
                data-hot
                className="mt-5 min-h-11 w-full rounded-sm bg-crimson px-5 text-sm text-concrete transition-transform hover:-translate-y-0.5"
              >
                {copied ? "کپی شد. حالا بفرست." : "کپیِ خلاصه‌ی سفارش"}
              </button>
              <a
                href="https://www.instagram.com/bad.staaation"
                target="_blank"
                rel="noopener noreferrer"
                data-hot
                className="mt-3 min-h-11 w-full rounded-sm border border-line px-5 py-3 text-sm text-concrete transition-colors hover:border-[var(--line-bright)]"
              >
                دایرکتِ اینستاگرام ↗
              </a>
              <button
                onClick={() => { setStage("cart"); closeCart(); }}
                data-hot
                className="mt-6 text-sm text-concrete-dim underline-offset-4 hover:underline"
              >
                باشه، رفتم.
              </button>
            </div>
          ) : items.length === 0 ? (
            /* EMPTY */
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-display text-3xl text-concrete">سبدت خالیه.</p>
              <p className="mt-2 text-sm text-concrete-dim">مثلِ باتریِ اجتماعیِ ما.</p>
              <button
                onClick={closeCart}
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
                <li key={l.key} className="flex gap-3 border-b border-line pb-4">
                  <img src={l.img} alt="" className="h-24 w-20 shrink-0 object-cover border border-line" />
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
                    <p className="mt-0.5 text-xs text-concrete-dim">
                      {l.color} · سایز <span dir="ltr">{l.size}</span>
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      {/* qty stepper */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQty(l.key, l.qty - 1)}
                          data-hot
                          aria-label="یکی کمتر"
                          className="flex h-8 w-8 items-center justify-center rounded-sm border border-line text-concrete hover:border-[var(--line-bright)]"
                        >
                          −
                        </button>
                        <span className="tnum w-6 text-center text-sm text-concrete">{fa(l.qty)}</span>
                        <button
                          onClick={() => setQty(l.key, Math.min(l.qty + 1, 9))}
                          data-hot
                          aria-label="یکی بیشتر"
                          className="flex h-8 w-8 items-center justify-center rounded-sm border border-line text-concrete hover:border-[var(--line-bright)]"
                        >
                          +
                        </button>
                      </div>
                      <span className="tnum text-sm text-concrete-dim">{toman(l.qty * l.price)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            /* CHECKOUT FORM */
            <form id="checkout-form" onSubmit={submit} noValidate className="space-y-4">
              <Field
                label="اسمت" id="cf-name" value={form.name} error={errors.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="مثلاً: یه آدمِ بی‌حوصله"
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
          )}
        </div>

        {/* footer / totals */}
        {stage !== "done" && items.length > 0 && (
          <div className="border-t border-line px-5 py-4">
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

            {stage === "cart" ? (
              <button
                onClick={() => setStage("checkout")}
                data-hot
                className="mt-4 min-h-12 w-full rounded-sm bg-crimson px-5 text-base text-concrete transition-transform hover:-translate-y-0.5"
              >
                نهایی کردنِ سفارش
              </button>
            ) : (
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
                  ثبتِ نهایی
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
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
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          rows={3}
          placeholder={placeholder}
          className="field w-full resize-none rounded-sm px-3 py-2.5 text-sm"
          {...rest}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          placeholder={placeholder}
          className="field min-h-11 w-full rounded-sm px-3 text-sm"
          {...rest}
        />
      )}
      {error && (
        <p role="alert" className="mt-1 text-xs text-crimson">{error}</p>
      )}
    </div>
  );
}
