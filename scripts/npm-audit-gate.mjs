#!/usr/bin/env node
/**
 * CI gate for npm audit — fails on high/critical except known unfixable
 * transitive advisories in the Solana/Web3 dependency tree.
 *
 * Usage: node scripts/npm-audit-gate.mjs [package-dir]
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

/** Advisories with no upstream patch in our dependency tree (accepted risk). */
const ALLOWLIST = new Set([
  "GHSA-3gc7-fjrx-p6mg", // bigint-buffer — pulled in by @solana/web3.js / spl-token
]);

const dir = path.resolve(process.argv[2] || ".");
const pkgJson = path.join(dir, "package.json");
if (!existsSync(pkgJson)) {
  console.log(`skip: no package.json in ${dir}`);
  process.exit(0);
}

/** @returns {Record<string, unknown>} */
function loadAuditReport() {
  try {
    const out = execSync("npm audit --omit=dev --json", {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return JSON.parse(out);
  } catch (err) {
    const stdout = err?.stdout?.toString?.() ?? "";
    if (stdout.trim()) {
      try {
        return JSON.parse(stdout);
      } catch {
        /* fall through */
      }
    }
    throw err;
  }
}

/** @param {string} url */
function ghsaFromUrl(url) {
  const match = String(url).match(/GHSA-[a-z0-9-]+/i);
  return match ? match[0] : null;
}

/**
 * Resolve a vulnerability entry to its root advisory GHSA IDs.
 * @param {string} name
 * @param {Record<string, { severity?: string, via?: unknown }>} vulns
 * @param {Set<string>} visited
 * @returns {string[]}
 */
function resolveAdvisoryIds(name, vulns, visited = new Set()) {
  if (visited.has(name)) return [];
  visited.add(name);
  const meta = vulns[name];
  if (!meta) return [];

  /** @type {string[]} */
  const ids = [];
  const via = meta.via;
  if (!via) return ids;

  if (typeof via === "string") {
    ids.push(...resolveAdvisoryIds(via, vulns, visited));
    return ids;
  }

  if (!Array.isArray(via)) return ids;

  for (const entry of via) {
    if (typeof entry === "string") {
      ids.push(...resolveAdvisoryIds(entry, vulns, visited));
    } else if (entry && typeof entry === "object" && "url" in entry) {
      const id = ghsaFromUrl(entry.url);
      if (id) ids.push(id);
    }
  }
  return ids;
}

const report = loadAuditReport();
/** @type {Record<string, { severity?: string, via?: unknown, name?: string }>} */
const vulns = report.vulnerabilities ?? {};

/** @type {Array<{ name: string, severity: string, ids: string[] }>} */
const blocking = [];

for (const [name, meta] of Object.entries(vulns)) {
  const severity = meta.severity ?? "";
  if (severity !== "high" && severity !== "critical") continue;

  const ids = [...new Set(resolveAdvisoryIds(name, vulns))];
  const unallowlisted = ids.filter((id) => !ALLOWLIST.has(id));
  if (unallowlisted.length === 0) continue;

  blocking.push({ name, severity, ids: unallowlisted });
}

if (blocking.length > 0) {
  console.error(`npm audit gate FAILED in ${path.relative(process.cwd(), dir) || "."}:`);
  for (const v of blocking) {
    console.error(`  - ${v.name} (${v.severity}): ${v.ids.join(", ")}`);
  }
  process.exit(1);
}

console.log(`npm audit gate passed for ${path.relative(process.cwd(), dir) || "."}`);
