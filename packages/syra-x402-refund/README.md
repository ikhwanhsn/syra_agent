<div align="center">

<img src="https://syraa.fun/images/logo.jpg" alt="Syra" width="96" height="96" />

# @syra-ai/x402-refund

**Hosted x402 refund coverage for agent fetch**

Wrap `fetch` · Syra observes the paid call · on-chain USDC refund on failure

[![npm version](https://img.shields.io/npm/v/@syra-ai/x402-refund.svg)](https://www.npmjs.com/package/@syra-ai/x402-refund)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/ikhwanhsn/syra_agent/blob/main/LICENSE)
[![Docs](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun/docs/build/refund)

</div>

---

## Quick start

```bash
npm install @syra-ai/x402-refund
```

```typescript
import { wrapFetchWithSyraRefund } from "@syra-ai/x402-refund";
import { getPaidFetch } from "@syra-ai/sdk/payment";

const paid = await getPaidFetch();
const fetch = wrapFetchWithSyraRefund(paid, {
  refundTo: process.env.AGENT_WALLET,
  payer: paid,
});

const res = await fetch("https://api.example.com/intel");
```

Covered paid calls go through `POST https://api.syraa.fun/refund/relay`. Syra charges a small x402 premium, forwards the upstream payment, and refunds on-chain USDC if the paid call then fails (5xx, timeout, network error).

Status: `GET https://api.syraa.fun/refund/status`  
Claims: `GET https://api.syraa.fun/refund/claims?wallet=`

Hosted coverage is gated (`REFUND_HOSTED_ENABLED`) and allowlisted. Check status before relying on payouts.

## Premium

Per covered call: `max(flat, coveredUsd × bps / 10_000)`, capped. Default flat is $0.002. `$SYRA` holders get the same inbound discount tiers as other Syra x402 routes.

## Related

| Need | Package |
|------|---------|
| Typed Syra client | [`@syra-ai/sdk`](https://www.npmjs.com/package/@syra-ai/sdk) (`import from "@syra-ai/sdk/refund"`) |
| Minimal 402 helper | [`@syra-ai/x402-payer`](https://www.npmjs.com/package/@syra-ai/x402-payer) |
| MCP tools | [`@syra-ai/mcp-server`](https://www.npmjs.com/package/@syra-ai/mcp-server) |

Docs: https://docs.syraa.fun/docs/build/refund
