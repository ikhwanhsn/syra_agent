import { useLocation, Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import tokenomicsV2Raw from "@/data/tokenomicsV2.md?raw";
import roadmapV2Raw from "@/data/roadmapV2.md?raw";

export default function Token() {
  const location = useLocation();
  const isTokenomics = location.pathname === "/docs/token/tokenomics";
  const isRoadmap = location.pathname === "/docs/token/roadmap";

  const markdownContent = isTokenomics ? tokenomicsV2Raw : isRoadmap ? roadmapV2Raw : null;

  if (markdownContent) {
    return (
      <DocsLayout>
        <article className="docs-prose overflow-x-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
        </article>
        <div className="flex gap-3 pt-6 border-t border-border/60 mt-8 not-prose">
          <Button variant="outline" asChild>
            <Link to="/docs/welcome">Back to Welcome</Link>
          </Button>
        </div>
      </DocsLayout>
    );
  }

  return (
    <DocsLayout>
      <DocPageHeader
        eyebrow="Token & Utility"
        title="Token & Utility"
        description="Token & Utility documentation for the Syra Trading Agent Bot — tokenomics, roadmap, and utility."
      />

      <DocSection id="overview" title="Overview" prose>
        <p>Use the sidebar to navigate to Tokenomics and Roadmap docs.</p>
      </DocSection>

      <div className="not-prose">
        <Button variant="outline" asChild>
          <Link to="/docs/welcome">Back to Welcome</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
