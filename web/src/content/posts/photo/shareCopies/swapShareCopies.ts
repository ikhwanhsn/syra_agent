import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Jupiter Swap photo deck. Proof-first, no meta card talk. */
export const SWAP_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Jupiter Swap is live under Earn on Syra.

You swap at Jupiter prices from the wallet you already connected (the account that holds your crypto). Syra never holds your keys. Staking and Swap now sit together in the navbar.

syraa.fun/swap`,

  thesis: `Research without a way to act is only half a product.

Syra already surfaces intelligence, agents, and portfolio context, but traders still left the site to swap. Jupiter Swap closes that loop on /swap with the same connected wallet.

syraa.fun/swap`,

  quote: `Research on Syra, then swap on Syra.

Same connected wallet from reading a signal to placing a trade. Jupiter finds the route. Syra's quote adapter and swap UI handle the interface. No custodial keys.

syraa.fun/swap`,

  flow: `A swap goes from quote to chain in four steps.

1. Open Swap from Earn or go to syraa.fun/swap, then connect a wallet
2. Search verified tokens, using balances and the Max preset on the input
3. Review the live Jupiter quote, including slippage and route details
4. Sign in the wallet. The transaction broadcasts with a Solscan link

syraa.fun/swap`,

  timeline: `The full swap stack shipped in one pass.

1. Earn nav: a dropdown groups Staking and Swap
2. Jupiter UI API: quote, swap build, and token search on /jupiter/ui
3. Swap UI: debounced quotes, slippage settings, and a token picker
4. Wallet execute: you sign on the client, Syra sends via RPC, and a referral fee applies when set

syraa.fun/swap`,

  pillars: `Four layers make one swap.

Quote is a Jupiter adapter. Syra's API proxies the quote and a referral fee account. Token search uses Jupiter Tokens V2 with lazy scroll and verified presets. Settings cover slippage in basis points, preset or custom, with the quote auto-refreshing. Execution stays in your wallet: you sign a VersionedTransaction and it broadcasts immediately.

syraa.fun/swap`,

  checklist: `Jupiter Swap is live now.

1. Earn nav groups Staking and Swap
2. Any Solana token can be swapped through Jupiter's routes
3. Balances, a Max preset, and full quote details show before you sign
4. Phantom, Privy, Solflare, and Backpack can all sign the transaction

syraa.fun/swap`,

  metrics: `One session covers the full loop.

1 connected wallet. 3 free UI routes. 0 custodial keys.

Read the intelligence, then swap in place, all under the same wallet.

syraa.fun/swap`,

  featured: `Sign once, then submit fast.

The UI marks success as soon as sendRawTransaction broadcasts. Confirmation runs in the background. A Solscan link is there when you want to check finality.

syraa.fun/swap`,

  comparison: `Research used to stop at the edge of the product.

Before, you researched on Syra, swapped on a separate DEX, reconnected a wallet, and lost session context. Now Earn leads to Swap on Syra, at Jupiter prices, with the same wallet from signal to execution.

syraa.fun/swap`,

  launch: `Syra and Jupiter are live together.

Best-route swaps run from your connected wallet. A referral fee adapter sits on Syra's own API.

syraa.fun/swap`,

  deepDive: `Builders get a Swap UI API.

GET /jupiter/ui/quote takes inputMint, outputMint, amount, and slippageBps. POST /jupiter/ui/swap takes a quoteResponse and userPublicKey and returns a swap transaction. GET /jupiter/ui/tokens covers search plus a verified bootstrap list. The client signs and calls sendRawTransaction, with an RPC fallback if the first send fails.

syraa.fun/swap`,

  split: `Earn now groups two actions: stake for yield, swap for execution.

The navbar Earn dropdown puts Streamflow staking locks and Jupiter swap in one place. Staking lives at /staking. Swap lives at /swap. The dashboard also has a quick action to Swap. Both UIs call free /jupiter/ui routes.

syraa.fun/staking`,

  terminal: `Pull a quote from the API, then build the swap.

GET /jupiter/ui/quote with an input mint and amount returns out amount, price impact, and route plan, plus platform fee and referral fee account. POST /jupiter/ui/swap returns a base64 swap transaction and a last valid block height. Both are free UI routes.

syraa.fun/swap`,

  cta: `Swap any Solana token on Syra.

Open Swap from Earn, connect your wallet, review the quote, and sign once.

syraa.fun/swap
syraa.fun/staking
syraa.fun/overview`,
};
