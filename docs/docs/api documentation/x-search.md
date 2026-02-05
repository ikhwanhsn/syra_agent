---
title: X Search
sidebar_position: 12
---

# X Search API

Deep research on X (Twitter) for crypto trends and discussions using the x402 payment protocol.

## Overview

The X Search API runs AI-powered research on X (Twitter) for a given query (e.g., token name, topic) and returns summarized findings with citations. This is a paid API that uses the x402 payment protocol—you must complete payment before receiving the data.

**Base URL:** `https://api.syraa.fun/v2`

**Price:** $0.01 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Endpoints

### GET /v2/x-search

Search X/Twitter for crypto and market content.

**Query Parameters:**

| Parameter | Type   | Required | Description                                      |
| --------- | ------ | -------- | ------------------------------------------------ |
| `query`   | string | Yes      | Search query (e.g., token name, topic).         |

**Example Request:**

```bash
curl "https://api.syraa.fun/v2/x-search?query=Bitcoin%20ETF%20approval"
```

**Response (Success - 200):**

```json
{
  "query": "Bitcoin ETF approval",
  "result": "AI-summarized findings from X/Twitter discussions...",
  "citations": [
    {
      "source": "@user",
      "url": "https://twitter.com/...",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "toolCalls": []
}
```

---

### POST /v2/x-search

Search via POST.

**Request Body:**

```json
{
  "query": "Solana ecosystem growth"
}
```

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/v2/x-search \
  -H "Content-Type: application/json" \
  -d '{"query": "Solana ecosystem growth"}'
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

Include the payment proof in your retry request headers to receive the search results.

## Response Codes

| Code  | Description                               |
| ----- | ----------------------------------------- |
| `200` | Success - search results returned          |
| `402` | Payment Required - complete payment first  |
| `500` | Server error - search failed               |

## Support

For payment-related issues or API support: **Telegram:** https://t.me/ikhwanhsn
