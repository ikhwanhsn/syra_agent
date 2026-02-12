import { useParams, Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { getApiDoc } from "@/data/apiDocs";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApiDocPage() {
  const { slug } = useParams<{ slug: string }>();
  const doc = slug ? getApiDoc(slug) : null;

  if (!doc) {
    return (
      <DocsLayout>
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-4">API not found</h1>
          <p className="text-muted-foreground mb-6">The API "{slug}" does not exist or has been moved.</p>
          <Button variant="outline" asChild>
            <Link to="/docs/api-reference">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to API Reference
            </Link>
          </Button>
        </div>
      </DocsLayout>
    );
  }

  const tocItems = [
    { id: "overview", title: "Overview", level: 2 },
    { id: "base-url", title: "Base URL & Price", level: 2 },
    { id: "authentication", title: "Authentication", level: 2 },
    { id: "endpoints", title: "Endpoints", level: 2 },
    ...doc.endpoints.map((e, i) => ({ id: `endpoint-${i}`, title: `${e.method} ${e.path}`, level: 3 })),
    { id: "payment-flow", title: "Payment Flow", level: 2 },
    { id: "response-codes", title: "Response Codes", level: 2 },
    { id: "support", title: "Support", level: 2 },
  ];

  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">API Documentation</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{doc.title}</h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">{doc.overview}</p>
      </div>

      <section id="base-url" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Base URL & Price</h2>
        <div className="p-4 rounded-lg border border-border bg-card space-y-2">
          <div className="flex items-center gap-2 text-sm font-mono">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">Base URL</span>
            <span className="text-muted-foreground">{doc.baseUrl}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 rounded bg-muted text-foreground font-medium">Price</span>
            <span className="text-muted-foreground">{doc.price}</span>
          </div>
        </div>
      </section>

      <section id="authentication" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
        <p className="text-muted-foreground">{doc.authNote}</p>
      </section>

      {doc.useCases && doc.useCases.length > 0 && (
        <section className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-semibold mb-4">Use Cases</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            {doc.useCases.map((useCase) => (
              <li key={useCase}>{useCase}</li>
            ))}
          </ul>
        </section>
      )}

      <section id="endpoints" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-6">Endpoints</h2>
        <div className="space-y-10">
          {doc.endpoints.map((endpoint, index) => (
            <div
              key={index}
              id={`endpoint-${index}`}
              className="scroll-mt-24 pb-10 border-b border-border last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={
                    endpoint.method === "GET"
                      ? "px-2 py-1 text-xs font-medium rounded bg-success/20 text-success"
                      : "px-2 py-1 text-xs font-medium rounded bg-primary/20 text-primary"
                  }
                >
                  {endpoint.method}
                </span>
                <code className="text-sm font-mono">{endpoint.path}</code>
              </div>
              <p className="text-muted-foreground mb-4">{endpoint.description}</p>

              {endpoint.params && endpoint.params.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">Query parameters</h4>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left p-3 font-medium">Parameter</th>
                          <th className="text-left p-3 font-medium">Type</th>
                          <th className="text-left p-3 font-medium">Required</th>
                          <th className="text-left p-3 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        {endpoint.params.map((param) => (
                          <tr key={param.name} className="border-b border-border/50 last:border-0">
                            <td className="p-3 font-mono text-primary">{param.name}</td>
                            <td className="p-3">{param.type}</td>
                            <td className="p-3">{param.required}</td>
                            <td className="p-3">{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {endpoint.bodyExample && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">Request body</h4>
                  <CodeBlock plain code={endpoint.bodyExample.trim()} language="json" showLineNumbers={false} />
                </div>
              )}

              <h4 className="text-sm font-semibold mb-2">Example request</h4>
              <CodeBlock plain code={endpoint.requestExample.trim()} language="bash" showLineNumbers={false} />

              <h4 className="text-sm font-semibold mb-2 mt-4">Response (200)</h4>
              <CodeBlock
                plain
                code={typeof endpoint.responseExample === "string" ? endpoint.responseExample.trim() : JSON.stringify(endpoint.responseExample, null, 2)}
                language="json"
                showLineNumbers={false}
              />
            </div>
          ))}
        </div>
      </section>

      <section id="payment-flow" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Payment Flow</h2>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-4">
          <li>{doc.paymentFlow.step1}</li>
          <li>{doc.paymentFlow.step2}</li>
          <li>{doc.paymentFlow.step3}</li>
        </ol>
        <p className="text-sm font-medium text-foreground mb-2">Standard 402 response</p>
        <CodeBlock plain code={doc.paymentFlow.response402.trim()} language="json" showLineNumbers={false} />
      </section>

      <section id="response-codes" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Response Codes</h2>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium">Code</th>
                <th className="text-left p-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {doc.responseCodes.map((row) => (
                <tr key={row.code} className="border-b border-border/50 last:border-0">
                  <td className="p-3 font-mono text-foreground">{row.code}</td>
                  <td className="p-3">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {doc.extraSections && doc.extraSections.length > 0 && (
        <>
          {doc.extraSections.map((section) => (
            <section key={section.title} className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
              <p className="text-muted-foreground">{section.content}</p>
            </section>
          ))}
        </>
      )}

      <section id="support" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Support</h2>
        <p className="text-muted-foreground mb-4">
          For payment-related issues or API support:
        </p>
        {/* Hidden: focus on website — Telegram support link
        <Button variant="outline" size="sm" asChild>
          <a href={doc.supportLink} target="_blank" rel="noopener noreferrer">
            Telegram
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </a>
        </Button>
        */}
      </section>

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button variant="outline" asChild>
          <Link to="/docs/api-reference">
            <ArrowLeft className="mr-2 h-4 w-4" />
            API Overview
          </Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
