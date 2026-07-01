// ════════ catalogue — DB-backed (replaces the hardcoded arrays in products.js) ════════
// Server-only. `available` = stock − active reservations (cart_items still holding it).
import { q, q1 } from "./db";

// active reservation total per product (cart lines whose hold hasn't expired)
const RESERVED = `
  SELECT product_id, COALESCE(SUM(qty), 0) AS reserved
    FROM cart_items
   WHERE reserved_until > now()
   GROUP BY product_id`;

const num = (v) => (v == null ? 0 : Number(v));

function mapProduct(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    cat: r.cat,
    price: num(r.price),
    img: r.img,
    images: r.images ?? [],
    alt: r.alt,
    tagline: r.tagline,
    note: r.note,
    story: r.story,
    details: r.details ?? [],
    material: r.material,
    care: r.care,
    fit: r.fit,
    colors: r.colors ?? [],
    sizes: r.sizes ?? [],
    tag: r.tag,
    stock: num(r.stock),
    available: Math.max(num(r.stock) - num(r.reserved), 0),
    archived: r.archived,
  };
}

export async function getCategories() {
  const rows = await q(`SELECT id, label, sort FROM categories ORDER BY sort, label`);
  return [{ id: "all", label: "همه‌چی" }, ...rows];
}

export async function getProducts({ includeArchived = false } = {}) {
  const rows = await q(
    `SELECT p.*, r.reserved
       FROM products p
       LEFT JOIN (${RESERVED}) r ON r.product_id = p.id
      ${includeArchived ? "" : "WHERE p.archived = false"}
      ORDER BY p.sort, p.created_at`
  );
  return rows.map(mapProduct);
}

export async function getProduct(id) {
  const r = await q1(
    `SELECT p.*, r.reserved
       FROM products p
       LEFT JOIN (${RESERVED}) r ON r.product_id = p.id
      WHERE p.id = $1`,
    [String(id ?? "")]
  );
  return mapProduct(r);
}

// related: same category first, then fill from the rest (mirrors old products.js)
export async function related(id, n = 4) {
  const all = (await getProducts()).filter((p) => p.id !== id);
  const self = await getProduct(id);
  if (!self) return all.slice(0, n);
  const same = all.filter((p) => p.cat === self.cat);
  const other = all.filter((p) => p.cat !== self.cat);
  return [...same, ...other].slice(0, n);
}
