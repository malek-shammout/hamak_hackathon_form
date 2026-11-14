/**
 * Produces a Vercel Build Output API v3 bundle in <repo>/.vercel/output:
 *   static/            Vite site (artifacts/hmk-hackathon/dist/public)
 *   functions/api.func Express API bundled into one Node.js serverless function
 *   config.json        /api/* -> function, static files, SPA fallback
 *
 * Vercel uses .vercel/output when the build command creates it, so the API no longer
 * depends on framework auto-detection (which is why /api used to return the 404 page).
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import { build as esbuild } from "esbuild";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(artifactDir, "..", "..");
const out = path.join(root, ".vercel", "output");
const viteOutput = path.join(root, "artifacts", "hmk-hackathon", "dist", "public");
const funcDir = path.join(out, "functions", "api.func");

async function main() {
  const index = await stat(path.join(viteOutput, "index.html")).catch(() => null);
  if (!index) throw new Error(`Vite output not found in ${viteOutput}. Run the frontend build first.`);

  await rm(out, { recursive: true, force: true });
  await mkdir(funcDir, { recursive: true });

  // 1) static site
  await cp(viteOutput, path.join(out, "static"), { recursive: true });

  // 2) API function
  await esbuild({
    stdin: {
      contents: `import app from "./src/app.ts";\nexport default app;\n`,
      resolveDir: artifactDir,
      sourcefile: "vercel-entry.ts",
      loader: "ts",
    },
    platform: "node",
    target: "node22",
    bundle: true,
    format: "esm",
    outfile: path.join(funcDir, "index.mjs"),
    logLevel: "info",
    sourcemap: "linked",
    legalComments: "none",
    // Production at runtime: secure cookies, JSON logs without pino worker transports.
    define: { "process.env.NODE_ENV": '"production"' },
    external: ["pg-native", "*.node", "pino-pretty", "bufferutil", "utf-8-validate"],
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';
globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);`,
    },
  });
  await writeFile(path.join(funcDir, "package.json"), JSON.stringify({ type: "module" }));
  await writeFile(path.join(funcDir, ".vc-config.json"), JSON.stringify({
    runtime: "nodejs22.x",
    handler: "index.mjs",
    launcherType: "Nodejs",
    shouldAddHelpers: false,
    maxDuration: 30,
  }, null, 2));

  // 3) routing
  await writeFile(path.join(out, "config.json"), JSON.stringify({
    version: 3,
    routes: [
      { src: "^/assets/(.*)$", headers: { "Cache-Control": "public, max-age=31536000, immutable" }, continue: true },
      {
        src: "^/(.*)$",
        headers: {
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "X-Frame-Options": "DENY",
        },
        continue: true,
      },
      { src: "^/api(?:/.*)?$", dest: "/api" },
      { handle: "filesystem" },
      { src: "^/(.*)$", dest: "/index.html" },
    ],
  }, null, 2));

  console.log(`Vercel build output ready in ${out}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
