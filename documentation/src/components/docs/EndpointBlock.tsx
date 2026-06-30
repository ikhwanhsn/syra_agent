import { cn } from "@/lib/utils";
import { CodeBlock } from "./CodeBlock";
import { ParamTable, type ParamRow } from "./ParamTable";

export interface EndpointExample {
  label?: string;
  language?: string;
  code: string;
  plain?: boolean;
}

export interface EndpointData {
  id: string;
  method: string;
  path: string;
  description: string;
  params?: ParamRow[];
  requestExample?: string;
  responseExample?: string;
  examples?: EndpointExample[];
}

interface EndpointBlockProps {
  endpoint: EndpointData;
  className?: string;
}

function methodColor(method: string): string {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-success/15 text-success border-success/30";
    case "POST":
      return "bg-primary/15 text-primary border-primary/30";
    case "PUT":
    case "PATCH":
      return "bg-warning/15 text-warning border-warning/30";
    case "DELETE":
      return "bg-destructive/15 text-destructive border-destructive/30";
    default:
      return "bg-muted text-foreground border-border";
  }
}

export function EndpointBlock({ endpoint, className }: EndpointBlockProps) {
  return (
    <article
      id={endpoint.id}
      className={cn("scroll-mt-24 pb-10 border-b border-border/60 last:border-0 last:pb-0", className)}
    >
      <div className="sticky top-[calc(var(--docs-header-height)+1px)] z-10 -mx-1 px-1 py-3 mb-4 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border",
              methodColor(endpoint.method)
            )}
          >
            {endpoint.method}
          </span>
          <code className="text-sm font-mono text-foreground break-all">{endpoint.path}</code>
        </div>
      </div>

      <p className="text-muted-foreground mb-4 leading-7">{endpoint.description}</p>

      {endpoint.params && endpoint.params.length > 0 && (
        <ParamTable params={endpoint.params} />
      )}

      {endpoint.requestExample && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Request example</h4>
          <CodeBlock code={endpoint.requestExample} language="bash" plain />
        </div>
      )}

      {endpoint.responseExample && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Response example</h4>
          <CodeBlock code={endpoint.responseExample} language="json" plain />
        </div>
      )}

      {endpoint.examples?.map((ex, i) => (
        <div key={i} className="mt-4">
          {ex.label && <h4 className="text-sm font-semibold text-foreground mb-2">{ex.label}</h4>}
          <CodeBlock code={ex.code} language={ex.language ?? "bash"} plain={ex.plain ?? true} />
        </div>
      ))}
    </article>
  );
}
