# Syra Cursor Plugin

**Pay-per-call crypto APIs for agents on Solana** — x402 micropayments, MCP tools, and typed SDK, packaged for Cursor.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![Documentation](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![API Marketplace](https://img.shields.io/badge/build-syraa.fun%2Fmarketplace-26a5e4)](https://syraa.fun/marketplace)

## What this plugin includes

| Component | Description |
|-----------|-------------|
| **MCP Server** | `@syra-ai/mcp-server` — ~240 crypto research and agent tools |
| **Rules** | SDK conventions, x402 payment flow, MCP tool usage |
| **Skills** | Integrate SDK, handle 402 payments, use MCP from chat |
| **Commands** | Add MCP config, scaffold typed client module |

## Install

### From Cursor Marketplace (recommended)

1. Open **Customize** in the Cursor sidebar
2. Search for **Syra**
3. Install the plugin
4. Enable the **syra** MCP server toggle

### Local testing

```bash
# Symlink for fast iteration
ln -s /path/to/syra-monorepo/plugins/syra ~/.cursor/plugins/local/syra
```

Restart Cursor or run **Developer: Reload Window**.

## Configuration

Set these environment variables for production auto-pay (never commit secrets):

| Variable | Purpose |
|----------|---------|
| `SYRA_PAYER_KEYPAIR` | Solana USDC wallet for x402 auto-pay |
| `SYRA_MCP_API_KEY` | Agent-direct bridge tools (web-search, Nansen, etc.) |
| `SYRA_API_BASE_URL` | API host (default: `https://api.syraa.fun`) |
| `SYRA_MCP_TOOL_PROFILE` | `curated` (default) or `full` |

### Payment rails

| Rail | Env |
|------|-----|
| Solana USDC (default) | `SYRA_PAYER_KEYPAIR` |
| Base USDC | `X402_PREFERRED_NETWORK=base` + `SYRA_EVM_PAYER_PRIVATE_KEY` |
| Algorand USDC | `X402_PREFERRED_NETWORK=algorand` + `SYRA_ALGORAND_PAYER_PRIVATE_KEY` |

## Quick start in chat

After installing, try:

- "Get the latest crypto news for BTC"
- "What's the market sentiment for ETH?"
- "Ask Syra Brain: trending tokens on Jupiter"
- "Show smart money flows on Solana"

## SDK integration

For TypeScript projects, use the `/syra-scaffold-client` command or install directly:

```bash
npm install @syra-ai/sdk
```

```typescript
import { createSyraPaidClient } from "@syra-ai/sdk";

const syra = await createSyraPaidClient();
const news = await syra.get("/news", { ticker: "BTC" });
```

## Platform roadmap

Live GTM is **Spend (x402)** + MCP/SDK. These modules share the same rails:

| Module | Purpose |
|--------|---------|
| **Spend** | x402 native pay-per-call APIs (**live**) |
| **Earn** | Agents monetize skills |
| **Treasury** | Allocate and manage capital |
| **Invest** | Deploy capital autonomously |
| **Grow** | Yield + portfolio optimization |

Discovery: `GET https://api.syraa.fun/pillars`

## Plugin structure

```
plugins/syra/
├── .cursor-plugin/plugin.json
├── mcp.json
├── rules/          # syra-sdk, syra-x402, syra-mcp-tools
├── skills/         # integrate-syra-sdk, handle-x402-payment, use-syra-mcp
├── commands/       # syra-add-mcp, syra-scaffold-client
└── assets/logo.jpg
```

## Resources

| Resource | URL |
|----------|-----|
| Docs | https://docs.syraa.fun |
| API | https://api.syraa.fun |
| Marketplace | https://syraa.fun/marketplace |
| OpenAPI | https://api.syraa.fun/openapi.json |
| x402 discovery | https://api.syraa.fun/.well-known/x402 |
| Skills catalog | https://syraa.fun/skills.md |

## Submit to marketplace

This plugin is structured for [Cursor Marketplace](https://cursor.com/marketplace/publish) submission. The monorepo includes `.cursor-plugin/marketplace.json` at the repo root.

## License

MIT — see [LICENSE](../../LICENSE).
