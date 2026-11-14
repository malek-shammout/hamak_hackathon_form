import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use Neon's pooled connection string (DATABASE_URL) for serverless production.
// A small per-instance pool prevents function instances from opening too many clients.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 10_000,
  allowExitOnIdle: true,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
