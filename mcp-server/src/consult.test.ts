import assert from "node:assert/strict";
import { test } from "node:test";
import { consultSyraIntent, SYRA_CONSULT_SUGGESTIONS } from "./consult.js";
import { MCP_TOOL_CATALOG } from "./generated/toolCatalog.js";

test("BTC news maps to syra_spend_news and does not bill", () => {
  const result = consultSyraIntent("Get BTC news");
  assert.equal(result.mode, "call");
  assert.equal(result.billed, false);
  assert.equal(result.calls?.[0]?.toolName, "syra_spend_news");
  assert.equal(result.calls?.[0]?.params.ticker, "BTC");
  assert.ok((result.calls?.[0]?.max_cost_usd ?? 1) < 0.01);
  assert.deepEqual(result.suggestions, [...SYRA_CONSULT_SUGGESTIONS]);
});

test("ETH sentiment maps to syra_spend_sentiment", () => {
  const result = consultSyraIntent("What's ETH sentiment?");
  assert.equal(result.calls?.[0]?.toolName, "syra_spend_sentiment");
  assert.equal(result.calls?.[0]?.params.ticker, "ETH");
});

test("Aave TVL maps to syra_spend_defillama_tvl", () => {
  const result = consultSyraIntent("TVL for Aave");
  assert.equal(result.calls?.[0]?.toolName, "syra_spend_defillama_tvl");
  assert.equal(result.calls?.[0]?.params.protocol, "aave");
});

test("agent economy stats maps to agent-economy-summary", () => {
  const result = consultSyraIntent("Agent economy x402 stats");
  assert.equal(result.mode, "call");
  assert.equal(result.billed, false);
  assert.equal(result.calls?.[0]?.toolId, "agent-economy-summary");
  assert.equal(result.calls?.[0]?.toolName, "syra_spend_agent_economy_summary");
});

test("Solana TVL uses chain not ticker", () => {
  const result = consultSyraIntent("TVL for Solana");
  assert.equal(result.calls?.[0]?.toolId, "defillama-tvl");
  assert.equal(result.calls?.[0]?.params.chain, "Solana");
});

test("image generation is unsupported", () => {
  const result = consultSyraIntent("Generate a landing page image");
  assert.equal(result.mode, "unsupported");
  assert.equal(result.calls, undefined);
});

test("empty intent is unsupported", () => {
  const result = consultSyraIntent("   ");
  assert.equal(result.mode, "unsupported");
});

test("smart money maps to nansen curated tool", () => {
  const result = consultSyraIntent("smart money on solana");
  assert.equal(result.calls?.[0]?.toolId, "nansen-smart-money-netflow");
});

test("consult only recommends curated tools", () => {
  const result = consultSyraIntent("Get BTC news");
  const toolId = result.calls?.[0]?.toolId;
  const entry = MCP_TOOL_CATALOG.find((t) => t.toolId === toolId);
  assert.equal(entry?.curated, true);
});

test("unspecific crypto intent defaults to BTC news", () => {
  const result = consultSyraIntent("crypto intel please");
  assert.equal(result.mode, "call");
  assert.equal(result.calls?.[0]?.toolName, "syra_spend_news");
  assert.equal(result.calls?.[0]?.params.ticker, "BTC");
});
