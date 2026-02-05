---
title: Pump (Workfun)
sidebar_position: 24
---

# Pump API

Pump-related data from Workfun with the x402 payment protocol.

## Overview

The Pump API provides Workfun-powered pump-related functionality (e.g., token engagement data). The POST endpoint is paid via x402; the GET endpoint may be used for token address lookups. This is a paid API that uses the x402 payment protocol—you must complete payment before receiving the data where applicable.

**Base URL:** `https://api.syraa.fun/v2`

**Price:** $0.01 USD per request (POST)

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Endpoints

### POST /v2/pump

Request pump/research data via POST (x402 paid).

**Request Body:**

```json
{
  "query": "optional query",
  "type": "quick"
}
```

`type` can be `"quick"` or `"deep"`.

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/v2/pump \
  -H "Content-Type: application/json" \
  -d '{"query": "token analysis", "type": "quick"}'
```

**Response (Success - 200):** Structure depends on the backend implementation.

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
| `402` | Payment Required - complete payment first |
| `404` | Token/address not found                    |
| `500` | Server error - failed to fetch             |

## Support

For payment-related issues or API support: **Telegram:** https://t.me/ikhwanhsn
