import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Earn Token SAID Verify photo deck. Proof-first, no meta card talk. */
export const EARN_TOKEN_SAID_VERIFY_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Earn Tokens now get identity verification through SAID Protocol.

Each wallet (the account that holds crypto) can launch only one token. The owner can verify that same wallet on SAID from the token's detail page. Reputation sticks on Solana.

syraa.fun/earn`,

  thesis: `A launch needs trust behind it, not just a mint.

Earn now caps launches at one token per wallet, then lets the owner register that same wallet on SAID Protocol once they are ready to back it with an on-chain identity.

syraa.fun/earn`,

  quote: `Launch once, then verify when you are ready.

Verification is owner-only, costs roughly 0.012 SOL paid from the Earn wallet, and uses the same rails Syra used to hit #1 on SAID. The result is a public profile on saidprotocol.com.

syraa.fun/earn`,

  flow: `Launch, open, verify, then rank.

1. Launch a token on Earn, capped at one per wallet
2. Open that token's detail page. The owner sees Verify on SAID
3. Verify on SAID for roughly 0.012 SOL
4. A badge appears, linked to the SAID profile on saidprotocol.com

syraa.fun/earn`,

  timeline: `Open launches became verified identity.

1. A limit was added that returns 409 on a second launch attempt
2. The Tokens tab now shows View your token once a wallet has hit the cap
3. A new POST /earn/token/:mint/verify-said route was added
4. Verifying calls the SAID SDK and stores a saidVerified badge on the launch record

syraa.fun/earn`,

  pillars: `Four pieces make one Earn identity stack.

Limit means one mint per wallet, enforced by the API. Sign means the Earn wallet's own custodial keypair signs the SAID transaction. SAID means registering and verifying that agent on-chain. Badge means the resulting verified profile is live and linkable.

syraa.fun/earn`,

  checklist: `What is live now for Earn and SAID.

1. Each connected wallet can launch only one Earn token
2. The owner sees a Verify on SAID option from the token's detail page
3. Verifying costs roughly 0.012 SOL, paid from the Earn wallet
4. A verified badge appears once the transaction succeeds
5. The resulting profile is live on saidprotocol.com

syraa.fun/earn`,

  metrics: `Scarcer launches, verifiable trust.

1 token per wallet. About 0.012 SOL to verify. Syra already leads SAID, and Earn tokens reuse that path.

syraa.fun/earn`,

  featured: `SAID is the protocol behind the badge.

SAID Protocol runs on-chain agent identity and verification on Solana. It is now wired into every Earn token owner's detail page.

saidprotocol.com`,

  comparison: `Unlimited launches had no token-level identity.

Before, Earn allowed unlimited launches per wallet with no SAID identity attached. Now each wallet gets one mint, and the owner can verify it on SAID from the detail page, building reputation that can climb SAID's own leaderboard.

syraa.fun/earn`,

  launch: `SAID verification is live for Earn Tokens.

It is the same path Syra used to reach #1 on SAID, now applied to one launch per wallet.

syraa.fun/earn
saidprotocol.com`,

  deepDive: `Verification is wired into Earn and SAID clients.

earnPumpfunService enforces the launch limit and runs verifyEarnTokenOnSaid. saidClient builds the token's AgentCard and handles the register-and-verify call. The route lives at POST /earn/token/:mint/verify-said, gated to the token owner's session. The launch record stores saidVerified alongside the resulting PDA.

syraa.fun/earn`,

  split: `Scarcer mints, then verifiable agents.

Creators get one serious launch instead of spamming mints. Trust is something they add later, by verifying that same wallet on SAID when ready. Repeat launches return API 409. The Earn keypair signs SAID transactions. The verify fee is about 0.012 SOL. The badge links the SAID profile.

syraa.fun/earn`,

  terminal: `Verification in a real request path.

POST /earn/token/:mint/verify-said resolves the Earn wallet, checks that the caller owns it, loads its keypair, and runs the SAID SDK's register and verify calls. The result is persisted as saidVerified on the launch record, with a badge linking out to the wallet's SAID profile.

syraa.fun/earn`,

  cta: `Launch once, then verify on SAID.

Open Earn Tokens, ship a mint, and verify it from the detail page whenever you are ready.

syraa.fun/earn
saidprotocol.com
saidprotocol.com/agents/53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t`,
};
