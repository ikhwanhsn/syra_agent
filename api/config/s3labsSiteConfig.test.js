import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  S3LABS_CANONICAL_ORIGIN,
  buildS3labsSiteUrl,
  resolveS3labsSiteUrl,
} from "./s3labsSiteConfig.js";

describe("s3labsSiteConfig", () => {
  it("defaults to s3labs.xyz", () => {
    assert.equal(resolveS3labsSiteUrl(""), S3LABS_CANONICAL_ORIGIN);
    assert.equal(resolveS3labsSiteUrl(undefined), S3LABS_CANONICAL_ORIGIN);
  });

  it("rewrites legacy s3labs.id and s3labs.fun", () => {
    assert.equal(resolveS3labsSiteUrl("https://s3labs.id"), S3LABS_CANONICAL_ORIGIN);
    assert.equal(resolveS3labsSiteUrl("https://www.s3labs.id/"), S3LABS_CANONICAL_ORIGIN);
    assert.equal(resolveS3labsSiteUrl("https://s3labs.fun/kol"), S3LABS_CANONICAL_ORIGIN);
    assert.equal(resolveS3labsSiteUrl("s3labs.id"), S3LABS_CANONICAL_ORIGIN);
  });

  it("accepts s3labs.xyz and strips trailing slash", () => {
    assert.equal(resolveS3labsSiteUrl("https://s3labs.xyz"), S3LABS_CANONICAL_ORIGIN);
    assert.equal(resolveS3labsSiteUrl("https://s3labs.xyz/"), S3LABS_CANONICAL_ORIGIN);
  });

  it("joins campaign paths onto a resolved origin", () => {
    const origin = resolveS3labsSiteUrl("https://s3labs.id/kol");
    assert.equal(
      `${origin}/kol?campaign=abc`,
      `${S3LABS_CANONICAL_ORIGIN}/kol?campaign=abc`,
    );
    assert.match(buildS3labsSiteUrl("/kol"), /\/kol$/);
  });
});
