"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * AccountMenu — nav-bar auth control. Self-contained, default export.
 * - fetches /api/auth/me on mount
 * - logged out: compact «ورود / ثبت‌نام» link to /login
 * - logged in: name (+ avatar) button opening a small keyboard-accessible dropdown
 *   (سفارش‌های من → /track, admins also get پنلِ مدیریت → /admin, خروج)
 * `compact` keeps the logged-out label visible even on small screens.
 */
export default function AccountMenu({ compact = false }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [open, setOpen] = useState(false);

  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const firstItemRef = useRef(null);

  // who am i?
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => alive && setUser(d?.user ?? null))
      .catch(() => alive && setUser(null));
    return () => {
      alive = false;
    };
  }, []);

  // close on outside click + Esc (returns focus to trigger)
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // move focus into the menu when it opens
  useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {}
    setOpen(false);
    // hard reload to the guest home: guarantees a full re-render as guest (server
    // components included) and remounts CartProvider, which drops the old cart.
    window.location.assign("/");
  };

  // reserve space while the session resolves — avoids a wrong-state flash + layout jump
  if (user === undefined) {
    return (
      <span
        aria-hidden="true"
        className="inline-block h-11 w-28 animate-pulse rounded-full border border-line bg-black-2 motion-reduce:animate-none"
      />
    );
  }

  // ───────── logged out ─────────
  if (!user) {
    return (
      <Link
        href="/login"
        data-hot
        aria-label="ورود یا ثبت‌نام"
        className="flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm text-concrete transition-colors hover:border-[var(--line-bright)]"
      >
        <UserIcon />
        {compact ? (
          <span>ورود / ثبت‌نام</span>
        ) : (
          <>
            <span className="sm:hidden">ورود</span>
            <span className="hidden sm:inline">ورود / ثبت‌نام</span>
          </>
        )}
      </Link>
    );
  }

  // ───────── logged in ─────────
  const firstName = (user.name || user.email || "").trim().split(/\s+/)[0] || "حساب";
  const initial = firstName.charAt(0) || "ب";

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={btnRef}
        type="button"
        data-hot
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 items-center gap-2 rounded-full border border-line pl-2.5 pr-2 text-sm text-concrete transition-colors hover:border-[var(--line-bright)]"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            referrerPolicy="no-referrer"
            className="h-7 w-7 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-crimson font-display text-sm text-concrete">
            {initial}
          </span>
        )}
        <span className="max-w-[7rem] truncate">{firstName}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 text-concrete-dim transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="حسابِ کاربری"
          className="panel-wall absolute left-0 top-full mt-2 z-[140] w-56 overflow-hidden rounded-sm border border-line p-1.5 shadow-2xl"
        >
          <div className="border-b border-line px-3 pb-2.5 pt-2">
            <p className="truncate text-sm text-concrete">{user.name || firstName}</p>
            {user.email && (
              <p className="truncate text-xs text-concrete-dim" dir="ltr">
                {user.email}
              </p>
            )}
          </div>

          <Link
            ref={firstItemRef}
            role="menuitem"
            href="/track"
            data-hot
            onClick={() => setOpen(false)}
            className="mt-1.5 flex min-h-11 items-center gap-2.5 rounded-sm px-3 text-sm text-concrete outline-none transition-colors hover:bg-black-3 focus-visible:bg-black-3"
          >
            <BoxIcon />
            سفارش‌های من
          </Link>

          {user.is_admin && (
            <Link
              role="menuitem"
              href="/admin"
              data-hot
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-2.5 rounded-sm px-3 text-sm text-concrete outline-none transition-colors hover:bg-black-3 focus-visible:bg-black-3"
            >
              <PanelIcon />
              پنلِ مدیریت
            </Link>
          )}

          <div className="my-1.5 border-t border-line" />

          <button
            type="button"
            role="menuitem"
            data-hot
            onClick={logout}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-sm px-3 text-sm text-crimson outline-none transition-colors hover:bg-black-3 focus-visible:bg-black-3"
          >
            <LogoutIcon />
            خروج
          </button>
        </div>
      )}
    </div>
  );
}

/* ───────── icons (inline SVG, no emoji) ───────── */

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7Z" />
      <path d="M3 8.5 12 14l9-5.5" />
      <path d="M12 14v7" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 9h18" />
      <path d="M8 9v11" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h11" />
    </svg>
  );
}
