import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for GoPlausible Solana/Base failover photo deck. */
export const GOPLAUSIBLE_SOLANA_BASE_FAILOVER_PHOTO_SHARE_COPIES: Record<
  PostPhotoCardRole,
  string
> = {
  cover: `GoPlausible x Syra now covers Labs failover, not only Algorand.

Labs x402 (pay only when you call) fails over Dexter, then GoPlausible, then PayAI on Solana and Base. Algorand still settles (the payment actually completes) on AVM.

syraa.fun/labs`,

  thesis: `One dry fee payer should not kill Labs.

Exact SVM needs a funded sponsor. When Dexter is underfunded, GoPlausible now takes Solana and Base before PayAI so checkout keeps working.

syraa.fun/labs`,

  quote: `Use the healthy rail first, then the next one.

Dexter stays primary when it is healthy. GoPlausible covers Solana and Base next. PayAI remains last resort. Same merchant payTo. Zero client changes.

syraa.fun/labs`,

  flow: `Probe the rail, offer it if healthy, then fall through.

1. Probe Dexter (fee payer or Base /supported)
2. Offer Dexter when that rail is healthy
3. Offer GoPlausible for Solana and Base if Dexter is not
4. Fall through to PayAI so checkout still completes

Rotation happens at offer time. Clients do not send new headers.

syraa.fun/labs`,

  timeline: `From Algorand-only to multi-rail Labs checkout.

1. Algorand AVM verify and settle already live via GoPlausible
2. Solana plus Base network profile added
3. Health probes for fee payer and /supported caches
4. Labs offer chain: Dexter, then GoPlausible, then PayAI

syraa.fun/labs`,

  pillars: `What stays up when Dexter dips.

Solana Exact SVM can use a GoPlausible fee payer to sponsor gas. Base Exact USDC (digital dollars) continues when Dexter drops Base (eip155:8453). Algorand USDC ASA verify and settle stay unchanged. Accepts rotate automatically at offer time.

syraa.fun/labs`,

  checklist: `What ships with this update.

1. Dexter remains primary for Labs Solana and Base
2. GoPlausible becomes the mid-rail when Dexter is unhealthy
3. PayAI stays last resort
4. Health probes warm at boot
5. Merchant payTo wallets are unchanged

syraa.fun/labs`,

  metrics: `Uptime is a payment feature.

3 facilitator rails. 2 new GoPlausible chains. 0 client changes.

Labs keeps accepting Solana and Base payments when Dexter is dry.

syraa.fun/labs`,

  featured: `GoPlausible beyond Algorand.

3 chains on one partner: Algorand AVM, plus Solana and Base Exact. One facilitator brand. Broader Syra rails.

facilitator.goplausible.xyz/supported`,

  comparison: `Two-rail vs three-rail Labs checkout.

Before, an unhealthy Dexter jumped straight to PayAI or failed. Now Labs offers Dexter first, GoPlausible next for Solana and Base, then PayAI. Same merchant wallet. A spare tire for those two chains.

syraa.fun/labs`,

  launch: `Syra x GoPlausible is live for Labs Solana and Base failover.

Algorand still settles through GoPlausible AVM. Labs x402 can fall through to GoPlausible when Dexter is dry, without client changes.

syraa.fun/labs
facilitator.goplausible.xyz/docs`,

  deepDive: `Offer-time only, by design.

goplausibleX402Networks covers Solana and Base. Health checks use the GoPlausible fee payer 8a8fFNfk… (env override available) and GET /supported for Base Exact. Settlement stays on the rail that was offered. Local Solana settle remains last resort.

syraa.fun/labs`,

  split: `GoPlausible does two jobs on Syra.

On Algorand, GoPlausible still verifies and settles via AVM. On Labs Solana and Base it is the mid-rail after Dexter and before PayAI. Exact SVM and Exact EVM keep accepting when the primary rail is unhealthy.

syraa.fun/labs`,

  terminal: `Failover sits in the request path.

A Solana Labs insights call with x-lab-x402-chain=solana probes Dexter. If the fee payer is underfunded, the profile switches to goplausible, returns 402 Exact SVM with the GoPlausible fee payer, then unlocks the payload after USDC payment.

syraa.fun/labs`,

  cta: `GoPlausible now spans Algorand, Solana, and Base, with Labs failover built in.

Hit Labs on Solana or Base and the payment rails choose themselves from health probes.

syraa.fun/labs
facilitator.goplausible.xyz/supported`,
};
