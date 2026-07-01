"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { useCart } from "./CartProvider";
import { fa } from "../lib/products";
import Sprayed from "./Sprayed";
import BadLogo from "./BadLogo";
import Search from "./Search";
import AccountMenu from "./AccountMenu";
import Hero from "./Hero";
import Shop from "./Shop";
import Lookbook from "./Lookbook";
import About from "./About";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const NAV_LINKS = [
  { href: "#shop", label: "فروشگاه" },
  { href: "#looks", label: "لوک‌بوک" },
  { href: "#about", label: "درباره" },
];

export default function Experience() {
  const root = useRef(null);
  const cursorRef = useRef(null);
  const badgeRef = useRef(null);
  const lenisRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, openCart, bump } = useCart();

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // ── smooth scroll ──
      const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenisRef.current = lenis;
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);

      // deep link (e.g. /#shop): sit at the target from the start, positioned
      // UNDER the full-screen loader — so nothing snaps when the loader lifts.
      const deepHash =
        /^#[\w-]+$/.test(window.location.hash) &&
        document.querySelector(window.location.hash)
          ? window.location.hash
          : null;
      if (deepHash) lenis.scrollTo(deepHash, { offset: -64, immediate: true });

      // ── custom cursor (delegated hover state) ──
      const dot = cursorRef.current;
      if (dot && window.matchMedia("(hover: hover)").matches) {
        const xTo = gsap.quickTo(dot, "x", { duration: 0.16, ease: "power3" });
        const yTo = gsap.quickTo(dot, "y", { duration: 0.16, ease: "power3" });
        const move = (e) => { xTo(e.clientX - 6); yTo(e.clientY - 6); };
        const over = (e) => dot.classList.toggle("is-hot", !!e.target.closest("[data-hot],a,button"));
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseover", over);
      }

      // ── nav background on scroll ──
      ScrollTrigger.create({
        start: "top -80",
        onUpdate: (self) => {
          document.getElementById("nav")?.classList.toggle("nav-solid", self.scroll() > 80);
        },
      });

      // ── smooth-scroll every in-page anchor through Lenis ──
      const onAnchorClick = (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const hash = a.getAttribute("href");
        if (!hash || hash === "#") return;
        e.preventDefault();
        lenis.scrollTo(hash === "#top" ? 0 : hash, { duration: 1.4, offset: -64 });
      };
      document.addEventListener("click", onAnchorClick);

      // ── preloader ──
      // lock scroll while the loader covers the page — if the user spins the wheel
      // during it, nothing scrolls underneath, so there's no snap-back when it lifts.
      lenis.stop();
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set("#loader", { display: "none" });
          ScrollTrigger.refresh();
          // deep link: re-assert the under-loader position after refresh. normal
          // load: leave it — scroll was locked at the top, so there's nothing to snap.
          if (deepHash) lenis.scrollTo(deepHash, { offset: -64, immediate: true });
          lenis.start();
        },
      });
      if (reduce) {
        tl.set("#loader", { display: "none" });
        gsap.set(".hero-reveal", { opacity: 1, y: 0 });
      } else {
        tl.from(".loader-bar", {
          scaleX: 0, transformOrigin: "right center", stagger: 0.08, duration: 0.4, ease: "power4.out",
        })
          .from("#loader-word", { y: 24, opacity: 0, duration: 0.5, ease: "power3.out" }, "-=0.2")
          .to("#loader", { yPercent: -100, duration: 0.9, ease: "power4.inOut", delay: 0.4 })
          .from(".hero-reveal", { y: 56, opacity: 0, stagger: 0.08, duration: 0.8, ease: "power3.out" }, "-=0.45");
      }

      return () => {
        document.removeEventListener("click", onAnchorClick);
        lenis.destroy();
        window.__lenis = null;
        gsap.ticker.lagSmoothing(500, 33);
      };
    },
    { scope: root }
  );

  // badge pop when an item is added
  useGSAP(
    () => {
      if (bump > 0 && badgeRef.current) {
        gsap.fromTo(badgeRef.current, { scale: 0.4 }, { scale: 1, duration: 0.45, ease: "back.out(3)" });
      }
    },
    { dependencies: [bump] }
  );

  // lock scroll while the mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      lenisRef.current?.stop?.();
      const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    lenisRef.current?.start?.();
  }, [menuOpen]);

  const goShop = () => lenisRef.current?.scrollTo("#shop", { duration: 1.4, offset: -64 });

  return (
    <div ref={root}>
      <div ref={cursorRef} className="cursor-dot" aria-hidden="true" />

      {/* ── preloader ── */}
      <div
        id="loader"
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-black"
        aria-hidden="true"
      >
        <div className="flex flex-col items-end gap-[6px]">
          {[112, 84, 56, 28].map((w) => (
            <span key={w} className="loader-bar block h-[13px]" style={{ width: w, background: "var(--crimson)" }} />
          ))}
        </div>
        <p id="loader-word" className="font-display text-3xl text-concrete">یه لحظه… بد چیزی در راهه.</p>
      </div>

      {/* ── nav ── */}
      <nav
        id="nav"
        className="fixed top-0 right-0 left-0 z-[110] flex items-center justify-between px-5 py-4 transition-colors duration-500 sm:px-8"
        aria-label="ناوبری اصلی"
      >
        <BadLogo as="a" href="#top" data-hot style={{ width: "2.4rem" }} />

        <div className="flex items-center gap-2 sm:gap-5">
          {/* desktop text links */}
          <button data-hot onClick={goShop} className="hidden text-sm text-concrete transition-opacity hover:opacity-60 sm:block">
            فروشگاه
          </button>
          <a data-hot href="#looks" className="hidden text-sm text-concrete transition-opacity hover:opacity-60 sm:block">لوک‌بوک</a>
          <a data-hot href="#about" className="hidden text-sm text-concrete transition-opacity hover:opacity-60 sm:block">درباره</a>

          <Search variant="icon" />

          <div className="hidden sm:block">
            <AccountMenu />
          </div>

          {/* cart */}
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
              <span
                ref={badgeRef}
                className="tnum absolute -top-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson px-1 text-xs text-concrete"
              >
                {fa(count)}
              </span>
            )}
          </button>

          {/* hamburger — mobile only */}
          <button
            data-hot
            onClick={() => setMenuOpen(true)}
            aria-label="منو"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-concrete transition-colors hover:border-[var(--line-bright)] sm:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ── mobile menu ── */}
      <div
        className="fixed inset-0 z-[150] sm:hidden"
        style={{ pointerEvents: menuOpen ? "auto" : "none" }}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 bg-black/70 transition-opacity duration-300"
          style={{ opacity: menuOpen ? 1 : 0 }}
        />
        <aside
          className="panel-wall absolute inset-y-0 right-0 flex w-[82%] max-w-sm flex-col border-l border-line shadow-2xl transition-transform duration-[380ms] ease-out"
          style={{ transform: menuOpen ? "translateX(0)" : "translateX(100%)" }}
          role="dialog"
          aria-modal="true"
          aria-label="منوی موبایل"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <BadLogo as="span" style={{ width: "2.3rem" }} />
            <button
              data-hot
              onClick={() => setMenuOpen(false)}
              aria-label="بستنِ منو"
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-line text-concrete hover:border-[var(--line-bright)]"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col gap-1 px-4 py-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                data-hot
                onClick={() => setMenuOpen(false)}
                className="rounded-sm px-3 py-3.5 font-display text-2xl text-concrete transition-colors hover:bg-black-3"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/track"
              data-hot
              onClick={() => setMenuOpen(false)}
              className="rounded-sm px-3 py-3.5 font-display text-2xl text-concrete transition-colors hover:bg-black-3"
            >
              پیگیری سفارش
            </Link>
          </nav>

          <div className="mt-auto border-t border-line px-5 py-5">
            <AccountMenu compact />
          </div>
        </aside>
      </div>

      <main>
        <Hero onShop={goShop} />
        <Shop />
        <Lookbook />
        <About />
      </main>

      {/* ── footer ── */}
      <footer className="bg-black-2 border-t border-line">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8">
          <BadLogo
            className="mb-10"
            style={{ width: "clamp(6rem, 20vw, 9rem)" }}
          />
          <Sprayed
            as="p"
            halo
            className="font-display text-4xl text-concrete sm:text-6xl"
            drips={[
              // cream, under «اسمش بده.» (right side). top<baseline so the thin
              // run-top hides behind the letters and only the run shows below.
              // em units so the drips scale with the text at every breakpoint.
              { left: "86%", top: "64%", w: "0.22em", h: "0.93em", img: "/drips/drip-1.png", o: 0.9 },
              { left: "65%", top: "66%", w: "0.2em", h: "1.07em", img: "/drips/drip-2.png", o: 0.85 },
              // crimson, under «خودش بد خوبه.» (left side)
              { left: "47%", top: "64%", w: "0.22em", h: "0.97em", img: "/drips/drip-3.png", color: "var(--crimson)", o: 0.9 },
              { left: "35%", top: "66%", w: "0.2em", h: "0.83em", img: "/drips/drip-1.png", color: "var(--crimson)", o: 0.85 },
              { left: "26%", top: "64%", w: "0.22em", h: "1.1em", img: "/drips/drip-2.png", color: "var(--crimson)", o: 0.9 },
              { left: "12%", top: "66%", w: "0.2em", h: "0.9em", img: "/drips/drip-3.png", color: "var(--crimson)", o: 0.85 },
            ]}
          >
            اسمش بده. <span className="text-crimson">خودش بد خوبه.</span>
          </Sprayed>
          <p className="mt-6 text-sm leading-7 text-concrete-dim">
            بَد استیشن؛ کانسپت‌استورِ پوشاکِ خیابونی. خیابان ویلا، نبشِ اراک، طبقه‌ی دومِ «اون بالا».
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4 text-sm">
            <a
              href="https://www.instagram.com/bad.staaation" target="_blank" rel="noopener noreferrer"
              data-hot className="rounded-full bg-crimson px-5 py-2 text-concrete transition-transform hover:-translate-y-0.5"
            >
              اینستاگرام ↗
            </a>
            <a
              href="https://maps.app.goo.gl/5EB5dazsyPi3ZmC17?g_st=ac" target="_blank" rel="noopener noreferrer"
              data-hot className="rounded-full border border-line px-5 py-2 text-concrete transition-transform hover:-translate-y-0.5"
            >
              گوگل‌مپس ↗
            </a>
            <Link
              href="/track"
              data-hot className="rounded-full border border-line px-5 py-2 text-concrete transition-transform hover:-translate-y-0.5"
            >
              پیگیری سفارش ↗
            </Link>
          </div>
          <p className="mt-12 font-stamp text-xs tracking-[0.3em] text-concrete-dim" dir="ltr">
            BAD STATION © {new Date().getFullYear()} — SO GOOD IT&apos;S BAD
          </p>
        </div>
      </footer>
    </div>
  );
}
