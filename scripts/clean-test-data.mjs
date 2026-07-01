// Wipe demo/test orders + non-admin users for a clean slate.
// Run: node scripts/clean-test-data.mjs   (reads .env.local)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query("DELETE FROM order_events");
await client.query("DELETE FROM orders");
const { rowCount } = await client.query(
  "DELETE FROM users WHERE is_admin = false"
);
await client.query("ALTER SEQUENCE orders_id_seq RESTART WITH 1");
console.log(`✓ cleared all orders/events and ${rowCount} non-admin user(s). Admin kept.`);
await client.end();
