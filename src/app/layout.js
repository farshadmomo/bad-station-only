import { Lalezar, Vazirmatn, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./components/CartProvider";
import CartDrawer from "./components/CartDrawer";

// display — bold, characterful Persian + Latin
const lalezar = Lalezar({
  variable: "--font-lalezar",
  weight: "400",
  subsets: ["arabic", "latin"],
  display: "swap",
});

// body — clean Persian/Latin with tabular figures
const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  display: "swap",
});

// industrial Latin micro-labels / stamps
const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "بَد استیشن — بد خوبه",
  description:
    "بَد استیشن؛ پوشاکِ خیابونی. شومیز، بلوز، تاپ و کیف. اسمش بده، خودش بد خوبه. ارسال به همه‌جای ایرانمون.",
  openGraph: {
    title: "بَد استیشن — بد خوبه",
    description: "اسممون بده، جنسمون بد خوبه. بد بپوش، بد بدرخش.",
  },
};

export const viewport = {
  themeColor: "#1a1714",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${lalezar.variable} ${vazirmatn.variable} ${bebas.variable} h-full antialiased`}
    >
      <body className="grain min-h-full">
        {/* ── spray-paint filters (referenced by .spray / .spray-soft) ── */}
        <svg
          width="0"
          height="0"
          aria-hidden="true"
          style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        >
          <defs>
            <filter id="bad-spray" x="-25%" y="-25%" width="150%" height="150%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.82 0.86"
                numOctaves="2"
                seed="7"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="4.2"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            <filter id="bad-spray-soft" x="-25%" y="-25%" width="150%" height="150%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9 0.95"
                numOctaves="1"
                seed="4"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="1.7"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
