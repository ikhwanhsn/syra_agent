import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { SYRA_API_URL, SYRA_SKILL_URL } from "@/content/syraUrls";

const tocItems = [
  { id: "why", title: "Why this path", level: 2 },
  { id: "prereqs", title: "Prerequisites", level: 2 },
  { id: "mcp", title: "Register Syra MCP", level: 2 },
  { id: "skill", title: "Install Syra skill", level: 2 },
  { id: "first-paid", title: "First paid call", level: 2 },
  { id: "next", title: "Next steps", level: 2 },
];

const mcpSetCmd = `openclaw mcp set syra '{"command":"npx","args":["-y","@syra-ai/mcp-server@latest"],"env":{"SYRA_API_BASE_URL":"https://api.syraa.fun","SYRA_MCP_TOOL_PROFILE":"curated","SYRA_PAYER_KEYPAIR":"your-solana-secret"}}'
openclaw mcp doctor syra --probe`;

export default function BuildOpenClaw() {
  return (
    <DocsLayout toc={tocItems}>
      <DocPageHeader
        eyebrow="Integrations"
        title="Install Syra on OpenClaw"
        description={
          <>
            Distribution path — OpenClaw agents run{" "}
            <code className="text-sm">@syra-ai/mcp-server</code> with a funded payer. Syra stays the x402 merchant;
            OpenClaw is the agent host.
          </>
        }
      />

      <DocSection id="why" title="Why this path" prose>
        <p>
          OpenClaw is a self-hosted agent runtime with first-class MCP management (
          <code className="text-sm">openclaw mcp set</code> / Control UI). Pair it with Syra for pay-per-call crypto
          news, sentiment, and Spend tools without wiring vendor API keys.
        </p>
        <Callout variant="tip" title="Same merchant as Cursor / Claude">
          The MCP package and payer env are identical to the{" "}
          <Link to="/docs/build/mcp" className="text-primary hover:underline">
            Install MCP
          </Link>{" "}
          guide. Only the host registration command changes.
        </Callout>
      </DocSection>

      <DocSection id="prereqs" title="Prerequisites" prose>
        <ul>
          <li>
            <a
              href="https://docs.openclaw.ai"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenClaw
            </a>{" "}
            installed with CLI on PATH
          </li>
          <li>Node.js ≥ 18</li>
          <li>
            Solana wallet with ≥ $1 USDC (+ SOL for fees), or fund via{" "}
            <a
              href="https://syraa.fun/wallet"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              syraa.fun/wallet
            </a>
          </li>
        </ul>
      </DocSection>

      <DocSection id="mcp" title="Register Syra MCP" prose>
        <p>
          Writes <code className="text-sm">mcp.servers.syra</code> into OpenClaw config. Replace{" "}
          <code className="text-sm">your-solana-secret</code> with a funded keypair (prefer a secret manager).
        </p>
        <pre className="rounded-md border bg-muted/40 p-4 text-sm overflow-x-auto whitespace-pre">
          <code>{mcpSetCmd}</code>
        </pre>
        <p className="mt-4">
          You can also enable or edit the server under Control UI <code className="text-sm">/settings/mcp</code>.
        </p>
        <Callout variant="warning" title="Never commit payer secrets">
          Do not check keypairs into git or shared OpenClaw config. Prefer env substitution or a secret store.
        </Callout>
      </DocSection>

      <DocSection id="skill" title="Install Syra skill" prose>
        <p>
          From a local clone of the Syra repo, install the consult-first skill so agents call{" "}
          <code className="text-sm">syra_consult</code> before paid tools:
        </p>
        <pre className="rounded-md border bg-muted/40 p-4 text-sm overflow-x-auto">
          <code>{`openclaw skills install ./.agents/skills/syra --as syra`}</code>
        </pre>
        <p className="mt-4">
          Agents can also paste: <code className="text-sm">set up {SYRA_SKILL_URL}</code>
        </p>
      </DocSection>

      <DocSection id="first-paid" title="First paid call" prose>
        <ol>
          <li>
            Ask the agent: <strong>Get BTC news</strong>
          </li>
          <li>
            It should call <code className="text-sm">syra_consult</code> (free), then{" "}
            <code className="text-sm">syra_spend_news</code> with ticker <code className="text-sm">BTC</code>
          </li>
          <li>
            Confirm HTTP 200 after 402 settle. Live proof:{" "}
            <a href="https://syraa.fun" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              syraa.fun
            </a>{" "}
            / <code className="text-sm">GET {SYRA_API_URL}/api/metrics</code>
          </li>
        </ol>
      </DocSection>

      <DocSection id="next" title="Next steps" prose>
        <ul>
          <li>
            <Link to="/docs/build/mcp" className="text-primary hover:underline">
              Install MCP
            </Link>{" "}
            — full tool naming, env, and profiles
          </li>
          <li>
            <Link to="/docs/build/sdk" className="text-primary hover:underline">
              Install SDK
            </Link>{" "}
            — typed HTTP for app code
          </li>
          <li>
            <Link to="/docs/build/crossmint-x402" className="text-primary hover:underline">
              Crossmint → Syra x402
            </Link>{" "}
            — card → USDC funding path
          </li>
          <li>
            Repo quickstart:{" "}
            <a
              href="https://github.com/ikhwanhsn/syra_agent/blob/main/docs/OPENCLAW_MCP_QUICKSTART.md"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              OPENCLAW_MCP_QUICKSTART.md
            </a>
          </li>
        </ul>
      </DocSection>
    </DocsLayout>
  );
}
