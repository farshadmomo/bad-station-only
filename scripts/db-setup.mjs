// Apply db/schema.sql and seed the admin user.
// Run: node scripts/db-setup.mjs   (reads .env.local)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// minimal .env.local loader (no dep)
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

const schema = readFileSync(join(root, "db", "schema.sql"), "utf8");

await client.connect();
console.log("→ connected:", process.env.DATABASE_URL);
await client.query(schema);
console.log("→ schema applied");

// seed admin
const email = process.env.ADMIN_EMAIL;
const pass = process.env.ADMIN_PASSWORD;
if (email && pass) {
  const hash = await bcrypt.hash(pass, 10);
  await client.query(
    `INSERT INTO users (email, name, password_hash, is_admin)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash, is_admin = true`,
    [email, "بَد ادمین", hash]
  );
  console.log("→ admin seeded:", email);
}

const { rows } = await client.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1"
);
console.log("→ tables:", rows.map((r) => r.table_name).join(", "));
await client.end();
console.log("✓ done");
