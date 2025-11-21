---
sidebar_position: 5
title: 📘 Commands Reference
---

# 📘 Commands Reference

The Syra AI Agent Trading Assistant Bot offers a variety of commands to help you analyze markets, access documentation, submit feedback, and explore upcoming features, all directly from Telegram.

## Overview

| Command                  | Description                                                                                                                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/start`                 | Initialize the bot and display the welcome message                                                                                                                                                                                |
| `/list`                  | Show a preview of available token signals                                                                                                                                                                                         |
| `/signal <token>`        | Get a full technical analysis report for a specific token                                                                                                                                                                         |
| `/news <ticker>`         | Get latest news for token (e.g. `/news BTC`)                                                                                                                                                                                      |
| `/top_mention`           | Get top mention token in specific time, available command: `last5min`, `last10min`, `last15min`, `last30min`, `last45min`, `last60min`, `today`, `yesterday`, `last7days`, `last30days`, `last60days`, `last90days`, `yeartodate` |
| `/event <ticker>` (soon) | Get latest events for token (e.g. `/event BTC`)                                                                                                                                                                                   |
| `/docs`                  | Open the Syra documentation                                                                                                                                                                                                       |
| `/feedback <message>`    | Send feedback, suggestions, or bug reports                                                                                                                                                                                        |
| `/soon`                  | Display upcoming features and roadmap                                                                                                                                                                                             |

_(other commands coming soon…)_

---

## `/start` — Start the Bot

### Purpose

Initializes the Syra bot and greets the user with an overview of available features.

### Usage

```
/start
```

### Response Example

```
👑 <b>Welcome to Syra Trading Agent Bot</b> 👑

Available Commands
━━━━━━━━━━━━━━━━━━━
/list — View available token signals
/signal — Get full market analysis (e.g. /signal bitcoin)
/docs — Read full documentation
/feedback — Share your ideas or report issues
/soon — See upcoming features

━━━━━━━━━━━━━━━━━━━
<i>Empowering traders with AI-powered market insights.</i>
```

---

## `/list` — List Available Tokens

### Purpose

Shows the top 10 available tokens for quick access and a link to view the full list.

### Usage

```
/list
```

### Response Example

```
📜 <b>Available Token Signals</b>
━━━━━━━━━━━━━━━━━━━
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
```

---

## `/signal <token>` — Get Trading Signal

### Purpose

Returns a full technical analysis and trading plan for the specified token.

### Usage

```
/signal <token>
```

### Examples

```
/signal bitcoin
/signal ethereum
/signal solana
```

### Response Example

```
📊 <b>BTC/USDT Market Analysis</b>
━━━━━━━━━━━━━━━━━━━
Trend: <b>STRONG BULLISH</b> (Confidence: MEDIUM)
Action: <b>BUY</b>
Entry: 201.02 | Stop Loss: 196.06
Targets: 205.98 / 209.70 / 213.42

Risk: 2% | Risk/Reward: 1:2
━━━━━━━━━━━━━━━━━━━
<i>Bullish momentum building</i>
━━━━━━━━━━━━━━━━━━━
<i>Syra Trading Agent Bot | Powered by n8n</i>
```

---

## `/news <ticker>` — Get News for Token

### Purpose

Returns the latest news for the specified token.

### Usage

```
/news <ticker>
```

### Examples

```
/news BTC
/news ETH
/news SOL
```

---

## `/top_mention <time>` — Get Top Mentioned Tokens

### Purpose

Returns the top mentioned tokens in the specified time period.

### Usage

```
/top_mention <time>
```

### Examples

```
/top_mention last5min
/top_mention last10min
/top_mention last15min
/top_mention last30min
/top_mention last45min
/top_mention last60min
/top_mention today
/top_mention yesterday
/top_mention last7days
/top_mention last30days
/top_mention last60days
/top_mention last90days
/top_mention yeartodate
```

---

## `/event <ticker>` (soon) — Get Events for Token

### Purpose

Returns the latest events for the specified token.

### Usage

```
/event <ticker>
```

### Examples

```
/event BTC
/event ETH
/event SOL
```

---

## `/docs` — Open Documentation

### Purpose

Provides a link to the official Syra documentation for deeper learning.

### Usage

```
/docs
```

### Response Example

```
📘 <b>Syra Documentation</b>

Explore full documentation for:
- Trading strategy logic
- Indicator explanations
- Automation setup with n8n
- Integration guides
```

---

## `/feedback <message>` — Send Feedback

### Purpose

Allows users to send feedback, suggestions, or issues directly to your database.

### Usage

```
/feedback <your message>
```

### Example

```
/feedback Please add RSI divergence alerts!
```

### Response Example

```
✅ <b>Thank you!</b>
Your feedback has been saved successfully.
We appreciate your input — it helps us improve Syra for all traders.
```

---

## `/soon` — Coming Soon Features

### Purpose

Displays upcoming features and future roadmap updates.

### Usage

```
/soon
```

### Response Example

```
🚀 <b>Coming Soon Features</b>
━━━━━━━━━━━━━━━━━━━
- AI Sentiment Analysis
- Portfolio Performance Tracker
- Multi-Exchange Signal Support
- Custom Strategy Builder
- DCA (Dollar-Cost Averaging) Automation

Stay tuned for future updates!
━━━━━━━━━━━━━━━━━━━
<i>Syra is always evolving to empower your trading journey.</i>
```

---

## Unknown or Invalid Command

When users type a command that isn't recognized, Syra responds with a friendly fallback:

```
⚠️ <b>Unknown Command</b>
Sorry, I didn't recognize that command.
Type /help or /start to see all available commands.
```

---

## Notes

:::info

- All commands are **case-insensitive**.
- The bot supports HTML parse mode for clean formatting.
  :::
