import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Crossmint onramp photo deck. */
export const CROSSMINT_ONRAMP_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Syra x Crossmint: buy USDC (digital dollars) with a card, fund your agent, start in minutes.

Onramp funds the wallet. Agents still pay Syra per call with x402 (you pay only when you call).

syraa.fun/wallet`,

  thesis: `Getting USDC was harder than calling the API.

Crossmint buys USDC with a card and sends it to your Syra agent wallet. Custody stays Privy. Paid calls stay x402.

syraa.fun/wallet`,

  quote: `Card in, USDC on your agent, then pay per call.

Top up the treasury with a card. Agents still micropay Syra APIs in USDC with x402. You are not charging the card for every API call.

syraa.fun/wallet`,

  flow: `From card to first paid call.

1. Open syraa.fun/wallet and pick Spend
2. Buy USDC with card, from $10
3. Refresh. Balance lands on the agent address.
4. Call an API from MCP, SDK, or marketplace

syraa.fun/wallet`,

  timeline: `Funding without a crypto scavenger hunt.

1. Buy USDC CTA on the agent wallet page
2. Server creates a Crossmint order for your address
3. Embedded checkout for card pay and delivery
4. Manual Deposit still works

syraa.fun/wallet`,

  pillars: `Four roles. One clear path.

You fund when you need USDC. Crossmint runs the card onramp. Syra holds the same agent treasury. x402 is how agents pay per API call after that.

syraa.fun/wallet`,

  checklist: `Try it in five steps.

1. Open Spend agent wallet
2. Buy USDC with card ($10+)
3. Or Deposit USDC yourself
4. Refresh balance
5. Run a paid marketplace call

syraa.fun/marketplace`,

  metrics: `Built for activation.

$10+ card pack. 1 tap to Buy USDC. 0 custody rewrite.

Funding is faster, on the same Syra wallet and the same x402 spend path.

syraa.fun/wallet`,

  featured: `Buy USDC lives on /wallet.

Buy USDC with a card sits next to Deposit on the wallet page. One treasury, two ways to fund: card via Crossmint, or send USDC yourself.

syraa.fun/wallet`,

  comparison: `Funding before vs now.

Before: exchange, buy USDC, copy address, wait, then first paid call. Now: buy USDC with a card into the agent wallet, or keep manual Deposit.

syraa.fun/wallet`,

  launch: `Syra x Crossmint is live.

Card to USDC for agent treasuries. Syra keeps x402 merchant APIs.

syraa.fun/wallet`,

  deepDive: `What Crossmint does here.

Fiat onramp into your agent address. Not a new Syra login or custody mode. Not card payment per API call. Per-call spend stays x402 USDC.

docs.syraa.fun/docs/build/crossmint-x402`,

  split: `Cards fund the treasury, then stablecoins spend.

Humans top up with a card when needed. Agents pay Syra APIs with USDC micropayments. Card checkout is for humans, the USDC treasury is for agents, x402 covers every paid call, and Deposit stays open.

syraa.fun/wallet`,

  terminal: `Happy path.

Open syraa.fun/wallet. Buy USDC with card. Checkout, KYC if needed. Refresh USDC balance. Call a paid Spend tool. HTTP 200 returns the intelligence payload.

syraa.fun/wallet`,

  cta: `Fund with a card, then call an API.

Top up once and pay per call after that. Wallet for funding. Marketplace for a first Spend call.

syraa.fun/wallet`,
};
