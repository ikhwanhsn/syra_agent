import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveInboundClientSource } from "./x402PaymentV2.js";

describe("resolveInboundClientSource", () => {
  it("defaults to api when header missing", () => {
    assert.equal(resolveInboundClientSource({ headers: {} }), "api");
    assert.equal(resolveInboundClientSource(null), "api");
  });

  it("accepts allowlisted mcp sources case-insensitively", () => {
    assert.equal(
      resolveInboundClientSource({ headers: { "x-syra-source": "mcp-server" } }),
      "mcp-server",
    );
    assert.equal(
      resolveInboundClientSource({ headers: { "x-syra-source": "MCP" } }),
      "mcp",
    );
    assert.equal(
      resolveInboundClientSource({ headers: { "x-syra-source": "sdk" } }),
      "sdk",
    );
  });

  it("rejects unknown values", () => {
    assert.equal(
      resolveInboundClientSource({ headers: { "x-syra-source": "evil" } }),
      "api",
    );
  });
});
