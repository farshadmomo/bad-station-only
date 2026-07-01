"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
    if (serverError) setServerError("");
  };

  const validate = () => {
    const e = {};
    if (!EMAIL_RE.test(form.email.trim())) e.email = "یه ایمیلِ درست بده.";
    if (!form.password) e.password = "رمزت رو بنویس.";
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() =>
        document.querySelector('[aria-invalid="true"]')?.focus()
      );
      return false;
    }
    return true;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(
          res.status === 401
            ? "ایمیل یا رمز جور نیست. یه بارِ دیگه بزن."
            : data?.error || "یه چیزی این وسط قاطی کرد. دوباره امتحان کن."
        );
        setPending(false);
        return;
      }
      // hard nav so CartProvider (in the root layout) remounts and re-fetches
      // /api/cart — that GET is where the server merges the guest cart into the
      // user's, so the restored cart shows immediately (no soft-nav stale state).
      window.location.assign("/");
    } catch {
      setServerError("نتونستیم وصل شیم. اینترنتت رو چک کن و دوباره بزن.");
      setPending(false);
    }
  };

  return (
    <AuthShell heading="بد خوش اومدی" sub="وارد شو. سبدت سرِ جاشه و سفارش‌هات یادمونه.">
      <Suspense fallback={null}>
        <GoogleNote />
      </Suspense>

      {serverError && <ServerError msg={serverError} />}

      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField
          id="login-email"
          label="ایمیل"
          type="email"
          inputMode="email"
          dir="ltr"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
        />
        <PasswordField
          id="login-password"
          label="رمز"
          autoComplete="current-password"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
        />
        <SubmitButton pending={pending} idle="ورود" busy="داره می‌ره…" />
      </form>

      {GOOGLE_ENABLED && <GoogleButton />}

      <p className="mt-7 text-center text-sm text-concrete-dim">
        حساب نداری؟{" "}
        <Link
          href="/signup"
          data-hot
          className="text-concrete underline decoration-crimson decoration-2 underline-offset-4 transition-colors hover:text-crimson"
        >
          ثبت‌نام کن
        </Link>
      </p>
    </AuthShell>
  );
}

/* note shown when the user is bounced back from an unconfigured google flow */
function GoogleNote() {
  const params = useSearchParams();
  if (params.get("google") !== "unconfigured") return null;
  return (
    <p
      role="status"
      className="mb-4 rounded-sm border border-line bg-black px-3.5 py-2.5 text-xs leading-6 text-concrete-dim"
    >
      ورود با گوگل هنوز روشن نشده. فعلاً با ایمیل و رمز بیا تو.
    </p>
  );
}

/* ───────── shared shell + form bits (self-contained on purpose) ───────── */

function AuthShell({ heading, sub, children }) {
  return (
    <main className="concrete relative flex min-h-dvh flex-col items-center justify-center px-5 py-16">
      <Link
        href="/"
        data-hot
        aria-label="بازگشت به خانه‌ی بَد استیشن"
        className="absolute right-5 top-5 font-display text-2xl leading-none text-concrete transition-opacity hover:opacity-70 sm:right-8 sm:top-7"
      >
        بَد<span className="text-crimson">.</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="panel-wall rounded-sm border border-line p-7 shadow-2xl sm:p-9">
          <header className="mb-7 text-center">
            <p className="stencil spray-soft text-[11px] text-crimson" dir="ltr">
              BAD STATION
            </p>
            <div className="spray-halo relative mt-3 inline-block">
              <span className="spray font-display text-7xl leading-none text-concrete">
                بَد<span className="text-crimson">.</span>
              </span>
              <span
                className="drip"
                style={{ height: 30, left: "34%", bottom: -16 }}
                aria-hidden="true"
              />
            </div>
            <h1 className="mt-8 font-display text-3xl text-concrete">{heading}</h1>
            <p className="mt-2 text-sm leading-7 text-concrete-dim">{sub}</p>
          </header>

          {children}
        </div>
      </div>
    </main>
  );
}

function ServerError({ msg }) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2.5 rounded-sm border border-crimson px-3.5 py-2.5 text-sm leading-6 text-concrete"
      style={{ backgroundColor: "oklch(48% 0.188 26 / 0.16)" }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className="mt-0.5 shrink-0 text-crimson"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 7v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="12" cy="16.4" r="1.05" fill="currentColor" />
      </svg>
      <span>{msg}</span>
    </div>
  );
}

function TextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
  inputMode,
  placeholder,
  dir,
  hint,
}) {
  const errId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-concrete">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errId : hint ? hintId : undefined}
        autoComplete={autoComplete}
        inputMode={inputMode}
        dir={dir}
        placeholder={placeholder}
        className="field min-h-11 w-full rounded-sm px-3 text-sm"
      />
      {error ? (
        <p id={errId} role="alert" className="mt-1.5 text-xs text-crimson">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-concrete-dim">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function PasswordField({ id, label, value, onChange, error, autoComplete, hint }) {
  const [show, setShow] = useState(false);
  const errId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-concrete">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errId : hint ? hintId : undefined}
          autoComplete={autoComplete}
          dir="ltr"
          className="field min-h-11 w-full rounded-sm pl-12 pr-3 text-sm"
        />
        <button
          type="button"
          data-hot
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          aria-label={show ? "پنهان‌کردنِ رمز" : "نمایشِ رمز"}
          title={show ? "پنهان‌کردنِ رمز" : "نمایشِ رمز"}
          className="absolute inset-y-0 left-0 flex w-11 items-center justify-center rounded-sm text-concrete-dim transition-colors hover:text-concrete"
        >
          {show ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {error ? (
        <p id={errId} role="alert" className="mt-1.5 text-xs text-crimson">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-concrete-dim">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SubmitButton({ pending, idle, busy }) {
  return (
    <button
      type="submit"
      data-hot
      disabled={pending}
      className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-crimson px-5 text-base text-concrete transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="animate-spin motion-reduce:hidden"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.4" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )}
      {pending ? busy : idle}
    </button>
  );
}

function GoogleButton() {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-concrete-dim" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        یا
        <span className="h-px flex-1 bg-line" />
      </div>
      <a
        href="/api/auth/google"
        data-hot
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2.5 rounded-sm border border-line bg-black px-5 text-sm text-concrete transition-colors hover:border-[var(--line-bright)]"
      >
        <GoogleG />
        ورود با گوگل
      </a>
    </div>
  );
}

/* ───────── icons (inline SVG, no emoji) ───────── */

function Eye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.2 12s3.6-7 9.8-7 9.8 7 9.8 7-3.6 7-9.8 7-9.8-7-9.8-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.8 5.2A10.4 10.4 0 0 1 12 5c6.2 0 9.8 7 9.8 7a17.8 17.8 0 0 1-3.1 4" />
      <path d="M6.2 6.2A17.6 17.6 0 0 0 2.2 12s3.6 7 9.8 7a10.4 10.4 0 0 0 3.8-.7" />
    </svg>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.42 0 9 0A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}
