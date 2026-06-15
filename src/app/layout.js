import { Lalezar, Vazirmatn, Bebas_Neue } from "next/font/google";
import "./globals.css";

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
  title: "بَد استیشن — بد نبودیم، بد شدیم",
  description:
    "فروشگاه آنلاین بَد استیشن. شومیز، دامن، وست، کیف و کراپ‌تاپ. حالمون بده، جنسمون خوب. ارسال به همه‌جای ایرانمون.",
  openGraph: {
    title: "بَد استیشن",
    description: "حالمون بده، جنسمون خوب. خیابان ویلا، نبش اراک، اون بالا.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${lalezar.variable} ${vazirmatn.variable} ${bebas.variable} h-full antialiased`}
    >
      <body className="grain min-h-full">{children}</body>
    </html>
  );
}
