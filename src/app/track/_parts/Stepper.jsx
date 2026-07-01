"use client";

import { STATUS, STATUS_FLOW, statusIndex } from "@/app/lib/orders-shared";
import { fa } from "@/app/lib/products";

// ── the signature: a square-node progress track ──
// RTL, so the first step (received) sits on the right and the line fills leftward.
// completed steps fill crimson, the current step glows (spray-halo), future stay hollow.
// square nodes on purpose — the brand has corners (see the cursor + loader bars).
export default function Stepper({ status }) {
  const current = statusIndex(status); // −1 for canceled / unknown

  return (
    <div
      className="flex items-start"
      role="group"
      aria-label={`وضعیتِ سفارش: ${STATUS[status]?.label ?? status}`}
    >
      {STATUS_FLOW.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const reached = i <= current; // is the connector leading into this node filled?
        const meta = STATUS[s] ?? { label: s };

        const nodeStyle = done
          ? { background: "var(--crimson)", borderColor: "var(--crimson)", color: "var(--concrete)" }
          : active
          ? { background: "var(--crimson)", borderColor: "var(--crimson-hi)", color: "var(--concrete)" }
          : { background: "var(--black-2)", borderColor: "var(--line)", color: "var(--concrete-mut)" };

        return (
          // display:contents — lets connector + column interleave inside the parent flex
          <div key={s} className="contents">
            {i > 0 && (
              <span
                aria-hidden="true"
                className="h-[2px] flex-1 rounded-full"
                style={{
                  marginTop: 19,
                  background: reached ? "var(--crimson)" : "var(--line)",
                }}
              />
            )}

            <div
              className="flex w-14 shrink-0 flex-col items-center gap-2 sm:w-16"
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-sm border text-sm ${active ? "spray-halo" : ""}`}
                style={nodeStyle}
              >
                {done ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M5 12.5l4.2 4.2L19 7"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span className="tnum font-stamp">{fa(i + 1)}</span>
                )}
              </span>
              <span
                className={`text-center text-[10px] leading-tight sm:text-xs ${
                  active ? "text-concrete" : done ? "text-concrete-dim" : "text-concrete-mut"
                }`}
              >
                {meta.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
