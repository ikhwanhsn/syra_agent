---
title: x402 API Documentation Standard
sidebar_position: 0
---

# x402 API Documentation Standard

This document defines the standard structure and conventions for all Syra x402 API documentation. Use it as a template when adding or updating API docs.

## Base URL & Versioning

- **Base URL:** `https://api.syraa.fun/v2`
- **Version:** All documented paid APIs use the **v2** path prefix. Full endpoint URLs are `{Base URL}/{resource}` (e.g. `https://api.syraa.fun/v2/news`).
- Do not document unversioned or v1 URLs for paid x402 endpoints; v2 is the current standard.

## Required Sections

Every x402 API doc must include these sections in this order:

1. **Title** – API name (e.g. "Browse", "News").
2. **Overview** – One short paragraph: what the API does, that it uses the x402 payment protocol, and that payment is required before receiving data.
3. **Base URL & Price**
   - **Base URL:** `https://api.syraa.fun/v2`
   - **Endpoint path:** `/{resource}` (e.g. `/browse`, `/news`). In examples, use full URL `https://api.syraa.fun/v2/{resource}`.
   - **Price:** USD per request (e.g. "$0.01 USD per request").
4. **Authentication** – State: "This API uses the x402 payment protocol. On first request without payment, you'll receive a `402 Payment Required` response with payment instructions."
5. **Endpoints** – For each method (GET/POST):
   - Method and path: `GET /v2/{resource}` or `POST /v2/{resource}`.
   - Query parameters or request body table.
   - Example request using full URL `https://api.syraa.fun/v2/{resource}`.
   - Response (Success - 200) with example JSON.
6. **Payment Flow**
   - Step 1: Initial request returns 402 with payment instructions.
   - Step 2: Complete payment (process payment header, submit via specified method, receive payment proof/token).
   - Step 3: Retry request with payment proof in headers.
   - Include the standard 402 response example (see below).
7. **Response Codes** – Table with at least: `200` (Success), `402` (Payment Required), `5xx` (Server error). Add others as needed (e.g. `404`).
8. **Support** – Link to support (e.g. Telegram: https://t.me/ikhwanhsn).

## Standard 402 Response Example

Use this structure in the Payment Flow section:

```json
{
  "error": "Payment Required",
  "price": <number>,
  "currency": "USD",
  "paymentInstructions": {
    "method": "x402",
    "details": "..."
  }
}
```

Replace `<number>` with the actual price (e.g. `0.01`, `0.0001` for check-status).

## URL Conventions in Examples

- **curl:** Use `https://api.syraa.fun/v2/{resource}` (e.g. `https://api.syraa.fun/v2/news`, `https://api.syraa.fun/v2/browse?query=...`).
- **JavaScript/fetch:** Use the same full base URL: `https://api.syraa.fun/v2/{resource}`.
- **Query params:** Append to the v2 URL (e.g. `https://api.syraa.fun/v2/news?ticker=BTC`).

## Optional Sections (use when relevant)

- **Response Fields** – Table describing response object fields.
- **Use Cases** – Bullet list of typical use cases.
- **How It Works** – Numbered flow of the API behavior.
- **Important Notes** – Pricing, rate limits, disclaimers.
- **Integration Example** – Code sample (JavaScript, etc.) using v2 URLs.
- **Rate Limits** – If applicable.

## Checklist for New or Updated API Docs

- [ ] Base URL is `https://api.syraa.fun/v2` and all example URLs use `/v2/{resource}`.
- [ ] Price is stated in USD per request.
- [ ] Authentication section states x402 and 402 response.
- [ ] All curl and code examples use `https://api.syraa.fun/v2/...`.
- [ ] Payment Flow includes the standard 402 JSON example with correct price.
- [ ] Response Codes table includes 200, 402, and relevant errors.
- [ ] Support link is present.
