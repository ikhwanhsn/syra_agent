import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for GoPlausible Solana/Base failover photo deck. */
export const GOPLAUSIBLE_SOLANA_BASE_FAILOVER_PHOTO_SHARE_COPIES: Record<
  PostPhotoCardRole,
  string
> = {
  cover: `This cover announces GoPlausible expanding on Syra beyond Algorand.

Labs x402 now fails over across Dexter, GoPlausible, then PayAI on Solana and Base. Algorand settlement still runs on GoPlausible AVM.

syraa.fun/labs`,

  thesis: `This card names the payment gap Labs was hitting.

Exact SVM needs a funded fee payer. When Dexter is underfunded, Solana and Base accepts used to die or jump straight to PayAI. GoPlausible now sits in the middle so one dry sponsor does not take Labs offline.

syraa.fun/labs`,

  quote: `The line on this card is the failover rule in plain words: check health first, then move to the next rail.

Dexter stays primary when healthy. GoPlausible covers Solana and Base next. PayAI remains last resort. Merchant payTo wallets stay the same, and clients do not send new headers.

syraa.fun/labs`,

  flow: `This image walks the Labs failover path in four steps.

1. Probe Dexter (fee payer or Base /supported)
2. Offer Dexter accepts when that rail is healthy
3. Offer GoPlausible for Solana and Base if Dexter is not
4. Fall through to PayAI so checkout still completes

The rotation happens at offer time. No client changes required.

syraa.fun/labs`,

  timeline: `This timeline shows how GoPlausible grew from Algorand-only into a multi-rail Labs partner.

1. Algorand AVM verify and settle (already live)
2. Solana and Base network profile added
3. Health probes for fee payer and /supported caches
4. Labs offer chain: Dexter, then GoPlausible, then PayAI

syraa.fun/labs`,

  pillars: `This bento layout shows what stays available when Dexter dips.

Solana Exact SVM can use a GoPlausible fee payer for gas. Base Exact USDC continues when Dexter drops Base. Algorand USDC ASA verify and settle stay unchanged. Accepts rotate automatically at offer time.

syraa.fun/labs`,

  checklist: `This checklist is what shipped with the GoPlausible Solana and Base failover.

1. Dexter remains primary for Labs Solana and Base
2. GoPlausible becomes the mid-rail when Dexter is unhealthy
3. PayAI stays last resort
4. Health probes warm at boot
5. Merchant payTo wallets are unchanged

syraa.fun/labs`,

  metrics: `The numbers on this card describe the new Labs facilitator stack.

Three rails can serve a payment: Dexter, GoPlausible, and PayAI. GoPlausible adds two chains for Labs (Solana and Base). Clients still call the same endpoints with zero header changes.

syraa.fun/labs`,

  featured: `This featured card highlights GoPlausible covering three chains under one partner brand.

Algorand keeps AVM settlement. Labs Solana and Base now inherit a second healthy sponsor before PayAI. Live networks are listed at facilitator.goplausible.xyz/supported.`,

  comparison: `This before-and-after card compares two-rail versus three-rail Labs checkout.

Before, an unhealthy Dexter jumped straight to PayAI or failed the accept. Now Labs offers Dexter first, GoPlausible next for Solana and Base, then PayAI. Same merchant wallet, one extra spare rail.

syraa.fun/labs`,

  launch: `This partnership card marks Syra x GoPlausible as live for Labs Solana and Base failover.

Algorand Mainnet still settles through GoPlausible AVM. Labs x402 can now fall through to GoPlausible when Dexter is dry, without client changes.

syraa.fun/labs
facilitator.goplausible.xyz/docs`,

  deepDive: `This deep-dive card lists the technical surface behind the failover image.

goplausibleX402Networks covers Solana and Base. Health checks use the GoPlausible fee payer (env override available) and GET /supported for Base Exact. Settlement stays on the rail that was offered. Local Solana settle remains a last resort.

syraa.fun/labs`,

  split: `This split card explains GoPlausible’s two jobs on Syra.

On Algorand it still verifies and settles via AVM. On Labs Solana and Base it is the mid-rail failover after Dexter and before PayAI. Exact SVM and Exact EVM both keep accepting when the primary rail is unhealthy.

syraa.fun/labs`,

  terminal: `This terminal card shows failover inside a real Labs request path.

A Solana insights call probes Dexter’s fee payer. If it is underfunded, the profile switches to goplausible, returns a 402 Exact SVM with the GoPlausible fee payer, then unlocks the payload after USDC payment.

syraa.fun/labs`,

  cta: `This closing card is the ship summary: one GoPlausible partner across Algorand, Solana, and Base, with Labs failover built in.

Call Labs on Solana or Base and the payment rails choose themselves from the health probes.

syraa.fun/labs
facilitator.goplausible.xyz/supported`,
};
