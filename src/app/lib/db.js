// ════════ Postgres pool ════════
// Single shared pg Pool across hot-reloads (Next dev re-evaluates modules).
//
// Windows note: Postgres spawns one OS process PER connection. In this
// constrained/non-interactive environment, lots of short-lived connections
// exhaust the Windows desktop heap (backends die with 0xC0000142 / err 487).
// So we keep a TINY, PERSISTENT pool: connections stay open and get reused,
// which means almost no new backend processes are spawned after warm-up.
import { Pool } from "pg";

const globalForPg = globalThis;

function makePool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    min: 1,
    idleTimeoutMillis: 0, // never close idle connections (avoid re-spawning backends)
    keepAlive: true,
    connectionTimeoutMillis: 10_000,
  });
  // don't let a dropped backend crash the node process
  pool.on("error", (err) => {
    console.error("[pg pool] idle client error:", err.message);
  });
  return pool;
}

export const pool = globalForPg.__badPgPool ?? makePool();

if (process.env.NODE_ENV !== "production") {
  globalForPg.__badPgPool = pool;
}

// query helper — returns rows. Retries once if the backend was reset.
export async function q(text, params) {
  try {
    const res = await pool.query(text, params);
    return res.rows;
  } catch (err) {
    if (isTransient(err)) {
      const res = await pool.query(text, params);
      return res.rows;
    }
    throw err;
  }
}

// query helper — returns first row or null
export async function q1(text, params) {
  const rows = await q(text, params);
  return rows[0] ?? null;
}

function isTransient(err) {
  const c = err?.code;
  return (
    c === "57P01" || // admin_shutdown / terminating connection
    c === "08006" || // connection failure
    c === "08003" || // connection does not exist
    c === "ECONNRESET" ||
    /terminat|reset|closed/i.test(err?.message ?? "")
  );
}
