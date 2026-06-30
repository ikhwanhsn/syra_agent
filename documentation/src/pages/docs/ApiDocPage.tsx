import { useParams, Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { EndpointBlock } from "@/components/docs/EndpointBlock";
import { ResponseTable } from "@/components/docs/ParamTable";
import { getApiDoc, type ApiParam } from "@/data/apiDocs";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function mapParams(params: ApiParam[] | undefined) {
  return params?.map((p) => ({
    name: p.name,
    type: p.type,
    required: p.required.toLowerCase() === "yes" || p.required.toLowerCase() === "true",
    description: p.description,
  }));
}

export default function ApiDocPage() {
  const { slug } = useParams<{ slug: string }>();
  const doc = slug ? getApiDoc(slug) : null;

  if (!doc) {
    return (
      <DocsLayout>
        <DocPageHeader
          title="API not found"
          description={`The API "${slug}" does not exist or has been moved.`}
        />
        <Button variant="outline" asChild>
          <Link to="/docs/api-reference">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to API Reference
          </Link>
        </Button>
      </DocsLayout>
    );
  }

  const tocItems = [
    { id: "base-url", title: "Base URL & Price", level: 2 },
    { id: "authentication", title: "Authentication", level: 2 },
    { id: "endpoints", title: "Endpoints", level: 2 },
    ...doc.endpoints.map((e, i) => ({ id: `endpoint-${i}`, title: `${e.method} ${e.path}`, level: 3 })),
    { id: "payment-flow", title: "Payment Flow", level: 2 },
    { id: "response-codes", title: "Response Codes", level: 2 },
    { id: "support", title: "Support", level: 2 },
  ];

  return (
    <DocsLayout toc={tocItems} wide>
      <DocPageHeader
        eyebrow="API Documentation"
        title={doc.title}
        description={doc.overview}
        wide
      />

      <DocSection id="base-url" title="Base URL & Price">
        <div className="grid sm:grid-cols-2 gap-3 not-prose">
          <div className="rounded-lg border border-border/60 p-4 bg-muted/20">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Base URL</p>
            <code className="text-sm font-mono text-foreground break-all">{doc.baseUrl}</code>
          </div>
          <div className="rounded-lg border border-border/60 p-4 bg-muted/20">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Price</p>
            <p className="text-sm text-foreground">{doc.price}</p>
          </div>
        </div>
      </DocSection>

      <DocSection id="authentication" title="Authentication">
        <Callout variant="important" title="x402 payment required">
          {doc.authNote}
        </Callout>
      </DocSection>

      {doc.useCases && doc.useCases.length > 0 && (
        <DocSection id="use-cases" title="Use Cases" prose>
          <ul>
            {doc.useCases.map((useCase) => (
              <li key={useCase}>{useCase}</li>
            ))}
          </ul>
        </DocSection>
      )}

      <section id="endpoints" className="mb-12 scroll-mt-24">
        <h2 className="docs-display text-2xl font-semibold tracking-tight mb-6">Endpoints</h2>
        <div className="space-y-2">
          {doc.endpoints.map((endpoint, index) => (
            <EndpointBlock
              key={index}
              endpoint={{
                id: `endpoint-${index}`,
                method: endpoint.method,
                path: endpoint.path,
                description: endpoint.description,
                params: mapParams(endpoint.params),
                requestExample: endpoint.requestExample.trim(),
                responseExample:
                  typeof endpoint.responseExample === "string"
                    ? endpoint.responseExample.trim()
                    : JSON.stringify(endpoint.responseExample, null, 2),
                examples: endpoint.bodyExample
                  ? [
                      {
                        label: "Request body",
                        code: endpoint.bodyExample.trim(),
                        language: "json",
                        plain: true,
                      },
                    ]
                  : undefined,
              }}
            />
          ))}
        </div>
      </section>

      <DocSection id="payment-flow" title="Payment Flow" prose>
        <ol>
          <li>{doc.paymentFlow.step1}</li>
          <li>{doc.paymentFlow.step2}</li>
          <li>{doc.paymentFlow.step3}</li>
        </ol>
        <p>
          <strong>Standard 402 response</strong>
        </p>
        <CodeBlock plain code={doc.paymentFlow.response402.trim()} language="json" />
      </DocSection>

      <section id="response-codes" className="mb-12 scroll-mt-24">
        <h2 className="docs-display text-2xl font-semibold tracking-tight mb-4">Response Codes</h2>
        <ResponseTable codes={doc.responseCodes.map((r) => ({ code: r.code, description: r.description }))} />
      </section>

      {doc.extraSections?.map((section) => (
        <DocSection key={section.title} id={section.title.toLowerCase().replace(/\s+/g, "-")} title={section.title} prose>
          <p>{section.content}</p>
        </DocSection>
      ))}

      <DocSection id="support" title="Support" prose>
        <p>For payment-related issues or API support, reach out via the Syra community channels.</p>
      </DocSection>

      <div className="not-prose pt-4">
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
