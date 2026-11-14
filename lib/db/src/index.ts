import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Use the Supabase pooled connection string (Transaction pooler, port 6543).",
  );
}

/**
 * Supabase (and Neon) require TLS. node-postgres lets `sslmode` in the URL override the
 * `ssl` option, and recent versions treat `sslmode=require` as full certificate
 * verification, which fails against Supabase's own CA. We therefore strip `sslmode`
 * from the URL and configure TLS explicitly:
 *  - DATABASE_CA_CERT set   -> verify the server against that CA (strictest)
 *  - local host             -> no TLS (development)
 *  - otherwise              -> encrypted connection without CA pinning
 */
function connectionConfig(rawUrl: string): pg.PoolConfig {
  const url = new URL(rawUrl);
  const sslmode = url.searchParams.get("sslmode");
  url.searchParams.delete("sslmode");
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n");
  let ssl: pg.PoolConfig["ssl"];
  if (sslmode === "disable" || (isLocal && !ca)) ssl = undefined;
  else if (ca) ssl = { ca, rejectUnauthorized: true };
  else ssl = { rejectUnauthorized: false };
  return { connectionString: url.toString(), ssl };
}

// A small per-instance pool keeps serverless functions from exhausting the
// Supabase pooler. The transaction pooler (port 6543) multiplexes these clients.
export const pool = new Pool({
  ...connectionConfig(process.env.DATABASE_URL),
  max: 5,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 10_000,
  allowExitOnIdle: true,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
