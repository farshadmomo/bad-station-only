"use client";

// BadLogo — the «بَد» wordmark from /logo, painted in concrete via CSS mask
// so the black ink reads on the dark wall. The PNG's red diamond gets masked
// to concrete too, so we re-introduce the brand red as a crimson diamond
// (where the original dot sits) plus optional crimson paint drips.
//
// The element's box equals the mark's tight content bbox (measured from the
// PNG), so there's no dead space; the masked layer oversizes + offsets to
// align the square PNG to that box. Every overlay is positioned in % of the
// box, so the diamond and drips track the mark at any size and never break.

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// teardrop runs — thin run widening to a rounded bulb — in % of the box.
// x = horizontal track, w/h = the drip's own width/height (% of box). Because
// the box is fixed-aspect and each <svg> uses a viewBox of the SAME w×h, the
// shapes scale uniformly with the logo at every size.
const HERO_DRIPS = [
  { x: 20, w: 1.8, h: 30 },
  { x: 33, w: 2.2, h: 47 },
  { x: 50, w: 1.6, h: 23 },
  { x: 66, w: 2.0, h: 40 },
  { x: 81.7, w: 1.5, h: 20 }, // sits on the diamond's tail, hides the masked sliver
  { x: 89, w: 1.6, h: 33 },
];

export default function BadLogo({
  className = "",
  style,
  drips = false, // false | true (HERO_DRIPS) | array of {x,w,h}
  dripDelay = 0.4,
  as: Tag = "span",
  "aria-label": ariaLabel = "بَد",
  ...rest
}) {
  const root = useRef(null);
  const dripSet = drips === true ? HERO_DRIPS : Array.isArray(drips) ? drips : null;

  useGSAP(
    () => {
      if (!dripSet) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(root.current.querySelectorAll(".bad-drip"), {
        scaleY: 0,
        transformOrigin: "top",
        stagger: 0.12,
        duration: 1.3,
        ease: "power2.out",
        delay: dripDelay,
      });
    },
    { scope: root, dependencies: [drips] }
  );

  return (
    <Tag ref={root} className={`bad-logo ${className}`} style={style} aria-label={ariaLabel} {...rest}>
      <span className="bad-logo-mark" aria-hidden="true" />
      <span className="bad-logo-diamond" aria-hidden="true" />
      {/* the dot's paint run — red in the PNG, but the concrete mask turns it
          cream; repaint it crimson so the drip bleeds red like the dot. */}
      <span className="bad-logo-dot-drip" aria-hidden="true" />
      {dripSet?.map((d, i) => (
        <svg
          key={i}
          className="bad-drip"
          viewBox={`0 0 ${d.w} ${d.h}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ left: `${d.x}%`, marginLeft: `${-d.w / 2}%`, width: `${d.w}%`, height: `${d.h}%` }}
        >
          <rect x={d.w * 0.3} y="0" width={d.w * 0.4} height={d.h - d.w * 0.9} rx={d.w * 0.2} />
          <ellipse cx={d.w / 2} cy={d.h - d.w * 0.6} rx={d.w * 0.5} ry={d.w * 0.6} />
        </svg>
      ))}
    </Tag>
  );
}
