import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  SECRET_ENV_KEY_SET,
  REQUIRED_BOOT_SECRETS,
  DEPRECATED_CONFIG_ENV_KEYS,
  optionalSecret,
  requireSecret,
  assertRequiredSecretsAtBoot,
  warnDeprecatedConfigEnv,
  isSecretEnvKey,
} from "./secrets.js";

describe("secrets.js", () => {
  const prev = { ...process.env };

  afterEach(() => {
    for (const k of Object.keys(process.env)) {
      if (!(k in prev)) delete process.env[k];
    }
    Object.assign(process.env, prev);
  });

  it("allowlists core boot secrets", () => {
    assert.ok(isSecretEnvKey("MONGODB_URI"));
    assert.ok(isSecretEnvKey("AGENT_WALLET_SECRET_ENCRYPTION_KEY"));
    assert.ok(isSecretEnvKey("JWT_HS_SECRET"));
    assert.ok(SECRET_ENV_KEY_SET.has("OPENROUTER_API_KEY"));
  });

  it("does not treat public config keys as secrets", () => {
    assert.equal(isSecretEnvKey("SOLANA_PAYTO"), false);
    assert.equal(isSecretEnvKey("BASE_URL"), false);
    assert.ok(DEPRECATED_CONFIG_ENV_KEYS.includes("SOLANA_PAYTO"));
    assert.ok(DEPRECATED_CONFIG_ENV_KEYS.includes("PORT"));
  });

  it("requireSecret throws when missing", () => {
    delete process.env.JWT_HS_SECRET;
    assert.throws(() => requireSecret("JWT_HS_SECRET"), /Missing required secret/);
  });

  it("optionalSecret trims empty", () => {
    process.env.METRICS_TOKEN = "  abc  ";
    assert.equal(optionalSecret("METRICS_TOKEN"), "abc");
  });

  it("assertRequiredSecretsAtBoot fails when any required missing", () => {
    for (const k of REQUIRED_BOOT_SECRETS) delete process.env[k];
    assert.throws(() => assertRequiredSecretsAtBoot(), /FATAL: required secret/);
  });

  it("warnDeprecatedConfigEnv reports set deprecated keys", () => {
    process.env.SOLANA_PAYTO = "SomeAddress";
    process.env.PORT = "3000";
    const warned = [];
    const keys = warnDeprecatedConfigEnv({ log: (m) => warned.push(m) });
    assert.ok(keys.includes("SOLANA_PAYTO"));
    assert.ok(keys.includes("PORT"));
    assert.equal(warned.length, 1);
    assert.match(warned[0], /Ignoring/);
  });
});
