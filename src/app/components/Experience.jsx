"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { useCart } from "./CartProvider";
import { fa } from "../lib/products";
import Hero from "./Hero";
import Shop from "./Shop";
import Lookbook from "./Lookbook";
import About from "./About";
import CartDrawer from "./CartDrawer";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Experience() {
  const root = useRef(null);
  const cursorRef = useRef(null);
  const badgeRef = useRef(null);
  const lenisRef = useRef(null);
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

      // ── smooth-scroll every in-page anchor through Lenis (nav tabs, logo, CTAs) ──
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
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set("#loader", { display: "none" });
          lenis.scrollTo(0, { immediate: true });
          ScrollTrigger.refresh();
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
        <p id="loader-word" className="font-display text-3xl text-concrete">یه لحظه… حسش نیست.</p>
      </div>

      {/* ── nav ── */}
      <nav
        id="nav"
        className="fixed top-0 right-0 left-0 z-[110] flex items-center justify-between px-5 py-4 transition-colors duration-500 sm:px-8"
        aria-label="ناوبری اصلی"
      >
        <a href="#top" data-hot className="font-display text-2xl leading-none text-concrete">
          بَد<span className="text-crimson">.</span>
        </a>

        <div className="flex items-center gap-4 text-sm text-concrete sm:gap-7">
          <button data-hot onClick={goShop} className="hidden hover:opacity-60 sm:block">فروشگاه</button>
          <a data-hot href="#looks" className="hidden hover:opacity-60 sm:block">لوک‌بوک</a>
          <a data-hot href="#about" className="hidden hover:opacity-60 sm:block">درباره</a>

          <button
            data-hot
            onClick={openCart}
            aria-label={`سبدِ خرید، ${count} کالا`}
            className="relative flex h-10 items-center gap-2 rounded-full border border-line px-4 transition-colors hover:border-[var(--line-bright)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 7h12l-1 13H7L6 7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M9 7a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span className="hidden sm:inline">سبد</span>
            {count > 0 && (
              <span
                ref={badgeRef}
                className="tnum absolute -top-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson px-1 text-xs text-concrete"
              >
                {fa(count)}
              </span>
            )}
          </button>
        </div>
      </nav>

      <main>
        <Hero onShop={goShop} />
        <Shop />
        <Lookbook />
        <About />
      </main>

      {/* ── footer ── */}
      <footer className="bg-black-2 border-t border-line">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8">
          <p className="font-display text-4xl text-concrete sm:text-6xl">
            حالمون بده. <span className="text-crimson">جنسمون خوب.</span>
          </p>
          <p className="mt-4 text-sm leading-7 text-concrete-dim">
            بَد استیشن — کانسپت‌استورِ پوشاک. خیابان ویلا، نبشِ اراک، طبقه‌ی دومِ «اون بالا».
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
          </div>
          <p className="mt-12 font-stamp text-xs tracking-[0.3em] text-concrete-dim" dir="ltr">
            BAD STATION © {new Date().getFullYear()} — MADE IN A BAD MOOD
          </p>
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
