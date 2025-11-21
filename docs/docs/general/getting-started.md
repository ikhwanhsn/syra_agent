---
sidebar_position: 2
title: ⚙️ Getting Started
---

# ⚙️ Getting Started

Welcome to the Syra AI Agent Trading Assistant setup guide. This page will help you connect to the bot, understand how it works, and run your first signal in just a few minutes.

## What You'll Need

Before starting, make sure you have:

- A Telegram account (mobile or desktop)
- Access to the Syra AI Agent Trading Assistant Bot
- An internet connection
- (Optional) Familiarity with trading basics such as RSI, MACD, and price action

## Step 1: Start the Bot

1. Open Telegram.
2. Choose [Syra AI Agent Trading Assistant Bot](https://t.me/syra_trading_bot).
3. Click **Start** or type `/start`.
4. You'll receive a welcome message introducing the bot and listing available commands.

:::tip
You can always type `/help` to redisplay the list of commands.
:::

## Step 2: Explore Available Tokens

Type `/list` to see the currently supported cryptocurrencies.

**Example output:**

```
📜 Available Token Signals
- Bitcoin (BTC)
- Ethereum (ETH)
- Solana (SOL)
- BNB (BNB)
- XRP (XRP)
- Cardano (ADA)
- Dogecoin (DOGE)
- Polkadot (DOT)
- Avalanche (AVAX)
- Chainlink (LINK)
View all supported token
```

## Step 3: Request a Trading Signal

Use the `/signal` command followed by the token name.

**Example:**

```
/signal bitcoin
```

The bot will return a complete analysis including:

- Current price and 24h change
- RSI, MACD, and Moving Averages
- Support and resistance levels
- Action plan (entry, targets, stop loss)
- Risk/reward ratio and confidence level

:::info
Syra doesn't just give signals — it explains why each trade setup is suggested.
:::

## Step 4: Find News for a Token

Use the `/news` command followed by the token symbol.

**Example:**

```
/news BTC
```

The bot will return a complete analysis including:

- Latest news articles related to the token
- Sentiment analysis from social media
- Technical analysis news

:::info
Syra AI Agent Trading Assistant Bot provides news analysis for supported tokens.
:::

## Step 5: Find Top Mentioned Tokens for a Token

Use the `/top_mention` command followed by time period.

**Example:**

```
/top_mention today
```

The bot will return a complete analysis including:

- Top mentioned tokens on Internet today
- Sentiment analysis from social media
- Technical analysis news

## Step 6: Find Events for a Token (soon)

Use the `/event` command followed by the token symbol.

**Example:**

```
/event BTC
```

The bot will return a complete analysis including:

- Upcoming events related to the token
- Sentiment analysis from social media
- Technical analysis news

## Step 7: Access Documentation

For detailed explanations of indicators, logic, and workflows:

- Type `/docs`

This will take you to the Syra documentation, where you can learn about:

- Indicator calculations
- Strategy logic
- n8n automation flow
- Customization and extensions

## Step 8: Provide Feedback

If you have suggestions, improvements, or bug reports, simply type:

```
/feedback I'd love to see Syra support RSI divergence alerts!
```

Your feedback will be stored automatically and reviewed by the Syra development team.

You'll receive a confirmation message:

```
✅ Thank you! Your feedback has been saved successfully.
```

## Step 9: Explore Upcoming Features

Stay ahead of the curve by checking what's next:

```
/soon
```

Syra will list upcoming features such as:

- AI sentiment analysis
- Portfolio tracker
- Custom strategy builder

## Optional: Enable Alerts (Advanced)

If you're using n8n or an automation environment, you can:

- Schedule Syra to send automatic `/signal` updates every hour
- Trigger alerts when price crosses a moving average or Bollinger Band
- Connect Syra to your custom trading dashboard

More details can be found in the [Developer & API](/docs/advance%20&%20support/developer-and-api) section.

## Summary

You've now:

- ✅ Started the bot
- ✅ Viewed supported tokens
- ✅ Requested your first signal
- ✅ Found news for a token
- ✅ Found events for a token
- ✅ Accessed documentation
- ✅ Sent feedback
- ✅ Explored what's coming next

You're all set to start analyzing markets with Syra AI Agent Trading Assistant Bot.
