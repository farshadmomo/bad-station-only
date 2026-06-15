"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LOOKS = [
  { src: "/gallery/bad/bad-c-10.jpg", cap: "وستِ قرمز. تنها چیزِ گرمِ این‌جا." },
  { src: "/gallery/bad/bad-c-00.jpg", cap: "ژاکتِ زبرا، جلوی دیوار." },
  { src: "/gallery/bad/bad-a-13.jpg", cap: "شومیز و یه گلِ آفتابگردون. عکس بود، حسش نبود." },
  { src: "/gallery/bad/bad-c-01.jpg", cap: "شنلِ شتری. دنیا رو نادیده بگیر." },
  { src: "/gallery/bad/bad-c-11.jpg", cap: "شنلِ شب. قهوه تلخ بود." },
  { src: "/gallery/bad/bad-c-13.jpg", cap: "وستِ سرمه‌ای. دستات تو جیب." },
];

export default function Lookbook() {
  const root = useRef(null);
  const track = useRef(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.from(".look-head", {
        y: 40, opacity: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: ".look-head", start: "top 85%" },
      });
      if (reduce) return;

      const mm = gsap.matchMedia();
      // desktop: pinned horizontal film strip
      mm.add("(min-width: 768px)", () => {
        const el = track.current;
        const dist = () => el.scrollWidth - window.innerWidth + 80;
        gsap.to(el, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => "+=" + dist(),
            scrub: 0.5,
            pin: true,
            invalidateOnRefresh: true,
          },
        });
      });
      // mobile: simple fade-in stagger of the grid
      mm.add("(max-width: 767px)", () => {
        gsap.from(".look-cell", {
          y: 40, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: ".look-rail", start: "top 80%" },
        });
      });
    },
    { scope: root }
  );

  return (
    <section id="looks" ref={root} className="relative overflow-hidden border-y border-line bg-black-2">
      <div className="px-5 pt-16 sm:px-8 md:absolute md:top-10 md:right-8 md:z-10">
        <div className="look-head">
          <p className="font-stamp text-sm tracking-[0.3em] text-crimson" dir="ltr">/ THE LOOKBOOK</p>
          <h2 className="mt-2 font-display text-4xl text-concrete sm:text-6xl">
            دیده‌شدن، <span className="text-crimson">به اجبار</span>
          </h2>
        </div>
      </div>

      {/* desktop strip / mobile grid */}
      <div
        dir="ltr"
        className="look-rail flex flex-col gap-4 px-5 py-10 sm:px-8 md:h-dvh md:flex-row md:flex-nowrap md:items-center md:gap-6 md:py-0 md:pl-[40vw]"
        ref={track}
      >
        {LOOKS.map((l, i) => (
          <figure
            key={l.src}
            className="look-cell shrink-0 overflow-hidden border border-line bg-black"
            style={{ transform: `rotate(${i % 2 ? 1 : -1}deg)` }}
          >
            <img
              src={l.src}
              alt={l.cap}
              loading="lazy"
              className="aspect-[3/4] w-full object-cover grayscale-[0.45] transition-all duration-700 hover:grayscale-0 md:h-[64vh] md:w-auto"
            />
            <figcaption dir="rtl" className="px-4 py-3 text-sm text-concrete-dim">{l.cap}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
