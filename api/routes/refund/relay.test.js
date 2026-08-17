/**
 * Run: node --test api/routes/refund/relay.test.js
 */
import { describe, it, afterEach, before } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createRefundCoverageRouter } from "./relay.js";

const keys = [
  "REFUND_ENABLED",
  "REFUND_HOSTED_ENABLED",
  "REFUND_HOSTED_ALLOWLIST",
];
const prev = {};
for (const k of keys) prev[k] = process.env[k];

afterEach(() => {
  for (const k of keys) {
    if (prev[k] == null) delete process.env[k];
    else process.env[k] = prev[k];
  }
});

async function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      resolve({ server, origin: `http://127.0.0.1:${addr.port}` });
    });
  });
}

describe("hosted refund relay routes", () => {
  /** @type {express.Express} */
  let app;
  /** @type {typeof fetch | undefined} */
  let originalFetch;

  before(async () => {
    app = express();
    app.use(express.json({ limit: "1mb" }));
    app.use("/refund", await createRefundCoverageRouter());
  });

  afterEach(() => {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
      originalFetch = undefined;
    }
  });

  it("GET /refund/status is public and reports hosted off by default", async () => {
    delete process.env.REFUND_HOSTED_ENABLED;
    const { server, origin } = await listen(app);
    try {
      const res = await fetch(`${origin}/refund/status`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.hosted, false);
    } finally {
      server.close();
    }
  });

  it("GET /refund/claims requires wallet", async () => {
    const { server, origin } = await listen(app);
    try {
      const res = await fetch(`${origin}/refund/claims`);
      assert.equal(res.status, 400);
    } finally {
      server.close();
    }
  });

  it("POST /refund/relay is 503 when hosted is off", async () => {
    process.env.REFUND_HOSTED_ENABLED = "false";
    const { server, origin } = await listen(app);
    try {
      const res = await fetch(`${origin}/refund/relay`, {
        method: "POST",
        headers: { "X-Refund-Target": "https://api.nansen.ai/x" },
      });
      assert.equal(res.status, 503);
      const json = await res.json();
      assert.equal(json.error, "hosted_refund_disabled");
    } finally {
      server.close();
    }
  });

  it("POST /refund/relay rejects hosts off the allowlist", async () => {
    process.env.REFUND_HOSTED_ENABLED = "true";
    process.env.REFUND_HOSTED_ALLOWLIST = "nansen.ai";
    const { server, origin } = await listen(app);
    try {
      const res = await fetch(`${origin}/refund/relay`, {
        method: "POST",
        headers: { "X-Refund-Target": "https://evil.example/x" },
      });
      assert.equal(res.status, 403);
    } finally {
      server.close();
    }
  });

  it("probe (no upstream payment) forwards a failing upstream without charging premium", async () => {
    process.env.REFUND_HOSTED_ENABLED = "true";
    process.env.REFUND_HOSTED_ALLOWLIST = "nansen.ai";
    originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.includes("api.nansen.ai")) {
        return new Response("upstream down", {
          status: 503,
          headers: { "content-type": "text/plain" },
        });
      }
      return originalFetch(input, init);
    };

    const { server, origin } = await listen(app);
    try {
      const res = await fetch(`${origin}/refund/relay`, {
        method: "POST",
        headers: {
          "X-Refund-Target": "https://api.nansen.ai/intel",
          "X-Refund-Method": "GET",
        },
      });
      assert.equal(res.status, 503);
      assert.equal(res.headers.get("x-syra-coverage"), "probe");
      const text = await res.text();
      assert.equal(text, "upstream down");
    } finally {
      server.close();
    }
  });

  it("paid coverage without Syra premium payment returns 402", async () => {
    process.env.REFUND_HOSTED_ENABLED = "true";
    process.env.REFUND_HOSTED_ALLOWLIST = "nansen.ai";
    const { server, origin } = await listen(app);
    try {
      const res = await fetch(`${origin}/refund/relay`, {
        method: "POST",
        headers: {
          "X-Refund-Target": "https://api.nansen.ai/intel",
          "X-Refund-Upstream-Payment": "dGVzdA==",
        },
      });
      assert.equal(res.status, 402);
    } finally {
      server.close();
    }
  });
});
