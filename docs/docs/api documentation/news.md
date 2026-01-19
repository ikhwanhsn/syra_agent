---
title: News
sidebar_position: 3
---

# News API

Get cryptocurrency news with HTTP 402 Payment Required protocol.

## Overview

The News API provides access to cryptocurrency news articles. This is a paid API that uses the x402 payment protocol - you'll need to complete payment before receiving the data.

**Base URL:** `https://api.syraa.fun`

**Price:** $0.10 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Endpoints

### GET /news

Fetch cryptocurrency news articles.

**Query Parameters:**

| Parameter | Type   | Required | Description                                                                              |
| --------- | ------ | -------- | ---------------------------------------------------------------------------------------- |
| `ticker`  | string | No       | Specific cryptocurrency ticker (e.g., "BTC", "ETH"). Omit or use "general" for all news. |

**Example Request:**

```bash
# General news
curl https://api.syraa.fun/news

# Specific ticker
curl https://api.syraa.fun/news?ticker=BTC
```

**Response (Success - 200):**

```json
{
  "news": [
    {
      "title": "Bitcoin Reaches New Milestone",
      "description": "Latest developments in cryptocurrency...",
      "source": "CryptoNews",
      "url": "https://example.com/article",
      "date": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### POST /news

Fetch cryptocurrency news articles via POST request.

**Request Body:**

```json
{
  "ticker": "BTC" // Optional: specific ticker or "general"
}
```

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/news \
  -H "Content-Type: application/json" \
  -d '{"ticker": "ETH"}'
```

**Response (Success - 200):**

```json
{
  "news": [
    {
      "title": "Ethereum Network Update",
      "description": "New features announced...",
      "source": "CryptoNews",
      "url": "https://example.com/article",
      "date": "2024-01-15T12:00:00Z"
    }
  ]
}
```

## Payment Flow

### Step 1: Initial Request (402 Response)

When you first call the API without payment, you'll receive a `402 Payment Required` response:

```json
{
  "error": "Payment Required",
  "price": 0.1,
  "currency": "USD",
  "paymentInstructions": {
    "method": "x402",
    "details": "..."
  }
}
```

### Step 2: Complete Payment

Follow the payment instructions provided in the 402 response. This typically involves:

1. Processing the payment header
2. Submitting payment via the specified method
3. Receiving a payment proof/token

### Step 3: Retry Request with Payment

Include the payment proof in your retry request headers and you'll receive the news data.

## Response Codes

| Code  | Description                               |
| ----- | ----------------------------------------- |
| `200` | Success - news data returned              |
| `402` | Payment Required - complete payment first |
| `404` | News not found                            |
| `500` | Server error - failed to fetch news       |

## Notes

- Payment is only settled after successful news retrieval
- General news includes articles from all tickers
- Specific ticker searches return both exact matches and related articles
- Each request requires a separate payment ($0.10 USD)

## Support

For payment-related issues or API support, please contact: https://t.me/ikhwanhsn
