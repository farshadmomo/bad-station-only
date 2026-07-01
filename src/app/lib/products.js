// ════════ BAD STATION catalogue ════════
// concept: «بَد» = slang intensifier ("insanely / so / crazy-good").
// the name says bad, the clothes are bad-good. prices in toman.

export const CATEGORIES = [
  { id: "all", label: "همه‌چی" },
  { id: "shomiz", label: "شومیز" },
  { id: "boloz", label: "بلوز" },
  { id: "top", label: "تاپ" },
];

export const PRODUCTS = [
  {
    id: "shomiz-katan-bad",
    name: "شومیزِ کتانِ بَد",
    cat: "shomiz",
    price: 1180000,
    img: "/gallery/new/linen-blue.jpg",
    images: [
      "/gallery/new/linen-blue.jpg",
      "/gallery-bad-new/2.png",
      "/gallery/new/look-linen-rack.jpg",
      "/gallery/new/look-studio.jpg",
    ],
    alt: "شومیز کتان آبی با یقه‌ی باز و جیبِ رو",
    tagline: "بد می‌شینه به تنت",
    note: "کتانِ خنک، یقه‌ی باز، یه جیبِ تمیز. آبیِ آروم که بد به هر چیزی میادش.",
    story:
      "اینو واسه روزایی زدیم که می‌خوای راحت باشی ولی کم نیاری. کتانِ سبک که نفس می‌کشه، فُرمش اندازه‌ست؛ نه گل‌وگشاد نه چسبون. تنش کن، آستین بزن بالا، تمومه.",
    details: ["یقه‌ی کوبایی (باز)", "یه جیبِ سینه", "دوختِ تمیزِ لبه", "نخِ ضدِ چروکِ نسبی"],
    material: "۱۰۰٪ کتان",
    care: "شستشوی ملایم، اتوی متوسط",
    fit: "فُرمِ ریلکس",
    colors: ["آبی", "سفید", "سرمه‌ای", "قهوه‌ای", "مشکی"],
    sizes: ["S", "M", "L", "XL"],
    tag: "پرفروش",
  },
  {
    id: "shomiz-toori-navy",
    name: "شومیزِ توریِ سرمه‌ای",
    cat: "shomiz",
    price: 1340000,
    img: "/gallery/new/sheer-navy.jpg",
    images: [
      "/gallery/new/sheer-navy.jpg",
      "/gallery-bad-new/colors.png",
      "/gallery/new/look-colors.jpg",
    ],
    alt: "شومیز توریِ موج‌دار سرمه‌ای",
    tagline: "بد توجه می‌گیری",
    note: "موج‌دار و توری، یه‌کم پیدا یه‌کم نه. سرمه‌ایش بد سنگینه.",
    story:
      "بافتِ موجیِ توری که زیرِ نور زنده می‌شه. روی یه تاپِ ساده بندازش یا تنها بپوش؛ هرجوری بپوشی بد دیده می‌شی. سبکه و خنک، واسه شبای گرم ساخته شده.",
    details: ["بافتِ توریِ موج‌دار", "آستینِ بلند با مچ", "نیمه‌شفاف", "سبک و خنک"],
    material: "پلی‌استرِ توریِ موج‌دار",
    care: "شستشوی دست، آب سرد",
    fit: "فُرمِ استاندارد",
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
    images: [
      "/gallery/new/sheer-pink.jpg",
      "/gallery-bad-new/colors.png",
      "/gallery/new/look-colors-2.jpg",
    ],
    alt: "نمای نزدیکِ شومیز توریِ صورتیِ موج‌دار",
    tagline: "بد لطیفه",
    note: "صورتیِ آروم با همون بافتِ موجیِ خفن. بد ملایمه، بد می‌چسبه.",
    story:
      "همون توریِ موج‌دار، این‌بار با یه صورتیِ خاکی که داد نمی‌زنه ولی دیده می‌شه. لِیه‌ای بپوشش؛ بد ترکیب می‌شه با هر رنگی.",
    details: ["بافتِ توریِ موج‌دار", "آستینِ بلند با مچ", "نیمه‌شفاف", "رنگِ صورتیِ خاکی"],
    material: "پلی‌استرِ توریِ موج‌دار",
    care: "شستشوی دست، آب سرد",
    fit: "فُرمِ استاندارد",
    colors: ["صورتی", "زرد", "سفید"],
    sizes: ["فری‌سایز"],
  },
  {
    id: "shomiz-toori-haftrang",
    name: "شومیزِ توریِ هفت‌رنگ",
    cat: "shomiz",
    price: 1390000,
    img: "/gallery-bad-new/colors.png",
    images: [
      "/gallery-bad-new/colors.png",
      "/gallery-bad-new/colors03.png",
      "/gallery/new/look-colors.jpg",
      "/gallery/new/look-colors-2.jpg",
    ],
    alt: "ردیفِ شومیزهای توریِ موج‌دار در هفت رنگ روی رگال",
    tagline: "هر رنگی بخوای، بد هست",
    note: "کلِ رنگ‌بندیِ توری یه‌جا. هرکدوم رو بزنی، بد در میای.",
    story:
      "نتونستیم یه رنگ رو انتخاب کنیم، پس همه رو آوردیم. از صورتیِ خاکی تا مشکیِ توری؛ هفت حسِ مختلف از یه بافت. رنگِ موردِ علاقه‌ت رو انتخاب کن.",
    details: ["هفت رنگ", "بافتِ توریِ موج‌دار", "نیمه‌شفاف", "لبه‌ی گره‌خور"],
    material: "پلی‌استرِ توریِ موج‌دار",
    care: "شستشوی دست، آب سرد",
    fit: "فُرمِ استاندارد",
    colors: ["صورتی", "زرد", "سفید", "آبی", "سرمه‌ای", "قهوه‌ای", "مشکی"],
    sizes: ["فری‌سایز"],
    tag: "هفت‌رنگ",
  },
  {
    id: "boloz-kelosh-sefid",
    name: "بلوزِ کلوشِ سفید",
    cat: "boloz",
    price: 1420000,
    img: "/gallery/new/babydoll-white.jpg",
    images: [
      "/gallery/new/babydoll-white.jpg",
      "/gallery/new/look-duo.jpg",
      "/gallery/new/look-trio.jpg",
    ],
    alt: "بلوز کلوشِ توریِ سفید تنِ مدل",
    tagline: "بد بهت میاد",
    note: "کلوش، مچ‌بنددار، سبک. سفیدش بد تمیزه و بد جلب می‌کنه.",
    story:
      "تنه‌ی کلوش که آزاد می‌افته و مچِ جمع که فُرم می‌ده. یه بلوزِ راحت که هم با شلوار جوره هم با دامن. سفیدِ پایه‌ای که همیشه جواب می‌ده.",
    details: ["برشِ کلوش", "مچِ کِش‌دار", "آستینِ بلند", "بافتِ سبک"],
    material: "ویسکوزِ توری",
    care: "شستشوی ملایم",
    fit: "فُرمِ آزاد",
    colors: ["سفید", "صورتی", "زرد", "آبی"],
    sizes: ["فری‌سایز"],
    tag: "همه‌رنگ",
  },
  {
    id: "boloz-kelosh-ghahve",
    name: "بلوزِ کلوشِ قهوه‌ای",
    cat: "boloz",
    price: 1420000,
    img: "/gallery/new/babydoll-brown.jpg",
    images: [
      "/gallery/new/babydoll-brown.jpg",
      "/gallery/new/look-corner.jpg",
      "/gallery/new/look-scene-crates.jpg",
    ],
    alt: "بلوز کلوشِ توریِ قهوه‌ای تنِ مدل با شلوار مشکی",
    tagline: "بد گرمه",
    note: "قهوه‌ایِ تلخ که با مشکی بد ست می‌شه. خوش‌دوخت و گرم.",
    story:
      "همون برشِ کلوش با یه قهوه‌ایِ عمیق که حسِ پاییز می‌ده. با شلوار مشکی بزنش، یه کفشِ ساده، بد کامل می‌شه.",
    details: ["برشِ کلوش", "مچِ کِش‌دار", "آستینِ بلند", "رنگِ قهوه‌ایِ تلخ"],
    material: "ویسکوزِ توری",
    care: "شستشوی ملایم",
    fit: "فُرمِ آزاد",
    colors: ["قهوه‌ای", "مشکی"],
    sizes: ["فری‌سایز"],
  },
  {
    id: "top-bandi-bad",
    name: "تاپِ بندیِ بَد",
    cat: "top",
    price: 690000,
    img: "/gallery/bad/bad-tanks.jpg",
    images: [
      "/gallery/bad/bad-tanks.jpg",
      "/gallery/bad/bad-a-00.jpg",
      "/gallery/bad/bad-b-00.jpg",
    ],
    alt: "دو تاپِ بندیِ کبریتی، سفید و مشکی، روی چوب‌لباسی",
    tagline: "پایه‌ی هر استایل",
    note: "کبریتیِ بنددار، یقه‌ی چهارگوش. زیرِ همه‌چی بد می‌شینه؛ تنها هم بد می‌ترکونه.",
    story:
      "اون تکه‌ای که همیشه لازمت می‌شه. بافتِ کبریتیِ کشی که فُرمِ تن رو می‌گیره، بندِ قابلِ تنظیم، یقه‌ی چهارگوشِ تمیز. سفید و مشکی بگیر، خیالت راحت.",
    details: ["بافتِ کبریتیِ کشی", "بندِ قابلِ تنظیم", "یقه‌ی چهارگوش", "قدِ کراپ"],
    material: "ویسکوز / الیافِ کشی",
    care: "شستشوی ماشین، آب سرد",
    fit: "فُرمِ بدن‌نما",
    colors: ["سفید", "مشکی"],
    sizes: ["S", "M", "L"],
    tag: "پایه",
  },
];

// ── helpers ──────────────────────────────────────────────
export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

// related items: same category first, then fill from the rest
export function related(id, n = 4) {
  const self = getProduct(id);
  if (!self) return PRODUCTS.slice(0, n);
  const same = PRODUCTS.filter((p) => p.id !== id && p.cat === self.cat);
  const other = PRODUCTS.filter((p) => p.id !== id && p.cat !== self.cat);
  return [...same, ...other].slice(0, n);
}

// free-text search over name / note / category label / colors
export function searchProducts(query) {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? "";
  return PRODUCTS.filter((p) => {
    const hay = [p.name, p.note, p.tagline, catLabel(p.cat), ...(p.colors || [])]
      .join(" ")
      .toLowerCase();
    return hay.includes(term);
  });
}

const FA = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

// 1280000 → "۱٬۲۸۰٬۰۰۰"  (coerce: Postgres BIGINT comes back as a string)
export function toman(n) {
  const num = Number(n) || 0;
  const grouped = num.toLocaleString("en-US").replace(/,/g, "٬");
  return grouped.replace(/[0-9]/g, (d) => FA[+d]);
}

// number → persian digits (for counts, qty)
export function fa(n) {
  return String(n).replace(/[0-9]/g, (d) => FA[+d]);
}
