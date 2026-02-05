---
title: Binance Correlation
sidebar_position: 23
---

# Binance Correlation API

Correlation matrix for crypto tokens (Binance OHLC-based) with the x402 payment protocol.

## Overview

The Binance Correlation API returns correlation data between tokens using Binance OHLC data. You can get a full correlation matrix or top correlations for a single symbol. This is a paid API that uses the x402 payment protocol—you must complete payment before receiving the data.

**Base URL:** `https://api.syraa.fun/v2`

**Price:** $0.01 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Endpoints

### GET /v2/binance/correlation/correlation-matrix

Fetch the full correlation matrix for all supported tokens.

**Example Request:**

```bash
curl https://api.syraa.fun/v2/binance/correlation/correlation-matrix
```

**Response (Success - 200):**

```json
{
  "interval": "1m",
  "count": 100,
  "tokens": ["BTCUSDT", "ETHUSDT", "..."],
  "data": {
    "BTCUSDT": { "ETHUSDT": 0.85, "..." },
    "ETHUSDT": { "BTCUSDT": 0.85, "..." }
  }
}
```

---

### POST /v2/binance/correlation/correlation-matrix

Fetch the full correlation matrix via POST.

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/v2/binance/correlation/correlation-matrix \
  -H "Content-Type: application/json"
```

**Response (Success - 200):** Same shape as GET.

---

### GET /v2/binance/correlation/correlation

Fetch top correlations for a single symbol.

**Query Parameters:**

| Parameter | Type   | Required | Description                                  |
| --------- | ------ | -------- | -------------------------------------------- |
| `symbol`  | string | No       | Symbol (e.g., BTCUSDT). Default: BTCUSDT.   |
| `limit`   | string | No       | Number of top correlations. Default: 10.     |

**Example Request:**

```bash
curl "https://api.syraa.fun/v2/binance/correlation/correlation?symbol=ETHUSDT&limit=10"
```

**Response (Success - 200):**

```json
{
  "symbol": "ETHUSDT",
  "top": [
    { "symbol": "BTCUSDT", "correlation": 0.92 },
    { "symbol": "SOLUSDT", "correlation": 0.78 }
  ]
}
```

---

### POST /v2/binance/correlation/correlation

Fetch top correlations for a symbol via POST.

**Request Body:**

```json
{
  "symbol": "BTCUSDT"
}
```

Query param `limit` can be used (e.g. `?limit=10`).

**Example Request:**

```bash
curl -X POST "https://api.syraa.fun/v2/binance/correlation/correlation?limit=5" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "SOLUSDT"}'
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
| `200` | Success - correlation data returned       |
| `402` | Payment Required - complete payment first |
| `404` | Symbol not found / no correlation         |
| `500` | Server error - failed to fetch             |

## Support

For payment-related issues or API support: **Telegram:** https://t.me/ikhwanhsn
