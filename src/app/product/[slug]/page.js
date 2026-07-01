import { Fragment } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct, related, getCategories } from "@/app/lib/catalogue";
import { toman } from "@/app/lib/products";
import SiteHeader from "@/app/components/SiteHeader";
import Gallery from "./_parts/Gallery";
import ProductBuy from "./_parts/ProductBuy";
import Reveal from "./_parts/Reveal";

// stock + reservations change per request — never prerender this page
export const dynamic = "force-dynamic";

// the brand word «بَد» (با زبر) — match by exact codepoints so the spray
// signature lands on the wordmark even with the combining mark.
const BAD = "بَد";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "پیدا نشد — بَد استیشن" };
  return {
    title: `${p.name} — بَد استیشن`,
    description: p.note,
    openGraph: {
      title: `${p.name} — بَد استیشن`,
      description: p.tagline,
      images: p.img ? [p.img] : undefined,
    },
  };
}

// wrap the «بَد» inside a product name with the spray filter
function SprayName({ name }) {
  if (!name.includes(BAD)) return name;
  const segs = name.split(BAD);
  return segs.map((seg, i) => (
    <Fragment key={i}>
      {seg}
      {i < segs.length - 1 && <span className="spray text-crimson">{BAD}</span>}
    </Fragment>
  ));
}

function Spec({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5">
      <dt className="text-xs text-concrete-dim">{label}</dt>
      <dd className="text-left text-sm text-concrete">{value}</dd>
    </div>
  );
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const [others, cats] = await Promise.all([related(slug, 4), getCategories()]);
  const CAT_LABEL = Object.fromEntries(cats.map((c) => [c.id, c.label]));
  const hasBad = p.name.includes(BAD);

  return (
    <>
      <SiteHeader />

      <main className="relative mx-auto max-w-6xl px-5 pt-24 pb-20 sm:px-8 sm:pt-28 sm:pb-28">
        {/* back to shop */}
        <Reveal mode="load" dir="rtl">
          <Link
            href="/#shop"
            data-hot
            className="inline-flex items-center gap-2 text-xs text-concrete-dim transition-colors hover:text-concrete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            برگرد به فروشگاه
          </Link>
        </Reveal>

        {/* hero — gallery left, info right (ltr wrapper, rtl content) */}
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12" dir="ltr">
          <Reveal mode="load" className="lg:sticky lg:top-28 lg:self-start">
            <Gallery images={p.images} alt={p.alt} tag={p.tag} />
          </Reveal>

          <div dir="rtl" className="flex flex-col">
            <Reveal mode="load" delay={0.08}>
              {/* category eyebrow */}
              <div className="flex items-center gap-3">
                <span className="stencil spray-soft text-sm text-crimson" dir="ltr">
                  / {p.cat.toUpperCase()}
                </span>
                <span className="text-xs text-concrete-dim">{CAT_LABEL[p.cat]}</span>
              </div>

              {/* name */}
              <h1
                className={`mt-3 font-display text-4xl leading-[1.1] text-concrete sm:text-5xl ${
                  hasBad ? "spray-halo" : ""
                }`}
              >
                <SprayName name={p.name} />
              </h1>

              {/* tagline */}
              <p className="mt-3 text-lg text-concrete-dim sm:text-xl">{p.tagline}</p>

              {/* price */}
              <p className="tnum mt-5 text-3xl text-concrete" dir="rtl">
                {toman(p.price)}
                <span className="mr-1.5 text-base text-concrete-dim">تومان</span>
              </p>

              {/* note */}
              <p className="mt-4 max-w-prose text-sm leading-7 text-concrete-dim">{p.note}</p>
            </Reveal>

            {/* buy box */}
            <Reveal mode="load" delay={0.16} className="mt-7">
              <ProductBuy product={p} />
              <p className="mt-3 text-center text-xs text-concrete-dim">
                ارسال به همه‌جای ایرانمون. تهِ سبد باهات هماهنگ می‌کنیم.
              </p>
            </Reveal>
          </div>
        </div>

        {/* details: story + bullets, and the spec sheet */}
        <section className="mt-16 sm:mt-24" dir="rtl">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <Reveal>
              <p className="stencil text-xs text-concrete-dim" dir="ltr">/ STORY</p>
              <h2 className="mt-2 font-display text-3xl text-concrete sm:text-4xl">قصه‌ش</h2>
              <p className="mt-4 max-w-prose text-[15px] leading-8 text-concrete-dim">{p.story}</p>

              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {p.details.map((d) => (
                  <li key={d} className="flex items-start gap-2.5 text-sm text-concrete">
                    <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-crimson" />
                    {d}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.05}>
              <p className="stencil text-xs text-concrete-dim" dir="ltr">/ SPEC</p>
              <h2 className="mt-2 font-display text-3xl text-concrete sm:text-4xl">مشخصات</h2>
              <dl className="mt-4 divide-y divide-line border-y border-line">
                <Spec label="جنس" value={p.material} />
                <Spec label="نگه‌داری" value={p.care} />
                <Spec label="فُرم" value={p.fit} />
              </dl>
            </Reveal>
          </div>
        </section>

        {/* other products */}
        <section className="mt-16 border-t border-line pt-12 sm:mt-24 sm:pt-16" dir="rtl">
          <p className="stencil text-xs text-concrete-dim" dir="ltr">/ MORE</p>
          <h2 className="mt-2 font-display text-3xl text-concrete sm:text-5xl">
            اینا رو هم بد می‌خوای
          </h2>

          <Reveal
            stagger
            className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6"
          >
            {others.map((rp) => (
              <Link
                key={rp.id}
                href={`/product/${rp.id}`}
                data-hot
                data-reveal-item
                className="group flex flex-col overflow-hidden rounded-sm border border-line bg-black-2"
              >
                <div className="relative overflow-hidden border-b border-line bg-black">
                  {rp.tag && (
                    <span className="absolute top-2.5 right-2.5 z-10 rounded-sm bg-crimson px-2 py-0.5 text-[11px] text-concrete">
                      {rp.tag}
                    </span>
                  )}
                  <img
                    src={rp.img}
                    alt={rp.alt}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover grayscale-[0.5] transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:grayscale-0"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-display text-lg leading-tight text-concrete sm:text-xl">
                    {rp.name}
                  </h3>
                  <p className="tnum mt-1 text-xs text-concrete-dim" dir="rtl">
                    {toman(rp.price)}
                    <span className="mr-1">تومان</span>
                  </p>
                </div>
              </Link>
            ))}
          </Reveal>
        </section>
      </main>
    </>
  );
}
