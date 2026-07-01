"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import BadLogo from "./BadLogo";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MARQUEE = [
  "بد بهت میاد",
  "بد خوش‌تیپ می‌شی",
  "بد حال می‌ده",
  "بددد می‌خوایش",
  "ذوق کن، عیب نداره",
];

export default function Hero({ onShop }) {
  const root = useRef(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // hype marquee drags itself
      gsap.to(".bad-marquee", { xPercent: -50, duration: 28, ease: "none", repeat: -1 });

      if (reduce) return;

      // hype meter scrubs from معمولی → بَد (the max) and pins there
      gsap.fromTo(
        ".mood-needle",
        { left: "92%" },
        {
          left: "8%",
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 },
        }
      );
      gsap.to(".mood-fill", {
        scaleX: 1,
        transformOrigin: "right center",
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 },
      });

      // parallax on the giant بَد
      gsap.to(".bad-wordmark", {
        yPercent: 14,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    },
    { scope: root }
  );

  return (
    <section
      id="top"
      ref={root}
      className="concrete relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 pt-28 pb-16"
      aria-label="بَد استیشن"
    >
      {/* bare bulb, lighting the wall */}
      <div className="flicker pointer-events-none absolute top-0 left-1/2 -translate-x-1/2" aria-hidden="true">
        <svg width="56" height="140" viewBox="0 0 56 140">
          <line x1="28" y1="0" x2="28" y2="90" stroke="var(--line)" strokeWidth="2" />
          <circle cx="28" cy="105" r="15" fill="oklch(80% 0.09 85 / 0.85)" />
          <circle cx="28" cy="105" r="32" fill="oklch(80% 0.09 85 / 0.10)" />
        </svg>
      </div>

      <p className="hero-reveal reveal stencil spray-soft text-sm text-crimson" dir="ltr">
        BAD STATION — CLOTHING &amp; BAGS
      </p>

      {/* giant graffiti بَد — the signature logo */}
      <div className="bad-wordmark spray-halo relative mt-2 mb-16">
        <BadLogo
          as="h1"
          className="hero-reveal reveal"
          style={{ width: "clamp(15rem, 56vw, 34rem)" }}
        />
      </div>

      <p className="hero-reveal reveal mt-8 text-center font-display text-3xl leading-snug text-concrete sm:text-5xl">
        اسمش بده. <span className="text-crimson">خودش بد خوبه.</span>
      </p>
      <p className="hero-reveal reveal mt-4 max-w-md text-center text-[15px] leading-7 text-concrete-dim">
        پوشاکِ خیابونی واسه آدمایی که می‌خوان دیده بشن. شومیز، بلوز، تاپ، کیف. اسمش
        بده، ولی پارچه و دوختش بد خوبه. بپوش، ببین.
      </p>

      {/* حال‌سنج — hype meter, sliding up to بَد (the max) */}
      <div className="hero-reveal reveal mt-10 w-full max-w-sm" aria-hidden="true">
        <div className="mb-2 flex justify-between font-stamp text-xl tracking-widest text-concrete-dim sm:text-2xl" dir="ltr">
          <span className="text-crimson">بَد</span>
          <span>معمولی</span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full border border-line bg-black-2">
          <div
            className="mood-fill absolute inset-y-0 right-0 left-0 origin-right rounded-full"
            style={{ background: "var(--crimson)", transform: "scaleX(0.12)" }}
          />
          <span
            className="mood-needle absolute top-1/2 h-5 w-[3px] -translate-y-1/2 rounded bg-concrete"
            style={{ left: "92%" }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-concrete-dim">
          حالِ امروزِ ما: <span className="text-crimson">بدددد خوبه</span>
        </p>
      </div>

      <div className="hero-reveal reveal mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={onShop}
          data-hot
          className="rounded-sm bg-crimson px-8 py-3.5 text-base text-concrete transition-transform hover:-translate-y-1"
        >
          بریم سراغِ خرید
        </button>
        <a
          href="#about"
          data-hot
          className="rounded-sm border border-line px-8 py-3.5 text-base text-concrete transition-colors hover:border-[var(--line-bright)]"
        >
          چرا بَد؟
        </a>
      </div>

      {/* hype marquee */}
      <div
        className="absolute bottom-0 left-0 w-full overflow-hidden border-t border-line bg-black/40 py-3 backdrop-blur-[1px]"
        dir="ltr"
        aria-hidden="true"
      >
        <div className="marquee-track bad-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {MARQUEE.map((t) => (
                <span key={t} className="font-display mx-6 whitespace-nowrap text-xl text-concrete-dim">
                  {t} <span className="mx-2 text-crimson">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
