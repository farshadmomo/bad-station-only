// ════════ Google OAuth helper ════════
// Auth-code flow + id_token verification against Google JWKS.
// Gracefully no-ops when GOOGLE_CLIENT_ID / SECRET are not configured.
// CSRF: a short-lived, jose-signed "state" token stored in an httpOnly cookie;
// the nonce inside it is echoed back via the `state` query param.
import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";

const ALG = "HS256";

export const STATE_COOKIE = "bad_oauth_state";
export const STATE_MAX_AGE = 600; // 10 minutes

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET missing");
  return new TextEncoder().encode(s);
}

// true only when the OAuth app is fully configured
export function googleConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
  );
}

// sign a short-lived token carrying the CSRF nonce
export async function signState(nonce) {
  return new SignJWT({ nonce })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${STATE_MAX_AGE}s`)
    .sign(secret());
}

// verify the cookie token and confirm its nonce matches the returned state
export async function verifyState(token, nonce) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return Boolean(payload.nonce) && payload.nonce === nonce;
  } catch {
    return false;
  }
}

// build the Google consent URL; `state` is the nonce echoed on callback
export function buildAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// exchange the authorization code for tokens
export async function exchangeCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("google token exchange failed");
  return res.json(); // { id_token, access_token, ... }
}

// verify the id_token signature + claims against Google's JWKS
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

export async function verifyIdToken(idToken) {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return payload; // { sub, email, email_verified, name, picture, ... }
}
