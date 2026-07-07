#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const skipDirs = new Set(["node_modules", ".git", "dist", ".cursor"]);
const exts = new Set([".md", ".json", ".ts", ".tsx", ".js", ".mjs", ".txt"]);

const replacements = [
  ["@syra-ai/mcp-server", "@syra-ai/mcp-server"],
  ["@syra-ai/sdk", "@syra-ai/sdk"],
  ["@syra-ai/x402-payer", "@syra-ai/x402-payer"],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (exts.has(name.slice(name.lastIndexOf("."))) || name === "llms.txt") out.push(p);
  }
  return out;
}

let count = 0;
for (const file of walk(root)) {
  let text = readFileSync(file, "utf8");
  const orig = text;
  for (const [a, b] of replacements) text = text.split(a).join(b);
  if (text !== orig) {
    writeFileSync(file, text);
    console.log("updated:", file.replace(root + "\\", "").replace(root + "/", ""));
    count++;
  }
}
console.log(`Done. ${count} files updated.`);
