import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { SYRA_API_URL } from "@/content/syraUrls";

const tocItems = [
  { id: "what", title: "What it is", level: 2 },
  { id: "install", title: "Install", level: 2 },
  { id: "quickstart", title: "Quick start", level: 2 },
  { id: "coverage", title: "Coverage rules", level: 2 },
  { id: "premium", title: "Premium pricing", level: 2 },
  { id: "api", title: "HTTP API", level: 2 },
  { id: "rollout", title: "Rollout", level: 2 },
];

export default function BuildRefund() {
  return (
    <DocsLayout toc={tocItems}>
      <DocPageHeader
        eyebrow="Build"
        title="x402 refund coverage"
        description={
          <>
            Insure an agent&apos;s paid x402 calls. Wrap <code className="text-sm">fetch</code> with{" "}
            <code className="text-sm">@syra-ai/x402-refund</code>. Syra observes the upstream outcome and
            refunds on-chain USDC when a paid call fails.
          </>
        }
      />

      <DocSection id="what" title="What it is" prose>
        <p>
          Syra hosted Refund-as-a-Service is a paid coverage layer for external agents. It is not
          self-reported insurance. Covered calls are relayed through Syra so Syra can see the real
          upstream status and settlement.
        </p>
        <ul>
          <li>
            <strong>Relay (default):</strong> the SDK sends the call to{" "}
            <code>POST {SYRA_API_URL}/refund/relay</code>. Syra forwards the agent&apos;s upstream payment,
            observes the response, and refunds on 5xx / timeout / network error after payment.
          </li>
          <li>
            <strong>Re-probe (GET):</strong> Syra independently GETs the URL after the agent&apos;s own
            call. Use when the payload must not leave the agent.
          </li>
        </ul>
      </DocSection>

      <DocSection id="install" title="Install" prose>
        <pre className="rounded-md border bg-muted/40 p-4 text-sm overflow-x-auto">
          <code>npm install @syra-ai/x402-refund</code>
        </pre>
        <p className="mt-4">
          Or import from <code>@syra-ai/sdk/refund</code> if you already use the typed client.
        </p>
      </DocSection>

      <DocSection id="quickstart" title="Quick start" prose>
        <pre className="rounded-md border bg-muted/40 p-4 text-sm overflow-x-auto whitespace-pre">{`import { wrapFetchWithSyraRefund } from "@syra-ai/x402-refund";
import { getPaidFetch } from "@syra-ai/sdk/payment";

const paid = await getPaidFetch();
const fetch = wrapFetchWithSyraRefund(paid, {
  refundTo: process.env.AGENT_WALLET,
  payer: paid,
});

const res = await fetch("https://api.example.com/intel");`}</pre>
      </DocSection>

      <DocSection id="coverage" title="Coverage rules" prose>
        <ul>
          <li>Refundable after payment: HTTP 5xx, 408, network / timeout errors.</li>
          <li>Not refundable: no payment, 2xx, 402 quotes, ordinary 4xx.</li>
          <li>Per-call cap (default $1), per-wallet daily cap, and a global daily pool cap.</li>
          <li>Host must be on <code>REFUND_HOSTED_ALLOWLIST</code>. Empty list means deny.</li>
        </ul>
      </DocSection>

      <DocSection id="premium" title="Premium pricing" prose>
        <p>
          Each covered call (paid upstream attempt) is billed over x402. Price is{" "}
          <code>max(flat, coveredUsd × bps / 10_000)</code>, then capped. Default flat is $0.002 (50 bps
          of covered value, cap $0.05). <code>$SYRA</code> holder discounts apply the same way as other
          inbound Syra routes.
        </p>
        <p>
          Pass <code>X-Refund-Covered-Usd</code> (or <code>coveredUsd</code> on the SDK) so bps pricing
          can see the insured call value. Omit it and Syra charges the flat premium.
        </p>
      </DocSection>

      <DocSection id="api" title="HTTP API" prose>
        <ul>
          <li>
            <code>GET {SYRA_API_URL}/refund/status</code> — flags, caps, allowlist
          </li>
          <li>
            <code>GET {SYRA_API_URL}/refund/claims?wallet=</code> — hosted ledger for that wallet
          </li>
          <li>
            <code>POST {SYRA_API_URL}/refund/relay</code> — x402-priced coverage relay
          </li>
          <li>
            <code>POST {SYRA_API_URL}/refund/reprobe</code> — attested GET re-probe
          </li>
        </ul>
        <Callout variant="tip" title="Headers">
          <code>X-Refund-Target</code>, <code>X-Refund-Method</code>, <code>X-Refund-To</code>,{" "}
          <code>X-Refund-Covered-Usd</code>, <code>X-Refund-Upstream-Payment</code>. Response:{" "}
          <code>X-Syra-Coverage</code>, <code>X-Syra-Refund-Tx</code>.
        </Callout>
      </DocSection>

      <DocSection id="rollout" title="Rollout" prose>
        <p>
          Hosted coverage ships <strong>off</strong> (<code>REFUND_HOSTED_ENABLED=false</code>) with a
          conservative allowlist and low daily caps. Phase 1 is relay + premium + ledger + SDK. Phase 2
          is GET re-probe hardening, holder-tier premium waiver, and public coverage metrics.
        </p>
        <p>
          Related:{" "}
          <Link to="/docs/build/sdk" className="text-primary hover:underline">
            Install SDK
          </Link>
          {" · "}
          <Link to="/docs/api/x402-api-standard" className="text-primary hover:underline">
            x402 payment flow
          </Link>
        </p>
      </DocSection>
    </DocsLayout>
  );
}
