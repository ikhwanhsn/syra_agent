<div align="center">

<img src="../landing/public/images/logo.jpg" alt="Syra Logo" width="96" height="96" />

# **OpenClaw × SYRA x402 API**

### Pay-per-request API for OpenClaw and x402-capable agents

[![x402](https://img.shields.io/badge/x402-API-0ea5e9)](https://api.syraa.fun/.well-known/x402)
[![Documentation](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-http__request-26a5e4)](https://openclawdoc.com/docs/agents/tools/)

**[Documentation](https://docs.syraa.fun)** · **[x402 Discovery](https://api.syraa.fun/.well-known/x402)** · **[OpenClaw Tools](https://openclawdoc.com/docs/agents/tools/)** · **[Agent](https://agent.syraa.fun)**

</div>

---

## Overview

This folder contains everything needed for **OpenClaw** (or any x402-capable agent) to call the **SYRA x402 API** on your system. Pay per request with USDC on Solana or Base—no API keys.

## Base URL

- **Production:** `https://api.syraa.fun`
- **Local/dev:** Set `BASE_URL` in your env (e.g. `http://localhost:3000`) and use that in `tools.json` and OpenAPI.

## How x402 Works

1. **Request** — Agent sends HTTP GET/POST to an endpoint (e.g. `GET https://api.syraa.fun/news?ticker=BTC`).
2. **402 Payment Required** — Server responds with `402` and a body describing price and payment (network, amount, pay-to address, etc.).
3. **Pay** — Your system signs a payment (USDC) on Solana or Base using the details from the 402 response.
4. **Retry with payment** — Same request again, with header `X-Payment` or `PAYMENT-SIGNATURE` set to the signed payment proof.
5. **200 OK** — Server verifies payment on-chain and returns the API response.

## Supported Networks

| Network | CAIP-2 | Token |
|--------|--------|--------|
| Solana Mainnet | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | USDC |
| Base Mainnet | `eip155:8453` | USDC |

## Files in This Folder

| File | Purpose |
|------|---------|
| **README.md** | This guide. |
| **openapi.yaml** | OpenAPI 3 spec for all x402 endpoints (paths, params, 402 response). |
| **tools.json** | Machine-readable tool list (id, method, path, params, price) for agents. |
| **discovery.json** | Static copy of `/.well-known/x402` (resource list + instructions). |
| **config.example.yaml** | Example OpenClaw agent config using `http_request` for this API. |

## Using with OpenClaw

1. **Enable `http_request`** in your agent’s `config.yaml` (see `config.example.yaml`).
2. **Base URL:** Use `https://api.syraa.fun` for all requests.
3. **402 handling:** When a request returns **402**, parse the response body for payment requirements, sign the payment (with your Solana/Base wallet), then retry the **same** request with the `X-Payment` or `PAYMENT-SIGNATURE` header set to the payment proof.
4. **Tool list:** Use `tools.json` to build URLs and parameters for each endpoint (method + path + query/body).

### Example flow (pseudo)

```text
1. GET https://api.syraa.fun/news?ticker=BTC
2. Response: 402 + body { paymentRequired: { ... } }
3. Sign USDC payment from 402 body → get paymentProof
4. GET https://api.syraa.fun/news?ticker=BTC
   Header: X-Payment: <paymentProof>
5. Response: 200 + JSON news data
```

## Discovery (live)

- **Well-known:** `GET https://api.syraa.fun/.well-known/x402`  
  Returns `resources` (full URLs), `ownershipProofs`, and `instructions`. This is the **canonical** list of direct HTTP x402 routes (brain, news, signal, health, `mpp/v1/health`, arbitrage, analytics/summary, X, etc.).
- **Agent-only tools:** Nansen, Zerion, Exa, crawl, browser-use, Jupiter swap order, pump.fun, 8004 reads, and most partner APIs are **not** in well-known; use `GET /agent/tools` and `POST /agent/tools/call` (see `tools.json` entry `agent-tools-call`).
- **Health:** `GET https://api.syraa.fun/health` (x402; minimal fee). Legacy `/check-status` → 308 to `/health`.

`discovery.json` in this folder is kept in sync with the well-known `resources` array. Regenerate or compare after API changes.

## Docs and support

- **API docs:** https://docs.syraa.fun  
- **Discovery:** https://api.syraa.fun/.well-known/x402  
