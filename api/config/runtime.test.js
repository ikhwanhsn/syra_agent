import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  isProduction,
  getPublicApiUrl,
  getPort,
  getDbName,
  getTrustProxy,
  getS3LabsSiteUrl,
  getRuntimeSnapshot,
} from "./runtime.js";

describe("runtime.js", () => {
  const prevNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevNodeEnv;
  });

  it("non-production uses localhost public URL", () => {
    process.env.NODE_ENV = "development";
    assert.equal(isProduction(), false);
    assert.equal(getPublicApiUrl(), "http://localhost:3000");
    assert.equal(getS3LabsSiteUrl(), "http://localhost:8080");
    assert.equal(getTrustProxy(), false);
  });

  it("production uses api.syraa.fun", () => {
    process.env.NODE_ENV = "production";
    assert.equal(isProduction(), true);
    assert.equal(getPublicApiUrl(), "https://api.syraa.fun");
    assert.equal(getS3LabsSiteUrl(), "https://s3labs.xyz");
    assert.equal(getTrustProxy(), true);
  });

  it("exposes stable db name and port", () => {
    assert.equal(getDbName(), "syra");
    assert.equal(getPort(), 3000);
    const snap = getRuntimeSnapshot();
    assert.equal(snap.dbName, "syra");
    assert.ok(snap.publicApiUrl);
  });
});
