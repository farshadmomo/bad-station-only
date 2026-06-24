// ════════ BAD STATION catalogue ════════
// prices in Toman. notes are grumpy on purpose.

export const CATEGORIES = [
  { id: "all", label: "همه‌چی" },
  { id: "shomiz", label: "شومیز" },
  { id: "boloz", label: "بلوز" },
];

export const PRODUCTS = [
  {
    id: "shomiz-katan-bad",
    name: "شومیزِ کتانِ بَد",
    cat: "shomiz",
    price: 1180000,
    img: "/gallery/new/linen-blue.jpg",
    alt: "شومیز کتان آبی تا‌خورده با لیبلِ بَد روی فرش قرمز",
    note: "لیبلِ خودمون روشه. آبیِ آروم، واسه روزایی که اعصاب نداریم. پنج تا رنگ، یه حال.",
    colors: ["آبی", "سرمه‌ای", "سفید", "قهوه‌ای", "مشکی"],
    sizes: ["S", "M", "L", "XL"],
    tag: "برندِ خودمون",
  },
  {
    id: "shomiz-toori-navy",
    name: "شومیزِ توریِ سرمه‌ای",
    cat: "shomiz",
    price: 1340000,
    img: "/gallery/new/sheer-navy.jpg",
    alt: "شومیز توریِ موج‌دار سرمه‌ای روی چوب‌لباسی",
    note: "موج داره، توره، یه‌کم پیداست. مثلِ مایی که هیچ‌وقت کامل بسته نیستیم.",
    colors: ["سرمه‌ای", "آبی", "سفید"],
    sizes: ["فری‌سایز"],
    tag: "تازه رسیده",
  },
  {
    id: "shomiz-toori-pink",
    name: "شومیزِ توریِ صورتی",
    cat: "shomiz",
    price: 1340000,
    img: "/gallery/new/sheer-pink.jpg",
    alt: "نمای نزدیکِ شومیز توریِ صورتیِ موج‌دار",
    note: "صورتیه، ولی فکر نکن خوش‌اخلاق شدیم. فقط رنگش لطیفه، ما نه.",
    colors: ["صورتی", "زرد", "سفید"],
    sizes: ["فری‌سایز"],
  },
  {
    id: "boloz-kelosh-white",
    name: "بلوزِ کلوشِ سفید",
    cat: "boloz",
    price: 1420000,
    img: "/gallery/new/babydoll-white.jpg",
    alt: "بلوز کلوشِ توریِ سفید تنِ مدل",
    note: "کلوشه، مچ‌بنددار، هفت‌تا رنگ. انتخاب با تو؛ ما به یکیش هم دل نبستیم.",
    colors: ["سفید", "صورتی", "زرد", "آبی"],
    sizes: ["فری‌سایز"],
    tag: "همه‌رنگ",
  },
  {
    id: "boloz-kelosh-brown",
    name: "بلوزِ کلوشِ قهوه‌ای",
    cat: "boloz",
    price: 1420000,
    img: "/gallery/new/babydoll-brown.jpg",
    alt: "بلوز کلوشِ توریِ قهوه‌ای تنِ مدل با شلوار مشکی",
    note: "قهوه‌ای مثل قهوه‌ی تلخِ بی‌شکر. می‌پوشیش، تلخ ولی خوش‌دوخت.",
    colors: ["قهوه‌ای", "مشکی"],
    sizes: ["فری‌سایز"],
  },
];

const FA = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

// 1280000 → "۱٬۲۸۰٬۰۰۰"
export function toman(n) {
  const grouped = n.toLocaleString("en-US").replace(/,/g, "٬");
  return grouped.replace(/[0-9]/g, (d) => FA[+d]);
}

// number → persian digits (for counts, qty)
export function fa(n) {
  return String(n).replace(/[0-9]/g, (d) => FA[+d]);
}
