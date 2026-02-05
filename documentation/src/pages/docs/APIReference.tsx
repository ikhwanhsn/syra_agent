 import { Link } from "react-router-dom";
 import { DocsLayout } from "@/components/docs/DocsLayout";
 import { CodeBlock } from "@/components/docs/CodeBlock";
 import { ArrowLeft, ArrowRight, FileJson } from "lucide-react";
 
 const tocItems = [
   { id: "overview", title: "Overview", level: 2 },
   { id: "authentication", title: "Authentication", level: 2 },
   { id: "endpoints", title: "Endpoints", level: 2 },
   { id: "agent-run", title: "Run Agent", level: 3 },
   { id: "agent-create", title: "Create Agent", level: 3 },
   { id: "errors", title: "Error Handling", level: 2 },
 ];
 
 export default function APIReference() {
   return (
     <DocsLayout toc={tocItems}>
       <div className="mb-8">
         <div className="text-sm text-primary font-medium mb-2">API Reference</div>
         <h1 className="text-4xl font-bold tracking-tight mb-4">Overview</h1>
         <p className="text-xl text-muted-foreground leading-relaxed">
           Complete reference for the Syra REST API and SDK methods.
         </p>
       </div>
 
       <section id="overview" className="mb-12 scroll-mt-24">
         <div className="p-4 rounded-lg border border-border bg-card">
           <div className="flex items-center gap-2 text-sm font-mono mb-2">
             <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">BASE URL</span>
             <span className="text-muted-foreground">https://api.syra.ai/v2</span>
           </div>
           <p className="text-sm text-muted-foreground">
             All API requests should be made to this base URL. The API uses JSON for all requests and responses.
           </p>
         </div>
       </section>
 
       <section id="authentication" className="mb-12 scroll-mt-24">
         <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
         
         <p className="text-muted-foreground mb-6">
           Authenticate requests using your API key in the Authorization header:
         </p>
 
         <CodeBlock 
           code={`curl -X POST https://api.syra.ai/v2/agents/run \\
   -H "Authorization: Bearer syra_sk_live_..." \\
   -H "Content-Type: application/json" \\
   -d '{"agent_id": "asst_123", "input": "Hello"}'`}
           language="bash"
         />
       </section>
 
       <section id="endpoints" className="mb-12 scroll-mt-24">
         <h2 className="text-2xl font-semibold mb-6">Endpoints</h2>
 
         <div id="agent-run" className="mb-8 scroll-mt-24">
           <div className="flex items-center gap-3 mb-4">
             <span className="px-2 py-1 text-xs font-medium rounded bg-success/20 text-success">POST</span>
             <code className="text-sm font-mono">/agents/run</code>
           </div>
           
           <p className="text-muted-foreground mb-4">
             Execute an agent with the given input.
           </p>
 
           <div className="mb-4">
             <div className="text-sm font-medium mb-2">Request Body</div>
             <CodeBlock 
               code={`{
   "agent_id": "asst_abc123",
   "input": "What is the capital of France?",
   "context": {
     "user_id": "usr_123"
   },
   "stream": false
 }`}
               language="json"
             />
           </div>
 
           <div>
             <div className="text-sm font-medium mb-2">Response</div>
             <CodeBlock 
               code={`{
   "id": "run_xyz789",
   "status": "completed",
   "output": "The capital of France is Paris.",
   "usage": {
     "input_tokens": 12,
     "output_tokens": 8,
     "total_tokens": 20
   },
   "created_at": "2024-01-15T10:30:00Z"
 }`}
               language="json"
             />
           </div>
         </div>
 
         <div id="agent-create" className="mb-8 scroll-mt-24">
           <div className="flex items-center gap-3 mb-4">
             <span className="px-2 py-1 text-xs font-medium rounded bg-success/20 text-success">POST</span>
             <code className="text-sm font-mono">/agents</code>
           </div>
           
           <p className="text-muted-foreground mb-4">
             Create a new agent.
           </p>
 
           <CodeBlock 
             code={`{
   "name": "Customer Support",
   "model": "syra-3",
   "instructions": "You are a helpful customer support agent.",
   "tools": ["web_search", "send_email"],
   "memory": {
     "enabled": true,
     "type": "conversation"
   }
 }`}
             language="json"
           />
         </div>
       </section>
 
       <section id="errors" className="mb-12 scroll-mt-24">
         <h2 className="text-2xl font-semibold mb-4">Error Handling</h2>
         
         <p className="text-muted-foreground mb-6">
           The API uses standard HTTP status codes and returns detailed error messages:
         </p>
 
         <div className="overflow-x-auto mb-6">
           <table className="w-full text-sm">
             <thead>
               <tr className="border-b border-border">
                 <th className="text-left py-3 pr-4 font-medium">Status</th>
                 <th className="text-left py-3 pr-4 font-medium">Code</th>
                 <th className="text-left py-3 font-medium">Description</th>
               </tr>
             </thead>
             <tbody className="text-muted-foreground">
               <tr className="border-b border-border">
                 <td className="py-3 pr-4 font-mono">400</td>
                 <td className="py-3 pr-4 font-mono text-warning">invalid_request</td>
                 <td className="py-3">The request was malformed or missing required parameters</td>
               </tr>
               <tr className="border-b border-border">
                 <td className="py-3 pr-4 font-mono">401</td>
                 <td className="py-3 pr-4 font-mono text-warning">unauthorized</td>
                 <td className="py-3">Invalid or missing API key</td>
               </tr>
               <tr className="border-b border-border">
                 <td className="py-3 pr-4 font-mono">404</td>
                 <td className="py-3 pr-4 font-mono text-warning">not_found</td>
                 <td className="py-3">The requested resource was not found</td>
               </tr>
               <tr className="border-b border-border">
                 <td className="py-3 pr-4 font-mono">429</td>
                 <td className="py-3 pr-4 font-mono text-warning">rate_limited</td>
                 <td className="py-3">Too many requests, please slow down</td>
               </tr>
               <tr>
                 <td className="py-3 pr-4 font-mono">500</td>
                 <td className="py-3 pr-4 font-mono text-destructive">server_error</td>
                 <td className="py-3">An internal server error occurred</td>
               </tr>
             </tbody>
           </table>
         </div>
 
         <CodeBlock 
           code={`{
   "error": {
     "code": "rate_limited",
     "message": "Rate limit exceeded. Please retry after 60 seconds.",
     "retry_after": 60
   }
 }`}
           language="json"
         />
       </section>
 
       {/* Navigation */}
       <div className="flex justify-between items-center pt-8 mt-8 border-t border-border">
         <Link
           to="/docs/marketplace/publishing"
           className="group flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
         >
           <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
           Publishing Agents
         </Link>
         <Link
           to="/docs/api-reference/endpoints"
           className="group flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
         >
           All Endpoints
           <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
         </Link>
       </div>
     </DocsLayout>
   );
 }