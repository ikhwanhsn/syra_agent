---
title: Sentiment
sidebar_position: 11
---

# Sentiment API

Get market sentiment analysis for crypto assets over the last 30 days with the x402 payment protocol.

## Overview

The Sentiment API provides sentiment analysis (positive, negative, neutral percentages) for the crypto market or a specific ticker. This is a paid API that uses the x402 payment protocol—you must complete payment before receiving the data.

**Base URL:** `https://api.syraa.fun/v2`

**Price:** $0.01 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Endpoints

### GET /v2/sentiment

Fetch sentiment analysis.

**Query Parameters:**

| Parameter | Type   | Required | Description                                                                 |
| --------- | ------ | -------- | --------------------------------------------------------------------------- |
| `ticker`  | string | No       | Ticker symbol (e.g., BTC, ETH) or "general" for market-wide sentiment. Default: "general". |

**Example Request:**

```bash
curl https://api.syraa.fun/v2/sentiment
curl "https://api.syraa.fun/v2/sentiment?ticker=BTC"
```

**Response (Success - 200):**

```json
{
  "sentimentAnalysis": [
    {
      "date": "2024-01-15",
      "general": { "positive": 45, "negative": 20, "neutral": 35 }
    }
  ]
}
```

For a specific ticker, the structure may use a `ticker` key per date.

---

### POST /v2/sentiment

Fetch sentiment analysis via POST.

**Request Body:**

```json
{
  "ticker": "ETH"
}
```

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/v2/sentiment \
  -H "Content-Type: application/json" \
  -d '{"ticker": "BTC"}'
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

Include the payment proof in your retry request headers to receive the sentiment data.

## Response Codes

| Code  | Description                                  |
| ----- | -------------------------------------------- |
| `200` | Success - sentiment data returned            |
| `402` | Payment Required - complete payment first    |
| `404` | Sentiment analysis not found                 |
| `500` | Server error - failed to fetch sentiment     |

## Support

For payment-related issues or API support: **Telegram:** https://t.me/ikhwanhsn
