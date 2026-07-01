"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toman } from "../lib/products"; // data now from /api/catalogue; toman stays for price fmt

gsap.registerPlugin(useGSAP);

const PAGE = 6; // lazy-render chunk size

export default function Search({ variant = "pill" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // catalogue fetched once on first open, cached across opens
  const [data, setData] = useState(null); // { products, categories }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE);

  // portal target: the overlay must escape any backdrop-filter/transform ancestor
  // (SiteHeader's blur, the scrolled home nav) or `fixed` gets trapped in the header.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const triggerRef = useRef(null);
  const rootRef = useRef(null);
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);

  // fetch + cache catalogue the first time the overlay opens
  useEffect(() => {
    if (!open || data || loading) return;
    setLoading(true);
    setError(false);
    fetch("/api/catalogue")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [open, data, loading]);

  const catLabel = (id) => data?.categories?.find((c) => c.id === id)?.label ?? "";

  // filter client-side over the cached products (replicates old searchProducts);
  // empty query → all products (popular)
  const products = data?.products ?? [];
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => {
      const hay = [p.name, p.note, p.tagline, catLabel(p.cat), ...(p.colors || [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [query, data]);

  const visible = filtered.slice(0, visibleCount);

  // reset the lazy window whenever the query changes
  useEffect(() => setVisibleCount(PAGE), [query]);

  // load more as the sentinel scrolls into the results container
  useEffect(() => {
    if (!open) return;
    if (visibleCount >= filtered.length) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((c) => c + PAGE);
      },
      { root: scrollRef.current, rootMargin: "200px" }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [open, visibleCount, filtered.length]);

  const close = () => {
    setOpen(false);
    setQuery("");
    // return focus to the trigger that opened the overlay
    triggerRef.current?.focus();
  };

  // scroll-lock · autofocus · ESC · focus-trap
  useEffect(() => {
    if (!open) return;
    window.__lenis?.stop?.();
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 60);

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab") {
        const root = rootRef.current;
        if (!root) return;
        const f = root.querySelectorAll(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      window.__lenis?.start?.();
      document.body.style.overflow = "";
    };
  }, [open]);

  // entrance motion — fade the veil, fade/lift/scale the content (reduced-motion safe)
  useGSAP(
    () => {
      if (!open) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return; // content is visible by default
      gsap
        .timeline()
        .fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power2.out" },
          0
        )
        .fromTo(
          panelRef.current,
          { opacity: 0, y: 14, scale: 0.985 },
          { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" },
          0.04
        );
    },
    { dependencies: [open], scope: rootRef }
  );

  return (
    <>
      {/* trigger */}
      <button
        ref={triggerRef}
        data-hot
        onClick={() => setOpen(true)}
        aria-label="جستجو"
        className={
          variant === "icon"
            ? "flex h-10 w-10 items-center justify-center rounded-full border border-line text-concrete transition-colors hover:border-[var(--line-bright)]"
            : "flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm text-concrete-dim transition-colors hover:border-[var(--line-bright)] hover:text-concrete"
        }
      >
        <SearchIcon />
        {variant === "pill" && <span className="hidden md:inline">دنبالِ چی می‌گردی؟</span>}
      </button>

      {/* fullscreen overlay — portaled to <body> so no header backdrop-filter traps it */}
      {open && mounted &&
        createPortal(
          <div
            ref={rootRef}
            className="fixed inset-0 z-[160]"
            role="dialog"
            aria-modal="true"
            aria-label="جستجوی محصولات"
          >
          {/* deep dark wash — near-opaque so results read sharply on top of it
              (was a translucent gray veil that let the page bleed through).
              still a full-screen click target to dismiss. */}
          <div
            ref={backdropRef}
            onClick={close}
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundColor: "oklch(11% 0.006 55 / 0.99)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          />

          {/* content laid directly on the surface; empty space clicks through to the veil */}
          <div className="pointer-events-none absolute inset-0 flex flex-col">
            <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-5 pb-6 pt-[10vh] sm:px-6 sm:pt-[12vh]">
              <div ref={panelRef} className="flex min-h-0 flex-1 flex-col">
                {/* header + search field */}
                <div className="pointer-events-auto shrink-0">
                  <div className="flex items-center justify-between gap-4">
                    <p className="stencil spray-soft text-[0.7rem] text-crimson" dir="ltr">
                      / SEARCH
                    </p>
                    <button
                      data-hot
                      onClick={close}
                      aria-label="بستن"
                      className="flex items-center gap-2 rounded-sm border border-line px-2.5 py-1.5 text-xs text-concrete-dim transition-colors hover:border-crimson hover:text-concrete"
                    >
                      <span className="hidden tracking-widest sm:inline" dir="ltr">
                        ESC
                      </span>
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <label htmlFor="bad-search" className="sr-only">
                    جستجوی محصولات
                  </label>
                  <div className="mt-4 flex items-center gap-3 border-b-2 border-line pb-3 transition-colors focus-within:border-crimson sm:mt-6 sm:gap-4">
                    <SearchIcon size={26} className="shrink-0 text-concrete-dim" />
                    <input
                      id="bad-search"
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="مثلاً: شومیز، توری، مشکی…"
                      autoComplete="off"
                      className="w-full bg-transparent text-2xl text-concrete placeholder:text-[var(--concrete-mut)] focus:outline-none sm:text-3xl"
                    />
                    {query && (
                      <button
                        data-hot
                        onClick={() => {
                          setQuery("");
                          inputRef.current?.focus();
                        }}
                        aria-label="پاک کردن جست‌وجو"
                        className="shrink-0 rounded-full p-1 text-concrete-dim transition-colors hover:text-concrete"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* results — scrollable column */}
                <div
                  ref={scrollRef}
                  data-lenis-prevent
                  className="thin-scroll pointer-events-auto mt-6 min-h-0 flex-1 overflow-y-auto pb-10"
                >
                  <p className="sr-only" aria-live="polite">
                    {query.trim() ? `${filtered.length} نتیجه پیدا شد` : ""}
                  </p>

                  {!query.trim() && data && (
                    <p className="stencil mb-2 px-1 text-[0.7rem] text-concrete-dim" dir="ltr">
                      / POPULAR
                    </p>
                  )}

                  {loading && !data ? (
                    <p className="px-1 py-10 text-center text-sm text-concrete-dim">
                      در حال بارگذاری…
                    </p>
                  ) : error ? (
                    <p className="px-1 py-10 text-center text-sm text-concrete-dim">
                      خطا در بارگذاری. یه لحظه دیگه دوباره امتحان کن.
                    </p>
                  ) : filtered.length === 0 ? (
                    <p className="px-1 py-10 text-center text-sm text-concrete-dim">
                      هیچی پیدا نشد. ولی همه‌چیمون بد خوبه، یه چیزِ دیگه امتحان کن.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {visible.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/product/${p.id}`}
                            data-hot
                            onClick={close}
                            className="group flex items-center gap-4 rounded-sm border border-transparent px-3 py-3 transition-colors hover:border-line hover:bg-black-2"
                          >
                            <img
                              src={p.img}
                              alt=""
                              loading="lazy"
                              className="h-16 w-14 shrink-0 rounded-sm border border-line object-cover"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-display text-lg text-concrete sm:text-xl">
                                {p.name}
                              </span>
                              <span className="block text-xs text-concrete-dim">{catLabel(p.cat)}</span>
                            </span>
                            <span className="tnum shrink-0 text-sm text-concrete transition-colors group-hover:text-crimson">
                              {toman(p.price)}
                              <span className="mr-1 text-xs text-concrete-dim">ت</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                      {visibleCount < filtered.length && (
                        <li ref={sentinelRef} aria-hidden="true" className="h-px" />
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>,
          document.body
        )}
    </>
  );
}

function SearchIcon({ className = "", size = 18 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function XIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
