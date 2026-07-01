// ════════ POST /api/auth/signup ════════
// { name, email, password } → creates a user, sets the session cookie.
import bcrypt from "bcryptjs";
import { q1 } from "@/app/lib/db";
import { setSessionCookie } from "@/app/lib/session";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      return Response.json({ error: "بدنه‌ی نامعتبر." }, { status: 400 });

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (name.length < 2)
      return Response.json({ error: "اسم باید حداقل ۲ حرف باشه." }, { status: 400 });
    if (!EMAIL_RE.test(email))
      return Response.json({ error: "ایمیلِ معتبر بده." }, { status: 400 });
    if (password.length < 6)
      return Response.json({ error: "رمز حداقل ۶ کاراکتر باشه." }, { status: 400 });

    const existing = await q1("SELECT id FROM users WHERE email = $1", [email]);
    if (existing)
      return Response.json({ error: "این ایمیل قبلاً ثبت شده." }, { status: 409 });

    const hash = await bcrypt.hash(password, 10);
    const isAdmin = email === String(process.env.ADMIN_EMAIL ?? "").toLowerCase();

    let user;
    try {
      user = await q1(
        `INSERT INTO users (email, name, password_hash, is_admin)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, name, is_admin`,
        [email, name, hash, isAdmin]
      );
    } catch (err) {
      if (err && err.code === "23505")
        return Response.json({ error: "این ایمیل قبلاً ثبت شده." }, { status: 409 });
      throw err;
    }

    await setSessionCookie({
      uid: user.id,
      email: user.email,
      name: user.name,
      is_admin: user.is_admin,
    });

    return Response.json({ user });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}
