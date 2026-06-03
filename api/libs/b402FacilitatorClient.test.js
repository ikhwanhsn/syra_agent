/**
 * B402 facilitator client unit tests.
 * Run: node --test api/libs/b402FacilitatorClient.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  signTeslaPayload,
  buildTeslaHeaders,
  buildPaymentPayloadForB402,
  buildPaymentRequirementsForB402,
  normalizeResourceInfo,
  resolveB402SettleAmount,
  clearB402SupportedCache,
} from "./b402FacilitatorClient.js";
import { x402MicroToBscTokenAtomic } from "../config/b402Networks.js";

function generateTestKeyPem() {
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return privateKey;
}

test("signTeslaPayload is deterministic for same body+timestamp", () => {
  const pem = generateTestKeyPem();
  const prev = process.env.B402_PRIVATE_KEY_PEM;
  process.env.B402_PRIVATE_KEY_PEM = pem;
  try {
    const body = "{}";
    const ts = "1700000000000";
    const a = signTeslaPayload(body, ts);
    const b = signTeslaPayload(body, ts);
    assert.equal(a, b);
    assert.ok(a.length > 20);
  } finally {
    if (prev === undefined) delete process.env.B402_PRIVATE_KEY_PEM;
    else process.env.B402_PRIVATE_KEY_PEM = prev;
  }
});

test("buildTeslaHeaders includes required X-Tesla fields", () => {
  const pem = generateTestKeyPem();
  const prevPem = process.env.B402_PRIVATE_KEY_PEM;
  const prevId = process.env.B402_CLIENT_ID;
  const prevTok = process.env.B402_ACCESS_TOKEN;
  process.env.B402_PRIVATE_KEY_PEM = pem;
  process.env.B402_CLIENT_ID = "test-client";
  process.env.B402_ACCESS_TOKEN = "test-token";
  try {
    const headers = buildTeslaHeaders('{"x":1}');
    assert.equal(headers["X-Tesla-ClientId"], "test-client");
    assert.equal(headers["X-Tesla-SignAccessToken"], "test-token");
    assert.ok(headers["X-Tesla-Timestamp"]);
    assert.ok(headers["X-Tesla-Signature"]);
    assert.equal(headers["Content-Type"], "application/json");
  } finally {
    if (prevPem === undefined) delete process.env.B402_PRIVATE_KEY_PEM;
    else process.env.B402_PRIVATE_KEY_PEM = prevPem;
    if (prevId === undefined) delete process.env.B402_CLIENT_ID;
    else process.env.B402_CLIENT_ID = prevId;
    if (prevTok === undefined) delete process.env.B402_ACCESS_TOKEN;
    else process.env.B402_ACCESS_TOKEN = prevTok;
  }
});

test("normalizeResourceInfo accepts object or legacy string", () => {
  assert.deepEqual(normalizeResourceInfo("http://localhost/health"), {
    url: "http://localhost/health",
  });
  assert.deepEqual(
    normalizeResourceInfo({
      url: "http://localhost/health",
      description: "health",
      mimeType: "application/json",
    }),
    {
      url: "http://localhost/health",
      description: "health",
      mimeType: "application/json",
    }
  );
});

test("buildPaymentPayloadForB402 maps decoded header and lifts legacy resource", () => {
  const decoded = {
    x402Version: 2,
    accepted: {
      scheme: "exact",
      network: "eip155:56",
      amount: "10000",
      resource: "http://localhost/health",
    },
    payload: { signature: "0xabc", authorization: { from: "0x1" } },
  };
  const out = buildPaymentPayloadForB402(decoded);
  assert.equal(out.x402Version, 2);
  assert.equal(out.accepted.network, "eip155:56");
  assert.equal(out.payload.signature, "0xabc");
  assert.equal(out.resource.url, "http://localhost/health");
  assert.equal(out.accepted.resource, undefined);
});

test("buildPaymentRequirementsForB402 includes ResourceInfo", () => {
  const decoded = {
    resource: {
      url: "http://localhost:3000/health",
      mimeType: "application/json",
    },
    accepted: {
      scheme: "exact",
      network: "eip155:56",
      amount: "10000",
      asset: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
      payTo: "0xMerchant",
      extra: {
        name: "World Liberty Financial USD",
        version: "1",
        assetTransferMethod: "eip3009",
      },
    },
  };
  const req = buildPaymentRequirementsForB402(decoded, decoded.accepted);
  assert.equal(req.resource.url, "http://localhost:3000/health");
  assert.equal(req.extra.name, "World Liberty Financial USD");
});

test("buildPaymentRequirementsForB402 copies extra from accepted", () => {
  const decoded = {
    accepted: {
      scheme: "exact",
      network: "eip155:56",
      amount: "10000",
      asset: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
      payTo: "0xMerchant",
      extra: {
        name: "USD1",
        version: "1",
        assetTransferMethod: "eip3009",
        signerAddress: "0xSigner",
      },
    },
  };
  const req = buildPaymentRequirementsForB402(decoded, decoded.accepted);
  assert.equal(req.extra.signerAddress, "0xSigner");
  assert.equal(req.extra.assetTransferMethod, "eip3009");
  assert.equal(req.payTo, "0xMerchant");
});

test("x402MicroToBscTokenAtomic scales micro units to 18-decimal wei", () => {
  assert.equal(x402MicroToBscTokenAtomic("1"), "1000000000000");
  assert.equal(x402MicroToBscTokenAtomic("1000000"), "1000000000000000000");
});

test("resolveB402SettleAmount omits amount for eip3009", () => {
  assert.equal(
    resolveB402SettleAmount({
      scheme: "exact",
      extra: { assetTransferMethod: "eip3009" },
      amount: "10000",
    }),
    undefined
  );
  assert.equal(
    resolveB402SettleAmount({
      scheme: "upto",
      extra: { assetTransferMethod: "permit2-upto" },
      amount: "5000000",
    }),
    "5000000"
  );
});

test("buildPaymentRequirementsForB402 strips nested eip712 from extra", () => {
  const decoded = {
    accepted: {
      scheme: "exact",
      network: "eip155:56",
      amount: "1",
      asset: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
      payTo: "0xMerchant",
      extra: {
        name: "World Liberty Financial USD",
        version: "1",
        assetTransferMethod: "eip3009",
        eip712: { name: "World Liberty Financial USD", version: "1" },
      },
    },
  };
  const req = buildPaymentRequirementsForB402(decoded, decoded.accepted);
  assert.equal(req.extra.name, "World Liberty Financial USD");
  assert.equal(req.extra.eip712, undefined);
});

test("clearB402SupportedCache does not throw", () => {
  clearB402SupportedCache();
});
