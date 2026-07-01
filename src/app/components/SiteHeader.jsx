"use client";

// Shared top bar for sub-pages (product, track). The home page has its own
// animated nav inside Experience.jsx. Cart state comes from the global provider.
import Link from "next/link";
import BadLogo from "./BadLogo";
import { useCart } from "./CartProvider";
import { fa } from "../lib/products";
import Search from "./Search";
import AccountMenu from "./AccountMenu";

export default function SiteHeader() {
  const { count, openCart } = useCart();

  return (
    <header
      className="fixed top-0 right-0 left-0 z-[110] flex items-center justify-between gap-3 border-b border-line bg-black/82 px-5 py-3 backdrop-blur-md sm:px-8"
      aria-label="ناوبری"
    >
      <div className="flex items-center gap-4">
        <Link href="/" data-hot aria-label="بَد استیشن">
          <BadLogo as="span" style={{ width: "2.2rem" }} />
        </Link>
        <Link
          href="/#shop"
          data-hot
          className="hidden text-sm text-concrete-dim transition-colors hover:text-concrete sm:block"
        >
          فروشگاه
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Search variant="icon" />
        <AccountMenu />
        <button
          data-hot
          onClick={openCart}
          aria-label={`سبدِ خرید، ${count} کالا`}
          className="relative flex h-10 items-center gap-2 rounded-full border border-line px-3 text-concrete transition-colors hover:border-[var(--line-bright)] sm:px-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 7h12l-1 13H7L6 7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M9 7a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span className="hidden text-sm sm:inline">سبد</span>
          {count > 0 && (
            <span className="tnum absolute -top-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson px-1 text-xs text-concrete">
              {fa(count)}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
