import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { SYRA_MARKETPLACE_URL } from "@/content/syraUrls";

const tocItems = [
  { id: "what-you-pay", title: "What you pay", level: 2 },
  { id: "vs-diy", title: "Why not call upstream DIY?", level: 2 },
  { id: "where", title: "Where prices appear", level: 2 },
  { id: "next", title: "Next steps", level: 2 },
];

const VS_DIY = [
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

export default function BuildPricing() {
  return (
    <DocsLayout toc={tocItems}>
      <DocPageHeader
        eyebrow="Build"
        title="Pricing & why Syra vs DIY"
        description="Honest margin bands for pay-per-call APIs, and why agent builders use Syra instead of wiring each upstream vendor alone. Token buybacks are not the reason to integrate."
      />

      <DocSection id="what-you-pay" title="What you pay" prose>
        <p>
          You pay only for <strong>successful</strong> paid requests via x402 (USDC). Exact per-route
          amounts come from each endpoint’s <code>402</code> response <code>accepts[]</code> array.
        </p>
        <ul>
          <li>
            <strong>Partner passthrough</strong> (e.g. Birdeye, Nansen, TopLedger): upstream cost × ~
            <strong>1.2</strong> (~+20%).
          </li>
          <li>
            <strong>OpenRouter</strong> chat / media / embeddings-style routes: upstream cost × ~
            <strong>1.4</strong> (~+40%), with floors.
          </li>
          <li>
            <strong>First-party Syra tiers</strong>: typically <code>$0.001</code> / <code>$0.005</code> /{" "}
            <code>$0.02</code> / <code>$0.08</code> per successful paid call.
          </li>
        </ul>
        <Callout variant="note" title="Platform fee">
          Listed marketplace and 402 prices include Syra’s platform fee over upstream cost. That fee
          funds gateway ops, settlement, MCP/SDK packaging, and catalog maintenance — not a hidden
          subscription.
        </Callout>
      </DocSection>

      <DocSection id="vs-diy" title="Why not call Birdeye/Nansen yourself?" prose>
        <p>
          Direct upstream accounts can be cheaper on a single route. Syra wins when the agent loop
          needs many tools with one payer and no vendor onboarding:
        </p>
        <ul>
          {VS_DIY.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong> — {item.description}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="where" title="Where prices appear" prose>
        <ul>
          <li>
            Runtime: HTTP <code>402 Payment Required</code> body <code>accepts[]</code>
          </li>
          <li>
            Discovery:{" "}
            <a href="https://api.syraa.fun/.well-known/x402" className="text-primary hover:underline">
              api.syraa.fun/.well-known/x402
            </a>{" "}
            and OpenAPI
          </li>
          <li>
            UI:{" "}
            <a href={SYRA_MARKETPLACE_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              syraa.fun/marketplace
            </a>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Optional token details (mint, staking, buybacks) are at{" "}
          <a href="https://syraa.fun/token" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            syraa.fun/token
          </a>{" "}
          — not required to make paid API calls.
        </p>
      </DocSection>

      <DocSection id="next" title="Next steps" prose>
        <ul>
          <li>
            <Link to="/docs/build/mcp" className="text-primary hover:underline">
              Install MCP
            </Link>
          </li>
          <li>
            <Link to="/docs/build/sdk" className="text-primary hover:underline">
              Install SDK
            </Link>
          </li>
          <li>
            <Link to="/docs/api/x402-api-standard" className="text-primary hover:underline">
              x402 payment flow
            </Link>
          </li>
        </ul>
      </DocSection>
    </DocsLayout>
  );
}
