---
title: Trending Headline
sidebar_position: 14
---

# Trending Headline API

Get trending headlines and top stories in the crypto market with the x402 payment protocol.

## Overview

The Trending Headline API returns trending headlines and top stories for the crypto market or a specific ticker. This is a paid API that uses the x402 payment protocol—you must complete payment before receiving the data.

**Base URL:** `https://api.syraa.fun/v2`

**Price:** $0.01 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Endpoints

### GET /v2/trending-headline

Fetch trending headlines.

**Query Parameters:**

| Parameter | Type   | Required | Description                                                                 |
| --------- | ------ | -------- | --------------------------------------------------------------------------- |
| `ticker`  | string | No       | Ticker symbol (e.g., BTC, ETH) or "general" for all trending headlines. Default: "general". |

**Example Request:**

```bash
curl https://api.syraa.fun/v2/trending-headline
curl "https://api.syraa.fun/v2/trending-headline?ticker=BTC"
```

**Response (Success - 200):**

```json
{
  "trendingHeadline": [
    {
      "title": "Bitcoin breaks key level",
      "source": "CryptoNews",
      "date": "2024-01-15",
      "sentiment": "positive"
    }
  ]
}
```

---

### POST /v2/trending-headline

Fetch trending headlines via POST.

**Request Body:**

```json
{
  "ticker": "ETH"
}
```

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/v2/trending-headline \
  -H "Content-Type: application/json" \
  -d '{"ticker": "SOL"}'
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

| Code  | Description                                  |
| ----- | -------------------------------------------- |
| `200` | Success - trending headlines returned        |
| `402` | Payment Required - complete payment first    |
| `404` | Trending headline not found                  |
| `500` | Server error - failed to fetch               |

## Support

For payment-related issues or API support: **Telegram:** https://t.me/ikhwanhsn
