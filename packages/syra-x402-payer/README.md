# @syra-ai/x402-payer

MIT-licensed x402 v2 HTTP payment helper — Syra's open-source top-of-funnel (inspired by BlockRun's ClawRouter playbook).

## Install

```bash
npm install @syra-ai/x402-payer
```

## Usage

```typescript
import { fetchWithX402Payment, microUsdcToUsd } from "@syra-ai/x402-payer";

const result = await fetchWithX402Payment(
  "https://api.syraa.fun/signal?token=solana",
  { method: "GET", headers: { Accept: "application/json" } },
  {
  async signPayment(requirement) {
    // Wire to @x402/svm, @x402/evm, or your wallet — return PAYMENT-SIGNATURE value
    const amountUsd = microUsdcToUsd(requirement.amount);
    console.log("Paying", amountUsd, "USDC on", requirement.network);
    return "..."; // signed payment header
  },
  },
);

if (result.ok) console.log(result.data);
```

## Safe retry

Responses containing **"Payment was NOT charged"** are treated as safe to retry (no double-billing).

## Links

- Syra API: https://api.syraa.fun
- Discovery: https://api.syraa.fun/.well-known/x402
- Full agent docs: https://api.syraa.fun/llms-full.txt
- SDK: `@syra-ai/sdk`
- MCP: `npx -y @syra-ai/mcp-server`
