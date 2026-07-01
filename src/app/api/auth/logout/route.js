// ════════ POST /api/auth/logout ════════
// clears the session cookie.
import { clearSessionCookie } from "@/app/lib/session";

export async function POST() {
  try {
    await clearSessionCookie();
  } catch {
    // ignore — already gone
  }
  return Response.json({ ok: true });
}
