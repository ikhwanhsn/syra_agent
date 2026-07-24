import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Earn Token SAID Verify photo deck. 15 distinct topics. */
export const EARN_TOKEN_SAID_VERIFY_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces Earn Tokens getting identity verification through SAID Protocol.

Each wallet can now launch only one token, and the owner can verify that same wallet on SAID directly from the token's detail page.

syraa.fun/earn`,

  thesis: `This card names why the limit exists.

A launch needs trust behind it, not just a mint. Earn now caps launches at one token per wallet, then lets the owner register that same wallet on SAID Protocol once they are ready to back it with an on-chain identity.

syraa.fun/earn`,

  quote: `The line on this card is the rule in plain words: launch once, verify when ready.

Verification is owner-only, costs roughly 0.012 SOL paid from the Earn wallet, and the result is a public profile on saidprotocol.com.

syraa.fun/earn`,

  flow: `This image walks the identity loop in four steps.

1. Launch a token on Earn, capped at one per wallet
2. Open that token's detail page
3. Verify on SAID for roughly 0.012 SOL
4. A badge appears, linked to the SAID profile

syraa.fun/earn`,

  timeline: `This timeline shows how the feature shipped.

1. A limit was added that returns 409 on a second launch attempt
2. The Tokens tab now shows View your token once a wallet has hit the cap
3. A new POST /earn/token/:mint/verify-said route was added
4. Verifying calls the SAID SDK and stores a saidVerified badge on the launch record

syraa.fun/earn`,

  pillars: `This bento layout breaks the identity stack into four pieces.

Limit means one mint per wallet, enforced by the API. Sign means the Earn wallet's own custodial keypair signs the SAID transaction. SAID means registering and verifying that agent on-chain. Badge means the resulting verified profile is live and linkable.

syraa.fun/earn`,

  checklist: `This checklist is what is live now.

1. Each connected wallet can launch only one Earn token
2. The owner sees a Verify on SAID option from the token's detail page
3. Verifying costs roughly 0.012 SOL, paid from the Earn wallet
4. A verified badge appears once the transaction succeeds
5. The resulting profile is live on saidprotocol.com

syraa.fun/earn`,

  metrics: `The numbers on this card describe the setup.

One token is allowed per wallet, verification costs roughly 0.012 SOL, and it reuses the same SAID registration path Syra's own agent already used to reach the top of that leaderboard.

syraa.fun/earn`,

  featured: `This featured card is about the protocol behind the badge.

SAID Protocol runs on-chain agent identity and verification on Solana, and it is now wired into every Earn token owner's detail page.

saidprotocol.com`,

  comparison: `This before-and-after card compares open launches to verified ones.

Before, Earn allowed unlimited launches per wallet with no token-level identity attached. Now, each wallet gets one mint, and the owner can verify it on SAID directly from the detail page, building reputation that can climb SAID's own leaderboard.

syraa.fun/earn`,

  launch: `This launch card marks SAID verification going live for Earn Tokens.

It is the same path Syra used to reach #1 on SAID, now applied to one launch per wallet.

syraa.fun/earn
saidprotocol.com`,

  deepDive: `This deep-dive card lists the technical surface behind verification.

earnPumpfunService enforces the launch limit and runs verifyEarnTokenOnSaid, saidClient builds the token's AgentCard and handles the register-and-verify call, and the route lives at POST /earn/token/:mint/verify-said, gated to the token owner's session. The launch record stores saidVerified alongside the resulting PDA.

syraa.fun/earn`,

  split: `This split card explains the two effects of this change.

Creators get pushed toward one serious launch instead of spamming mints. Trust becomes something they can add later, by verifying that same wallet on SAID whenever they are ready.

syraa.fun/earn`,

  terminal: `This terminal card shows verification in a real request path.

A call to POST /earn/token/:mint/verify-said resolves the Earn wallet, checks that the caller owns it, loads its keypair, and runs the SAID SDK's register and verify calls. The result gets persisted as saidVerified on the launch record, with a badge linking out to the wallet's SAID profile.

syraa.fun/earn`,

  cta: `This closing card is the ship summary: launch once, then verify on SAID.

Open Earn Tokens, ship a mint, and verify it from the detail page whenever you are ready.

syraa.fun/earn
saidprotocol.com
saidprotocol.com/agents/53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t`,
};
