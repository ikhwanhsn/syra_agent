import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsLayout } from "@/components/docs/DocsLayout";

export default function OutcomesCompletedWork() {
  return (
    <DocsLayout>
      <DocPageHeader
        title="Completed-Work Outcomes"
        description="Machine money for agents: buy finished financial work, not copilot data. Mandates, managed jobs, proof reports, and pay-per-outcome billing."
      />

      <DocSection title="Positioning">
        <p>
          Syra keeps the brand <strong>Machine Money for Agents</strong> and adds a services layer:
          agents grant a scoped mandate, Syra runs the job autonomously, and you pay when the outcome
          is proven (x402 settlement on performance or AUM fees).
        </p>
        <Callout variant="note" title="Copilot vs completed work">
          <p>
            <strong>Copilot (Spend):</strong> pay per API call, agent still does the money work.
            <br />
            <strong>Completed work (Outcomes):</strong> pay when liquidity is managed, treasury
            rebalanced, or yield deployed. Better AI widens margins instead of commoditizing you.
          </p>
        </Callout>
      </DocSection>

      <DocSection title="Outcome products">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong>LP Autopilot (Robinhood Chain)</strong> — pilot; requires EV gate pass
          </li>
          <li>
            <strong>LP Autopilot (Solana Meteora)</strong> — beta; delegates to lp-agent-real
          </li>
          <li>
            <strong>Treasury Autopilot</strong> — rebalance idle stables and trim concentration
          </li>
          <li>
            <strong>Yield Autopilot</strong> — route idle capital to Marinade, Jito, Giza
          </li>
        </ul>
      </DocSection>

      <DocSection title="Quickstart (5 minutes)">
        <CodeBlock
          language="bash"
          code={`# 1. Discover products
curl https://api.syraa.fun/outcomes/catalog

# 2. Check EV gate (LP Autopilot)
curl https://api.syraa.fun/outcomes/ev-gate

# 3. Create mandate
curl -X POST https://api.syraa.fun/outcomes/mandates \\
  -H "Content-Type: application/json" \\
  -H "x-anonymous-id: YOUR_AGENT_ID" \\
  -d '{
    "productId": "yield_autopilot",
    "chain": "solana",
    "agentAddress": "YOUR_WALLET",
    "policy": { "minDeployUsd": 10, "preferredVenues": ["marinade", "giza"] }
  }'

# 4. Run a completed-work job cycle
curl -X POST https://api.syraa.fun/outcomes/jobs \\
  -H "Content-Type: application/json" \\
  -d '{ "mandateId": "mandate_...", "input": { "idleCapitalUsd": 50 } }'

# 5. Verify proof report
curl https://api.syraa.fun/outcomes/reports/REPORT_ID/verify`}
        />
      </DocSection>

      <DocSection title="MCP tools">
        <p>Use these free facade tools from the Syra MCP server:</p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>
            <code>syra_outcomes_catalog</code> — list outcome products
          </li>
          <li>
            <code>syra_outcomes_ev_gate</code> — EV gate status
          </li>
          <li>
            <code>syra_outcomes_create_mandate</code> — grant standing authority
          </li>
          <li>
            <code>syra_outcomes_run_job</code> — execute one completed-work cycle
          </li>
        </ul>
      </DocSection>

      <DocSection title="Billing">
        <p>
          Outcome fees are computed on realized PnL, managed capital (AUM bps), or flat per-cycle
          charges. Settlement uses x402 when the job is proven done. Spend per-call revenue continues
          underneath for intelligence APIs.
        </p>
        <Callout variant="warning" title="Regulatory">
          Managed capital and performance fees may trigger advisory or asset-management rules in your
          jurisdiction. See internal memo <code>docs/OUTCOMES_REGULATORY.md</code> and consult counsel
          before production scale.
        </Callout>
      </DocSection>
    </DocsLayout>
  );
}
