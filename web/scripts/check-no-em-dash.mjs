/**
 * Fails if any U+2014 em dash remains under web/src or web/public.
 * Run from web/: node scripts/check-no-em-dash.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EM_DASH = "\u2014";
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_ROOTS = [webRoot];
const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);
const TEXT_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".html",
  ".css",
  ".md",
  ".mdx",
  ".json",
  ".svg",
  ".txt",
  ".xml",
  ".mjs",
  ".cjs",
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const offenders = [];
for (const root of SCAN_ROOTS) {
  for (const file of walk(root)) {
    const ext = path.extname(file).toLowerCase();
    if (!TEXT_EXTS.has(ext)) continue;
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (!text.includes(EM_DASH)) continue;
    const rel = path.relative(webRoot, file).replace(/\\/g, "/");
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(EM_DASH)) offenders.push(`${rel}:${i + 1}`);
    }
  }
}

if (offenders.length > 0) {
  console.error(`Em dash (U+2014) found in ${offenders.length} location(s):`);
  for (const o of offenders) console.error(`  ${o}`);
  process.exit(1);
}

console.log("OK: no em dashes under web/");
