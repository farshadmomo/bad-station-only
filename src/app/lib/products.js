// ════════ BAD STATION catalogue ════════
// prices in Toman. notes are grumpy on purpose.

export const CATEGORIES = [
  { id: "all", label: "همه‌چی" },
  { id: "vest", label: "وست" },
  { id: "shomiz", label: "شومیز" },
  { id: "cape", label: "شنل" },
  { id: "top", label: "کراپ‌تاپ" },
  { id: "bag", label: "کیف" },
];

export const PRODUCTS = [
  {
    id: "vest-crimson",
    name: "وستِ قرمزِ بَد",
    cat: "vest",
    price: 1280000,
    img: "/gallery/bad/bad-b-13.jpg",
    alt: "وست قرمز جلوی دیوار بتنی",
    note: "همون قرمزیه که حالمون رو نشون می‌ده. بپوشش، حداقل تو خوب باش.",
    colors: ["قرمز", "مشکی"],
    sizes: ["S", "M", "L"],
    tag: "پرفروشِ بی‌حوصله",
  },
  {
    id: "vest-navy",
    name: "وستِ سرمه‌ایِ زیپ‌دار",
    cat: "vest",
    price: 1180000,
    img: "/gallery/bad/bad-c-13.jpg",
    alt: "وست سرمه‌ای زیپ‌دار روی چوب‌لباسی",
    note: "جیب داره برای دستات. چون قرار نیست کسی دستت رو بگیره.",
    colors: ["سرمه‌ای", "مشکی"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "shomiz-oxygen",
    name: "شومیزِ اکسیژن",
    cat: "shomiz",
    price: 980000,
    img: "/gallery/bad/bad-b-01.jpg",
    alt: "شومیز سفید و آبی و سرمه‌ای روی رگال",
    note: "سه تا رنگ داره. ما حتی یه دونه حس خوب نداریم. انتخاب کن.",
    colors: ["سفید", "آبی", "سرمه‌ای"],
    sizes: ["فری‌سایز"],
    tag: "تابستونی",
  },
  {
    id: "shomiz-fog",
    name: "شومیزِ طرحِ مه",
    cat: "shomiz",
    price: 1050000,
    img: "/gallery/bad/bad-a-11.jpg",
    alt: "شومیز طرح‌دار کرم",
    note: "طرحش شلوغه، مثل فکرای ما سرِ شب. ولی قشنگه. لعنتی.",
    colors: ["کرم"],
    sizes: ["فری‌سایز"],
  },
  {
    id: "cape-camel",
    name: "شنلِ شتری",
    cat: "cape",
    price: 1650000,
    img: "/gallery/bad/bad-c-01.jpg",
    alt: "شنل شتری توی خیابون",
    note: "می‌پیچیش دورِ خودت و دنیا رو نادیده می‌گیری. کارِ ما همینه.",
    colors: ["شتری"],
    sizes: ["فری‌سایز"],
    tag: "گرونِ ارزشمند",
  },
  {
    id: "cape-night",
    name: "شنلِ شب",
    cat: "cape",
    price: 1490000,
    img: "/gallery/bad/bad-c-11.jpg",
    alt: "شنل مشکی پشت میز کافه",
    note: "مشکیه. مثل قهوه‌ای که تلخ سفارش می‌دیم و شکر نمی‌ریزیم.",
    colors: ["مشکی"],
    sizes: ["فری‌سایز"],
  },
  {
    id: "top-neutral",
    name: "کراپ‌تاپِ خنثی",
    cat: "top",
    price: 420000,
    img: "/gallery/bad/bad-tanks.jpg",
    alt: "کراپ‌تاپ سفید و مشکی",
    note: "سفید یا مشکی. خاکستری نداریم، چون اون رنگِ بلاتکلیفیه.",
    colors: ["سفید", "مشکی"],
    sizes: ["S", "M", "L"],
  },
  {
    id: "bag-brown",
    name: "توتِ قهوه‌ای",
    cat: "bag",
    price: 760000,
    img: "/gallery/bad/bad-c-12.jpg",
    alt: "کیف توت قهوه‌ای",
    note: "جا برای همه‌چی داره. جز حوصله‌ی ما. اون رو خونه جا گذاشتیم.",
    colors: ["قهوه‌ای"],
    sizes: ["تک‌سایز"],
    tag: "کیف",
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
