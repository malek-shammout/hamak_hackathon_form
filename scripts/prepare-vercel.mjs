import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteOutput = path.join(projectRoot, "artifacts", "hmk-hackathon", "dist", "public");
const vercelPublic = path.join(projectRoot, "public");

try {
  const outputStat = await stat(viteOutput);
  if (!outputStat.isDirectory()) throw new Error("Vite output is not a directory");
  const outputFiles = await readdir(viteOutput);
  if (!outputFiles.includes("index.html")) {
    throw new Error(`index.html was not found in ${viteOutput}`);
  }

  await rm(vercelPublic, { recursive: true, force: true });
  await mkdir(vercelPublic, { recursive: true });
  for (const entry of outputFiles) {
    await cp(path.join(viteOutput, entry), path.join(vercelPublic, entry), { recursive: true });
  }

  console.log(`Prepared ${outputFiles.length} Vite output entries in ${vercelPublic}`);
} catch (error) {
  console.error("Unable to prepare Vercel public assets. Make sure the Vite build completed first.");
  console.error(error);
  process.exitCode = 1;
}
