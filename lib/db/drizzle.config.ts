import { defineConfig } from "drizzle-kit";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Prefer the direct Neon connection for Drizzle schema operations.
// Runtime application queries continue to use the pooled DATABASE_URL.
const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL must be set before running Drizzle Kit");
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  schema: path.join(currentDir, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
