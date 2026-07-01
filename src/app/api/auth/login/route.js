// ════════ POST /api/auth/login ════════
// { email, password } → verifies bcrypt, sets the session cookie.
import bcrypt from "bcryptjs";
import { q1 } from "@/app/lib/db";
import { setSessionCookie } from "@/app/lib/session";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      return Response.json({ error: "بدنه‌ی نامعتبر." }, { status: 400 });

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password)
      return Response.json({ error: "ایمیل و رمز رو بده." }, { status: 400 });

    const bad = { error: "ایمیل یا رمز اشتباهه." };
    const user = await q1("SELECT * FROM users WHERE email = $1", [email]);
    if (!user || !user.password_hash)
      return Response.json(bad, { status: 401 });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return Response.json(bad, { status: 401 });

    // keep admin in sync with the configured ADMIN_EMAIL
    const isAdmin =
      Boolean(user.is_admin) ||
      email === String(process.env.ADMIN_EMAIL ?? "").toLowerCase();

    await setSessionCookie({
      uid: user.id,
      email: user.email,
      name: user.name,
      is_admin: isAdmin,
    });

    return Response.json({
      user: { id: user.id, email: user.email, name: user.name, is_admin: isAdmin },
    });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}
