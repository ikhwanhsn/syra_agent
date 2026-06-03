# ✨ Tokenomics

The Syra token ($SYRA) powers **machine money infrastructure for AI agents** on Solana. Our tokenomics align incentives between the platform, autonomous agents, and the community, emphasizing fair distribution, utility-driven value, and routing x402 revenue into **SYRA buybacks reserved for community airdrops**.

## Token Overview

| Parameter           | Details                   |
| ------------------- | ------------------------- |
| **Token Name**      | Syra Agent                |
| **Token Symbol**    | $SYRA                     |
| **Total Supply**    | 1,000,000,000 (1 Billion) |
| **Blockchain**      | Solana                    |
| **Launch Platform** | Pump.fun                  |
| **Token Standard**  | SPL Token                 |

## Token Distribution

Our distribution prioritizes community ownership and long-term sustainability.

| Allocation          | Percentage | Amount      | Details                                       |
| ------------------- | ---------- | ----------- | --------------------------------------------- |
| **Community**       | 97%        | 970,000,000 | Public sale via Pump.fun                      |
| **Team & Treasury** | 3%         | 30,000,000  | Development, operations, and ecosystem growth |

### Community Allocation (97%)

- **Public Launch**: Fair launch on Pump.fun with no private sale or pre-sale
- **Liquidity Provision**: Deep liquidity for healthy trading

### Team & Treasury Allocation (3%)

- **Total Supply**: 30,000,000 tokens
- **Locked**: 16M tokens for 12 months ([proof](https://app.streamflow.finance/contract/solana/mainnet/8h8dvpkS8Ypa2gKVzGwXfYSKzbTHGuEaNwSj6SbTPzZo))
- **Burned**: 5M tokens post-launch ([proof](https://solscan.io/tx/5eDpknA4FsVcxmxYBb2LFwZgLMitKw3GvYiw6dyHiWPfFtoqdoGuALjpXhxmWFETz28J5oga7f43Z33FNoNByhXX))
- **Available**: 9M for operations, partnerships, and grants

> **ℹ️ Transparency Commitment**  
> All team wallets are publicly disclosed. Vesting enforced through smart contracts with no early unlock provisions.

## Token Utility (x402-Optimized)

$SYRA is the native payment token for accessing Syra’s agent-facing APIs via the x402 protocol.

### 1. **x402 API Access**

- Agents pay for API calls via x402 protocol (USDC/stablecoins)
- Seamless integration for autonomous agents
- Instant settlement on Solana (400ms)
- Sub-cent payments possible ($0.001+ per API call)

**Pricing Examples:**

- Sentiment API: $0.01 per call
- Risk Scoring: $0.10 per analysis
- Deep Research: $5.00 per request

### 2. **Staking for Discounts (roadmap — not applied in API pricing yet)**

> **Note:** x402 API prices are set in the Syra API (`x402Pricing` / `getEffectivePriceUsd`) and **do not** currently read on-chain stake or tier. The table below describes **planned** utility once staking is wired to billing.

Lock $SYRA tokens to unlock tiered discounts on all x402 API calls:

| Staking Tier | Tokens Required | Discount | Additional Benefits |
| ------------ | --------------- | -------- | ------------------- |
| **Bronze**   | 10,000          | 10%      | soon                |
| **Silver**   | 50,000          | 25%      | soon                |
| **Gold**     | 100,000         | 40%      | soon                |
| **Platinum** | 500,000         | 50%      | soon                |

**Lock periods:** 30-day minimum. Longer locks can unlock higher reward tiers.

### 3. **Governance Rights**

- Vote on new intelligence API features
- Approve data partnership investments (e.g., Bloomberg Terminal)
- Decide airdrop rules, treasury allocation, and economic parameters
- Community-driven roadmap prioritization

**Voting Power:** 1 staked token = 1 vote

## x402 Buyback & Community Airdrops

Paid x402 API traffic settles in USDC (and stablecoins). **In production, a fixed share of each settled payment is swapped into $SYRA** (via Jupiter) and **held in the Syra treasury wallet for future user airdrops**—tokens are **not** burned as part of this program.

| Mechanism              | Allocation / behavior                         | Frequency        |
| ---------------------- | ----------------------------------------------- | ---------------- |
| **USDC x402 payments** | ~80% of each settled fee → SYRA buyback (Jupiter), kept for airdrops | Each settled paid call (production) |
| **Other burns / sinks** | e.g. optional governance fees, unclaimed staking (roadmap) | If / when enabled |

**Illustrative buyback volume (directional):**

- Monthly x402 volume: $1,000,000 (USDC/stablecoins)
- If ~80% of fees route to buyback: ~$800,000/month equivalent directed into SYRA purchases **accumulating for airdrops**, not removed from circulation by this program.

Schedules and payout rules for airdrops are communicated separately (governance / announcements).

### Supply & circulation

**Total supply:** 1,000,000,000 tokens (fixed at mint).  
Historic burns (e.g. post-launch treasury burns) remain visible on-chain; **ongoing x402 buybacks prioritize distributing value back to users via airdrops** rather than shrinking supply through this mechanism.

## Revenue Model

Platform sustainability through multiple x402 revenue streams:

### Primary Revenue Sources

- x402 API call payments (pay-per-use intelligence)
- Enterprise white-label licensing ($10K-50K/month)
- Institutional custom model training ($50K-250K/year)
- Data licensing to quant funds and researchers

### Revenue Allocation

High-level intent (subject to governance and runway):

- **Significant share** → $SYRA buyback reserved for **community airdrops** (tied to x402 usage)
- **Operations & development** → engineering, infra, partnerships
- **Staker revenue sharing** → rewards for long-term lockers
- **Ecosystem grants & partnerships** → integrations and builders

> **💡 Target Metrics (End of 2026)**  
> - **1,000+ agents** using APIs  
> - **$2M/month** x402 transaction volume  
> - **Growing SYRA buyback pool** funded by fees, distributed via airdrops  
> - **80% gross margins** (API business)

## Long-Term Value Accrual

$SYRA captures value as the AI agent economy grows:

### Network Effects

1. **More agents** → More API calls → Larger buyback pool → More capacity for community airdrops
2. **Better data** → Better models → More agents (flywheel)
3. **Higher staking** → Less circulating supply → Price pressure

### Moat Building

- Proprietary training data from 1,000+ agents
- Cross-agent learning creates better intelligence over time
- First-mover advantage in x402-native agentic trading on Solana
- High switching costs once agents integrate our APIs

### Exit Scenarios (2027+)

- **Acquisition** by Coinbase, Bloomberg, or trading platform ($500M-2B)
- **Strategic merge** with major AI agent framework
- **Independent unicorn** with $50M+ annual revenue

In any scenario, $SYRA holders and active users can benefit from buybacks routed to airdrops, revenue sharing, or acquisition premium.

---

## Comparison: Old vs New Model

| Aspect            | Old Model (B2C Trading Bot) | New Model (x402 Intelligence APIs)     |
| ----------------- | --------------------------- | -------------------------------------- |
| **Users**         | Human operators             | Autonomous AI agents                   |
| **Revenue**       | $10-50/month subscriptions  | $0.01-10 per API call via x402 (USDC)  |
| **Payments**      | $SYRA or fiat               | USDC/stablecoins via x402              |
| **CAC**           | $500-2,000 per user         | $0 (agents discover via x402scan)      |
| **Margins**       | 40-60%                      | 80-90%                                 |
| **Scalability**   | Linear (need support team)  | Exponential (APIs scale infinitely)    |
| **Token Utility** | Discounts & governance      | Staking discounts + x402 buybacks for airdrops |
| **Moat**          | Brand & features            | Proprietary data network               |
| **Exit Multiple** | 3-5x revenue                | 10-20x revenue                         |

**Bottom Line:** The new model is 10x more valuable with better economics and stronger moats.

---

> **ℹ️ Stay Updated**  
> - **Website**: [syra.ai](https://syraa.fun)  
> - **Twitter**: [@syra_agent](https://twitter.com/syra_agent)  
> <!-- hidden: focus on website - **Telegram**: [t.me/syra_ai](https://t.me/syra_ai) -->
> - **x402 Directory**: Listed at x402scan  
>  
> For technical documentation and API integration, visit our developer portal.

> **💡 For Developers**  
> Test our x402 APIs. No signup required. Just start calling our endpoints and pay only when you exceed the free tier.  
>  
> See the [API reference and x402 overview](https://docs.syraa.fun/docs/api-reference) on docs.syraa.fun.
