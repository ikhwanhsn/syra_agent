# Browse

Scrape and extract information from websites using AI-powered browsing with HTTP 402 Payment Required protocol.

## Overview

The Browse API enables you to scrape and gather information from websites using an intelligent browsing service. This is a paid API that uses the x402 payment protocol - you'll need to complete payment before receiving the data.

**Base URL:** `https://api.syraa.fun`

**Price:** $0.15 USD per request

## Authentication

This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions.

## Endpoints

### GET /browse

Scrape information from websites based on a query.

**Query Parameters:**

| Parameter | Type   | Required | Description                                        |
| --------- | ------ | -------- | -------------------------------------------------- |
| `query`   | string | No       | Your research query or task for the browsing agent |

**Example Request:**

```bash
# Basic scraping request
curl "https://api.syraa.fun/browse?query=Find%20the%20latest%20Bitcoin%20price%20from%20CoinMarketCap"

# Without query (general browsing)
curl https://api.syraa.fun/browse
```

**Response (Success - 200):**

```json
{
  "query": "Find the latest Bitcoin price from CoinMarketCap",
  "result": "{\"status\":\"finished\",\"data\":\"Bitcoin price is $45,230 as of January 15, 2024...\"}"
}
```

---

### POST /browse

Scrape information from websites via POST request.

**Request Body:**

```json
{
  "query": "Your research query or browsing task"
}
```

**Example Request:**

```bash
curl -X POST https://api.syraa.fun/browse \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Extract all product prices from example-shop.com"
  }'
```

**Response (Success - 200):**

```json
{
  "query": "Extract all product prices from example-shop.com",
  "result": "{\"status\":\"finished\",\"data\":\"Product 1: $29.99, Product 2: $49.99...\"}"
}
```

## How It Works

1. **Submit Request** - Send your browsing query to the API
2. **Task Processing** - The AI browsing agent starts working on your task
3. **Polling** - API automatically polls for results every 5 seconds
4. **Complete** - Once finished, you receive the scraped data
5. **Payment Settled** - Payment is only charged after successful completion

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

Include the payment proof in your retry request headers and the browsing task will begin.

## Response Codes

| Code  | Description                                    |
| ----- | ---------------------------------------------- |
| `200` | Success - browsing completed and data returned |
| `402` | Payment Required - complete payment first      |
| `500` | Server error - browsing task failed            |

## Task Status

The browsing service returns results with the following statuses:

- `finished` - Task completed successfully
- `stopped` - Task was stopped
- `failed` - Task failed to complete

## Use Cases

- **Price Monitoring** - Extract product prices from e-commerce sites
- **Data Collection** - Gather specific information from multiple pages
- **Content Scraping** - Extract articles, reviews, or listings
- **Market Research** - Collect competitor data and insights
- **Real-time Information** - Get current data from dynamic websites

## Important Notes

- Payment is only settled after successful task completion
- The API automatically polls for results - no manual polling needed
- Processing time varies based on query complexity (typically 5-30 seconds)
- Each request requires a separate payment ($0.15 USD)
- The browsing agent uses AI to interpret and execute your query

## Rate Limits

Please use responsibly. Excessive requests may be rate-limited.

## Support

For payment-related issues or API support:

- **Telegram:** https://t.me/ikhwanhsn

## Example Queries

Here are some example queries you can use:

```json
{
  "query": "Find the current Ethereum gas prices"
}
```

```json
{
  "query": "Extract the top 5 trending topics from Hacker News"
}
```

```json
{
  "query": "Get the latest news headlines from TechCrunch"
}
```

```json
{
  "query": "Find all NFT collections on OpenSea homepage"
}
```
