"use client";

// ════════ Products manager ════════
// Admin catalogue CRUD: list + add/edit form (image upload, chip inputs,
// stock, category). Refetches after each mutation (optimistic refresh). RTL.
import { useEffect, useMemo, useRef, useState } from "react";
import { toman, fa } from "@/app/lib/products";

const EMPTY = {
  id: "", name: "", cat: "", price: 0, stock: 0, img: "",
  images: [], colors: [], sizes: [], details: [],
  tagline: "", note: "", story: "", material: "", care: "", fit: "", alt: "", tag: "",
};

// normalise a DB row (jsonb may arrive as array already) into the form shape
function toForm(p) {
  return {
    ...EMPTY,
    ...p,
    cat: p.cat ?? "",
    images: p.images ?? [],
    colors: p.colors ?? [],
    sizes: p.sizes ?? [],
    details: p.details ?? [],
  };
}

export default function ProductsManager() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [phase, setPhase] = useState("loading"); // loading | ready | error
  const [editing, setEditing] = useState(null); // form object | null
  const [err, setErr] = useState("");

  async function load() {
    setPhase("loading");
    try {
      const [pr, cr] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/admin/categories", { cache: "no-store" }),
      ]);
      if (!pr.ok || !cr.ok) return setPhase("error");
      const pd = await pr.json();
      const cd = await cr.json();
      setProducts(pd.products || []);
      setCats(cd.categories || []);
      setPhase("ready");
    } catch {
      setPhase("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const catLabel = useMemo(() => {
    const m = new Map(cats.map((c) => [c.id, c.label]));
    return (id) => m.get(id) ?? "—";
  }, [cats]);

  async function remove(p) {
    if (!confirm(`«${p.name}» حذف بشه؟`)) return;
    setErr("");
    const res = await fetch(`/api/admin/products?id=${encodeURIComponent(p.id)}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "حذف نشد.");
      return;
    }
    load();
  }

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="stencil spray-soft text-xs text-crimson" dir="ltr">
            / PRODUCTS
          </p>
          <h1 className="mt-3 font-display text-4xl text-concrete sm:text-5xl">محصول‌ها</h1>
        </div>
        <button
          data-hot
          onClick={() => setEditing(toForm(EMPTY))}
          className="min-h-11 rounded-sm px-5 text-sm text-concrete transition-colors hover:opacity-90"
          style={{ background: "var(--crimson)" }}
        >
          + محصولِ جدید
        </button>
      </header>

      {err && (
        <p role="alert" className="mt-4 text-sm text-crimson">
          {err}
        </p>
      )}

      <div className="mt-8">
        {phase === "loading" && (
          <div className="space-y-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-sm border border-line bg-black-2" />
            ))}
          </div>
        )}

        {phase === "error" && (
          <div className="rounded-sm border border-line bg-black-2 p-10 text-center">
            <p className="font-display text-2xl text-concrete">بارگیری نشد.</p>
            <button
              onClick={load}
              data-hot
              className="mt-5 min-h-11 rounded-sm border border-crimson px-6 text-sm text-concrete transition-colors hover:bg-crimson"
            >
              دوباره
            </button>
          </div>
        )}

        {phase === "ready" && products.length === 0 && (
          <div className="rounded-sm border border-line bg-black-2 p-10 text-center">
            <p className="font-display text-2xl text-concrete">هنوز محصولی نیست.</p>
            <p className="mt-2 text-sm text-concrete-dim">با دکمه‌ی بالا اولی رو بساز.</p>
          </div>
        )}

        {phase === "ready" && products.length > 0 && (
          <ul className="space-y-3">
            {products.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-sm border bg-black-2 p-3"
                style={{ borderColor: p.archived ? "var(--crimson)" : "var(--line)" }}
              >
                <Thumb src={p.img} alt={p.alt || p.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-concrete">
                    {p.name}
                    {p.archived && (
                      <span className="mr-2 rounded-sm border border-crimson px-1.5 py-0.5 text-[0.65rem] text-crimson">
                        بایگانی
                      </span>
                    )}
                  </p>
                  <p className="tnum mt-0.5 text-xs text-concrete-dim">
                    {toman(p.price)} تومان · موجودی {fa(p.stock)} · {catLabel(p.cat)}
                  </p>
                </div>
                <button
                  data-hot
                  onClick={() => setEditing(toForm(p))}
                  className="chip min-h-10 shrink-0 rounded-sm px-3 text-xs"
                >
                  ویرایش
                </button>
                <button
                  data-hot
                  onClick={() => remove(p)}
                  className="min-h-10 shrink-0 rounded-sm border border-crimson px-3 text-xs text-crimson transition-colors hover:bg-crimson hover:text-concrete"
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <ProductForm
          initial={editing}
          cats={cats}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </main>
  );
}

function Thumb({ src, alt }) {
  return (
    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-sm border border-line bg-black-3">
      {src ? (
        // plain img: urls are user-managed uploads, sizes vary
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[0.6rem] text-concrete-dim">
          بی‌عکس
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── add / edit form ───────────────────────── */

function ProductForm({ initial, cats, onClose, onSaved }) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const isNew = !initial.id;
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    if (!f.name.trim()) return setErr("اسمِ محصول لازمه.");
    setBusy(true);
    setErr("");
    // primary img defaults to the first gallery image when unset
    const img = f.img || f.images[0] || "";
    const payload = { ...f, img, cat: f.cat || null };
    if (isNew) delete payload.id;
    const res = await fetch("/api/admin/products", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "ذخیره نشد.");
      return;
    }
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? "محصولِ جدید" : "ویرایشِ محصول"}
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-2xl rounded-sm border border-line bg-black-2 p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-concrete">
            {isNew ? "محصولِ جدید" : "ویرایش"}
          </h2>
          <button
            data-hot
            onClick={onClose}
            aria-label="بستن"
            className="chip min-h-10 rounded-full px-3 text-sm"
          >
            بستن
          </button>
        </div>

        <div className="space-y-4">
          <Field label="نام">
            <input className="field min-h-11 w-full rounded-sm px-3 text-sm" value={f.name} onChange={(e) => set("name", e.target.value)} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="دسته‌بندی">
              <select className="field min-h-11 w-full rounded-sm px-3 text-sm" value={f.cat} onChange={(e) => set("cat", e.target.value)}>
                <option value="">—</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="قیمت (تومان)">
              <input type="number" min="0" className="field tnum min-h-11 w-full rounded-sm px-3 text-sm" value={f.price} onChange={(e) => set("price", e.target.value)} />
            </Field>
            <Field label="موجودی">
              <input type="number" min="0" className="field tnum min-h-11 w-full rounded-sm px-3 text-sm" value={f.stock} onChange={(e) => set("stock", e.target.value)} />
            </Field>
          </div>

          <Field label="عکس‌ها">
            <ImageUploader
              images={f.images}
              primary={f.img}
              onChange={(images) => set("images", images)}
              onPrimary={(url) => set("img", url)}
              onError={setErr}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="رنگ‌ها">
              <ChipInput
                items={f.colors}
                onAdd={(v) => setF((p) => (p.colors.includes(v) ? p : { ...p, colors: [...p.colors, v] }))}
                onRemove={(v) => setF((p) => ({ ...p, colors: p.colors.filter((x) => x !== v) }))}
                placeholder="رنگ + Enter"
              />
            </Field>
            <Field label="سایزها">
              <ChipInput
                items={f.sizes}
                onAdd={(v) => setF((p) => (p.sizes.includes(v) ? p : { ...p, sizes: [...p.sizes, v] }))}
                onRemove={(v) => setF((p) => ({ ...p, sizes: p.sizes.filter((x) => x !== v) }))}
                placeholder="سایز + Enter"
              />
            </Field>
            <Field label="مشخصات">
              <ChipInput
                items={f.details}
                onAdd={(v) => setF((p) => (p.details.includes(v) ? p : { ...p, details: [...p.details, v] }))}
                onRemove={(v) => setF((p) => ({ ...p, details: p.details.filter((x) => x !== v) }))}
                placeholder="مورد + Enter"
              />
            </Field>
          </div>

          <Field label="تگ‌لاین">
            <input className="field min-h-11 w-full rounded-sm px-3 text-sm" value={f.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
          <Field label="توضیحِ کوتاه">
            <textarea className="field min-h-16 w-full rounded-sm px-3 py-2 text-sm" value={f.note} onChange={(e) => set("note", e.target.value)} />
          </Field>
          <Field label="داستان">
            <textarea className="field min-h-20 w-full rounded-sm px-3 py-2 text-sm" value={f.story} onChange={(e) => set("story", e.target.value)} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="جنس">
              <input className="field min-h-11 w-full rounded-sm px-3 text-sm" value={f.material} onChange={(e) => set("material", e.target.value)} />
            </Field>
            <Field label="نگه‌داری">
              <input className="field min-h-11 w-full rounded-sm px-3 text-sm" value={f.care} onChange={(e) => set("care", e.target.value)} />
            </Field>
            <Field label="فُرم">
              <input className="field min-h-11 w-full rounded-sm px-3 text-sm" value={f.fit} onChange={(e) => set("fit", e.target.value)} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="برچسب (مثلاً: پرفروش)">
              <input className="field min-h-11 w-full rounded-sm px-3 text-sm" value={f.tag} onChange={(e) => set("tag", e.target.value)} />
            </Field>
            <Field label="متنِ جایگزینِ عکس (alt)">
              <input className="field min-h-11 w-full rounded-sm px-3 text-sm" value={f.alt} onChange={(e) => set("alt", e.target.value)} />
            </Field>
          </div>
        </div>

        {err && (
          <p role="alert" className="mt-4 text-sm text-crimson">
            {err}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button data-hot onClick={onClose} className="chip min-h-11 rounded-sm px-5 text-sm">
            انصراف
          </button>
          <button
            data-hot
            disabled={busy}
            onClick={save}
            className="min-h-11 rounded-sm px-6 text-sm text-concrete transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--crimson)" }}
          >
            {busy ? "…" : "ذخیره"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-concrete-dim">{label}</span>
      {children}
    </label>
  );
}

// chips commit only on an explicit action (Enter or the + button). add/remove
// go through the parent's functional setF, so a rapid add-then-remove can't
// clobber each other from a stale snapshot (that used to drop options). there's
// deliberately no onBlur commit — clicking away never mutates the list.
function ChipInput({ items, onAdd, onRemove, placeholder }) {
  const [val, setVal] = useState("");
  const commit = () => {
    const v = val.trim();
    if (v) onAdd(v);
    setVal("");
  };
  return (
    <div>
      {items.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {items.map((it) => (
            <span key={it} className="inline-flex items-center gap-1 rounded-full border border-line bg-black-3 px-2.5 py-1 text-xs text-concrete">
              {it}
              <button
                type="button"
                data-hot
                onClick={() => onRemove(it)}
                aria-label={`حذفِ ${it}`}
                className="text-concrete-dim hover:text-crimson"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className="field min-h-11 w-full rounded-sm px-3 text-sm"
          value={val}
          placeholder={placeholder}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <button
          type="button"
          data-hot
          onClick={commit}
          aria-label="افزودن"
          className="chip min-h-11 shrink-0 rounded-sm px-3 text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ImageUploader({ images, primary, onChange, onPrimary, onError }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function onPick(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setBusy(true);
    const added = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        onError?.(d.error || "آپلودِ عکس نشد.");
        continue;
      }
      const d = await res.json();
      if (d.url) added.push(d.url);
    }
    const next = [...images, ...added];
    onChange(next);
    if (!primary && next[0]) onPrimary(next[0]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {images.map((url) => {
            const isPrimary = url === primary;
            return (
              <div
                key={url}
                className="relative h-20 w-20 overflow-hidden rounded-sm border bg-black-3"
                style={{ borderColor: isPrimary ? "var(--crimson)" : "var(--line)" }}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  data-hot
                  onClick={() => onPrimary(url)}
                  className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center text-[0.6rem] text-concrete"
                  title="انتخاب به‌عنوانِ عکسِ اصلی"
                >
                  {isPrimary ? "★ اصلی" : "اصلی کن"}
                </button>
                <button
                  type="button"
                  data-hot
                  onClick={() => {
                    const next = images.filter((u) => u !== url);
                    onChange(next);
                    if (isPrimary) onPrimary(next[0] || "");
                  }}
                  aria-label="حذفِ عکس"
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-concrete hover:text-crimson"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={onPick} className="hidden" />
      <button
        type="button"
        data-hot
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="chip min-h-11 rounded-sm px-4 text-sm disabled:opacity-50"
      >
        {busy ? "در حالِ آپلود…" : "+ افزودنِ عکس"}
      </button>
    </div>
  );
}
