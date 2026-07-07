#!/usr/bin/env node
/**
 * Publish Syra npm packages in dependency order:
 *   @syra-ai/x402-payer → @syra-ai/sdk → @syra-ai/mcp-server
 *
 * npm (2025+) uses security keys (Windows Hello / Touch ID / passkey), NOT Google Authenticator.
 *
 * Recommended — Granular token with Bypass 2FA (no prompts):
 *   1. npmjs.com → Access Tokens → Generate Granular token
 *   2. Read and write on All packages (or @syra-ai scope)
 *   3. CHECK "Bypass two-factor authentication (2FA)"
 *   4. npm config set //registry.npmjs.org/:_authToken npm_...
 *   5. npm run verify:npm-auth && npm run publish:packages
 *
 * Alternative — interactive passkey in your terminal:
 *   npm login
 *   npm run publish:packages:interactive
 */
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");
const interactive = process.argv.includes("--interactive");

const packages = [
  { name: "@syra-ai/x402-payer", dir: "packages/syra-x402-payer" },
  { name: "@syra-ai/sdk", dir: "syra-sdk" },
  { name: "@syra-ai/mcp-server", dir: "mcp-server" },
];

function run(cmd, cwd = root) {
  console.log(`\n> ${cmd}`);
  if (interactive && cmd.includes("npm publish") && !dryRun) {
    const result = spawnSync(cmd, { cwd, stdio: "inherit", shell: true });
    if (result.status !== 0) throw new Error(`Command failed: ${cmd}`);
    return;
  }
  execSync(cmd, { cwd, stdio: "inherit" });
}

if (!dryRun) {
  try {
    execSync("node scripts/verify-npm-publish-auth.mjs", { cwd: root, stdio: "inherit" });
  } catch {
    process.exit(1);
  }
}

console.log(dryRun ? "Dry-run publish (no packages uploaded)" : "Publishing Syra packages to npm");

run("npm run build:packages");

const publishFlag = dryRun ? "--dry-run" : "";

for (const pkg of packages) {
  const cwd = path.join(root, pkg.dir);
  run(`npm publish --access public ${publishFlag}`.trim(), cwd);
}

console.log("\nDone.", dryRun ? "Re-run without --dry-run to publish." : "");
