# Agent / OpenAPI DX: resolve error shapes + consumer examples

## Context

Syra integrates Tokens as the canonical asset layer for AI agents (MCP tools + x402). Source: https://github.com/solana-foundation/tokens · docs: https://docs.tokens.xyz/v1/quickstart

## Ask

1. **Stable error shapes** for `GET /v1/assets/resolve` when `ref` / `mint` is unknown or ambiguous (consistent JSON: `code`, `message`, optional `candidates[]`)
2. **OpenAPI examples** for the agent-critical path:
   - resolve (`ref` or `mint`) → `assetId`
   - risk-summary
   - detail with `include=profile,markets`
   - batch `POST /v1/assets/market-snapshots`
3. Optional: a small **“paid agent consumer”** docs page (API key server-side; agents pay a proxy). Syra can contribute a snippet (see `EXAMPLE_paid_agent_consumer.md` in this folder).

## Why

Agents fail closed when resolve returns opaque HTML/text or inconsistent JSON. Explicit contracts cut integration bugs across every agent framework using Tokens.

## Offer

Syra can PR example markdown under `apps/docs` once preferred path is confirmed, or keep examples in consumer repos and link from Tokens docs.
