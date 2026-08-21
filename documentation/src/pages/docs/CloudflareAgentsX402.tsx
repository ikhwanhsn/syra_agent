import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { SYRA_API_URL } from "@/content/syraUrls";

const tocItems = [
  { id: "why", title: "Why this path", level: 2 },
  { id: "prereqs", title: "Prerequisites", level: 2 },
  { id: "pay", title: "Pay Syra from a Cloudflare Agent", level: 2 },
  { id: "mcp", title: "MCP note", level: 2 },
  { id: "next", title: "Next steps", level: 2 },
];

const exampleCode = `import { Agent, callable } from "agents";
import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

type Env = {
  /** Base EVM private key (Worker secret). Fund with USDC + gas. */
  SYRA_EVM_PAYER_PRIVATE_KEY: string;
};

const SYRA_NEWS = "${SYRA_API_URL}/news?ticker=BTC";

export class SyraPayAgent extends Agent<Env> {
  fetchWithPay!: typeof fetch;

  onStart() {
    const raw = this.env.SYRA_EVM_PAYER_PRIVATE_KEY.trim();
    const hex = (raw.startsWith("0x") ? raw : \`0x\${raw}\`) as Hex;
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
}`;

export default function CloudflareAgentsX402() {
  return (
    <DocsLayout toc={tocItems}>
      <DocPageHeader
        eyebrow="Integrations"
        title="Pay Syra from a Cloudflare Agent"
        description={
          <>
            Distribution path — Cloudflare Agents call Syra’s x402 Spend APIs with Base USDC. Syra stays the merchant;
            the Agent is the payer (same role as Crossmint).
          </>
        }
      />

      <DocSection id="why" title="Why this path" prose>
        <p>
          Syra accepts USDC on Base via x402 facilitators. Cloudflare’s Agents SDK documents automatic 402 handling with{" "}
          <code className="text-sm">@x402/fetch</code> (HTTP) and <code className="text-sm">withX402Client</code> (MCP).
          Together: fund a Base wallet → Agent wraps fetch → call{" "}
          <code className="text-sm">{SYRA_API_URL}</code> → settle → JSON.
        </p>
        <Callout variant="tip" title="Merchant stays Syra">
          Do not put Monetization Gateway or Cloudflare <code className="text-sm">paidTool</code> in front of Syra Spend
          routes as a second charge. Syra already returns 402; the Agent only pays.
        </Callout>
      </DocSection>

      <DocSection id="prereqs" title="Prerequisites" prose>
        <ul>
          <li>Cloudflare Agents Worker (<code className="text-sm">agents</code> package)</li>
          <li>Base wallet funded with USDC (+ gas); private key in Worker secrets only</li>
          <li>
            Packages: <code className="text-sm">@x402/fetch</code>, <code className="text-sm">@x402/core</code>,{" "}
            <code className="text-sm">@x402/evm</code>, <code className="text-sm">viem</code>
          </li>
        </ul>
      </DocSection>

      <DocSection id="pay" title="Pay Syra from a Cloudflare Agent" prose>
        <p>
          Pattern matches Cloudflare’s{" "}
          <a
            href="https://github.com/cloudflare/agents/tree/main/examples/x402"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            HTTP x402 Agent example
          </a>
          , pointed at Syra (Exact EVM scheme, same as Syra’s Base SDK payer):
        </p>
        <CodeBlock language="typescript" code={exampleCode} />
        <p>
          Expected success: HTTP 200 with news JSON after an automatic 402 → sign → retry. Confirm Base{" "}
          <code className="text-sm">accepts</code> via{" "}
          <code className="text-sm">GET {SYRA_API_URL}/.well-known/x402</code> if payment loops.
        </p>
      </DocSection>

      <DocSection id="mcp" title="MCP note" prose>
        <p>
          Prefer HTTP Spend for Workers. For Cursor / Claude Desktop, install{" "}
          <Link to="/docs/build/mcp" className="text-primary hover:underline">
            @syra-ai/mcp-server
          </Link>{" "}
          with Solana <code className="text-sm">SYRA_PAYER_KEYPAIR</code>. Use Cloudflare{" "}
          <code className="text-sm">withX402Client</code> only when connecting to an HTTP MCP that already fronts Syra.
        </p>
      </DocSection>

      <DocSection id="next" title="Next steps" prose>
        <ul>
          <li>
            <Link to="/docs/build/crossmint-x402" className="text-primary hover:underline">
              Crossmint → Syra x402
            </Link>{" "}
            (another Base payer path)
          </li>
          <li>
            <Link to="/docs/build/mcp" className="text-primary hover:underline">
              Install MCP
            </Link>
          </li>
          <li>
            <Link to="/docs/api/x402-api-standard" className="text-primary hover:underline">
              x402 payment flow
            </Link>
          </li>
          <li>
            Cloudflare:{" "}
            <a
              href="https://developers.cloudflare.com/agents/tools/payments/"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Agentic payments docs
            </a>
          </li>
        </ul>
      </DocSection>
    </DocsLayout>
  );
}
