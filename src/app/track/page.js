import { Suspense } from "react";
import SiteHeader from "@/app/components/SiteHeader";
import TrackBoard from "./_parts/TrackBoard";

export const metadata = {
  title: "پیگیریِ سفارش — بَد استیشن",
  description: "کدِ سفارشت رو بزن، ببین کجاست. هرجا باشه، بد داره می‌رسه.",
};

export default function TrackPage() {
  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto min-h-dvh max-w-3xl px-5 pt-28 pb-24 sm:px-8 sm:pt-32">
        <Suspense fallback={<TrackFallback />}>
          <TrackBoard />
        </Suspense>
      </main>
    </>
  );
}

// server-rendered shell while the client board (which reads ?code=) hydrates
function TrackFallback() {
  return (
    <div aria-hidden="true">
      <p className="stencil spray-soft text-xs text-crimson" dir="ltr">
        / TRACK ORDER
      </p>
      <h1 className="mt-3 font-display text-5xl leading-tight text-concrete sm:text-6xl">
        سفارشت <span className="text-crimson">کجاست؟</span>
      </h1>
      <div className="mt-8 h-12 w-full rounded-sm border border-line bg-black-2" />
    </div>
  );
}
