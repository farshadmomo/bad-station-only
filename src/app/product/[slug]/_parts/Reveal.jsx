"use client";

// Generic GSAP reveal wrapper used by the (server) product page so the
// page itself can stay a server component while motion lives on the client.
//  - mode="load"   → animates once on mount (hero / above-the-fold)
//  - mode="scroll" → animates when scrolled into view (below-the-fold)
//  - stagger       → animates [data-reveal-item] children in sequence
// Always respects prefers-reduced-motion (content stays fully visible).

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Reveal({
  as: Tag = "div",
  mode = "scroll",
  delay = 0,
  y = 28,
  stagger = false,
  start = "top 82%",
  className,
  children,
  ...rest
}) {
  const ref = useRef(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const targets = stagger
        ? ref.current.querySelectorAll("[data-reveal-item]")
        : ref.current;

      if (reduce) {
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }

      const vars = {
        y,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        delay,
        ...(stagger ? { stagger: 0.08 } : {}),
      };

      if (mode === "load") {
        gsap.from(targets, vars);
      } else {
        gsap.from(targets, {
          ...vars,
          scrollTrigger: { trigger: ref.current, start },
        });
      }
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
