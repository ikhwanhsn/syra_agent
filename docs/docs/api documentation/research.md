# Research

Comprehensive AI-powered research from websites with quick or deep analysis modes using HTTP 402 Payment Required protocol.

## Overview

The Research API provides AI-powered research capabilities with two modes: Quick Research for fast insights and Deep Research for comprehensive analysis. The system automatically gathers, analyzes, and synthesizes information from multiple web sources to answer your research queries.

**Base URL:** `https://api.syraa.fun`

**Price:** $0.75 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Research Modes

### Quick Research

- **Speed:** Fast (30-60 seconds)
- **Depth:** Surface-level analysis
- **Sources:** 3-5 sources
- **Best For:** Quick facts, basic overviews, simple questions
- **Output:** Concise summary with key points

### Deep Research

- **Speed:** Thorough (2-5 minutes)
- **Depth:** Comprehensive analysis
- **Sources:** 10-20+ sources
- **Best For:** Complex topics, detailed analysis, multi-faceted questions
- **Output:** In-depth report with citations

## Endpoints

### GET /research

Perform research on any topic.

**Query Parameters:**

| Parameter | Type   | Required | Description                                               |
| --------- | ------ | -------- | --------------------------------------------------------- |
| `query`   | string | No       | Your research question or topic                           |
| `type`    | enum   | No       | Research type: `"quick"` or `"deep"` (default: `"quick"`) |

**Example Request:**

```bash
# Quick research (default)
curl "https://api.syraa.fun/research?query=What%20is%20Bitcoin%20ETF"

# Deep research
curl "https://api.syraa.fun/research?query=Analyze%20the%20impact%20of%20Bitcoin%20ETFs%20on%20institutional%20adoption&type=deep"
```

**Response (Success - 200):**

```json
{
  "status": "success",
  "content": "# Bitcoin ETF Analysis\n\nA Bitcoin ETF (Exchange-Traded Fund) is a financial product that tracks the price of Bitcoin and trades on traditional stock exchanges. Here's what you need to know:\n\n## What is a Bitcoin ETF?\n\nBitcoin ETFs allow investors to gain exposure to Bitcoin without directly owning the cryptocurrency. They trade like stocks on regulated exchanges...\n\n## Key Benefits\n\n1. **Regulatory Compliance** - Approved by SEC, providing institutional-grade oversight\n2. **Easy Access** - Trade through traditional brokerage accounts\n3. **Custody Security** - Professional custody solutions eliminate self-storage risks\n\n## Market Impact\n\nThe approval of spot Bitcoin ETFs in January 2024 marked a watershed moment for crypto adoption...",
  "sources": [
    {
      "url": "https://www.sec.gov/bitcoin-etf-approval",
      "title": "SEC Approves First Bitcoin ETFs",
      "relevance": "Primary source for regulatory information"
    },
    {
      "url": "https://www.bloomberg.com/bitcoin-etf-analysis",
      "title": "Bitcoin ETF Market Analysis",
      "relevance": "Market data and institutional adoption statistics"
    },
    {
      "url": "https://www.coindesk.com/bitcoin-etf-guide",
      "title": "Complete Guide to Bitcoin ETFs",
      "relevance": "Educational overview and mechanics"
    }
  ]
}
```

---

### POST /research

Perform research via POST request.

**Request Body:**

```json
{
  "query": "Compare Layer 1 vs Layer 2 blockchain scaling solutions",
  "type": "deep"
}
```

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/research \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the latest developments in AI and blockchain integration?",
    "type": "quick"
  }'
```

**Response (Success - 200):**

```json
{
  "status": "success",
  "content": "# AI and Blockchain Integration: Latest Developments\n\nRecent advances show growing convergence between AI and blockchain technologies...",
  "sources": [
    {
      "url": "https://example.com/ai-blockchain",
      "title": "AI Meets Blockchain: 2024 Trends",
      "relevance": "Recent developments and use cases"
    }
  ]
}
```

## Response Fields

| Field     | Type   | Description                               |
| --------- | ------ | ----------------------------------------- |
| `status`  | string | Request status (`"success"` or `"error"`) |
| `content` | string | Research report in Markdown format        |
| `sources` | array  | List of sources used in research          |

### Source Object

Each source contains:

| Field       | Type   | Description                  |
| ----------- | ------ | ---------------------------- |
| `url`       | string | Source URL                   |
| `title`     | string | Page/article title           |
| `relevance` | string | Why this source was included |

## Payment Flow

### Step 1: Initial Request (402 Response)

When you first call the API without payment, you'll receive a `402 Payment Required` response:

```json
{
  "error": "Payment Required",
  "price": 0.75,
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

Include the payment proof in your retry request headers and the research will begin.

## Response Codes

| Code  | Description                               |
| ----- | ----------------------------------------- |
| `200` | Success - research completed              |
| `402` | Payment Required - complete payment first |
| `500` | Server error - research failed            |

## Use Cases

### Business Intelligence

- Competitor analysis
- Market research
- Industry trend analysis
- Technology evaluation

### Academic Research

- Literature reviews
- Topic exploration
- Fact-checking
- Citation gathering

### Investment Research

- Project due diligence
- Market analysis
- Trend identification
- Risk assessment

### Technical Research

- Technology comparisons
- Best practices
- Implementation guides
- Architecture analysis

### Content Creation

- Article research
- Report writing
- Presentation preparation
- Educational content

## How It Works

### Quick Research Flow

1. **Query Analysis** - Understands your research question
2. **Source Discovery** - Finds 3-5 relevant sources
3. **Content Extraction** - Pulls key information
4. **Synthesis** - Combines into concise summary
5. **Source Attribution** - Lists sources with relevance

### Deep Research Flow

1. **Query Decomposition** - Breaks down complex questions
2. **Comprehensive Search** - Finds 10-20+ sources
3. **Deep Analysis** - Analyzes each source thoroughly
4. **Cross-Referencing** - Validates information across sources
5. **Report Generation** - Creates detailed markdown report
6. **Citation Tracking** - Full source attribution

## Content Format

All research reports are returned in **Markdown format**, including:

- Headers and subheaders
- Bullet points and numbered lists
- Bold and italic emphasis
- Code blocks (when relevant)
- Tables (for comparisons)
- Links to sources

This makes the content easy to:

- Display in web applications
- Convert to HTML
- Copy to documentation
- Include in reports
- Parse programmatically

## Important Notes

- Payment is only settled after successful research completion
- Processing time varies by research type and complexity
- Each request requires a separate payment ($0.75 USD)
- Sources are verified and relevant to your query
- Content is AI-generated based on source material
- Results reflect current web information

## Choosing Research Type

### Use Quick Research When:

- You need fast answers
- The question is straightforward
- You want a brief overview
- Budget is a consideration
- Time is limited

### Use Deep Research When:

- The topic is complex or multi-faceted
- You need comprehensive analysis
- Multiple perspectives are important
- You're making important decisions
- Quality trumps speed

## Best Practices

### Writing Effective Queries

**Good Queries:**

- "Compare Ethereum and Solana for DeFi applications"
- "What are the security risks of AI-generated code?"
- "Explain zero-knowledge proofs and their use cases"

**Poor Queries:**

- "blockchain" (too vague)
- "tell me everything about crypto" (too broad)
- "yes or no: should I buy BTC?" (not research-oriented)

### Tips for Better Results

- Be specific but not overly narrow
- Include context when needed
- Ask one main question per request
- Use deep research for complex topics
- Specify the perspective you want (technical, business, etc.)

## Example Queries

```bash
# Technology comparison
curl "https://api.syraa.fun/research?query=PostgreSQL%20vs%20MongoDB%20for%20Web3%20applications&type=deep"

# Market analysis
curl "https://api.syraa.fun/research?query=NFT%20market%20trends%202024&type=quick"

# Technical explanation
curl "https://api.syraa.fun/research?query=How%20does%20Bitcoin%20Lightning%20Network%20work&type=quick"

# Investment research
curl "https://api.syraa.fun/research?query=Analyze%20Solana%20ecosystem%20growth%20potential&type=deep"
```

## Integration Example

```javascript
// Perform deep research
async function conductResearch(topic) {
  const response = await fetch("https://api.syraa.fun/research", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Payment-Token": "your-payment-token",
    },
    body: JSON.stringify({
      query: topic,
      type: "deep",
    }),
  });

  const data = await response.json();

  if (data.status === "success") {
    // Convert markdown to HTML or display directly
    console.log("Research Report:");
    console.log(data.content);

    console.log("\nSources:");
    data.sources.forEach((source, i) => {
      console.log(`${i + 1}. ${source.title}`);
      console.log(`   ${source.url}`);
      console.log(`   Relevance: ${source.relevance}\n`);
    });
  }

  return data;
}

// Usage
conductResearch("Impact of quantum computing on blockchain security");
```

## Rendering Markdown Content

The research content is in Markdown format. Here's how to display it:

### JavaScript (with marked.js)

```javascript
import { marked } from "marked";

const html = marked(data.content);
document.getElementById("research-output").innerHTML = html;
```

### React

```jsx
import ReactMarkdown from "react-markdown";

function ResearchDisplay({ content }) {
  return <ReactMarkdown>{content}</ReactMarkdown>;
}
```

### Python

```python
import markdown

html = markdown.markdown(data['content'])
```

## Performance Expectations

| Research Type | Typical Duration | Source Count   | Word Count       |
| ------------- | ---------------- | -------------- | ---------------- |
| Quick         | 30-60 seconds    | 3-5 sources    | 300-800 words    |
| Deep          | 2-5 minutes      | 10-20+ sources | 1000-3000+ words |

## Cost Comparison

For complex research needs:

- **Single Deep Research:** $0.75 (comprehensive, all sources included)
- **Multiple Quick Searches:** $0.75 each (may need several for same depth)

Deep research is often more cost-effective for complex topics.

## Support

For payment-related issues or API support:

- **Telegram:** https://t.me/ikhwanhsn

---

**💡 TIP:** For best results, use deep research for important decisions and quick research for rapid fact-checking or overviews.
