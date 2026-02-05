# Event

Get upcoming and past cryptocurrency events with HTTP 402 Payment Required protocol.

## Overview

The Event API provides access to cryptocurrency events, including conferences, launches, updates, and other important dates in the crypto market. Track events for specific tokens or get general crypto market events.

**Base URL:** `https://api.syraa.fun/v2`

**Price:** $0.01 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Endpoints

### GET /v2/event

Fetch cryptocurrency events.

**Query Parameters:**

| Parameter | Type   | Required | Description                                                                                |
| --------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| `ticker`  | string | No       | Specific cryptocurrency ticker (e.g., "BTC", "ETH"). Omit or use "general" for all events. |

**Example Request:**

```bash
# General crypto events
curl https://api.syraa.fun/v2/event

# Specific ticker events
curl https://api.syraa.fun/v2/event?ticker=BTC
```

**Response (Success - 200):**

```json
{
  "event": [
    {
      "date": "2024-01-20",
      "general": [
        {
          "title": "Bitcoin Conference 2024",
          "description": "Annual Bitcoin conference in Miami",
          "location": "Miami, FL",
          "time": "09:00 AM EST"
        },
        {
          "title": "Ethereum Network Upgrade",
          "description": "Scheduled network upgrade",
          "time": "12:00 PM UTC"
        }
      ]
    },
    {
      "date": "2024-01-25",
      "general": [
        {
          "title": "Token Unlock Event",
          "description": "Major token unlock scheduled",
          "time": "00:00 UTC"
        }
      ]
    }
  ]
}
```

**Response for Specific Ticker:**

```json
{
  "event": [
    {
      "date": "2024-01-22",
      "ticker": [
        {
          "title": "Bitcoin Halving Countdown",
          "description": "Estimated halving date approaching",
          "time": "TBD"
        }
      ]
    }
  ]
}
```

---

### POST /v2/event

Fetch cryptocurrency events via POST request.

**Request Body:**

```json
{
  "ticker": "ETH" // Optional: specific ticker or "general"
}
```

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/v2/event \
  -H "Content-Type: application/json" \
  -d '{"ticker": "ETH"}'
```

**Response (Success - 200):**

```json
{
  "event": [
    {
      "date": "2024-02-01",
      "ticker": [
        {
          "title": "Ethereum Dencun Upgrade",
          "description": "Major protocol upgrade implementation",
          "time": "14:00 UTC"
        }
      ]
    }
  ]
}
```

## Response Structure

The API returns events organized by date:

| Field             | Type   | Description                          |
| ----------------- | ------ | ------------------------------------ |
| `event`           | array  | Array of date-grouped events         |
| `event[].date`    | string | Event date (YYYY-MM-DD format)       |
| `event[].general` | array  | General crypto events for that date  |
| `event[].ticker`  | array  | Ticker-specific events for that date |

### Event Object Fields

Each event may contain:

- `title` - Event name/title
- `description` - Event description and details
- `location` - Physical or virtual location (if applicable)
- `time` - Event time (various formats)

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

Follow the payment instructions provided in the 402 response. This typically involves:

1. Processing the payment header
2. Submitting payment via the specified method
3. Receiving a payment proof/token

### Step 3: Retry Request with Payment

Include the payment proof in your retry request headers and you'll receive the event data.

## Response Codes

| Code  | Description                               |
| ----- | ----------------------------------------- |
| `200` | Success - event data returned             |
| `402` | Payment Required - complete payment first |
| `404` | Events not found                          |
| `500` | Server error - failed to fetch events     |

## Use Cases

- **Event Calendars** - Build crypto event tracking applications
- **Investment Planning** - Plan trades around major events
- **Token Analysis** - Track important dates for specific cryptocurrencies
- **Market Research** - Monitor upcoming launches, upgrades, and conferences
- **Alert Systems** - Set up notifications for important crypto events

## Event Types

The API tracks various types of crypto events:

- **Conferences & Meetups** - Industry conferences, local meetups
- **Network Upgrades** - Protocol updates, hard forks
- **Token Unlocks** - Scheduled token unlock events
- **Product Launches** - New product and feature releases
- **Partnerships** - Strategic partnership announcements
- **Listings** - Exchange listing dates
- **Airdrops** - Airdrop distribution dates

## Important Notes

- Payment is only settled after successful event retrieval
- General events include all crypto market events
- Ticker-specific searches return events related to that cryptocurrency
- Events are organized chronologically by date
- Each request requires a separate payment ($0.01 USD)
- Event data is updated regularly from trusted sources

## Example Queries

```bash
# Get all upcoming crypto events
curl https://api.syraa.fun/v2/event

# Get Bitcoin-specific events
curl https://api.syraa.fun/v2/event?ticker=BTC

# Get Ethereum events via POST
curl -X POST https://api.syraa.fun/v2/event \
  -H "Content-Type: application/json" \
  -d '{"ticker": "ETH"}'

# Get Solana events
curl https://api.syraa.fun/v2/event?ticker=SOL
```

## Tips for Best Results

- Check events regularly as dates can change
- Use ticker-specific queries for focused research
- Cross-reference with other sources for time-sensitive events
- Monitor both general and ticker-specific events for comprehensive coverage
- Set up automated polling for calendar applications

## Integration Example

```javascript
// Fetch Bitcoin events
const response = await fetch("https://api.syraa.fun/v2/event?ticker=BTC", {
  headers: {
    "X-Payment-Token": "your-payment-token",
  },
});

const data = await response.json();

// Process events by date
data.event.forEach((dateGroup) => {
  console.log(`Date: ${dateGroup.date}`);
  dateGroup.ticker.forEach((event) => {
    console.log(`  - ${event.title}: ${event.description}`);
  });
});
```

## Support

For payment-related issues or API support:

- **Telegram:** https://t.me/ikhwanhsn

---

_Note: Event dates and times are subject to change. Always verify critical events from official sources._
