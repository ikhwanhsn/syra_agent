import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { Button } from "@/components/ui/button";

export default function AgentCatalog() {
  return (
    <DocsLayout>
      <DocPageHeader
        eyebrow="x402 Agent"
        title="Agent Catalog"
        description="Syra autonomous agent catalog on x402scan. Discover available agent workflows and research tasks."
      />

      <DocSection id="overview" title="Overview">
        <Callout variant="note">
          Use the x402 platform to run market analysis, research synthesis, and narrative &amp; sentiment workflows.
          For the full catalog and task list, see the x402scan platform.
        </Callout>
      </DocSection>

      <div className="not-prose">
        <Button variant="outline" asChild>
          <Link to="/docs/x402-agent/getting-started">← Getting Started</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
