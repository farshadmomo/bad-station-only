// ════════ GET /api/auth/google ════════
// If configured → 302 to Google's consent screen with a signed CSRF state cookie.
// If not configured → 302 back to /login?google=unconfigured (no crash).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  googleConfigured,
  buildAuthUrl,
  signState,
  STATE_COOKIE,
  STATE_MAX_AGE,
} from "@/app/lib/google";

export async function GET(req) {
  try {
    if (!googleConfigured()) {
      return NextResponse.redirect(new URL("/login?google=unconfigured", req.url));
    }

    const nonce = crypto.randomUUID();
    const token = await signState(nonce);

    const store = await cookies();
    store.set(STATE_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: STATE_MAX_AGE,
    });

    return NextResponse.redirect(buildAuthUrl(nonce));
  } catch (e) {
    return NextResponse.redirect(new URL("/login?google=error", req.url));
  }
}
