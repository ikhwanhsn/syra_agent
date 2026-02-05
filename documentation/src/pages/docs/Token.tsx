import { useLocation, Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
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
        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-table:rounded-lg prose-tbody:bg-card/30 overflow-x-auto overflow-x-auto-touch">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
        </article>
        <div className="flex gap-3 pt-6 border-t border-border mt-8">
          <Button variant="outline" asChild>
            <Link to="/docs/welcome">Back to Welcome</Link>
          </Button>
        </div>
      </DocsLayout>
    );
  }

  return (
    <DocsLayout>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Token & Utility</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Token & Utility</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Token & Utility documentation for the Syra Trading Agent Bot — tokenomics, roadmap, and utility.
        </p>
      </div>

      <div className="space-y-4 text-muted-foreground mb-8">
        <p>Use the sidebar to navigate to Tokenomics and Roadmap docs.</p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link to="/docs/welcome">Back to Welcome</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
