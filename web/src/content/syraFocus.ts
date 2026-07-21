/** Product focus copy — pay-per-call wedge. Tagline lives in syraBranding. */

export {
  SYRA_TAGLINE,
  SYRA_TAGLINE_SHORT,
  SYRA_AGENT_DESCRIPTION as SYRA_USP,
} from "@/lib/syraBranding";

export const SYRA_ONE_LINER =
  "Machine money for agents on Solana — live today: pay-per-call crypto APIs over x402.";

export const SYRA_RAIL_MODULES = [
  {
    title: "Pay-per-call x402 APIs",
    description:
      "News, sentiment, risk, smart-money flow, signals, and execution — agents discover and fund tools with USDC on HTTP 402.",
    features: ["x402 USDC on Solana", "OpenAPI catalog", "Marketplace"],
  },
  {
    title: "MCP + typed SDK",
    description:
      "Install once in Cursor or Claude, or wire createSyraPaidClient in app code — auto-pay on 402 without per-vendor API keys.",
    features: ["@syra-ai/mcp-server", "@syra-ai/sdk", "Auto-pay wallets"],
  },
  {
    title: "Agent money layer",
    description:
      "Optional wallets, spend caps, and policy so agents can hold and pay without human babysitting on every call.",
    features: ["Agent wallets", "Spend caps", "Policy engine"],
  },
] as const;

/** Why pay Syra instead of wiring each upstream vendor yourself. */
export const SYRA_VS_DIY = [
  {
    title: "One wallet, many tools",
    description:
      "One USDC payer (MCP or SDK) covers news, on-chain intel, and partner routes — no N vendor API keys or billing accounts.",
  },
  {
    title: "Agent-native install",
    description:
      "Curated MCP tools + auto-pay on HTTP 402 so Cursor/Claude agents succeed mid-task without human key pasting.",
  },
  {
    title: "Unified discovery",
    description:
      "OpenAPI, marketplace, and /.well-known/x402 list routes with live payment terms in one catalog.",
  },
  {
    title: "Transparent per-call price",
    description:
      "402 accepts[] shows the exact USDC charge. Listed prices include Syra’s platform fee over upstream cost.",
  },
] as const;

/** Honest margin bands — keep in sync with api/config/x402Pricing.js. */
export const SYRA_PRICING_BANDS = {
  passthrough:
    "Partner passthrough APIs (e.g. Birdeye, Nansen, TopLedger): upstream cost × ~1.2 (~+20%).",
  openRouter:
    "OpenRouter chat / media / embeddings-style routes: upstream cost × ~1.4 (~+40%), with floors.",
  firstParty: "First-party Syra tiers: typically $0.001 / $0.005 / $0.02 / $0.08 per successful paid call.",
} as const;

export const SYRA_PLATFORM_FEE_NOTE =
  "Includes Syra platform fee over upstream — see pricing docs for bands.";

export const SYRA_PRICING_DOCS_URL = "https://docs.syraa.fun/docs/build/pricing";
export const SYRA_TOKEN_PAGE_PATH = "/token";
