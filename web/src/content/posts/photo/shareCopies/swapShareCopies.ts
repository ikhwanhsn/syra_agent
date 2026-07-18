import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Jupiter Swap photo deck - 15 distinct voices. */
export const SWAP_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Syra just shipped Jupiter Swap.

Earn in the navbar: Staking + Swap. Connect your wallet, pick tokens, review the quote, sign once.

Best routes via Jupiter. Non-custodial.

→ syraa.fun/swap`,

  thesis: `How many tabs between reading a Syra signal and actually buying the token?

We closed the loop. Same connected wallet. Jupiter routing. Premium swap UI on /swap.

Research to execution in one session.`,

  quote: `"Research on Syra. Swap on Syra. Same wallet."

Assets → conviction → Earn → Swap. No app hopping.

Try → syraa.fun/swap`,

  flow: `Swap in four steps:

1. Earn → Swap (or syraa.fun/swap)
2. Pick input + output tokens
3. Review live Jupiter quote + slippage
4. Sign in wallet → tx on chain

That is the whole flow.`,

  timeline: `What shipped in Jupiter Swap:

→ Earn nav: Staking + Swap dropdown
→ /jupiter/ui quote · swap · tokens API
→ Debounced quotes + slippage settings
→ Token search with verified presets
→ Client-side sign via connected wallet
→ Instant success after broadcast`,

  pillars: `Four layers. One swap card:

→ Quote adapter with Syra referral fee
→ Token search (Jupiter Tokens V2)
→ Slippage + live quote refresh
→ Sign → broadcast → Solscan link

Built for production wallets.`,

  checklist: `Jupiter Swap is live now:

→ Earn nav groups Staking + Swap
→ Any Solana token via Jupiter routes
→ Balances + Max preset on input
→ Quote details: impact, route, fees
→ Non-custodial: Phantom, Privy, Solflare, Backpack

Open → syraa.fun/swap`,

  metrics: `One session. Full loop:

→ 1 connected wallet
→ 3 free UI routes
→ 0 custodial keys

Read intelligence. Execute in the same session.`,

  featured: `Sign once. Broadcast immediately.

UI confirms on sendRawTransaction. No spinner waiting on RPC confirmation. Track finality on Solscan.

Swap → syraa.fun/swap`,

  comparison: `Before:
Research on Syra. Swap somewhere else. Reconnect wallet. Lose context.

Now:
Earn → Swap on Syra. Same wallet. Jupiter prices. One dashboard.`,

  launch: `SHIP LOG · Syra �- Jupiter Swap is live.

Earn nav · wallet-signed swaps · referral adapter on Syra API.

Try it → syraa.fun/swap`,

  deepDive: `Builder surface:

→ GET /jupiter/ui/quote: Jupiter quote + referral feeAccount
→ POST /jupiter/ui/swap: build serialized swap tx
→ GET /jupiter/ui/tokens: search + verified bootstrap
→ Client signs VersionedTransaction, sends via RPC fallback`,

  split: `Two earn actions. One menu.

→ Staking locks for yield
→ Jupiter Swap for execution

Both under Earn in the navbar. Pick the action, not the app.`,

  terminal: `Pull a quote from the API:

$ curl syraa.fun/jupiter/ui/quote?inputMint=So11...&outputMint=EPjF...&amount=1000000
> inAmount · outAmount · priceImpactPct
> platformFeeBps · feeAccount (referral)
< 200 ok · free route`,

  cta: `Swap any Solana token on Syra.

Earn → Swap. Connect wallet. Jupiter routes. You sign.

→ syraa.fun/swap
→ syraa.fun/staking`,
};
