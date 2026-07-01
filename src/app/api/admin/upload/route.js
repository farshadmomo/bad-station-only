// ════════ /api/admin/upload ════════
// POST (multipart/form-data, field "file") → saves an image to public/uploads
// and returns { url }. Admin only. Server-authoritative validation.
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/app/lib/session";

const MAX_BYTES = 5 * 1024 * 1024; // ~5MB
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: "دسترسی نداری." }, { status: 401 });

    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function")
      return Response.json({ error: "فایلی نیومد." }, { status: 400 });

    if (!String(file.type || "").startsWith("image/"))
      return Response.json({ error: "فقط عکس." }, { status: 400 });
    if (file.size > MAX_BYTES)
      return Response.json({ error: "عکس باید زیرِ ۵ مگ باشه." }, { status: 400 });

    // ext from mime, falling back to the original name's extension (sanitised)
    const nameExt = String(file.name || "").split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
    const ext = EXT[file.type] || (nameExt && nameExt.length <= 5 ? nameExt : "jpg");

    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const name = `${randomUUID()}.${ext}`;
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

    return Response.json({ url: `/uploads/${name}` }, { status: 201 });
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}
