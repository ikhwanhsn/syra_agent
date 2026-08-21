/**
 * Nevermined news pilot route — disabled (503) path only (no live Nevermined).
 * Run: node --test routes/neverminedNews.test.js
 */
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { createNeverminedNewsRouter } from "./neverminedNews.js";
import { resetNeverminedPaymentsForTests } from "../libs/neverminedPayments.js";

const ENV_KEYS = [
  "NEVERMINED_X402_ENABLED",
  "NVM_API_KEY",
  "NVM_PLAN_ID",
  "NVM_AGENT_ID",
  "NVM_ENVIRONMENT",
];

/**
 * @param {import('express').Express} app
 * @param {string} path
 */
async function getJson(app, path) {
  const server = app.listen(0);
  try {
    const { port } = /** @type {import('net').AddressInfo} */ (server.address());
    const res = await fetch(`http://127.0.0.1:${port}${path}`);
    const body = await res.json();
    return { status: res.status, body };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve(undefined)));
    });
  }
}

describe("neverminedNews router", () => {
  /** @type {Record<string, string | undefined>} */
  const prev = {};

  beforeEach(() => {
    for (const k of ENV_KEYS) {
      prev[k] = process.env[k];
      delete process.env[k];
    }
    resetNeverminedPaymentsForTests();
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
    resetNeverminedPaymentsForTests();
  });

  it("returns 503 when Nevermined pilot is disabled", async () => {
    const app = express();
    app.use("/partners/nevermined", createNeverminedNewsRouter());
    const { status, body } = await getJson(app, "/partners/nevermined/news?ticker=BTC");
    assert.equal(status, 503);
    assert.equal(body.facilitator, "nevermined");
    assert.equal(body.exactNews, "/news");
    assert.match(String(body.error || ""), /NEVERMINED_X402_ENABLED|not configured|NVM_/);
  });

  it("returns 503 when enabled flag set but secrets missing", async () => {
    process.env.NEVERMINED_X402_ENABLED = "true";
    const app = express();
    app.use("/partners/nevermined", createNeverminedNewsRouter());
    const { status, body } = await getJson(app, "/partners/nevermined/news");
    assert.equal(status, 503);
    assert.equal(body.path, "/partners/nevermined/news");
  });
});
