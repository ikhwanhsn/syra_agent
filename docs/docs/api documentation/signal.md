---
title: Signal
sidebar_position: 10
---

# Signal API

Get AI-generated trading signals with entry/exit recommendations using the x402 payment protocol.

## Overview

The Signal API returns trading signals for a given token, including recommendations, entry price, targets, and analysis. This is a paid API that uses the x402 payment protocol—you must complete payment before receiving the data.

**Base URL:** `https://api.syraa.fun/v2`

**Price:** $0.01 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Endpoints

### GET /v2/signal

Get a trading signal for a token.

**Query Parameters:**

| Parameter | Type   | Required | Description                                              |
| --------- | ------ | -------- | -------------------------------------------------------- |
| `token`   | string | No       | Token name for the signal (e.g., "solana", "bitcoin"). Default: "bitcoin". |

**Example Request:**

```bash
curl "https://api.syraa.fun/v2/signal?token=bitcoin"
curl "https://api.syraa.fun/v2/signal?token=solana"
```

**Response (Success - 200):**

```json
{
  "signal": {
    "recommendation": "BUY",
    "entryPrice": 45000,
    "targets": [48000, 52000],
    "analysis": "..."
  }
}
```

---

### POST /v2/signal

Get a trading signal via POST.

**Request Body:**

```json
{
  "token": "bitcoin"
}
```

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/v2/signal \
  -H "Content-Type: application/json" \
  -d '{"token": "solana"}'
```

**Response (Success - 200):** Same as GET.

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

Follow the payment instructions in the 402 response (process payment header, submit payment, receive payment proof/token).

### Step 3: Retry Request with Payment

Include the payment proof in your retry request headers to receive the signal data.

## Response Codes

| Code  | Description                               |
| ----- | ----------------------------------------- |
| `200` | Success - signal data returned             |
| `402` | Payment Required - complete payment first  |
| `500` | Server error - failed to fetch signal     |

## Support

For payment-related issues or API support: **Telegram:** https://t.me/ikhwanhsn
