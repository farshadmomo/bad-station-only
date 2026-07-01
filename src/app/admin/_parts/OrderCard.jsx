"use client";

import { useState } from "react";
import { STATUS, STATUS_FLOW, statusIndex } from "@/app/lib/orders-shared";
import { toman, fa } from "@/app/lib/products";

function faDateTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

export default function OrderCard({ order, onChanged }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(null); // the status currently being applied
  const [err, setErr] = useState("");

  const current = order.status;
  const canceled = current === "canceled";

  async function setStatus(next) {
    if (next === current || busy) return;
    setBusy(next);
    setErr("");
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, note: note.trim() || undefined }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "تغییرِ وضعیت انجام نشد.");
        setBusy(null);
        return;
      }
      const data = await res.json();
      onChanged(order.id, data.status || next);
      setNote("");
      setBusy(null);
    } catch {
      setErr("ارتباط برقرار نشد.");
      setBusy(null);
    }
  }

  return (
    <article
      className="admin-card rounded-sm border bg-black-2 p-4 sm:p-5"
      style={{ borderColor: canceled ? "var(--crimson)" : "var(--line)" }}
    >
      {/* header: code + date + current status */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
        <div>
          <p className="font-stamp text-xl tracking-[0.2em] text-crimson" dir="ltr">
            {order.code}
          </p>
          <p className="tnum mt-0.5 text-xs text-concrete-dim">{faDateTime(order.created_at)}</p>
        </div>
        <StatusChip status={current} />
      </div>

      {/* mini stepper */}
      {!canceled && <MiniStepper status={current} />}

      {/* customer + items */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-concrete-dim">مشتری</p>
          <p className="mt-0.5 text-sm text-concrete">{order.customer_name}</p>
          {order.phone ? (
            <a
              href={`tel:${order.phone}`}
              data-hot
              className="tnum text-sm text-concrete-dim underline-offset-4 hover:text-concrete hover:underline"
              dir="ltr"
            >
              {order.phone}
            </a>
          ) : null}
          {order.address ? (
            <p className="mt-1 text-xs leading-6 text-concrete-dim">{order.address}</p>
          ) : null}
          {order.note ? (
            <p className="mt-1 text-xs leading-6 text-concrete-dim">
              یادداشتِ مشتری: {order.note}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-xs text-concrete-dim">اقلام</p>
          <ul className="mt-1 space-y-1.5">
            {(order.items || []).map((it, i) => (
              <li key={i} className="flex items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-concrete">
                  {it.name}
                  <span className="text-concrete-dim">
                    {" · "}
                    {it.color}
                    {it.color && it.size ? "/" : ""}
                    <span dir="ltr">{it.size}</span>
                    {" · "}
                    <span className="tnum">×{fa(it.qty || 1)}</span>
                  </span>
                </span>
                <span className="tnum shrink-0 text-concrete-dim">
                  {toman((it.price || 0) * (it.qty || 1))}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="text-sm text-concrete">جمعِ کل</span>
            <span className="tnum text-sm text-crimson">{toman(order.total || 0)} تومان</span>
          </div>
        </div>
      </div>

      {/* status control */}
      <div className="mt-4 border-t border-line pt-4">
        <label htmlFor={`note-${order.id}`} className="mb-1.5 block text-xs text-concrete-dim">
          یادداشتِ تغییر (اختیاری، تو سابقه‌ی مشتری ثبت می‌شه)
        </label>
        <input
          id={`note-${order.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="مثلاً: تأیید موجودی، کدِ رهگیریِ پست…"
          className="field min-h-11 w-full rounded-sm px-3 text-sm"
        />

        <p className="mt-3 mb-2 text-xs text-concrete-dim">تغییرِ وضعیت به:</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_FLOW.map((s) => (
            <button
              key={s}
              data-hot
              disabled={!!busy}
              onClick={() => setStatus(s)}
              aria-pressed={s === current}
              data-on={s === current}
              className="chip min-h-11 rounded-sm px-3 text-xs disabled:opacity-50"
            >
              {busy === s ? "…" : STATUS[s].label}
            </button>
          ))}
          <button
            data-hot
            disabled={!!busy}
            onClick={() => setStatus("canceled")}
            aria-pressed={canceled}
            data-on={canceled}
            className="chip min-h-11 rounded-sm px-3 text-xs disabled:opacity-50"
          >
            {busy === "canceled" ? "…" : STATUS.canceled.label}
          </button>
        </div>

        {err && (
          <p role="alert" className="mt-2 text-xs text-crimson">
            {err}
          </p>
        )}
      </div>
    </article>
  );
}

function StatusChip({ status }) {
  const meta = STATUS[status] || { label: status };
  const canceled = status === "canceled";
  const delivered = status === "delivered";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-concrete"
      style={{
        borderColor: canceled ? "var(--crimson)" : "var(--line-bright)",
        background: canceled
          ? "oklch(48% 0.188 26 / 0.2)"
          : delivered
          ? "oklch(48% 0.188 26 / 0.14)"
          : "oklch(13% 0.006 50 / 0.6)",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: canceled ? "var(--crimson)" : "var(--crimson-hi)" }}
      />
      {meta.label}
    </span>
  );
}

// compact progress bars, filled up to the current step
function MiniStepper({ status }) {
  const cur = statusIndex(status);
  return (
    <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
      {STATUS_FLOW.map((s, i) => (
        <span
          key={s}
          className="h-1.5 flex-1 rounded-full"
          style={{ background: i <= cur ? "var(--crimson)" : "var(--line)" }}
        />
      ))}
    </div>
  );
}
