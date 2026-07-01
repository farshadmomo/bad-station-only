// ════════ order status — shared by API, admin, track page ════════
// the pipeline, in order. STATUS_FLOW drives the stepper UI everywhere.

// flat-rate shipping (toman). Server-authoritative — never trust the client's value.
export const SHIPPING = 90000;

export const STATUS_FLOW = ["received", "confirmed", "packing", "shipped", "delivered"];

// label = short chip, voice = the hyped one-liner shown to the customer
export const STATUS = {
  received:  { label: "ثبت شد",            voice: "سفارشت بد نشست. ثبتش کردیم." },
  confirmed: { label: "تأیید شد",          voice: "موجودی تأیید شد. داریم می‌بندیمش." },
  packing:   { label: "در حال آماده‌سازی", voice: "بد داریم برات می‌پیچیمش." },
  shipped:   { label: "ارسال شد",          voice: "زد بیرون. داره می‌رسه دستت." },
  delivered: { label: "تحویل شد",          voice: "رسید. بد بپوش، بد بدرخش." },
  canceled:  { label: "لغو شد",            voice: "این یکی کنسل شد. بعداً جبران." },
};

export const STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUS).map(([k, v]) => [k, v.label])
);

// per-status swatch — one source of truth for the admin calendar + analytics.
// distinct hues (not a crimson opacity ramp) so statuses are easy to tell apart.
export const STATUS_COLOR = {
  received: "#3b82f6",  // blue
  confirmed: "#f59e0b", // amber
  packing: "#f97316",   // orange
  shipped: "#94a3b8",   // slate
  delivered: "#22c55e", // green
  canceled: "var(--crimson)",
};

// index in the flow (−1 if canceled / unknown)
export function statusIndex(status) {
  return STATUS_FLOW.indexOf(status);
}

// generate a public tracking code, e.g. "BAD-7F3K9" (no ambiguous chars)
export function makeOrderCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I,O,0,1
  let s = "";
  for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `BAD-${s}`;
}
