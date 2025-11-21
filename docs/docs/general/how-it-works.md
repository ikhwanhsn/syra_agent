---
sidebar_position: 4
title: 🧠 How It Works
---

# 🧠 How It Works

The Syra AI Agent Trading Assistant Bot operates through a streamlined pipeline that transforms raw market data into intelligent, actionable trading insights, all delivered instantly to your Telegram chat.

## Overview

Syra combines real-time data analysis, technical computation, and automation workflows using n8n, market APIs, and Telegram integration.

The process follows four main stages:

1. **Data Collection** → Fetch market data
2. **Analysis Engine** → Process indicators
3. **Signal Generation** → Build structured output
4. **Delivery** → Send formatted reports to Telegram

## 1. Data Sources

Syra retrieves live and historical data from trusted market APIs such as:

- **Binance Market Data API** — price, volume, and candlestick information
- **CoinGecko / CryptoCompare** (optional) — price indexes and asset metadata

Each signal query (e.g., `/signal bitcoin`) triggers Syra to fetch:

- Latest OHLCV (Open, High, Low, Close, Volume) data
- Previous 20–50 candles for technical indicator computation

:::info
The data is normalized before analysis to ensure accuracy across exchanges.
:::

## 2. Analysis Engine

Once the data is collected, Syra's engine runs a sequence of indicator calculations inside the n8n workflow.

### Indicators Calculated:

- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- SMA 20 & 50
- EMA 12 & 26
- Bollinger Bands
- ATR % (Average True Range Percentage)

These indicators are compared against dynamic thresholds to detect:

- Momentum direction
- Volatility level
- Overbought / Oversold zones
- Trend confirmations (crossovers, divergences)

## 3. Signal Logic & Trend Evaluation

The core logic of Syra assigns a trend score based on combined signals.

For example:

| Condition               | Score Impact | Meaning                  |
| ----------------------- | ------------ | ------------------------ |
| Price above SMA20       | +1           | Short-term bullish trend |
| Price above SMA50       | +1           | Mid-term confirmation    |
| RSI above 60            | +1           | Positive momentum        |
| MACD histogram positive | +1           | Bullish momentum         |
| MACD crossover bearish  | −1           | Momentum weakening       |

The total score determines the trend label:

- **5** → STRONG BULLISH
- **3–4** → BULLISH
- **0–2** → NEUTRAL / MIXED
- **−3 to −5** → BEARISH

## 4. AI Confidence Layer

The bot uses a rule-based AI layer to analyze conflicting signals.

For instance:

- RSI bullish but MACD bearish → **Confidence = Medium**
- All indicators aligned → **Confidence = High**
- Mixed volatility and volume → **Confidence = Low**

This confidence rating helps traders gauge trust level in each recommendation.

## 5. Signal Generation

Once analysis is complete, Syra constructs a structured message object like this:

```json
{
  "trend": "STRONG BULLISH",
  "confidence": "HIGH",
  "action": "BUY",
  "support": "191.64",
  "resistance": "205.03",
  "entry": "201.02",
  "targets": ["205.98", "209.70", "213.42"],
  "stopLoss": "196.06",
  "riskReward": "1:2"
}
```

This data is then converted into a formatted HTML message ready for Telegram output.

## 6. Telegram Message Formatting

Using the n8n Telegram Send Message node, Syra sends structured text using HTML parse mode for bold titles, emojis, and easy readability.

**Example output:**

```
📊 <b>BTC/USDT Market Analysis</b>
━━━━━━━━━━━━━━━━━━━
Trend: <b>STRONG BULLISH</b> (Confidence: HIGH)
Action: <b>BUY</b>
Entry: 201.02 | Stop Loss: 196.06
Targets: 205.98 / 209.70 / 213.42
━━━━━━━━━━━━━━━━━━━
<i>Syra Trading Agent Bot | Powered by n8n</i>
```

:::tip
Every section is modular — you can add or remove fields from the workflow without breaking formatting.
:::

## 7. Automation via n8n

The n8n workflow powers the bot's entire process.

**Typical structure:**

1. **Trigger Node**: Telegram command received (`/signal bitcoin`)
2. **HTTP Request Node**: Fetch market data from Binance
3. **Function Node**: Calculate indicators and logic
4. **Switch Node**: Route by command type
5. **Telegram Node**: Send formatted response back to user

:::info
This modular approach allows easy customization and scaling.
:::

## 8. Error Handling & Reliability

Syra includes built-in safeguards:

- **Invalid command** → returns "Unknown Command" message
- **Missing data** → retries API call
- **Empty analysis** → sends fallback "No signal available" notice

Each stage logs timestamped metadata for traceability.

## 9. Security & Privacy

- Telegram user IDs are anonymized and stored only for session tracking.
- Feedback messages are securely saved in the Syra database for analysis only.
- No financial transactions or wallet connections are ever requested by the bot.

:::tip
Syra is a read-only analysis tool — safe for all users.
:::

## System Architecture Diagram

**Example flow:**

```
User → Telegram Command → n8n → Market API → Analysis → Telegram Response
```

## Summary

| Stage                 | Description                      |
| --------------------- | -------------------------------- |
| **Data Collection**   | Fetches latest market data       |
| **Analysis Engine**   | Processes indicators and metrics |
| **Signal Generation** | Builds structured JSON result    |
| **Telegram Delivery** | Sends formatted trading report   |
| **Automation**        | Runs seamlessly via n8n          |
