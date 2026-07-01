// Seed categories + products from the (formerly hardcoded) lib/products.js into Postgres.
// Idempotent upsert. Run: node scripts/seed-catalogue.mjs   (reads .env.local)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { PRODUCTS, CATEGORIES } from "../src/app/lib/products.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
console.log("→ connected");

// categories (skip the synthetic "all" tab — that's a UI filter, not a real category)
let c = 0;
for (const [i, cat] of CATEGORIES.filter((x) => x.id !== "all").entries()) {
  await client.query(
    `INSERT INTO categories (id, label, sort) VALUES ($1,$2,$3)
       ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort = EXCLUDED.sort`,
    [cat.id, cat.label, i]
  );
  c++;
}
console.log(`→ categories: ${c}`);

// products — keep existing stock if already seeded, else default 6
let p = 0;
for (const [i, prod] of PRODUCTS.entries()) {
  await client.query(
    `INSERT INTO products
       (id,name,cat,price,img,images,alt,tagline,note,story,details,material,care,fit,colors,sizes,tag,stock,sort)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15::jsonb,$16::jsonb,$17,$18,$19)
     ON CONFLICT (id) DO UPDATE SET
       name=EXCLUDED.name, cat=EXCLUDED.cat, price=EXCLUDED.price, img=EXCLUDED.img,
       images=EXCLUDED.images, alt=EXCLUDED.alt, tagline=EXCLUDED.tagline, note=EXCLUDED.note,
       story=EXCLUDED.story, details=EXCLUDED.details, material=EXCLUDED.material, care=EXCLUDED.care,
       fit=EXCLUDED.fit, colors=EXCLUDED.colors, sizes=EXCLUDED.sizes, tag=EXCLUDED.tag,
       sort=EXCLUDED.sort, updated_at=now()`,
    [
      prod.id, prod.name, prod.cat, prod.price, prod.img,
      JSON.stringify(prod.images ?? []), prod.alt ?? null, prod.tagline ?? null,
      prod.note ?? null, prod.story ?? null, JSON.stringify(prod.details ?? []),
      prod.material ?? null, prod.care ?? null, prod.fit ?? null,
      JSON.stringify(prod.colors ?? []), JSON.stringify(prod.sizes ?? []),
      prod.tag ?? null, 6, i,
    ]
  );
  p++;
}
console.log(`→ products: ${p}`);

await client.end();
console.log("✓ catalogue seeded");
