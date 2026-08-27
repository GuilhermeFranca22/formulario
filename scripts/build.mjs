import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await cp(resolve(root, "index.html"), resolve(dist, "index.html"));
await cp(resolve(root, "styles.css"), resolve(dist, "styles.css"));
await cp(resolve(root, "src"), resolve(dist, "src"), { recursive: true });

const apiUrl = process.env.FORM_API_URL?.trim();
if (apiUrl) {
  const configPath = resolve(dist, "src", "config.js");
  const config = await readFile(configPath, "utf8");
  await writeFile(configPath, config.replace("__FORM_API_URL__", apiUrl.replace(/\/$/, "")), "utf8");
}

console.log("Build estático gerado em dist/");
