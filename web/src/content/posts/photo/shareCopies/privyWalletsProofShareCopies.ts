import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Privy wallets proof photo deck. Proof-first, no meta card talk. */
export const PRIVY_WALLETS_PROOF_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Syra agent wallets on Privy are live.

Login creates a ready-to-spend agent address. Custody stays on Privy. Agents pay Syra per call with x402 USDC.

syraa.fun/chat`,

  thesis: `Agents need a wallet before they can pay.

Paid intelligence is useless without an address that can hold USDC. Syra provisions that wallet on Privy so chat, Telegram, and Spend share one custody path.

syraa.fun/chat`,

  quote: `Ready-to-spend wallets beat empty login screens.

Connect once, get an agent address under Privy, fund it, then settle paid calls. The product starts when the wallet exists.

syraa.fun/chat`,

  flow: `The path from login to a paid call is four steps.

1. Connect with Privy on syraa.fun or /start on Telegram
2. Syra provisions the agent wallet under Privy custody
3. Fund USDC into the agent treasury
4. Spend tools settle with x402 from that same address

syraa.fun/chat`,

  timeline: `What the Privy Overview shows through early August.

1. Wallet provisioning scaled across Syra surfaces
2. Assets in wallets ramped from late July
3. Transaction volume spiked in early August
4. The stack stays the same: Privy custody, x402 settlement

syraa.fun/chat`,

  pillars: `Three reasons the wallet stack matters.

Custody runs on Privy so users are not managing raw keys per surface. Chat, Telegram, and Spend share the same agent address path. Settlement stays x402 USDC after the treasury is funded.

syraa.fun/chat`,

  checklist: `What you can do today with a Syra agent wallet.

1. Connect on syraa.fun/chat
2. Open syraa.fun/wallet to see your agent address
3. Fund USDC into the treasury
4. Run a paid Spend call from chat, MCP, or marketplace
5. Use Telegram /start for the same walleted agent in chat

syraa.fun/chat`,

  metrics: `Privy Overview numbers for Syra.

4,333 wallets. 150 users. $501 in assets.

Agent wallets scale faster than human logins because Syra provisions wallets for the product surfaces that need them. Custody stays Privy.

syraa.fun/chat`,

  featured: `4,333 Syra agent wallets on Privy.

That is the headline from the Privy Overview. Users log in. Syra provisions ready-to-spend addresses. Settlement stays x402 USDC once the treasury is funded.

syraa.fun/chat`,

  comparison: `Manual wallet friction vs a Privy-backed agent wallet.

Before, builders juggled separate connect flows and empty addresses before the first paid call. Now login provisions a Syra agent wallet on Privy, you fund once, and Spend settles with x402.

syraa.fun/chat`,

  launch: `Syra × Privy agent wallets are live.

4,333 wallets provisioned. Same custody path for chat, Telegram, and Spend. Fund USDC, then pay per call.

syraa.fun/chat`,

  deepDive: `Where agent wallets show up in the product.

Chat at syraa.fun/chat for connect and paid asks. Telegram /start for a walleted bot session. Wallet page for address and balances. Marketplace and Spend for x402 settlement against the same treasury.

syraa.fun/wallet`,

  split: `Custody and settlement stay in their lanes.

Privy holds the agent wallet. Syra still settles paid intelligence with x402 USDC. Crossmint or manual deposit can fund the address. Neither replaces Privy login or per-call payment.

syraa.fun/chat`,

  terminal: `A real activation path.

Connect with Privy. Agent wallet ready. Fund USDC. First paid Spend call returns 200 with settlement.

syraa.fun/chat`,

  cta: `Get an agent wallet. Then spend.

Connect on chat, fund USDC, and run a paid call. Custody stays Privy. Settlement stays x402.

syraa.fun/chat
syraa.fun/wallet`,
};
