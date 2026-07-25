#!/usr/bin/env node
/**
 * Export ship-log #40 (OKX Genesis) via Remotion CLI — same PostDeck composition as /post/video/40.
 *
 *   node okx-asp/export-post-demo-video.mjs
 *
 * Output: okx-asp/out/syra-okxai-genesis-finance-copilot.mp4
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const webDir = join(root, "web");
const outDir = join(root, "okx-asp", "out");
const outFile = join(outDir, "syra-okxai-genesis-finance-copilot.mp4");

mkdirSync(outDir, { recursive: true });

if (!existsSync(join(webDir, "node_modules", "remotion"))) {
  console.error("Missing web/node_modules/remotion — run npm install in web/");
  process.exit(1);
}

// PostDeckGenesis in Root.tsx embeds OKX_GENESIS_FINANCE_POST (#40) — icons stay in-bundle.
const args = [
  "remotion",
  "render",
  "src/video/remotion-entry.ts",
  "PostDeck",
  outFile,
  "--codec=h264",
  "--scale=2",
];

console.log("cwd:", webDir);
console.log("npx", args.join(" "));
const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", args, {
  cwd: webDir,
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});
process.exit(r.status ?? 1);
