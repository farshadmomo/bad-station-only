// ════════ session (stateless JWT in httpOnly cookie) ════════
// jose HS256 signed with SESSION_SECRET. No sessions table needed.
// NOTE (Next 16): cookies() is async — always await it.
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "bad_session";
const ALG = "HS256";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET missing");
  return new TextEncoder().encode(s);
}

// payload: { uid, email, name, is_admin }
export async function signSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

// write the session cookie (call inside a route handler / server action)
export async function setSessionCookie(payload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

// read + verify the current session, or null
export async function getSession() {
  try {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    return payload; // { uid, email, name, is_admin, iat, exp }
  } catch {
    return null;
  }
}

// guard helper for admin-only routes
export async function requireAdmin() {
  const s = await getSession();
  return s?.is_admin ? s : null;
}
