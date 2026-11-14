import { defineConfig } from "drizzle-kit";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Schema operations should use the DIRECT / session connection, not the transaction pooler.
// Supabase: Project → Connect → "Session pooler" (port 5432) or "Direct connection".
// Runtime application queries continue to use the pooled DATABASE_URL (port 6543).
const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL must be set before running Drizzle Kit");
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const url = new URL(databaseUrl);
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

export default defineConfig({
  schema: path.join(currentDir, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: isLocal ? { url: databaseUrl } : {
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, "") || "postgres",
    // Supabase requires TLS; its CA is not in Node's default trust store.
    ssl: { rejectUnauthorized: false },
  },
});
