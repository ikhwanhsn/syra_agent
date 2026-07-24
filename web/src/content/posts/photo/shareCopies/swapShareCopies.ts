import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Jupiter Swap photo deck - 15 distinct voices. */
export const SWAP_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces that Syra shipped Jupiter Swap under the Earn menu.

The badge marks it as Earn, Jupiter, and non-custodial. Staking and Swap now sit together in the navbar, and swaps execute at Jupiter's prices, signed by the wallet you already connected.

syraa.fun/swap`,

  thesis: `This card names the gap Jupiter Swap closes: research without a way to act on it is only half a product.

Syra already surfaces intelligence, agents, and portfolio context, but traders still had to leave to actually swap. The new /swap page uses the same connected wallet, so research and execution happen in one session.

syraa.fun/swap`,

  quote: `The line on this card is short on purpose: research on Syra, swap on Syra.

Same connected wallet the whole way from reading a signal to placing a trade. Jupiter handles routing, Syra's quote adapter and swap UI handle the interface, and no custodial keys are involved.

syraa.fun/swap`,

  flow: `This image walks a swap from quote to confirmed transaction in four steps.

1. Open Swap from Earn or go straight to syraa.fun/swap, then connect a wallet
2. Search for the input and output tokens, using balances and the Max preset
3. Review the live Jupiter quote, including slippage and route details
4. Sign in the wallet, and the transaction broadcasts with a Solscan link

syraa.fun/swap`,

  timeline: `This timeline covers what shipped to build the full swap stack.

1. Earn nav updated with a dropdown grouping Staking and Swap
2. Jupiter UI API added, covering quote, swap build, and token search under /jupiter/ui
3. Swap card UI built with debounced quotes, slippage settings, and a token picker
4. Wallet execution wired up, with client-side signing, RPC send, and a referral fee when set

syraa.fun/swap`,

  pillars: `This bento layout breaks the swap card into four working parts.

The quote layer is a Jupiter adapter, with Syra's API proxying the quote and a referral fee account. Token search uses Jupiter's Tokens V2 with lazy scroll and verified presets. Settings cover slippage in basis points, either preset or custom, with the quote auto-refreshing. Execution happens in your own wallet, signing a VersionedTransaction and broadcasting immediately.

syraa.fun/swap`,

  checklist: `This checklist is what Jupiter Swap shipped with.

1. The Earn nav groups Staking and Swap together
2. Any Solana token can be swapped through Jupiter's routes
3. Balances, a Max preset, and full quote details are shown before signing
4. Phantom, Privy, Solflare, and Backpack can all sign the transaction

syraa.fun/swap`,

  metrics: `The numbers on this card describe the whole session in one glance.

One connected wallet covers everything. Three free UI routes power the swap card. Zero custodial keys are ever held by Syra. Read the intelligence, then swap in place, all under the same wallet.

syraa.fun/swap`,

  featured: `This featured card is about how fast the swap feels after signing.

The UI confirms success as soon as the transaction is broadcast with sendRawTransaction, instead of waiting on RPC confirmation. A Solscan link is provided to track finality afterward.

syraa.fun/swap`,

  comparison: `This before-and-after card compares the old workflow with the new one.

Before, research happened on Syra but swapping happened on a separate DEX, which meant reconnecting a wallet and losing session context. Now Earn leads straight to Swap, using Jupiter's prices and the same wallet from signal to execution.

syraa.fun/swap`,

  launch: `This partnership card marks Syra and Jupiter as live together.

Best-route swaps execute from your connected wallet, with a referral fee adapter running on Syra's own API.

syraa.fun/swap`,

  deepDive: `This deep-dive card lists the Jupiter Swap API for builders.

GET /jupiter/ui/quote takes inputMint, outputMint, amount, and slippageBps. POST /jupiter/ui/swap takes a quoteResponse and userPublicKey and returns a swap transaction. GET /jupiter/ui/tokens covers search plus a verified bootstrap list. The client signs and calls sendRawTransaction, with an RPC fallback if the first attempt fails.

syraa.fun/swap`,

  split: `This split card explains the two actions grouped under Earn.

Staking locks tokens for yield at /staking. Jupiter Swap handles execution at /swap. Both live under the same Earn dropdown, plus a quick action from the dashboard, and both call free /jupiter/ui routes behind the scenes.

syraa.fun/staking`,

  terminal: `This terminal card shows a real quote pulled from the API.

Calling /jupiter/ui/quote with an input mint and amount returns the out amount, price impact, and route plan, along with the platform fee and referral fee account. Posting to /jupiter/ui/swap returns a base64 swap transaction and a last valid block height, all on a free UI route.

syraa.fun/swap`,

  cta: `This closing card is the summary: swap any Solana token on Syra.

Go from Earn to Swap, connect your wallet, review the quote, and sign once.

syraa.fun/swap
syraa.fun/staking
syraa.fun/overview`,
};
