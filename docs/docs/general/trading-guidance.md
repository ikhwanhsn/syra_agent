---
sidebar_position: 7
title: 🧭 Trading Guidance
---

# 🧭 Trading Guidance

The Syra AI Agent Trading Assistant provides AI-powered trading insights to help you make data-driven decisions. This section explains how to read, apply, and act on the signals Syra generates.

## Understanding Syra's Signals

Each `/signal` output is carefully structured to give you a complete technical snapshot of the market.

**Example output:**

```
📊 <b>BTC/USDT Market Analysis</b>
━━━━━━━━━━━━━━━━━━━
Trend: <b>STRONG BULLISH</b> (Confidence: HIGH)
Action: <b>BUY</b>
Entry: 201.02 | Stop Loss: 196.06
Targets: 205.98 / 209.70 / 213.42

Risk: 2% | Risk/Reward: 1:2
━━━━━━━━━━━━━━━━━━━
<i>Bullish momentum building</i>
━━━━━━━━━━━━━━━━━━━
<i>Syra Trading Agent Bot | Powered by n8n</i>
```

Let's break down each part 👇

## Trend

Describes the current overall direction of the market.

| Trend Type         | Meaning                                            | Suggested Action                    |
| ------------------ | -------------------------------------------------- | ----------------------------------- |
| **STRONG BULLISH** | Price momentum and indicators fully aligned upward | Look for long entries               |
| **BULLISH**        | Positive signals with moderate confirmation        | Consider buying with caution        |
| **NEUTRAL**        | Mixed signals, low conviction                      | Wait or stay out                    |
| **BEARISH**        | Downward trend forming                             | Avoid longs or prepare short setups |
| **STRONG BEARISH** | High conviction downtrend                          | Short opportunities likely          |

## Confidence

Reflects how consistent and reliable the signal is.

| Confidence | Meaning                               |
| ---------- | ------------------------------------- |
| **HIGH**   | Most indicators agree                 |
| **MEDIUM** | Some mixed signals                    |
| **LOW**    | Conflicting data, uncertain direction |

:::info
The higher the confidence, the stronger the confluence between multiple indicators.
:::

## Entry & Stop Loss

- **Entry Price:** The ideal price level to open your position.
- **Stop Loss:** The price level to automatically exit and protect your capital.

:::warning
Always place a stop loss immediately after entering a trade. Never skip it.
:::

## Profit Targets

Syra provides up to three profit targets:

- **Target 1:** Conservative take-profit zone (secure early gains)
- **Target 2:** Moderate take-profit zone (ride the trend)
- **Target 3:** Aggressive take-profit zone (maximize potential)

:::tip
Many traders close 33% of their position at each target to balance safety and profit.
:::

## Risk Management

Proper risk control is essential to long-term success.

Syra includes a Risk Management block in each signal:

```
Recommended Risk Per Trade: 2%
Suggested Stop Loss: 4.96 points
Max Position Size: 40.32
Risk/Reward Ratio: 1:2
```

**Guidelines:**

- Risk a maximum of **2%** of your capital per trade.
- Use position sizing — smaller size for volatile markets.
- Aim for **1:2 or better** risk/reward ratio.

:::info
Risk less when confidence is "Medium" or "Low."
:::

## Momentum & Volume Context

The momentum and volume sections describe how strong the trend really is.

| Indicator     | Interpretation          |
| ------------- | ----------------------- |
| RSI > 60      | Upward momentum         |
| RSI < 40      | Downward pressure       |
| MACD > Signal | Bullish crossover       |
| MACD < Signal | Bearish crossover       |
| High Volume   | Confirms breakout       |
| Low Volume    | Weak trend, may reverse |

## Volatility & Bollinger Bands

Volatility helps you gauge risk exposure.

| Volatility Level | Meaning                                    |
| ---------------- | ------------------------------------------ |
| **LOW**          | Price range tight — possible breakout soon |
| **MODERATE**     | Controlled trend, good trading environment |
| **HIGH**         | Wild swings — reduce position size         |

**Bollinger Band Position:**

Shows where current price sits within its range.

- **Above 80%** → Near resistance (watch for pullback)
- **Below 20%** → Near support (potential reversal)

## Action Plan Example

Each signal includes an Action Plan, a structured approach to execute the trade:

```
Immediate Actions:
- Consider entering long position
- Entry price: 201.02
- Set stop loss: 196.06 (-4.96 points)

Entry Strategy:
- Scale in 2–3 tranches
- Wait for confirmation on lower timeframe
- Use DCA if price dips

Exit Strategy:
- Take 33% profit at Target 1: 205.98
- Take 33% profit at Target 2: 209.70
- Take 34% profit at Target 3: 213.42
- Trail stop loss after Target 1
```

:::tip
Syra is built for discipline, not emotional trading. Stick to your action plan and risk limits every time.
:::

## Common Mistakes to Avoid

❌ **Don't:**

- Ignore Stop Losses
- Enter trades without confirmation
- Overleverage (use too much size)
- Chase every signal
- Ignore market volatility

✅ **Instead:**

- Wait for signal alignment
- Follow risk-per-trade rules
- Review previous signals for trend consistency

## Pro Tips

### 💡 1. Combine with Lower Timeframes

Check shorter timeframes (15m / 1h) to confirm entries.

### 💡 2. Use Syra as a Filter

Only take trades aligned with Syra's "BULLISH" or "STRONG BULLISH" trends.

### 💡 3. Keep a Trade Journal

Record entries, targets, and emotions. It improves long-term accuracy.

---

## Disclaimer

:::caution
Syra AI Agent Trading Assistant provides technical insights only. It does not provide financial advice or guarantee profits. Always do your own analysis and use proper risk control.
:::
