# Cloudflare Agents → Syra x402 (distribution)

Syra remains the **x402 merchant**. A Cloudflare Agent is an optional **payer** on Base USDC (same role as Crossmint in [`CROSSMINT_X402_QUICKSTART.md`](./CROSSMINT_X402_QUICKSTART.md)).

Partner context: [`TRENDING_PARTNER_INTEGRATIONS.md`](./TRENDING_PARTNER_INTEGRATIONS.md).

## Quick path

1. Create a Cloudflare Agents Worker (`agents` package). Store a Base-funded EVM private key in Worker secrets (never in client code).
2. In the Agent, wrap `fetch` with `@x402/fetch` + Exact EVM scheme (Base mainnet).
3. Call `https://api.syraa.fun/news?ticker=BTC` (or any paid Spend route).
4. Confirm HTTP 200 after 402 → sign → retry. Check `X-PAYMENT-RESPONSE` and [syraa.fun](https://syraa.fun) settled metrics.

## Prerequisites

- Base wallet with USDC (and gas)
- Packages: `agents`, `@x402/fetch`, `@x402/core`, `@x402/evm`, `viem`
- Cloudflare docs: [Agentic payments](https://developers.cloudflare.com/agents/tools/payments/) · [Pay from Agents SDK](https://developers.cloudflare.com/agents/agentic-payments/x402/pay-from-agents-sdk/) · [HTTP x402 example](https://github.com/cloudflare/agents/tree/main/examples/x402)

## Copy-paste Agent (HTTP payer)

```typescript
import { Agent, callable } from "agents";
import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

type Env = {
  /** Base EVM private key (Worker secret). Fund with USDC + gas. */
  SYRA_EVM_PAYER_PRIVATE_KEY: string;
};

const SYRA_NEWS = "https://api.syraa.fun/news?ticker=BTC";

export class SyraPayAgent extends Agent<Env> {
  fetchWithPay!: typeof fetch;

  onStart() {
    const raw = this.env.SYRA_EVM_PAYER_PRIVATE_KEY.trim();
    const hex = (raw.startsWith("0x") ? raw : `0x${raw}`) as Hex;
    const account = privateKeyToAccount(hex);
    const scheme = new ExactEvmScheme(account);
    const client = x402Client.fromConfig({
      schemes: [{ network: "eip155:*", client: scheme }],
    });
    this.fetchWithPay = wrapFetchWithPayment(fetch, client);
  }

  @callable()
  async fetchSyraNews() {
    const res = await this.fetchWithPay(SYRA_NEWS, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const body = await res.json();
    return {
      status: res.status,
      paymentResponse: res.headers.get("X-PAYMENT-RESPONSE"),
      body,
    };
  }
}
```

Expected success: HTTP 200 with news JSON after an automatic 402 → sign → retry. If you loop on 402, confirm Base USDC balance and that Syra lists a Base `accept` for the route (`GET https://api.syraa.fun/.well-known/x402`).

## MCP note (secondary)

Cloudflare’s `withX402Client` wraps an **MCP client** for paid tools. Prefer that only when your Worker connects to an HTTP MCP that already fronts Syra. For Cursor / Claude / OpenClaw, keep the default install: `npx -y @syra-ai/mcp-server@latest` with `SYRA_PAYER_KEYPAIR` (Solana) outside Workers. See [docs.syraa.fun/docs/build/mcp](https://docs.syraa.fun/docs/build/mcp).

## Do not

- Wrap Syra behind Cloudflare `paidTool` / Monetization Gateway as a second merchant (double-charge)
- Put Syra settle on Cloudflare facilitators instead of Syra’s Dexter → GoPlausible → PayAI path
- Put private keys in front-end or committed `.env`
- Replace Privy / Syra agent treasury custody

## Related

- Product docs: [Cloudflare Agents → Syra x402](https://docs.syraa.fun/docs/build/cloudflare-agents-x402)
- Crossmint (another Base payer path): [`CROSSMINT_X402_QUICKSTART.md`](./CROSSMINT_X402_QUICKSTART.md)
- GTM: [`AGENT_BUILDER_GTM.md`](./AGENT_BUILDER_GTM.md)
