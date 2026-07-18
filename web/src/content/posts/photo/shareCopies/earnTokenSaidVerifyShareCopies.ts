import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Earn Token SAID Verify photo deck. 15 distinct topics. */
export const EARN_TOKEN_SAID_VERIFY_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Earn Tokens × SAID Protocol.

One launch per wallet.
Then Verify on SAID from token detail.

Same trust rails Syra used to hit #1.

Try it → syraa.fun/earn`,

  thesis: `Launches need trust, not just a mint.

Earn now caps one token per wallet, then lets owners register that earn wallet on SAID Protocol.

Scarcer. Verifiable. On-chain.`,

  quote: `"Launch once. Verify when ready."

Owner-only Verify on SAID.
~0.012 SOL from the Earn wallet.
Profile on saidprotocol.com.`,

  flow: `Earn token identity loop:

1. Launch on Earn (one per wallet)
2. Open your token detail page
3. Verify on SAID (~0.012 SOL)
4. Badge + profile on saidprotocol.com

Same register + verify path Syra ships.`,

  timeline: `What shipped:

→ One token per earnAnonymousId (API 409)
→ Tokens tab: View your token when capped
→ POST /earn/token/:mint/verify-said
→ said-sdk register + verify via earn keypair
→ Verified badge → SAID profile link`,

  pillars: `4 layers. One Earn identity stack:

→ LIMIT: one mint per wallet
→ SIGN: earn custodial keypair
→ SAID: registerAgent + verifyAgent
→ BADGE: on-chain verified profile`,

  checklist: `Earn × SAID is live:

→ One token per connected wallet
→ Owner Verify on SAID on detail
→ ~0.012 SOL from Earn wallet
→ Verified badge after success
→ Profile on saidprotocol.com

Open → syraa.fun/earn`,

  metrics: `By the numbers:

→ 1 token per wallet
→ ~0.012 SOL to verify
→ Same SAID stack as Syra #1*

*Syra already leads SAID reputation.`,

  featured: `The protocol behind the badge:

SAID Protocol on Solana.

On-chain agent identity + verified badge.
Now wired to every Earn token owner.`,

  comparison: `Before: unlimited Earn launches. No token-level SAID identity.

Now: one mint per wallet.
Owner Verify on SAID from detail.
Reputation that can climb the leaderboard.`,

  launch: `SHIP LOG · Earn Tokens get SAID verify.

One launch. One identity.
Syra's #1 path, applied to your token.

→ syraa.fun/earn
→ saidprotocol.com`,

  deepDive: `Technical surface:

→ earnPumpfunService: launch limit + verifyEarnTokenOnSaid
→ saidClient: buildTokenAgentCard + registerAndVerifyAgentCard
→ POST /earn/token/:mint/verify-said (owner session)
→ EarnPumpfunLaunch stores saidVerified + PDA
→ Privy earn wallets: clear signer unavailable error`,

  split: `Two moves. One cleaner Earn surface:

CREATORS: one serious launch, not spam
TRUST: Verify on SAID when you are ready

Scarcer mints. Verifiable agents.`,

  terminal: `Verify from the stack:

$ POST /earn/token/:mint/verify-said
> resolve earn wallet · owner check
> getSolanaAgentKeypair(earn)
> said-sdk registerAgent + verifyAgent
> persist saidVerified on launch
< badge → saidprotocol.com/agents/:wallet`,

  cta: `Ready to launch once and verify?

Earn Tokens → syraa.fun/earn
SAID → saidprotocol.com
Syra profile → saidprotocol.com/agents`,
};
