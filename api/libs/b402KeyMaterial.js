/**
 * B402 private key loading for local files and production env (B402_PRIVATE_KEY_B64 / PEM).
 * Production hosts rarely ship api/.keys/b402_private.pem — bootstrap writes it from env at boot.
 */
import crypto from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_B402_PRIVATE_KEY_FILE = path.resolve(__dirname, "../.keys/b402_private.pem");

function env(name) {
  return String(process.env[name] || "").trim();
}

function stripWrappingQuotes(value) {
  const s = String(value || "").trim();
  if (
    (s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
    (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
  ) {
    return s.slice(1, -1).trim();
  }
  return s;
}

/**
 * Normalize PEM / base64 key material from hosting env vars (Railway, Render, etc.).
 * @param {string} raw
 * @returns {string | null}
 */
export function parsePrivateKeyMaterialFromEnv(raw) {
  let s = stripWrappingQuotes(raw);
  if (!s) return null;

  if (s.includes("\\n")) {
    s = s.replace(/\\n/g, "\n");
  }

  if (s.includes("BEGIN")) {
    if (!s.includes("\n") && /\s/.test(s)) {
      s = s
        .replace(/-----BEGIN ([^-]+)-----/g, "-----BEGIN $1-----\n")
        .replace(/-----END ([^-]+)-----/g, "\n-----END $1-----")
        .replace(/\s+/g, "\n")
        .replace(/\n+/g, "\n")
        .trim();
    }
    return s.includes("BEGIN") ? s : null;
  }

  try {
    const der = Buffer.from(s.replace(/\s/g, ""), "base64");
    const keyObject = crypto.createPrivateKey({ key: der, format: "der", type: "pkcs8" });
    return keyObject.export({ type: "pkcs8", format: "pem" });
  } catch {
    return null;
  }
}

/**
 * @returns {string}
 */
export function resolveB402PrivateKeyFilePath() {
  const fallbackSyra =
    process.env.USERPROFILE || process.env.HOME
      ? path.join(process.env.USERPROFILE || process.env.HOME, ".syra", "qa-api-rsa", "private.pem")
      : "";
  return (
    env("B402_PRIVATE_KEY_FILE") ||
    (fallbackSyra && existsSync(fallbackSyra) ? fallbackSyra : "") ||
    DEFAULT_B402_PRIVATE_KEY_FILE
  );
}

/**
 * Load PEM from env vars only (not from disk).
 * @returns {string | null}
 */
export function loadPrivateKeyPemFromEnv() {
  const pemRaw = env("B402_PRIVATE_KEY_PEM");
  if (pemRaw) {
    const parsed = parsePrivateKeyMaterialFromEnv(pemRaw);
    if (parsed) return parsed;
  }
  const b64Raw = env("B402_PRIVATE_KEY_B64");
  if (b64Raw) {
    const parsed = parsePrivateKeyMaterialFromEnv(b64Raw);
    if (parsed) return parsed;
  }
  return null;
}

/**
 * Write api/.keys/b402_private.pem from env when the file is missing (production bootstrap).
 * @returns {{ wrote: boolean, path: string, source: "env_pem" | "env_b64" | "existing_file" | "none" }}
 */
export function bootstrapB402PrivateKeyFromEnv() {
  const keyPath = resolveB402PrivateKeyFilePath();
  if (existsSync(keyPath)) {
    try {
      const existing = readFileSync(keyPath, "utf8").trim();
      if (existing.includes("BEGIN")) {
        return { wrote: false, path: keyPath, source: "existing_file" };
      }
    } catch {
      /* continue to bootstrap from env */
    }
  }

  const pemFromEnv = loadPrivateKeyPemFromEnv();
  if (!pemFromEnv) {
    return { wrote: false, path: keyPath, source: "none" };
  }

  mkdirSync(path.dirname(keyPath), { recursive: true });
  writeFileSync(keyPath, `${pemFromEnv.trim()}\n`, { encoding: "utf8", mode: 0o600 });
  const source = env("B402_PRIVATE_KEY_PEM") ? "env_pem" : "env_b64";
  return { wrote: true, path: keyPath, source };
}

/**
 * Non-secret diagnostics for logs and GET /x402/capabilities.
 * @returns {{ enabled: boolean, configured: boolean, missing: string[], keySource: string, token: string, payToSet: boolean }}
 */
export function getB402PublicStatus() {
  const missing = [];
  const enabledFlag = env("X402_B402_ENABLED").toLowerCase();
  if (enabledFlag !== "true" && enabledFlag !== "1") missing.push("X402_B402_ENABLED");

  if (!env("B402_CLIENT_ID")) missing.push("B402_CLIENT_ID");
  if (!env("B402_ACCESS_TOKEN")) missing.push("B402_ACCESS_TOKEN");
  if (!env("B402_PAY_TO")) missing.push("B402_PAY_TO");

  const keyPath = resolveB402PrivateKeyFilePath();
  const hasEnvKey = Boolean(loadPrivateKeyPemFromEnv());
  const hasFileKey =
    existsSync(keyPath) &&
    (() => {
      try {
        return readFileSync(keyPath, "utf8").includes("BEGIN");
      } catch {
        return false;
      }
    })();

  let keySource = "none";
  if (hasFileKey) keySource = "file";
  else if (env("B402_PRIVATE_KEY_PEM")) keySource = "env_pem";
  else if (env("B402_PRIVATE_KEY_B64")) keySource = "env_b64";

  if (!hasFileKey && !hasEnvKey) {
    missing.push("B402_PRIVATE_KEY_B64_or_PEM_or_FILE");
  }

  const enabled = missing.length === 0;

  let configured = false;
  if (enabled) {
    try {
      const pem =
        hasFileKey && existsSync(keyPath)
          ? readFileSync(keyPath, "utf8")
          : loadPrivateKeyPemFromEnv() || "";
      if (pem.includes("BEGIN")) {
        const bits = crypto.createPrivateKey(pem).asymmetricKeyDetails?.modulusLength ?? null;
        configured = bits === 1024;
        if (!configured) missing.push("B402_RSA_1024_BIT_KEY");
      }
    } catch {
      missing.push("B402_PRIVATE_KEY_INVALID");
    }
  }

  return {
    enabled,
    configured,
    missing,
    keySource,
    token: env("B402_TOKEN") || "USD1",
    payToSet: Boolean(env("B402_PAY_TO")),
    network: "eip155:56",
  };
}
