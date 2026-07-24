import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Algorand x402 photo deck: 15 distinct topics. */
export const ALGORAND_X402_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces that Syra's pay-per-call intelligence APIs now settle USDC natively on Algorand Mainnet.

GoPlausible verifies and settles the payment, so an Algorand treasury never has to bridge to another chain just to pay for data. The badge on this card marks it as AVM, USDC, and Mainnet, all live.

syraa.fun/playground`,

  thesis: `This card names the gap Algorand builders were hitting before this update: paying for intelligence meant bridging off Algorand.

Syra agents already settled on Solana, PayAI's EVM chains, and BSC. Algorand needed the same native x402 path, with USDC ASA as the asset and GoPlausible handling verify and settle.

syraa.fun/playground`,

  quote: `The line on this card is the point of the whole release: settle where your treasury lives, including Algorand.

Solana, PayAI's EVM chains, BSC B402, and Algorand Mainnet all sit inside the same x402 v2 surface now, so a builder pays with whatever wallet they already run.

syraa.fun/playground`,

  flow: `This image walks the Algorand payment path in four steps.

1. Call any paid Syra API
2. Get a 402 that lists an Algorand accept alongside USDC ASA 31566704
3. Sign the ASA transfer, with GoPlausible's fee payer covering the ALGO fee
4. GoPlausible verifies the genesis hash, settles, and the payload unlocks

syraa.fun/playground`,

  timeline: `This timeline covers how the Algorand integration went from config to a proven mainnet payment.

1. AVM resource server built on x402-avm/core plus a GoPlausible facilitator client
2. 402 middleware updated so every paid response appends an Algorand accept
3. Agent client shipped with a mainnet Algod configuration fix
4. Full loop validated end to end: 402, pay, verify_ok, then 200 on GET /news

syraa.fun/playground`,

  pillars: `This bento layout breaks down the four pieces of the Algorand checkout stack.

The network card confirms Algorand Mainnet with its genesis hash verified. USDC ASA 31566704 is the asset, using the exact scheme with 6-decimal micropayments. GoPlausible is the facilitator, handling verify, settle, and fee payer sponsorship. The fourth card ties it to the Global x402 Challenge, where mainnet volume counts toward the leaderboard.

syraa.fun/playground`,

  checklist: `This checklist is what shipped with Algorand support.

1. Every paid Syra API now includes an algorand accept
2. USDC ASA 31566704 settles on Algorand Mainnet
3. GoPlausible's fee payer is included in the payment extra field
4. GET /x402/capabilities reports algorand as enabled
5. The validate-algorand-x402 npm script proves the full paid loop end to end

syraa.fun/playground`,

  metrics: `The numbers on this card are the mainnet proof for Algorand support.

A 402 Payment Required response uses the AVM exact scheme, and the loop ends in a 200 on the paid resource. Capabilities, the 402 offer, the signed USDC transfer, GoPlausible's verify step, and delivery of the resource have all been validated together.

syraa.fun/playground`,

  featured: `This featured card is the end-to-end confirmation on Algorand Mainnet.

A paid GET /news call returned 200 after the genesis hash matched and GoPlausible's fee payer signed the transaction. The response carried a Payment-Response header, which is what the Global x402 Challenge checks for.

syraa.fun/playground`,

  comparison: `This before-and-after card compares bridging off Algorand with paying natively.

Before, Algorand agents either bridged to another chain or skipped Syra's paid APIs, since there was no native AVM x402 path. Now a 402 response accepts USDC ASA on mainnet, GoPlausible settles it, and the agent never leaves Algorand.

syraa.fun/playground`,

  launch: `This partnership card marks x402 on Algorand Mainnet as live.

Syra and GoPlausible now support USDC payments on every paid intelligence API, built with the Global x402 Challenge in mind.

syraa.fun/playground
algorand.co/global-x402-challenge`,

  deepDive: `This deep-dive card lists the technical surface behind Algorand support.

algorandX402Networks.js holds the CAIP-2 network and USDC ASA config. x402AvmResourceServer.js wraps a GoPlausible facilitator singleton. x402PaymentV2.js routes verify and settle calls for the algorand network. agentAvmX402Client.js carries the mainnet Algod client fix, and a network field on PaidApiCall tracks volume for challenge reporting.

facilitator.goplausible.xyz/docs`,

  split: `This split card lays out the four payment rails a Syra caller can choose from.

Solana covers agent wallet auto-pay. PayAI's EVM chains cover eight mainnets. BSC runs its own B402 lane for USD1 and USDC. Algorand settles through GoPlausible with USDC ASA. Every paid endpoint advertises all four, and the client picks whichever matches its treasury.

syraa.fun/playground`,

  terminal: `This terminal card shows the Algorand path inside a real request.

Checking capabilities returns algorand enabled as true. A paid news call comes back 402 with an Algorand accept, and running the validate-algorand-x402 script completes the loop with a 200 and a Payment-Response header.

syraa.fun/playground`,

  cta: `This closing card is the summary for Algorand-native agents: the payment rail is live, and it is the same Syra brain on the other side.

Hit a paid endpoint, pay USDC on Algorand Mainnet, and the intelligence unlocks.

syraa.fun/playground
algorand.co/global-x402-challenge`,
};
