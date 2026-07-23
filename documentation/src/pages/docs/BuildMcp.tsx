import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { SYRA_API_URL, SYRA_MARKETPLACE_URL } from "@/content/syraUrls";

const tocItems = [
  { id: "what", title: "What you get", level: 2 },
  { id: "first-paid", title: "First paid call (5 min)", level: 2 },
  { id: "install", title: "Install", level: 2 },
  { id: "cursor", title: "Cursor config", level: 2 },
  { id: "env", title: "Environment", level: 2 },
  { id: "tools", title: "Tool naming", level: 2 },
  { id: "next", title: "Next steps", level: 2 },
];

export default function BuildMcp() {
  return (
    <DocsLayout toc={tocItems}>
      <DocPageHeader
        eyebrow="Build"
        title="Install Syra MCP"
        description={
          <>
            Expose Syra’s crypto research APIs as MCP tools in Cursor, Claude Desktop, or any MCP client — with optional
            x402 auto-pay via <code className="text-sm">@syra-ai/mcp-server</code>.
          </>
        }
      />

      <DocSection id="what" title="What you get" prose>
        <ul>
          <li>
            <strong>257</strong> codegen tools from the live agent catalog (default profile: <strong>47 curated</strong>)
          </li>
          <li>stdio MCP transport — no HTTP port to manage</li>
          <li>Automatic HTTP 402 → sign → retry when a payer key is configured</li>
          <li>
            Escape hatch <code>syra_call_tool</code> for any <code>toolId</code>
          </li>
        </ul>
      </DocSection>

      <DocSection id="first-paid" title="First paid call in 5 minutes" prose>
        <p>
          Same path as the README and marketplace <strong>Integrate</strong> tab. Primary CTA for agent builders:
        </p>
        <ol>
          <li>
            Install MCP:{" "}
            <code className="text-sm">claude mcp add syra -- npx -y @syra-ai/mcp-server@latest</code>
          </li>
          <li>
            Set <code className="text-sm">SYRA_API_BASE_URL=https://api.syraa.fun</code>
          </li>
          <li>
            Fund a Solana wallet with ≥ $1 USDC (+ a little SOL) and set{" "}
            <code className="text-sm">SYRA_PAYER_KEYPAIR</code>
          </li>
          <li>
            Call <code className="text-sm">syra_spend_news</code> with ticker <code className="text-sm">BTC</code>
          </li>
          <li>
            Confirm settled HTTP 402 → JSON. Live proof:{" "}
            <a href="https://syraa.fun" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              syraa.fun
            </a>{" "}
            / <code className="text-sm">GET /api/metrics</code>
          </li>
        </ol>
        <Callout variant="tip" title="Hot paths after first success">
          Expand to insights that already convert:{" "}
          <code className="text-sm">/insights/volatility-index</code>,{" "}
          <code className="text-sm">/insights/market-pulse</code>,{" "}
          <code className="text-sm">/insights/defi-tvl</code>, then the rest of Spend.
        </Callout>
      </DocSection>

      <DocSection id="install" title="Install" prose>
        <p>One-line (Claude CLI):</p>
        <pre className="rounded-md border bg-muted/40 p-4 text-sm overflow-x-auto">
          <code>claude mcp add syra -- npx -y @syra-ai/mcp-server@latest</code>
        </pre>
        <p className="mt-4">Or run directly:</p>
        <pre className="rounded-md border bg-muted/40 p-4 text-sm overflow-x-auto">
          <code>npx -y @syra-ai/mcp-server</code>
        </pre>
        <p className="mt-4">
          Requires Node.js ≥ 18. Package:{" "}
          <a
            href="https://www.npmjs.com/package/@syra-ai/mcp-server"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            @syra-ai/mcp-server
          </a>
          .
        </p>
      </DocSection>

      <DocSection id="cursor" title="Cursor config" prose>
        <p>
          Add to <code>.cursor/mcp.json</code> (or user MCP settings):
        </p>
        <pre className="rounded-md border bg-muted/40 p-4 text-sm overflow-x-auto whitespace-pre">{`{
  "mcpServers": {
    "syra": {
      "command": "npx",
      "args": ["-y", "@syra-ai/mcp-server@latest"],
      "env": {
        "SYRA_API_BASE_URL": "https://api.syraa.fun",
        "SYRA_MCP_TOOL_PROFILE": "curated",
        "SYRA_PAYER_KEYPAIR": "your-solana-secret"
      }
    }
  }
}`}</pre>
        <Callout variant="warning" title="Never commit payer secrets">
          Prefer environment variable substitution or a secret manager. Do not check keypairs into git.
        </Callout>
      </DocSection>

      <DocSection id="env" title="Environment" prose>
        <ul>
          <li>
            <code>SYRA_PAYER_KEYPAIR</code> — Solana USDC auto-pay (default rail)
          </li>
          <li>
            <code>X402_PREFERRED_NETWORK=base</code> + <code>SYRA_EVM_PAYER_PRIVATE_KEY</code> — Base USDC
          </li>
          <li>
            <code>X402_PREFERRED_NETWORK=algorand</code> + <code>SYRA_ALGORAND_PAYER_PRIVATE_KEY</code>
          </li>
          <li>
            <code>SYRA_MCP_TOOL_PROFILE=full</code> — register all 257 tools
          </li>
          <li>
            <code>SYRA_USE_DEV_ROUTES=true</code> — local API without payment
          </li>
        </ul>
      </DocSection>

      <DocSection id="tools" title="Tool naming" prose>
        <p>
          Tools use <code>syra_&#123;pillar&#125;_&#123;toolId&#125;</code> — for example <code>syra_spend_news</code>,{" "}
          <code>syra_invest_squid_route</code>. Legacy <code>syra_v2_*</code> names are obsolete.
        </p>
        <p>
          Curated list:{" "}
          <a href="https://syraa.fun/skills.md" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            syraa.fun/skills.md
          </a>
          . Agent skill:{" "}
          <a href={`${SYRA_API_URL}/skill.md`} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            {SYRA_API_URL}/skill.md
          </a>
          .
        </p>
      </DocSection>

      <DocSection id="next" title="Next steps" prose>
        <ul>
          <li>
            <Link to="/docs/build/sdk" className="text-primary hover:underline">
              Install the TypeScript SDK
            </Link>{" "}
            for app/script clients
          </li>
          <li>
            <Link to="/docs/api/x402-api-standard" className="text-primary hover:underline">
              x402 payment flow
            </Link>
          </li>
          <li>
            <a href={SYRA_MARKETPLACE_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Marketplace
            </a>{" "}
            — browse paid routes
          </li>
          <li>
            <a
              href={`${SYRA_API_URL}/llms-full.txt`}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              llms-full.txt
            </a>{" "}
            — full agent reference
          </li>
        </ul>
      </DocSection>
    </DocsLayout>
  );
}
