#!/usr/bin/env node
/**
 * Launch local mcp-server against production with payer from api/.env.
 * Keeps the secret out of ~/.cursor/mcp.json.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const envPath = path.resolve(repoRoot, "api/.env");
const mcpEntry = path.resolve(repoRoot, "mcp-server/dist/index.js");

function loadEnvValue(file, key) {
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, "utf8");
  const line = text.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) return null;
  let raw = line.slice(key.length + 1).trim();
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1);
  }
  return raw;
}

const payer = loadEnvValue(envPath, "PAYER_KEYPAIR") || loadEnvValue(envPath, "SYRA_PAYER_KEYPAIR");
if (!payer) {
  console.error("[syra-mcp-prod] Missing PAYER_KEYPAIR in api/.env");
  process.exit(1);
}

const env = {
  ...process.env,
  SYRA_API_BASE_URL: "https://api.syraa.fun",
  SYRA_MCP_TOOL_PROFILE: process.env.SYRA_MCP_TOOL_PROFILE || "curated",
  SYRA_PAYER_KEYPAIR: payer,
};
delete env.SYRA_USE_DEV_ROUTES;

const child = spawn(process.execPath, [mcpEntry], {
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
