# Gems

Discover hidden gem cryptocurrency projects through deep X (Twitter) platform research with HTTP 402 Payment Required protocol.

## Overview

The Gems API performs deep research on X (Twitter) to identify promising, under-the-radar cryptocurrency projects. Using AI-powered analysis, it scans social media for emerging tokens with strong community signals, developer activity, and growth potential.

**Base URL:** `https://api.syraa.fun`

**Price:** $0.15 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## What Are "Gems"?

In crypto terminology, "gems" refer to hidden or undervalued projects with high growth potential. This API helps you discover:

- **Early-stage projects** with strong fundamentals
- **Low market cap tokens** showing promising signals
- **Community-driven projects** gaining traction
- **Innovative protocols** flying under the radar
- **Emerging narratives** before they go mainstream

## Endpoints

### GET /gems

Discover hidden gem cryptocurrency projects.

**Query Parameters:**

None required. The API uses a predefined research prompt to find hidden gems.

**Example Request:**

```bash
curl https://api.syraa.fun/gems
```

**Response (Success - 200):**

```json
{
  "query": "Find hidden gem crypto projects on X",
  "result": "Based on deep X platform research, here are promising hidden gems:\n\n1. ProjectAlpha ($ALPHA) - Emerging DeFi protocol showing strong community growth with 300% increase in mentions over the past week. Early-stage project with innovative yield aggregation mechanism.\n\n2. ChainBeta ($BETA) - Layer 2 solution gaining developer traction. Recent partnerships with established protocols suggest strong fundamentals...",
  "citations": [
    {
      "source": "@cryptodev123",
      "url": "https://twitter.com/cryptodev123/status/...",
      "timestamp": "2024-01-15T10:30:00Z",
      "relevance": "Mentioned ProjectAlpha development progress"
    },
    {
      "source": "@defi_analyst",
      "url": "https://twitter.com/defi_analyst/status/...",
      "timestamp": "2024-01-15T08:45:00Z",
      "relevance": "Analysis of ChainBeta partnerships"
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

### POST /gems

Discover hidden gems via POST request.

**Request Body:**

```json
{}
```

_Note: The POST endpoint uses the same predefined research prompt as the GET endpoint. No body parameters are required._

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/gems \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (Success - 200):**

```json
{
  "query": "Find hidden gem crypto projects on X",
  "result": "Current hidden gems trending on X platform:\n\n• Token XYZ showing organic growth...\n• Project ABC with unique value proposition...",
  "citations": [
    {
      "source": "@early_investor",
      "url": "https://twitter.com/early_investor/status/...",
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

| Field       | Type   | Description                                  |
| ----------- | ------ | -------------------------------------------- |
| `query`     | string | The research query used                      |
| `result`    | string | AI-generated analysis of hidden gem projects |
| `citations` | array  | Source citations from X posts                |
| `toolCalls` | array  | Information about tools used in the research |

## Research Criteria

The API analyzes multiple factors when identifying gems:

### Community Signals

- Organic mention growth (not paid shilling)
- Quality of discussions and engagement
- Developer and builder involvement
- Community sentiment and enthusiasm

### Project Fundamentals

- Innovative technology or approach
- Active development progress
- Transparent team and roadmap
- Real-world use cases

### Market Indicators

- Early-stage market cap
- Liquidity and trading volume trends
- Token distribution and unlock schedules
- Exchange listing potential

### Social Momentum

- Trending hashtags and topics
- Influencer attention (organic, not paid)
- Partnership announcements
- Community growth rate

## Payment Flow

### Step 1: Initial Request (402 Response)

When you first call the API without payment, you'll receive a `402 Payment Required` response:

```json
{
  "error": "Payment Required",
  "price": 0.15,
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

Include the payment proof in your retry request headers and you'll receive the gem research.

## Response Codes

| Code  | Description                               |
| ----- | ----------------------------------------- |
| `200` | Success - gem research returned           |
| `402` | Payment Required - complete payment first |
| `500` | Server error - research failed            |

## Use Cases

- **Early Investment Research** - Discover projects before mainstream attention
- **Portfolio Diversification** - Find emerging opportunities in different sectors
- **Trend Spotting** - Identify new narratives early
- **Due Diligence** - Get initial leads for deeper research
- **Alpha Generation** - Access community-driven insights
- **Market Monitoring** - Track emerging projects regularly

## How It Works

1. **Deep X Scanning** - Live search across X platform for emerging signals
2. **AI Analysis** - Evaluates projects based on multiple criteria
3. **Signal Filtering** - Filters out spam, scams, and low-quality projects
4. **Insight Compilation** - Aggregates findings into actionable research
5. **Citation Tracking** - Provides sources for transparency and verification
6. **Payment Settlement** - Payment only charged after successful research

## Important Notes

- Payment is only settled after successful research completion
- Results are based on real-time X platform data
- Research reflects current trends (typically last 24-48 hours)
- Citations provided for source verification
- Each request requires a separate payment ($0.15 USD)
- AI analysis combines multiple data points for comprehensive insights

## Best Practices

### Do Your Own Research (DYOR)

- Use this API as a starting point, not financial advice
- Verify all claims and check project websites
- Review smart contracts and audit reports
- Assess team credibility and track record

### Risk Management

- Hidden gems are high-risk, high-reward opportunities
- Only invest what you can afford to lose
- Diversify across multiple projects
- Set stop-losses and take-profit targets

### Timing Considerations

- Run searches regularly to catch new gems early
- Compare results over time to spot trends
- Act quickly on high-conviction opportunities
- Monitor cited sources for updates

## Example Use Case

```bash
# Daily gem discovery routine
curl https://api.syraa.fun/gems

# The API returns:
# - 3-5 promising projects with analysis
# - Community sentiment indicators
# - Direct citations to verify sources
# - Key metrics and catalysts
```

## Tips for Maximizing Value

- **Run Daily** - New gems emerge constantly
- **Track Citations** - Follow cited accounts for ongoing insights
- **Cross-Reference** - Combine with other API endpoints (News, Events)
- **Build Watchlists** - Create lists of discovered gems to monitor
- **Set Alerts** - Track mentioned projects on exchanges and DexScreener

## Integration Example

```javascript
// Fetch hidden gems
const response = await fetch("https://api.syraa.fun/gems", {
  headers: {
    "X-Payment-Token": "your-payment-token",
  },
});

const data = await response.json();

// Parse and display gems
console.log("Hidden Gems Research:");
console.log(data.result);

// Check citations
console.log("\nSources:");
data.citations.forEach((citation) => {
  console.log(`- ${citation.source}: ${citation.url}`);
});
```

## Support

For payment-related issues or API support:

- **Telegram:** https://t.me/ikhwanhsn

---

**⚠️ IMPORTANT DISCLAIMER**

_This API provides research and information for educational purposes only. It does NOT constitute financial, investment, or trading advice. Cryptocurrency investments are highly risky and volatile. Hidden gems carry additional risk due to lower liquidity and limited track records. Always conduct thorough due diligence, consult with qualified financial advisors, and never invest more than you can afford to lose. Past performance does not guarantee future results._
