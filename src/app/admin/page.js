import Link from "next/link";
import { getSession } from "@/app/lib/session";
import SiteHeader from "@/app/components/SiteHeader";
import AdminBoard from "./_parts/AdminBoard";

export const metadata = {
  title: "مدیریتِ سفارش‌ها — بَد استیشن",
};

export default async function AdminPage() {
  const session = await getSession();

  // gate: never render order data to non-admins
  if (!session?.is_admin) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 pb-24 pt-28 text-center">
          <p className="stencil spray-soft text-xs text-crimson" dir="ltr">
            / ADMIN ONLY
          </p>
          <h1 className="mt-3 font-display text-4xl text-concrete">اینجا مالِ تیمِ بَده.</h1>
          <p className="mt-3 text-sm leading-7 text-concrete-dim">
            برای دیدن و مدیریتِ سفارش‌ها باید با حسابِ ادمین وارد شده باشی.
          </p>
          <Link
            href="/login"
            data-hot
            className="mt-6 min-h-12 rounded-sm bg-crimson px-7 py-3 text-sm text-concrete transition-transform hover:-translate-y-0.5"
          >
            ورود به حساب
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <AdminBoard adminName={session.name} />
    </>
  );
}
