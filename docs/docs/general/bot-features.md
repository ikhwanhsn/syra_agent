---
sidebar_position: 3
title: 🤖 Bot Features
---

# 🤖 Bot Features

Syra AI Agent Trading Assistant Bot is more than a signal generator, it's a complete AI-powered market assistant that helps you understand the why behind every trade setup. This section breaks down it.

## Market Overview

Every signal begins with a snapshot of the current market.

**Includes:**

- 💰 Current price
- 📈 24-hour change (percentage and direction)
- 🔼 Highest and lowest price in 24 h
- 📊 Trading volume and volatility level

The Market Overview helps you quickly gauge short-term sentiment before diving into deeper analysis.

## Technical Indicators

Syra processes multiple indicators simultaneously to provide a balanced perspective of market conditions.

### RSI — Relative Strength Index

Measures market momentum (0–100).

- RSI above 70 = Overbought zone; below 30 = Oversold zone.
- Syra uses RSI trends to detect potential reversals or momentum continuation.

### MACD — Moving Average Convergence Divergence

Tracks the relationship between two EMAs (12 & 26-period).

- A bullish crossover indicates potential upward momentum.
- Syra highlights when MACD crosses its signal line or diverges.

### Moving Averages (SMA & EMA)

- **SMA20 / SMA50** show short- and medium-term trend direction.
- **EMA12 / EMA26** react faster to price changes.
- Price above moving averages = Bullish trend confirmation.

### Bollinger Bands

Show price volatility and potential breakout levels.

- **Upper band** = Resistance zone, **lower band** = Support zone.
- Syra calculates the price's position inside the band (0–100%) to identify tension areas.

## Trend Analysis

Syra determines overall market direction and strength.

**Components:**

- 🔁 **Trend type** — Bullish, Bearish, or Sideways
- 💪 **Strength score** (1–5)
- 🧩 **Signal confirmations** (e.g., "Price above SMA-20")

**Example:**

```
Trend: STRONG BULLISH (Score: 5)
Signals: Price above SMA-20 • EMA Golden Cross • MACD Bullish
```

## Momentum & Volatility

**Momentum Analysis:** Detects shifts in buying or selling pressure using RSI + MACD synergy.

**Volatility Analysis:** Uses ATR % and Bollinger Width to measure how dynamic the market is.

- Low volatility = possible consolidation.
- High volatility = potential breakout.

## Volume Analysis

Volume confirms strength behind a move.

Syra compares buy vs. sell pressure and classifies it as **Bullish**, **Bearish**, or **Neutral**.

:::caution
Balanced volume = No clear dominance → proceed cautiously.
:::

## Price Targets

Syra automatically computes key price levels based on historical data and volatility.

| Type                 | Description                            |
| -------------------- | -------------------------------------- |
| 🧱 **Support**       | Expected lower boundary before bounce  |
| 🚀 **Resistance**    | Upper boundary before rejection        |
| 🎯 **Long Targets**  | 1-3 profit milestones for long trades  |
| 🔻 **Short Targets** | 1-3 profit milestones for short trades |

Each signal also includes Bollinger Band references and entry levels for both long and short setups.

## Risk Management

Professional trading starts with disciplined risk control.

Syra provides:

- Recommended risk per trade (% of capital)
- Calculated stop-loss level and maximum position size
- Risk : Reward ratio for evaluating trade efficiency

**Example:**

```
Risk : Reward = 1 : 2 means a potential profit twice the risk.
```

## Action Plan

Every signal concludes with a structured action plan:

### Immediate Actions

- Suggested entry and stop loss
- Quick summary of trade direction

### Entry Strategy

- Scaling guidance (e.g., enter in 2-3 tranches)
- Confirmation suggestions before entry

### Exit Strategy

- Multi-target profit taking (Target 1–3)
- Trail stop-loss recommendations

### Warnings

:::warning

- Never risk more than 2% per trade
- Always use stop losses
- Market conditions may change quickly
  :::

Designed to make Syra's analysis not just informative — but **actionable**.

## AI Insights

Syra applies heuristic and data-driven logic to interpret multiple indicator combinations.

When indicators conflict, Syra assigns a confidence score (**Low**, **Medium**, or **High**) to the final recommendation.

This approach ensures balanced decision-making, avoiding false signals from isolated indicators.

## Supported Tokens

Syra currently supports major tokens such as:

**BTC**, **ETH**, **SOL**, **BNB**, **XRP**, **ADA**, **DOGE**, **DOT**, **AVAX**, **LINK**, and more.

Type `/list` in Telegram to view the latest top 10
