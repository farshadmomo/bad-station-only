// ════════ GET /api/auth/google/callback ════════
// Verify CSRF state → exchange code → verify id_token (Google JWKS) →
// upsert user by google_sub/email → set session cookie → 302 to /.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { q1 } from "@/app/lib/db";
import { setSessionCookie } from "@/app/lib/session";
import {
  googleConfigured,
  verifyState,
  exchangeCode,
  verifyIdToken,
  STATE_COOKIE,
} from "@/app/lib/google";

const fail = (req, reason) =>
  NextResponse.redirect(new URL(`/login?google=${reason}`, req.url));

export async function GET(req) {
  try {
    if (!googleConfigured()) return fail(req, "unconfigured");

    const sp = req.nextUrl.searchParams;
    if (sp.get("error")) return fail(req, "denied");

    const code = sp.get("code");
    const state = sp.get("state");
    if (!code || !state) return fail(req, "error");

    const store = await cookies();
    const stateToken = store.get(STATE_COOKIE)?.value;
    const stateOk = stateToken && (await verifyState(stateToken, state));
    if (!stateOk) return fail(req, "error");
    store.delete(STATE_COOKIE);

    const tokens = await exchangeCode(code);
    if (!tokens || !tokens.id_token) return fail(req, "error");

    const claims = await verifyIdToken(tokens.id_token);
    const sub = claims.sub;
    const email = String(claims.email ?? "").toLowerCase();
    if (!sub || !email) return fail(req, "error");

    // only trust Google's email if Google says it's verified — otherwise an
    // attacker with an unverified-email Google account could claim someone's row
    if (claims.email_verified !== true && claims.email_verified !== "true")
      return fail(req, "unverified");

    const name =
      String(claims.name ?? "").trim() || email.split("@")[0] || "کاربر";
    const avatar = claims.picture ? String(claims.picture) : null;
    const isAdmin = email === String(process.env.ADMIN_EMAIL ?? "").toLowerCase();

    // 1) authoritative match: this exact Google identity
    let user = await q1("SELECT * FROM users WHERE google_sub = $1 LIMIT 1", [sub]);

    // 2) fall back to email, but never rebind an account already linked to a
    //    DIFFERENT Google identity (that would be account takeover)
    if (!user) {
      const byEmail = await q1("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
      if (byEmail) {
        if (byEmail.google_sub && byEmail.google_sub !== sub) return fail(req, "error");
        user = byEmail;
      }
    }

    if (user) {
      user = await q1(
        `UPDATE users
            SET google_sub = $1,
                avatar_url  = COALESCE($2, avatar_url),
                name        = COALESCE(NULLIF($3, ''), name),
                is_admin    = is_admin OR $4
          WHERE id = $5
          RETURNING id, email, name, is_admin`,
        [sub, avatar, name, isAdmin, user.id]
      );
    } else {
      user = await q1(
        `INSERT INTO users (email, name, google_sub, avatar_url, is_admin)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name, is_admin`,
        [email, name, sub, avatar, isAdmin]
      );
    }

    await setSessionCookie({
      uid: user.id,
      email: user.email,
      name: user.name,
      is_admin: user.is_admin,
    });

    return NextResponse.redirect(new URL("/", req.url));
  } catch (e) {
    return fail(req, "error");
  }
}
