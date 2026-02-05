---
title: Sundown Digest
sidebar_position: 15
---

# Sundown Digest API

Daily end-of-day summary of key crypto market events and movements with the x402 payment protocol.

## Overview

The Sundown Digest API returns a daily digest of key crypto market events, movements, and highlights. This is a paid API that uses the x402 payment protocol—you must complete payment before receiving the data.

**Base URL:** `https://api.syraa.fun/v2`

**Price:** $0.01 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Endpoints

### GET /v2/sundown-digest

Fetch the daily sundown digest.

**Example Request:**

```bash
curl https://api.syraa.fun/v2/sundown-digest
```

**Response (Success - 200):**

```json
{
  "sundownDigest": [
    {
      "summary": "Key market events today...",
      "keyEvents": [],
      "marketHighlights": []
    }
  ]
}
```

---

### POST /v2/sundown-digest

Fetch the sundown digest via POST.

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/v2/sundown-digest \
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

Include the payment proof in your retry request headers to receive the digest.

## Response Codes

| Code  | Description                               |
| ----- | ----------------------------------------- |
| `200` | Success - sundown digest returned          |
| `402` | Payment Required - complete payment first  |
| `404` | Sundown digest not found                   |
| `500` | Server error - failed to fetch             |

## Support

For payment-related issues or API support: **Telegram:** https://t.me/ikhwanhsn
