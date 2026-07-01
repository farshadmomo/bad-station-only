// ════════ GET /api/auth/me ════════
// → { user } from the session, or { user: null }.
import { getSession } from "@/app/lib/session";

export async function GET() {
  try {
    const s = await getSession();
    if (!s) return Response.json({ user: null });
    return Response.json({
      user: {
        id: s.uid,
        email: s.email,
        name: s.name,
        is_admin: Boolean(s.is_admin),
      },
    });
  } catch (e) {
    return Response.json({ user: null });
  }
}
