import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { SYRA_API_URL, SYRA_MARKETPLACE_URL } from "@/content/syraUrls";

const tocItems = [
  { id: "what", title: "What you get", level: 2 },
  { id: "install", title: "Install", level: 2 },
  { id: "quickstart", title: "Quick start", level: 2 },
  { id: "env", title: "Payment env", level: 2 },
  { id: "packages", title: "Related packages", level: 2 },
  { id: "next", title: "Next steps", level: 2 },
];

export default function BuildSdk() {
  return (
    <DocsLayout toc={tocItems}>
      <DocPageHeader
        eyebrow="Build"
        title="Install Syra SDK"
        description={
          <>
            Typed TypeScript client for Syra machine money — <code className="text-sm">createSyraPaidClient</code> handles
            HTTP 402 → sign → retry so agents and apps can call paid routes without custom payment plumbing.
          </>
        }
      />

      <DocSection id="what" title="What you get" prose>
        <ul>
          <li>
            Auto-pay client for Solana, Base, and Algorand USDC rails
          </li>
          <li>
            Low-level payment fetch via <code>@syra-ai/sdk/payment</code>
          </li>
          <li>
            Pillar discovery (<code>/pillars</code>) and typed <code>&#123; success, data?, error? &#125;</code> responses
          </li>
        </ul>
      </DocSection>

      <DocSection id="install" title="Install" prose>
        <pre className="rounded-md border bg-muted/40 p-4 text-sm overflow-x-auto">
          <code>npm install @syra-ai/sdk</code>
        </pre>
        <p className="mt-4">
          Requires Node.js ≥ 18. Package:{" "}
          <a
            href="https://www.npmjs.com/package/@syra-ai/sdk"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            @syra-ai/sdk
          </a>
          .
        </p>
      </DocSection>

      <DocSection id="quickstart" title="Quick start" prose>
        <pre className="rounded-md border bg-muted/40 p-4 text-sm overflow-x-auto whitespace-pre">{`import { createSyraPaidClient } from "@syra-ai/sdk";

// Reads SYRA_PAYER_KEYPAIR (Solana) or Base/Algorand keys from env
const syra = await createSyraPaidClient({
  baseUrl: "https://api.syraa.fun",
});

const news = await syra.get("/news", { ticker: "BTC" });
if (news.success) {
  console.log(news.data);
}`}</pre>
        <Callout variant="tip" title="Prefer MCP for chat agents">
          If you only need tools inside Cursor or Claude, use{" "}
          <Link to="/docs/build/mcp" className="text-primary hover:underline">
            @syra-ai/mcp-server
          </Link>{" "}
          instead of embedding the SDK.
        </Callout>
      </DocSection>

      <DocSection id="env" title="Payment env" prose>
        <ul>
          <li>
            <strong>Solana (default):</strong> <code>SYRA_PAYER_KEYPAIR</code>
          </li>
          <li>
            <strong>Base:</strong> <code>X402_PREFERRED_NETWORK=base</code> + <code>SYRA_EVM_PAYER_PRIVATE_KEY</code>
          </li>
          <li>
            <strong>Algorand:</strong> <code>X402_PREFERRED_NETWORK=algorand</code> +{" "}
            <code>SYRA_ALGORAND_PAYER_PRIVATE_KEY</code>
          </li>
        </ul>
        <p>
          Discovery:{" "}
          <a
            href={`${SYRA_API_URL}/.well-known/x402`}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {SYRA_API_URL}/.well-known/x402
          </a>
        </p>
      </DocSection>

      <DocSection id="packages" title="Related packages" prose>
        <ul>
          <li>
            <Link to="/docs/build/mcp" className="text-primary hover:underline">
              @syra-ai/mcp-server
            </Link>{" "}
            — MCP tools for IDEs and agent frameworks
          </li>
          <li>
            <a
              href="https://www.npmjs.com/package/@syra-ai/x402-payer"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              @syra-ai/x402-payer
            </a>{" "}
            — minimal 402 helper for raw <code>fetch</code>
          </li>
        </ul>
      </DocSection>

      <DocSection id="next" title="Next steps" prose>
        <ul>
          <li>
            <Link to="/docs/api/x402-api-standard" className="text-primary hover:underline">
              x402 payment flow
            </Link>
          </li>
          <li>
            <a href={SYRA_MARKETPLACE_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Marketplace
            </a>
          </li>
          <li>
            <a
              href={`${SYRA_API_URL}/llms-full.txt`}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              llms-full.txt
            </a>
          </li>
          <li>
            <a
              href={`${SYRA_API_URL}/skill.md`}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Agent skill
            </a>
          </li>
        </ul>
      </DocSection>
    </DocsLayout>
  );
}
