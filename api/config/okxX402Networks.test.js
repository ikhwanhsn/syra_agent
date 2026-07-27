import assert from "node:assert/strict";
import test from "node:test";
import {
  XLAYER_MAINNET_CAIP2,
  XLAYER_MAINNET_USDT,
  XLAYER_USDT0_EIP712_NAME,
  XLAYER_USDT0_EIP712_VERSION,
  getOkxEip712Extra,
  getOkxNetworkByCaip2,
} from "./okxX402Networks.js";

test("X Layer USDT0 EIP-712 domain uses tugrik glyph USD₮0 / version 1", () => {
  assert.equal(XLAYER_USDT0_EIP712_NAME, "USD\u20AE0");
  assert.equal(XLAYER_USDT0_EIP712_VERSION, "1");
  assert.notEqual(XLAYER_USDT0_EIP712_NAME, "USD Coin");
  assert.notEqual(XLAYER_USDT0_EIP712_NAME, "USDT0");
});

test("getOkxNetworkByCaip2 returns USDT0 asset + EIP-712 metadata", () => {
  const net = getOkxNetworkByCaip2(XLAYER_MAINNET_CAIP2);
  assert.ok(net);
  assert.equal(net.stablecoin.toLowerCase(), XLAYER_MAINNET_USDT.toLowerCase());
  assert.equal(net.eip712Name, XLAYER_USDT0_EIP712_NAME);
  assert.equal(net.eip712Version, XLAYER_USDT0_EIP712_VERSION);
});

test("getOkxEip712Extra stamps name/version and nested eip712", () => {
  const net = getOkxNetworkByCaip2(XLAYER_MAINNET_CAIP2);
  const extra = getOkxEip712Extra(net);
  assert.equal(extra.name, "USD\u20AE0");
  assert.equal(extra.version, "1");
  assert.deepEqual(extra.eip712, { name: "USD\u20AE0", version: "1" });
});
