import {
  getParamsForExampleFlow,
  type ExampleFlowPreset,
} from "@/hooks/useApiPlayground";
import type { RequestParam } from "@/types/api";
import { buildFlowCardDisplay } from "@/lib/x402FlowCardMeta";
import {
  getPlaygroundSyraPathname,
  parsePlaygroundRequestUrl,
} from "@/lib/playgroundUrl";

function resolveFlowRequestUrl(flow: ExampleFlowPreset): URL | null {
  return parsePlaygroundRequestUrl(flow.url);
}

export function buildExampleRequestUrl(
  flow: ExampleFlowPreset,
  paramsOverride?: RequestParam[],
): string {
  const params = paramsOverride ?? getParamsForExampleFlow(flow);
  const url = resolveFlowRequestUrl(flow);
  if (!url) return flow.url;

  if (flow.method === "GET") {
    for (const param of params) {
      if (!param.enabled || !param.key.trim()) continue;
      if (param.value.trim() === "") continue;
      url.searchParams.set(param.key, param.value);
    }
  }

  return url.toString();
}

export interface MarketplaceUsageSnippets {
  mcp: string;
  sdk: string;
  curl: string;
}

export function buildMarketplaceUsageSnippets(
  flow: ExampleFlowPreset,
  requestUrl: string,
): MarketplaceUsageSnippets {
  const path = getPlaygroundSyraPathname(requestUrl) || getPlaygroundSyraPathname(flow.url) || flow.url;
  const card = buildFlowCardDisplay(flow, path);
  const absoluteUrl = parsePlaygroundRequestUrl(requestUrl)?.toString() ?? requestUrl;
  const priceHint = card.priceLabel ? ` (~${card.priceLabel} USDC per call)` : "";
  const parsed = parsePlaygroundRequestUrl(requestUrl);
  const apiBase = parsed ? `${parsed.origin}` : "https://api.syraa.fun";

  const curlGet = `# 1. First call returns HTTP 402 with x402 payment requirements${priceHint}
curl -i "${absoluteUrl}"

# 2. Sign payment with your wallet, then retry with PAYMENT-SIGNATURE header
# Docs: https://docs.syraa.fun/docs/x402-agent/getting-started`;

  const curlPost = `# 1. First call returns HTTP 402 with x402 payment requirements${priceHint}
curl -i -X ${flow.method} "${absoluteUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${(flow.body || "{}").replace(/'/g, "'\\''")}'

# 2. Sign payment with your wallet, then retry with PAYMENT-SIGNATURE header`;

  const sdk = `import { createPaidFetch } from "@syra-ai/x402-payer";

const paidFetch = createPaidFetch({
  // Solana keypair or wallet adapter signer
  signer: yourSigner,
});

const res = await paidFetch("${absoluteUrl}", {
  method: "${flow.method}",${
    flow.method !== "GET" && flow.body
      ? `
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${flow.body}),`
      : ""
  }
});

const data = await res.json();`;

  const mcp = `# Prefer MCP for chat agents — auto-pays on HTTP 402
# Path: ${path}${priceHint}

# Cursor / Claude Desktop mcp.json
{
  "mcpServers": {
    "syra": {
      "command": "npx",
      "args": ["-y", "@syra-ai/mcp-server"],
      "env": {
        "SYRA_API_BASE_URL": "${apiBase}",
        "SYRA_PAYER_KEYPAIR": "\${SYRA_PAYER_KEYPAIR}"
      }
    }
  }
}

# Or: claude mcp add syra -- npx -y @syra-ai/mcp-server@latest
# Then call curated tools (e.g. syra_spend_news) or syra_call_tool with this path.
# Docs: https://docs.syraa.fun/docs/build/mcp`;

  return {
    mcp,
    sdk,
    curl: flow.method === "GET" ? curlGet : curlPost,
  };
}
