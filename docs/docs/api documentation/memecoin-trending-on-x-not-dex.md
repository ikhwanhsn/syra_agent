---
title: Memecoin — Trending on X Not DEX
sidebar_position: 31
---

# Memecoin Trending on X Not DEX API

Memecoins trending on X but not yet on DEX with the x402 payment protocol.

## Overview

This API returns AI-researched memecoins that are trending on X (Twitter) but not yet on DEX. This is a paid API that uses the x402 payment protocol—you must complete payment before receiving the data.

**Base URL:** `https://api.syraa.fun/v2`

**Price:** $0.01 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Endpoints

### GET /v2/memecoin/trending-on-x-not-dex

Fetch memecoins trending on X but not on DEX.

**Example Request:**

```bash
curl https://api.syraa.fun/v2/memecoin/trending-on-x-not-dex
```

**Response (Success - 200):**

```json
{
  "query": "...",
  "result": "AI-summarized results...",
  "citations": [],
  "toolCalls": []
}
```

---

### POST /v2/memecoin/trending-on-x-not-dex

Fetch via POST.

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/v2/memecoin/trending-on-x-not-dex \
  -H "Content-Type: application/json"
```

**Response (Success - 200):** Same shape as GET.

## Payment Flow

### Step 1: Initial Request (402 Response)

When you first call the API without payment, you'll receive a `402 Payment Required` response:

```json
{
  "error": "Payment Required",
  "price": 0.01,
  "currency": "USD",
  "paymentInstructions": {
    "method": "x402",
    "details": "..."
  }
}
```

### Step 2: Complete Payment

Follow the payment instructions in the 402 response.

### Step 3: Retry Request with Payment

Include the payment proof in your retry request headers to receive the data.

## Response Codes

| Code  | Description                               |
| ----- | ----------------------------------------- |
| `200` | Success - data returned                    |
| `402` | Payment Required - complete payment first  |
| `500` | Server error - failed to fetch             |

## Support

For payment-related issues or API support: **Telegram:** https://t.me/ikhwanhsn
