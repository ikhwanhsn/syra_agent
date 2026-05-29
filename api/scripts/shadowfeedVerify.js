#!/usr/bin/env node
/**
 * ShadowFeed Partner Bridge — local HMAC handshake test.
 *
 * Usage:
 *   node scripts/shadowfeedVerify.js --path /health
 *   node scripts/shadowfeedVerify.js --path /news --base-url https://api.syraa.fun
 *
 * Reads SHADOWFEED_PARTNER_SECRET from api/.env (or env).
 */
import { createHash, createHmac, randomUUID } from "node:crypto";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function parseArgs(argv) {
  const out = {
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
    path: "/health",
    method: "GET",
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--path" && argv[i + 1]) out.path = argv[++i];
    else if (a === "--base-url" && argv[i + 1]) out.baseUrl = argv[++i];
    else if (a === "--method" && argv[i + 1]) out.method = argv[++i].toUpperCase();
  }
  if (!out.path.startsWith("/")) out.path = `/${out.path}`;
  return out;
}

function signRequest({ secret, method, path, body = "" }) {
  const ts = Math.floor(Date.now() / 1000);
  const nonce = randomUUID();
  const bodyHash = body
    ? createHash("sha256").update(body).digest("hex")
    : "";
  const canonical = [method.toUpperCase(), path, String(ts), nonce, bodyHash].join("\n");
  const signature = createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
  return { ts, nonce, signature };
}

async function main() {
  const secret = process.env.SHADOWFEED_PARTNER_SECRET?.trim();
  if (!secret) {
    console.error("Missing SHADOWFEED_PARTNER_SECRET (set in api/.env or env)");
    process.exit(1);
  }

  const { baseUrl, path: feedPath, method } = parseArgs(process.argv);
  const url = `${baseUrl.replace(/\/$/, "")}${feedPath}`;
  const body = method === "GET" ? "" : JSON.stringify({});
  const { ts, nonce, signature } = signRequest({ secret, method, path: feedPath, body });

  console.log(`Probing ${method} ${url}`);
  const headers = {
    "X-Sf-Partner": "shadowfeed",
    "X-Sf-Timestamp": String(ts),
    "X-Sf-Nonce": nonce,
    "X-Sf-Signature": signature,
  };
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(url, { method, headers, body: body || undefined });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text.slice(0, 500);
  }

  console.log(`Status: ${res.status}`);
  console.log(JSON.stringify(json, null, 2));

  if (res.status === 401) {
    console.error("\nHMAC rejected — check secret and that source_path matches this path exactly.");
    process.exit(1);
  }
  if (res.status === 402) {
    console.error("\nGot 402 — HMAC bypass did not run (middleware order or invalid signature).");
    process.exit(1);
  }
  if (!res.ok) {
    process.exit(1);
  }
  console.log("\nShadowFeed partner handshake OK.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
