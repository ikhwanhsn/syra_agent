---
title: Token Report (Rugcheck)
sidebar_position: 20
---

# Token Report API

Token report from Rugcheck for a given token address, with the x402 payment protocol.

## Overview

The Token Report API returns Rugcheck report data for a token (risk, security, and related metrics). This is a paid API that uses the x402 payment protocol—you must complete payment before receiving the data.

**Base URL:** `https://api.syraa.fun/v2`

**Price:** $0.01 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Endpoints

### GET /v2/token-report

Fetch Rugcheck token report by address.

**Query Parameters:**

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `address` | string | Yes      | Token address.  |

**Example Request:**

```bash
curl "https://api.syraa.fun/v2/token-report?address=7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr"
```

**Response (Success - 200):**

```json
{
  "data": {}
}
```

The `data` object contains Rugcheck report fields (risk scores, security info, etc.).

---

### POST /v2/token-report

Fetch token report via POST.

**Request Body:**

```json
{
  "address": "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr"
}
```

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/v2/token-report \
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

Include the payment proof in your retry request headers to receive the report.

## Response Codes

| Code  | Description                               |
| ----- | ----------------------------------------- |
| `200` | Success - token report returned           |
| `402` | Payment Required - complete payment first |
| `500` | Server error - failed to fetch            |

## Support

For payment-related issues or API support: **Telegram:** https://t.me/ikhwanhsn
