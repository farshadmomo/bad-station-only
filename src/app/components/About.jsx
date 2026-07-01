"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ORDER_STEPS = [
  "محصولی که چشمت رو گرفت، بریز تو سبدِ خرید.",
  "تو صفحه‌ی محصول سایز و رنگش رو انتخاب کن.",
  "سبد رو نهایی کن؛ اسم و آدرس و شماره‌ت رو بده و پرداخت کن.",
  "یه کدِ پیگیری می‌گیری و قدم‌به‌قدم می‌بینی سفارشت کجاست.",
];

export default function About() {
  const root = useRef(null);
  const [cta, setCta] = useState("بزن تو دایرکت");

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set(".bad-rise", { opacity: 1, y: 0 });
        return;
      }
      gsap.utils.toArray(".bad-rise").forEach((el) => {
        gsap.from(el, {
          y: 44, opacity: 0, duration: 0.85, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 86%" },
        });
      });
    },
    { scope: root }
  );

  return (
    <section id="about" ref={root} className="concrete relative">
      {/* ── the crumpled letter ── */}
      <div className="mx-auto max-w-3xl px-5 pt-28 pb-20 sm:px-8">
        <div
          className="bad-rise reveal relative border border-line bg-black-2 px-7 py-12 sm:px-14"
          style={{ transform: "rotate(-0.6deg)" }}
        >
          <span
            className="font-display absolute -top-5 right-8 px-4 py-1 text-xl text-concrete"
            style={{ background: "var(--crimson)", transform: "rotate(2deg)" }}
          >
            درباره‌ی بَد!
          </span>
          <p className="text-lg leading-10 text-concrete">
            یه تیمِ کوچیکیم که «بد» براش همه‌چی بود: جنس و دوامِ پارچه، قیمتِ
            منصف، طرح، رنگ و جدیتِ کار. تو هر تیکه تلاش کردیم چیزی کم نذاریم؛ که
            وقتی می‌پوشیش، حسِ خوبی بهت بده. حسِ بد.
          </p>
          <p className="mt-6 font-display text-2xl text-crimson">
            «بد» قشنگ‌ترین اسمی بود که می‌تونستیم بذاریم. اسمش بده، خودش بد خوبه.
          </p>
          <p className="mt-8 text-left text-sm text-concrete-dim">
            دوست‌دارِ شما،
            <br />
            پدر و مادرِ «بد»
          </p>
        </div>
      </div>

      {/* ── how to order ── */}
      <div className="mx-auto max-w-4xl px-5 pb-24 sm:px-8">
        <h2 className="bad-rise font-display text-3xl text-concrete sm:text-5xl">
          نحوه‌ی سفارش{" "}
          <span className="align-middle text-base text-concrete-dim">(چون می‌دونیم می‌پرسی)</span>
        </h2>
        <ol className="mt-9">
          {ORDER_STEPS.map((s, i) => (
            <li
              key={i}
              className="bad-rise flex items-center gap-6 border-t border-line py-5 text-concrete last:border-b"
            >
              <span className="font-display text-3xl text-crimson">{["۱", "۲", "۳", "۴"][i]}</span>
              <span className="leading-8">{s}</span>
            </li>
          ))}
        </ol>

        <div className="bad-rise mt-9 flex flex-wrap items-center gap-4">
          <a
            href="https://www.instagram.com/bad.staaation"
            target="_blank"
            rel="noopener noreferrer"
            data-hot
            onMouseEnter={() => setCta("بزن دیگه، منتظریم")}
            onMouseLeave={() => setCta("بزن تو دایرکت")}
            className="rounded-sm bg-crimson px-8 py-3.5 text-base text-concrete transition-transform hover:-translate-y-1"
          >
            {cta}
          </a>
          <span className="text-sm text-concrete-dim">ارسال هم داریم؛ به همه‌جای ایرانمون.</span>
        </div>
      </div>

      {/* ── location ── */}
      <div className="mx-auto max-w-4xl px-5 pb-28 text-center sm:px-8">
        <h2 className="bad-rise font-display text-4xl text-concrete sm:text-5xl">کجاییم؟!</h2>
        <p className="bad-rise mt-5 text-lg leading-9 text-concrete-dim">
          خیابان ویلا (نجات‌اللهی)، نبشِ اراک؛{" "}
          <strong className="text-concrete">طبقه‌ی دومِ «اون بالا».</strong>
          <br />
          از وسطِ کافه و آدمای خوشحالش رد شو، بیا بالا. بد می‌ارزه.
        </p>
        <a
          href="https://maps.app.goo.gl/5EB5dazsyPi3ZmC17?g_st=ac"
          target="_blank"
          rel="noopener noreferrer"
          data-hot
          className="bad-rise mt-8 inline-block rounded-sm border border-crimson px-8 py-3 text-concrete transition-transform hover:-translate-y-1"
        >
          مسیر رو بگیر و بیا ↗
        </a>
      </div>
    </section>
  );
}
