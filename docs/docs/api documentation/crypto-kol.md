# Crypto KOL

Get insights from top crypto influencers and KOLs (Key Opinion Leaders) with HTTP 402 Payment Required protocol.

## Overview

The Crypto KOL API provides AI-powered insights based on the perspectives and opinions of leading crypto influencers. Get analysis and viewpoints from top voices in the cryptocurrency space on various crypto topics.

**Base URL:** `https://api.syraa.fun/v2`

**Price:** $0.01 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Supported KOLs

The API can provide insights from these influential crypto accounts:

- **@elonmusk** - Elon Musk
- **@VitalikButerin** - Vitalik Buterin (Ethereum founder)
- **@cz_binance** - CZ (Binance founder)
- **@saylor** - Michael Saylor (MicroStrategy)
- **@justinsuntron** - Justin Sun (TRON founder)
- **@APompliano** - Anthony Pompliano
- **@balajis** - Balaji Srinivasan
- **@TheCryptoLark** - The Crypto Lark
- **@100trillionUSD** - PlanB
- **@themooncarl** - Carl The Moon

## Endpoints

### GET /v2/crypto-kol

Get crypto insights from KOL perspectives.

**Query Parameters:**

None required. The API uses a predefined prompt to gather insights from crypto KOLs.

**Example Request:**

```bash
curl https://api.syraa.fun/v2/crypto-kol
```

**Response (Success - 200):**

```json
{
  "query": "What are crypto KOLs saying about the market?",
  "result": "Based on recent insights from top crypto influencers: Vitalik Buterin emphasized the importance of scaling solutions, while Michael Saylor continues to advocate for Bitcoin as digital property...",
  "citations": [
    {
      "source": "@VitalikButerin",
      "url": "https://twitter.com/VitalikButerin/status/...",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "toolCalls": [
    {
      "tool": "x_live_search",
      "status": "success"
    }
  ]
}
```

---

### POST /v2/crypto-kol

Get crypto insights via POST request.

**Request Body:**

```json
{}
```

_Note: The POST endpoint uses the same predefined KOL prompt as the GET endpoint. No body parameters are required._

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/v2/crypto-kol \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (Success - 200):**

```json
{
  "query": "What are crypto KOLs saying about the market?",
  "result": "Recent crypto sentiment from key influencers shows...",
  "citations": [
    {
      "source": "@saylor",
      "url": "https://twitter.com/saylor/status/...",
      "timestamp": "2024-01-15T12:00:00Z"
    }
  ],
  "toolCalls": [
    {
      "tool": "x_live_search",
      "status": "success"
    }
  ]
}
```

## Response Fields

| Field       | Type   | Description                                |
| ----------- | ------ | ------------------------------------------ |
| `query`     | string | The search query used                      |
| `result`    | string | AI-generated insights from crypto KOLs     |
| `citations` | array  | Source citations from KOL posts/tweets     |
| `toolCalls` | array  | Information about tools used in the search |

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

Include the payment proof in your retry request headers and you'll receive the KOL insights.

## Response Codes

| Code  | Description                               |
| ----- | ----------------------------------------- |
| `200` | Success - KOL insights returned           |
| `402` | Payment Required - complete payment first |
| `500` | Server error - search failed              |

## Use Cases

- **Market Sentiment** - Gauge crypto market sentiment from top influencers
- **Project Analysis** - Get KOL perspectives on specific crypto projects
- **Trend Identification** - Discover what crypto leaders are talking about
- **Investment Research** - Gather diverse viewpoints from influential voices
- **News Aggregation** - Consolidated insights from multiple KOL sources

## How It Works

1. **Live Search** - The API performs real-time searches across KOL social media
2. **AI Analysis** - Aggregates and analyzes recent posts from target KOLs
3. **Citation Tracking** - Provides source citations for transparency
4. **Insight Generation** - Delivers comprehensive summary with citations
5. **Payment Settlement** - Payment only charged after successful results

## Important Notes

- Payment is only settled after successful insight generation
- Results are based on real-time social media data from KOLs
- Citations are provided for verification and transparency
- Each request requires a separate payment ($0.01 USD)
- Insights reflect recent KOL activity (typically last 24-48 hours)

## Example Use Case

```bash
# Get current crypto market sentiment from KOLs
curl https://api.syraa.fun/v2/crypto-kol

# Response includes:
# - Aggregated insights from multiple KOLs
# - Direct citations from their recent posts
# - Tool execution details
```

## Tips for Best Results

- Use during market volatility to get diverse KOL perspectives
- Check citations to verify original sources
- Cross-reference insights with other market data
- Monitor regularly for trending topics among KOLs

## Support

For payment-related issues or API support:

- **Telegram:** https://t.me/ikhwanhsn

---

_Disclaimer: KOL insights are provided for informational purposes only and should not be considered financial advice. Always do your own research (DYOR) before making investment decisions._
