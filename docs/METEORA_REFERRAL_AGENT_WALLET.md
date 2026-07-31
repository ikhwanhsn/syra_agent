# Meteora Referral: Agent Wallet Attribution (Deferred)

Status: **deferred** after spike (2026-07-31).

## Goal

Attribute Syra automated LP agent wallets (`purpose: lp`) to referral code `VUDCXUSRXA` so Earn Yield / LP Real fees count toward Syra's Meteora Referral Staking rewards.

## Spike findings

| Source | Result |
|--------|--------|
| [`@meteora-ag/referral`](https://www.npmjs.com/package/@meteora-ag/referral) v0.0.4 | Program ID `refnrNncADccJPZEB5hHuiFVb3trY5LH39ykwMD59Ht`. Public methods: staking/escrow only (`initializeEscrow`, `stake`, `unstake`, …). **No `linkReferral` / `setReferrer` instruction.** |
| [Meteora Referral Staking docs / app](https://www.meteora.ag/referral) | Referred users link a code in the web UI after connecting a wallet. Attribution is wallet-based, not per-position. |
| DLMM SDK | Positions support `feeOwner` / `operator`, not referral codes. Referral Staking is a separate incentive layer. |

Conclusion: automated broker-signed linking is **not viable with public tooling**. Do not ship a fragile reverse-engineered instruction without an official IDL method.

## What ships instead (human path)

- Shared helpers: `api/libs/meteoraReferral.js`, `web/src/lib/meteoraReferral.ts`
- Deep links append `?ref=CODE` (best-effort)
- In-app `MeteoraReferralPanel` + Invest Meteora "Link referral" CTA → `https://www.meteora.ag/ref/VUDCXUSRXA`

## Manual runbook (treasury / shared LP wallet only)

Use this only for wallets you control and can connect in a browser (not for every per-user `AgentWallet`).

1. Confirm MET is staked under code `VUDCXUSRXA` at [meteora.ag/referral](https://www.meteora.ag/referral) (min 200 MET; earnings cap = 0.1 USDC per MET per cycle).
2. Export or access the LP wallet pubkey you want attributed (e.g. treasury LP, not user custodies).
3. Open `https://www.meteora.ag/ref/VUDCXUSRXA` in a browser.
4. Connect that wallet and complete the "link referral code" / verify flow when prompted.
5. Deploy liquidity only into **eligible** DLMM pools (SOL or USDC quote). Blacklisted / wash / DAMM v2 / limit-order-only positions do not earn referral rewards.
6. Track referrer USDC rewards on the Meteora referral dashboard; do not assume uncapped take rate.

## Revisit triggers

- Meteora publishes a `linkReferral` (or equivalent) instruction in `@meteora-ag/referral` or public IDL
- Official partner API for attributing server wallets
- Product decision to stop automated LP and only deep-link humans (then this runbook is N/A)

## Do not

- Scrape or forge unsigned UI RPC calls into production broker tools
- Auto-link per-user Privy/legacy LP wallets without user consent and a supported instruction
- Promise uncapped fees in marketing copy (cap is stake-bound)
