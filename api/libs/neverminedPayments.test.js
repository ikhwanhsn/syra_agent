/**
 * Nevermined payments helper unit tests.
 * Run: node --test libs/neverminedPayments.test.js
 */
import assert from "node:assert/strict";
import { describe, it, afterEach, beforeEach } from "node:test";
import {
  buildNeverminedNewsRouteConfig,
  getNeverminedConfig,
  getNeverminedDisabledReason,
  getNeverminedEnvironment,
  isNeverminedEnabled,
  NEVERMINED_NEWS_CREDITS,
  NEVERMINED_NEWS_PUBLIC_PATH,
  NEVERMINED_NEWS_ROUTE_PATH,
  resetNeverminedPaymentsForTests,
} from "./neverminedPayments.js";

const ENV_KEYS = [
  "NEVERMINED_X402_ENABLED",
  "NVM_API_KEY",
  "NVM_PLAN_ID",
  "NVM_AGENT_ID",
  "NVM_ENVIRONMENT",
];

describe("neverminedPayments", () => {
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

  it("isNeverminedEnabled is false when flag off", () => {
    process.env.NVM_API_KEY = "sandbox:test-key";
    process.env.NVM_PLAN_ID = "plan-1";
    assert.equal(isNeverminedEnabled(), false);
    assert.match(getNeverminedDisabledReason() || "", /NEVERMINED_X402_ENABLED/);
  });

  it("isNeverminedEnabled is false when api key missing", () => {
    process.env.NEVERMINED_X402_ENABLED = "true";
    process.env.NVM_PLAN_ID = "plan-1";
    assert.equal(isNeverminedEnabled(), false);
    assert.match(getNeverminedDisabledReason() || "", /NVM_API_KEY/);
  });

  it("isNeverminedEnabled is false when plan id missing", () => {
    process.env.NEVERMINED_X402_ENABLED = "1";
    process.env.NVM_API_KEY = "sandbox:test-key";
    assert.equal(isNeverminedEnabled(), false);
    assert.match(getNeverminedDisabledReason() || "", /NVM_PLAN_ID/);
  });

  it("isNeverminedEnabled is true when flag + key + plan set", () => {
    process.env.NEVERMINED_X402_ENABLED = "true";
    process.env.NVM_API_KEY = "sandbox:test-key";
    process.env.NVM_PLAN_ID = "plan-1";
    assert.equal(isNeverminedEnabled(), true);
    assert.equal(getNeverminedDisabledReason(), null);
  });

  it("getNeverminedEnvironment defaults to sandbox", () => {
    assert.equal(getNeverminedEnvironment(), "sandbox");
    process.env.NVM_ENVIRONMENT = "live";
    assert.equal(getNeverminedEnvironment(), "live");
  });

  it("buildNeverminedNewsRouteConfig includes GET /news and optional agentId", () => {
    process.env.NEVERMINED_X402_ENABLED = "true";
    process.env.NVM_API_KEY = "sandbox:test-key";
    process.env.NVM_PLAN_ID = "plan-abc";
    process.env.NVM_AGENT_ID = "agent-xyz";
    const routes = buildNeverminedNewsRouteConfig();
    assert.deepEqual(routes[`GET ${NEVERMINED_NEWS_ROUTE_PATH}`], {
      planId: "plan-abc",
      agentId: "agent-xyz",
      credits: NEVERMINED_NEWS_CREDITS,
    });
    assert.equal(NEVERMINED_NEWS_PUBLIC_PATH, "/partners/nevermined/news");
  });

  it("getNeverminedConfig trims secrets", () => {
    process.env.NVM_API_KEY = "  key  ";
    process.env.NVM_PLAN_ID = "  plan  ";
    assert.equal(getNeverminedConfig().apiKey, "key");
    assert.equal(getNeverminedConfig().planId, "plan");
  });
});
