---
title: Bubblemaps Maps
sidebar_position: 22
---

# Bubblemaps Maps API

Token holder distribution visualization and decentralization score from BubbleMaps, with the x402 payment protocol.

## Overview

The Bubblemaps Maps API returns BubbleMaps data for a Solana token: holder clusters, decentralization score, and distribution visualization. This is a paid API that uses the x402 payment protocol—you must complete payment before receiving the data.

**Base URL:** `https://api.syraa.fun/v2`

**Price:** $0.01 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Endpoints

### GET /v2/bubblemaps/maps

Fetch BubbleMaps data for a Solana token.

**Query Parameters:**

| Parameter | Type   | Required | Description                        |
| --------- | ------ | -------- | ---------------------------------- |
| `address` | string | Yes      | Solana token contract address.     |

**Example Request:**

```bash
curl "https://api.syraa.fun/v2/bubblemaps/maps?address=7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr"
```

**Response (Success - 200):**

```json
{
  "data": {
    "clusters": [],
    "decentralization_score": 0.85
  }
}
```

---

### POST /v2/bubblemaps/maps

Fetch BubbleMaps data via POST.

**Request Body:**

```json
{
  "address": "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr"
}
```

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/v2/bubblemaps/maps \
  -H "Content-Type: application/json" \
  -d '{"address": "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr"}'
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
| `200` | Success - BubbleMaps data returned        |
| `402` | Payment Required - complete payment first |
| `500` | Server error - failed to fetch            |

## Support

For payment-related issues or API support: **Telegram:** https://t.me/ikhwanhsn
