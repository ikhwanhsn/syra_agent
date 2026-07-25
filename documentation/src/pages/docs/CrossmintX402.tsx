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
  { id: "pay", title: "Pay Syra with x402", level: 2 },
  { id: "fund", title: "Fund agent wallets (Syra UI)", level: 2 },
  { id: "next", title: "Next steps", level: 2 },
];

const exampleCode = `import { EVMWallet } from "@crossmint/client-sdk-react-ui";
import { CrossmintWallets, createCrossmint } from "@crossmint/wallets-sdk";
import { x402Client, wrapFetchWithPayment } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import type { Hex } from "viem";

const crossmint = createCrossmint({
  apiKey: process.env.CROSSMINT_SERVER_API_KEY!,
});
const wallets = CrossmintWallets.from(crossmint);

const wallet = await wallets.getWallet("<wallet-address>", { chain: "base" });
await wallet.useSigner({
  type: "server",
  secret: process.env.CROSSMINT_SIGNER_SECRET!,
});

const evmWallet = EVMWallet.from(wallet);
const x402Signer = {
  address: evmWallet.address as \`0x\${string}\`,
  async signTypedData(typedData: any) {
    const { signature } = await evmWallet.signTypedData({
      ...typedData,
      chain: "base",
    });
    return signature as Hex;
  },
};

const client = new x402Client();
client.register("eip155:*", new ExactEvmScheme(x402Signer));
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const res = await fetchWithPayment("${SYRA_API_URL}/news?ticker=BTC", {
  method: "GET",
  headers: { Accept: "application/json" },
});
console.log(res.status, await res.json());`;

export default function CrossmintX402() {
  return (
    <DocsLayout toc={tocItems}>
      <DocPageHeader
        eyebrow="Integrations"
        title="Pay Syra from a Crossmint Base wallet"
        description={
          <>
            Distribution path — Crossmint agents (or any Base USDC wallet) call Syra’s x402 Spend APIs without replacing
            Syra’s Privy custody stack. Syra stays the merchant; Crossmint is the payer wallet.
          </>
        }
      />

      <DocSection id="why" title="Why this path" prose>
        <p>
          Syra accepts USDC on Base via x402 facilitators. Crossmint documents an agent wallet that signs Exact EVM x402
          payments. Together: fund a Crossmint Base wallet → call{" "}
          <code className="text-sm">{SYRA_API_URL}</code> → settle → JSON.
        </p>
        <Callout variant="tip" title="Not a custody rewrite">
          Do not migrate Syra agent wallets to Crossmint. For humans funding Syra treasuries in the product UI, use{" "}
          <Link to="/docs/build/mcp" className="text-primary hover:underline">
            Buy USDC with card
          </Link>{" "}
          (Crossmint onramp → existing Privy/Syra address) or transfer USDC manually.
        </Callout>
      </DocSection>

      <DocSection id="prereqs" title="Prerequisites" prose>
        <ul>
          <li>Crossmint project with a Base wallet funded in USDC</li>
          <li>Agent authorized as a signer on that wallet (Crossmint Agents docs)</li>
          <li>
            Packages: <code className="text-sm">@crossmint/wallets-sdk</code>,{" "}
            <code className="text-sm">@x402/core</code>, <code className="text-sm">@x402/evm</code>
          </li>
        </ul>
      </DocSection>

      <DocSection id="pay" title="Pay Syra with x402" prose>
        <p>
          Pattern matches Crossmint’s{" "}
          <a
            href="https://docs.crossmint.com/agents/payment-flows/x402"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            x402 guide
          </a>
          , pointed at Syra:
        </p>
        <CodeBlock language="typescript" code={exampleCode} />
        <p>
          Expected success: HTTP 200 with news JSON after an automatic 402 → sign → retry. If you see 402 forever,
          confirm Base USDC balance and that Syra’s Base <code className="text-sm">accepts</code> rail is enabled.
        </p>
      </DocSection>

      <DocSection id="fund" title="Fund Syra agent wallets (product UI)" prose>
        <ol>
          <li>
            Open <a href="https://syraa.fun/wallet" className="text-primary hover:underline">syraa.fun/wallet</a>
          </li>
          <li>Use <strong>Buy USDC with card</strong> (Crossmint onramp) or <strong>Deposit</strong> (manual transfer)</li>
          <li>Refresh balances, then call Spend tools via MCP/SDK</li>
        </ol>
        <p>
          Server env (API): <code className="text-sm">CROSSMINT_ONRAMP_ENABLED</code>,{" "}
          <code className="text-sm">CROSSMINT_SERVER_API_KEY</code>,{" "}
          <code className="text-sm">CROSSMINT_CLIENT_API_KEY</code>, webhook at{" "}
          <code className="text-sm">/internal/crossmint/webhook</code>.
        </p>
      </DocSection>

      <DocSection id="next" title="Next steps" prose>
        <ul>
          <li>
            <Link to="/docs/build/mcp" className="text-primary hover:underline">
              Install MCP
            </Link>{" "}
            for agent builders on Solana
          </li>
          <li>
            <Link to="/docs/api/x402-api-standard" className="text-primary hover:underline">
              x402 payment flow
            </Link>
          </li>
          <li>
            Deferred Grow features (Agent Checkouts, offramp): see repo{" "}
            <code className="text-sm">docs/CROSSMINT_DEFERRED.md</code>
          </li>
        </ul>
      </DocSection>
    </DocsLayout>
  );
}
