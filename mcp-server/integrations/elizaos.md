# Syra MCP — ElizaOS / agent framework integration

Add Syra machine money tools (x402 APIs, wallets, treasury) to any ElizaOS agent via HTTP tools or subprocess MCP.

## Option A: MCP subprocess (recommended)

Configure your Eliza character to spawn the Syra MCP server:

```json
{
  "mcp": {
    "servers": {
      "syra": {
        "command": "npx",
        "args": ["-y", "@syra-ai/mcp-server"],
        "env": {
          "SYRA_API_BASE_URL": "https://api.syraa.fun"
        }
      }
    }
  }
}
```

## Option B: @syra-ai/sdk in a custom plugin

```typescript
import { createSyraClient, SYRA_HIGH_VALUE_ROUTES } from "@syra-ai/sdk";

const syra = createSyraClient({ baseUrl: "https://api.syraa.fun", signer: agentSigner });

export async function syraSentimentAction(_runtime, message) {
  const res = await syra.get(
    SYRA_HIGH_VALUE_ROUTES.sentiment.path,
    SYRA_HIGH_VALUE_ROUTES.sentiment.params,
  );
  return res.success ? JSON.stringify(res.data) : res.error;
}
```

## Option C: Direct x402 from agent wallet

Use `POST /agent/tools/call` on `api.syraa.fun` with your agent session — treasury pays via policy engine.

See [mcp-server README](../README.md) and [syra-sdk README](../../syra-sdk/README.md).
