---
title: Token Statistic (Rugcheck)
sidebar_position: 21
---

# Token Statistic API

Token statistics from Rugcheck: new tokens, recent, trending, and verified, with the x402 payment protocol.

## Overview

The Token Statistic API returns Rugcheck aggregate statistics: new tokens, recent, trending, and verified token lists. This is a paid API that uses the x402 payment protocol—you must complete payment before receiving the data.

**Base URL:** `https://api.syraa.fun/v2`

**Price:** $0.01 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Endpoints

### GET /v2/token-statistic

Fetch Rugcheck token statistics.

**Example Request:**

```bash
curl https://api.syraa.fun/v2/token-statistic
```

**Response (Success - 200):**

```json
{
  "rugcheck/new_tokens": [],
  "rugcheck/recent": [],
  "rugcheck/trending": [],
  "rugcheck/verified": []
}
```

---

### POST /v2/token-statistic

Fetch token statistics via POST.

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/v2/token-statistic \
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
| `200` | Success - token statistics returned       |
| `402` | Payment Required - complete payment first |
| `500` | Server error - failed to fetch             |

## Support

For payment-related issues or API support: **Telegram:** https://t.me/ikhwanhsn
