#!/usr/bin/env node
/**
 * Verify npm auth can publish @syra-ai packages.
 * Dry-run alone can pass with a limited token — we also probe org access.
 */
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkgDir = path.join(root, "packages/syra-x402-payer");

function run(cmd, cwd, allowFail = false) {
  try {
    return execSync(cmd, { cwd, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  } catch (err) {
    if (allowFail) return String(err.stderr || err.stdout || "");
    throw err;
  }
}

console.log("Checking npm publish auth for @syra-ai/* …\n");

let user;
try {
  user = run("npm whoami", root).trim();
  console.log(`✓ Logged in as: ${user}`);
} catch {
  console.error("✗ Not logged in.\n");
  console.error("  npm login                    # browser + Windows Hello / passkey");
  console.error("  npm run publish:packages:interactive\n");
  process.exit(1);
}

const orgProbe = run("npm org ls syra-ai", root, true);
if (/403|Forbidden|not perform/i.test(orgProbe)) {
  console.warn("⚠ Token cannot manage @syra-ai org — likely missing package write scope.");
  console.warn("  Org-only token access does NOT allow publishing @syra-ai/* packages.\n");
}

try {
  run("npm publish --access public --dry-run", pkgDir);
  console.log("✓ Dry-run tarball OK.");
} catch (err) {
  printFix(String(err.stderr || err.stdout || err.message || ""));
  process.exit(1);
}

console.log(
  "\nIf real publish returns E403, enable \"Bypass 2FA\" on the syra-ai granular token.\n" +
    "If E404, token lacks package write scope (Packages → All packages → Read and write).\n" +
    "Or: npm login && npm run publish:packages:interactive (Windows Hello)\n",
);

function printFix(msg) {
  console.error("✗ Auth check failed.\n");
  if (/bypass 2fa/i.test(msg)) {
    console.error(
      "Create a Granular token with \"Bypass two-factor authentication (2FA)\" checked.\n" +
        "npm uses Windows Hello / passkey — NOT Google Authenticator.\n",
    );
  } else if (/404|not in this registry/i.test(msg)) {
    console.error(
      "Token cannot publish to @syra-ai scope. When creating the token:\n\n" +
        "  Packages and scopes → All packages → Read and write\n" +
        "  (NOT org-only — org access alone cannot publish packages)\n\n" +
        "  Also check: Bypass two-factor authentication (2FA)\n\n" +
        "Then: npm config set //registry.npmjs.org/:_authToken npm_...\n",
    );
  } else {
    console.error(msg.slice(0, 600));
  }
}
