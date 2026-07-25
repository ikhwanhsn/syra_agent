import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Crossmint onramp photo deck. */
export const CROSSMINT_ONRAMP_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces Syra and Crossmint together for a simple job: buy USDC with a card and fund your agent wallet.

The badge marks onramp, wallet, and x402. You fund once with a card. Agents still pay Syra per API call with USDC.

syraa.fun/wallet`,

  thesis: `This card names the real bottleneck: getting USDC was harder than calling the API.

Crossmint handles card checkout and delivers USDC to your existing Syra agent address. Privy custody stays the same. Syra still settles paid Spend calls with x402.

syraa.fun/wallet`,

  quote: `The line on this card is the product promise: card in, USDC on your agent, then pay per call.

You are not paying for each Syra API with a credit card. You top up the treasury once, then agents micropay in USDC.

syraa.fun/wallet`,

  flow: `This image walks the path from card to first paid call in four steps.

1. Open syraa.fun/wallet and pick your agent treasury
2. Tap Buy USDC with card, enter email and amount from ten dollars
3. Finish Crossmint checkout (KYC if required) and refresh balance
4. Call a paid Spend tool from MCP, SDK, or the marketplace

syraa.fun/wallet`,

  timeline: `This timeline covers what shipped for activation.

1. Buy USDC with card CTA on the agent wallet page
2. Server-side Crossmint order creation for your agent address
3. Embedded checkout for card payment and delivery
4. Manual Deposit kept for people who already hold USDC

syraa.fun/wallet`,

  pillars: `This bento layout shows four simple roles.

You fund. Crossmint runs the card onramp. The Syra agent wallet holds the USDC. x402 is how agents pay per call after that.

syraa.fun/wallet`,

  checklist: `This checklist is what you can do today.

1. Open your Spend agent wallet
2. Buy USDC with card (minimum ten dollars)
3. Or Deposit USDC yourself with zero KYC
4. Refresh balance
5. Run a paid marketplace or MCP call

syraa.fun/marketplace`,

  metrics: `The numbers on this card are about activation, not hype.

Typical card packs start at ten dollars, Buy USDC is one tap on the wallet page, and custody was not rewritten. Crossmint funds the address you already have.

syraa.fun/wallet`,

  featured: `This featured card is the wallet page itself.

syraa.fun/wallet now has Buy USDC with card beside Deposit. Same treasury. Faster funding when you do not already hold USDC.

syraa.fun/wallet`,

  comparison: `This before-and-after card contrasts the old funding step with the new one.

Before, you had to find an exchange, buy USDC, and send it yourself before the first paid call. Now you can buy USDC with a card into the agent wallet, or keep transferring manually if that is easier.

syraa.fun/wallet`,

  launch: `This partnership card marks Syra and Crossmint live for funding.

Crossmint powers card to USDC. Syra keeps the agent wallet and the x402 merchant APIs. One job: get builders to a funded treasury faster.

syraa.fun/wallet`,

  deepDive: `This deep-dive card lists what Crossmint is and is not in Syra.

It is the fiat onramp into your agent address. It is not a replacement for Privy login, not a new custody mode, and not how each API call is charged. Per-call payment stays x402 USDC.

docs.syraa.fun/docs/build/crossmint-x402`,

  split: `This split card separates human funding from agent spending.

Humans can buy USDC with a card when they need to top up. Agents then spend that USDC on Syra APIs with x402. Cards fail for tiny programmatic payments. Stablecoins work.

syraa.fun/wallet`,

  terminal: `This terminal card shows the happy path in plain steps.

Open wallet, buy USDC, refresh balance, call a paid route. If onramp is disabled in your environment, Deposit still works.

syraa.fun/wallet`,

  cta: `This closing card is the ask: fund with a card, then make your first paid call.

Wallet for funding. Marketplace for a first Spend call. Docs if you are paying Syra from a Crossmint Base agent wallet.

syraa.fun/wallet`,
};
