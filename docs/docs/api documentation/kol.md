# X KOL

Deep research on X (Twitter) platform to analyze what influencers and KOLs are saying about specific tokens with HTTP 402 Payment Required protocol.

## Overview

The X KOL API performs deep research on X (Twitter) to discover what Key Opinion Leaders (KOLs) and influencers are saying about specific cryptocurrency tokens. Combine this with real-time token data from DexScreener for comprehensive token analysis.

**Base URL:** `https://api.syraa.fun/v2`

**Price:** $0.01 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Key Features

- **Token-Specific KOL Analysis** - See what influencers say about any token
- **DexScreener Integration** - Get live token metrics alongside social sentiment
- **Citation Tracking** - Direct links to KOL posts for verification
- **Real-time Data** - Live X platform scanning and on-chain metrics
- **Comprehensive Insights** - Combines social sentiment with market data

## Endpoints

### GET /v2/x-kol

Research what KOLs are saying about a specific token.

**Query Parameters:**

| Parameter | Type   | Required | Description                                          |
| --------- | ------ | -------- | ---------------------------------------------------- |
| `address` | string | No       | Token contract address (e.g., Solana, Ethereum, BSC) |

**Example Request:**

```bash
# Research a specific token
curl "https://api.syraa.fun/v2/x-kol?address=7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr"

# General crypto KOL research (without address)
curl https://api.syraa.fun/v2/x-kol
```

**Response (Success - 200):**

```json
{
  "query": "What are KOLs saying about token 7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr?",
  "tokenInfo": {
    "name": "POPCAT",
    "symbol": "POPCAT",
    "address": "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    "chain": "solana",
    "price": 0.845,
    "priceChange24h": 12.5,
    "volume24h": 15420000,
    "marketCap": 845000000,
    "liquidity": 8500000,
    "fdv": 845000000,
    "holders": 125000
  },
  "result": "KOL sentiment analysis for POPCAT:\n\n@crypto_trader highlighted the recent price action, noting a 12.5% increase in 24h with strong volume support. @defi_chad mentioned growing community engagement and potential for further upside. @altcoin_guru pointed out the healthy liquidity of $8.5M...",
  "citations": [
    {
      "source": "@crypto_trader",
      "url": "https://twitter.com/crypto_trader/status/...",
      "timestamp": "2024-01-15T10:30:00Z",
      "content": "POPCAT showing strong momentum..."
    },
    {
      "source": "@defi_chad",
      "url": "https://twitter.com/defi_chad/status/...",
      "timestamp": "2024-01-15T09:15:00Z",
      "content": "Community engagement increasing..."
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

### POST /v2/x-kol

Research token KOL sentiment via POST request.

**Request Body:**

```json
{
  "address": "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr"
}
```

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/v2/x-kol \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234567890abcdef1234567890abcdef12345678"
  }'
```

**Response (Success - 200):**

```json
{
  "query": "What are KOLs saying about this token?",
  "tokenInfo": {
    "name": "Example Token",
    "symbol": "EXT",
    "price": 1.23,
    "priceChange24h": -5.2,
    "volume24h": 500000
  },
  "result": "Mixed sentiment from KOLs regarding this token...",
  "citations": [...],
  "toolCalls": [...]
}
```

## Response Fields

| Field       | Type   | Description                         |
| ----------- | ------ | ----------------------------------- |
| `query`     | string | The research query used             |
| `tokenInfo` | object | Live token data from DexScreener    |
| `result`    | string | AI-generated KOL sentiment analysis |
| `citations` | array  | Source citations from KOL posts     |
| `toolCalls` | array  | Information about tools used        |

### Token Info Object

The `tokenInfo` field contains real-time data from DexScreener:

| Field            | Type   | Description                              |
| ---------------- | ------ | ---------------------------------------- |
| `name`           | string | Token name                               |
| `symbol`         | string | Token ticker symbol                      |
| `address`        | string | Contract address                         |
| `chain`          | string | Blockchain (solana, ethereum, bsc, etc.) |
| `price`          | number | Current price in USD                     |
| `priceChange24h` | number | 24h price change percentage              |
| `volume24h`      | number | 24h trading volume in USD                |
| `marketCap`      | number | Market capitalization                    |
| `liquidity`      | number | Total liquidity                          |
| `fdv`            | number | Fully diluted valuation                  |
| `holders`        | number | Number of token holders                  |

## Supported Chains

The API works with tokens from multiple blockchains:

- **Solana** - Most meme coins and new projects
- **Ethereum** - ERC-20 tokens
- **BSC** - Binance Smart Chain tokens
- **Base** - Base network tokens
- **Arbitrum** - Arbitrum tokens
- **Polygon** - Polygon tokens
- And many more supported by DexScreener

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

Include the payment proof in your retry request headers and you'll receive the research results.

## Response Codes

| Code  | Description                                    |
| ----- | ---------------------------------------------- |
| `200` | Success - KOL research and token data returned |
| `402` | Payment Required - complete payment first      |
| `500` | Server error - research failed                 |

## Use Cases

- **Token Due Diligence** - Research KOL opinions before investing
- **Sentiment Analysis** - Gauge influencer sentiment on holdings
- **Trend Detection** - Identify when KOLs start discussing a token
- **Risk Assessment** - Check for red flags in KOL discussions
- **Portfolio Monitoring** - Track KOL sentiment on your holdings
- **Entry/Exit Timing** - Use sentiment shifts as signals
- **Scam Detection** - Identify coordinated shilling or FUD

## How It Works

1. **Token Data Fetch** - Retrieves live metrics from DexScreener
2. **X Platform Search** - Scans X for KOL mentions of the token
3. **AI Analysis** - Analyzes sentiment and key insights
4. **Citation Compilation** - Gathers source posts for verification
5. **Combined Report** - Merges on-chain data with social sentiment
6. **Payment Settlement** - Payment only charged on success

## Analysis Categories

The API evaluates KOL discussions across:

### Sentiment

- **Bullish** - Positive outlook and recommendations
- **Bearish** - Warnings or negative sentiment
- **Neutral** - Factual analysis without bias
- **Mixed** - Conflicting opinions from different KOLs

### Discussion Topics

- Price predictions and targets
- Technical analysis observations
- Fundamental project updates
- Partnership announcements
- Team and developer activity
- Community growth metrics
- Tokenomics and supply concerns
- Exchange listing speculation

### Signal Strength

- **Strong** - Multiple reputable KOLs discussing
- **Moderate** - Some KOL attention
- **Weak** - Limited or low-quality mentions
- **None** - No significant KOL coverage

## Important Notes

- Payment is only settled after successful research completion
- Token info is fetched in real-time from DexScreener
- KOL analysis reflects recent X activity (24-48 hours)
- Citations provided for transparency and verification
- Each request requires a separate payment ($0.01 USD)
- Works with any token that has a contract address

## Best Practices

### Token Address Format

- Use the correct contract address for the chain
- Solana addresses are typically 32-44 characters
- EVM addresses (ETH, BSC, etc.) start with "0x"
- Verify address on official sources before using

### Interpreting Results

- **Check Citations** - Always verify KOL posts directly
- **Consider Context** - Understand each KOL's track record
- **Compare Metrics** - Cross-reference social sentiment with on-chain data
- **Watch for Coordination** - Be wary of synchronized shilling
- **Track Changes** - Monitor sentiment shifts over time

### Risk Management

- KOL opinions are not financial advice
- Influencers can be wrong or have conflicts of interest
- Some KOLs may be paid to promote projects
- Always combine with your own research (DYOR)
- Never invest based solely on influencer opinions

## Example Queries

```bash
# Analyze Solana meme coin
curl "https://api.syraa.fun/v2/x-kol?address=7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr"

# Check Ethereum token sentiment
curl "https://api.syraa.fun/v2/x-kol?address=0x6982508145454Ce325dDbE47a25d4ec3d2311933"

# Research BSC token
curl "https://api.syraa.fun/v2/x-kol?address=0x55d398326f99059fF775485246999027B3197955"
```

## Integration Example

```javascript
// Analyze token before buying
async function checkTokenSentiment(tokenAddress) {
  const response = await fetch(
    `https://api.syraa.fun/v2/x-kol?address=${tokenAddress}`,
    {
      headers: {
        "X-Payment-Token": "your-payment-token",
      },
    },
  );

  const data = await response.json();

  // Display token metrics
  console.log("Token:", data.tokenInfo.name);
  console.log("Price:", data.tokenInfo.price);
  console.log("24h Change:", data.tokenInfo.priceChange24h + "%");
  console.log("Market Cap:", data.tokenInfo.marketCap);

  // Display KOL sentiment
  console.log("\nKOL Analysis:");
  console.log(data.result);

  // Show sources
  console.log("\nCitations:");
  data.citations.forEach((cite) => {
    console.log(`- ${cite.source}: ${cite.url}`);
  });

  return data;
}

// Usage
checkTokenSentiment("7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr");
```

## Combining with Other APIs

Get comprehensive token intelligence by combining this API with others:

```bash
# 1. Get KOL sentiment
curl "https://api.syraa.fun/v2/x-kol?address=YOUR_TOKEN"

# 2. Check latest news
curl "https://api.syraa.fun/v2/news?ticker=TOKEN_SYMBOL"

# 3. Look for upcoming events
curl "https://api.syraa.fun/v2/event?ticker=TOKEN_SYMBOL"
```

## Support

For payment-related issues or API support:

- **Telegram:** https://t.me/ikhwanhsn

---

**⚠️ DISCLAIMER**

_This API provides research and information for educational purposes only. KOL opinions do not constitute financial, investment, or trading advice. Influencers may have undisclosed conflicts of interest or be compensated for their opinions. Token metrics are subject to rapid change. Always conduct thorough due diligence and consult with qualified financial advisors before making investment decisions._
