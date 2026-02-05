 import { Link } from "react-router-dom";
 import { DocsLayout } from "@/components/docs/DocsLayout";
 import { CodeBlock } from "@/components/docs/CodeBlock";
 import { ArrowRight, CheckCircle } from "lucide-react";
 
 const tocItems = [
   { id: "what-is-syra", title: "What is Syra?", level: 2 },
   { id: "key-features", title: "Key Features", level: 2 },
   { id: "architecture", title: "Architecture", level: 2 },
   { id: "next-steps", title: "Next Steps", level: 2 },
 ];
 
 export default function GettingStarted() {
   return (
     <DocsLayout toc={tocItems}>
       <div className="mb-8">
         <div className="text-sm text-primary font-medium mb-2">Getting Started</div>
         <h1 className="text-4xl font-bold tracking-tight mb-4">What is Syra?</h1>
         <p className="text-xl text-muted-foreground leading-relaxed">
           Syra is an open-source platform for building, deploying, and scaling AI agents 
           with first-class support for multi-agent systems and Web3 integration.
         </p>
       </div>
 
       <section id="what-is-syra" className="mb-12 scroll-mt-24">
         <p className="text-muted-foreground leading-relaxed mb-6">
           Unlike traditional AI frameworks, Syra is designed from the ground up for 
           autonomous agents that can reason, remember, and take action. Whether you're 
           building a simple chatbot or a complex multi-agent system, Syra provides the 
           primitives you need.
         </p>
 
         <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 mb-6">
           <p className="text-sm">
             <strong className="text-primary">Built for the future.</strong>{" "}
             Syra embraces the agentic paradigm — where AI doesn't just respond, 
             but actively solves problems through planning, tool use, and collaboration.
           </p>
         </div>
       </section>
 
       <section id="key-features" className="mb-12 scroll-mt-24">
         <h2 className="text-2xl font-semibold mb-6">Key Features</h2>
         
         <div className="space-y-4">
           {[
             {
               title: "Autonomous Agents",
               description: "Build agents with memory, reasoning, and the ability to use tools and take actions.",
             },
             {
               title: "Multi-Agent Orchestration",
               description: "Create systems where multiple agents collaborate, delegate, and communicate.",
             },
             {
               title: "Web3 Native",
               description: "First-class Solana integration with wallet connection, transaction signing, and on-chain automation.",
             },
             {
               title: "Agent Marketplace",
               description: "Discover, deploy, and monetize agents built by the community.",
             },
             {
               title: "Developer Experience",
               description: "TypeScript-first SDK, powerful CLI, and real-time debugging tools.",
             },
             {
               title: "Enterprise Ready",
               description: "Sandboxed execution, encrypted memory, and SOC 2 compliance.",
             },
           ].map((feature) => (
             <div key={feature.title} className="flex gap-3">
               <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
               <div>
                 <div className="font-medium">{feature.title}</div>
                 <div className="text-sm text-muted-foreground">{feature.description}</div>
               </div>
             </div>
           ))}
         </div>
       </section>
 
       <section id="architecture" className="mb-12 scroll-mt-24">
         <h2 className="text-2xl font-semibold mb-6">Architecture Overview</h2>
         
         <p className="text-muted-foreground mb-6">
           Syra follows a modular architecture designed for flexibility and scale:
         </p>
 
         <div className="p-6 rounded-xl border border-border bg-card mb-6">
           <div className="grid grid-cols-3 gap-4 text-center text-sm">
             <div className="p-4 rounded-lg bg-muted">
               <div className="font-medium mb-1">Your App</div>
               <div className="text-xs text-muted-foreground">React, Node, etc.</div>
             </div>
             <div className="col-span-2 p-4 rounded-lg border-2 border-dashed border-primary/30">
               <div className="font-medium text-primary mb-1">Syra SDK</div>
               <div className="text-xs text-muted-foreground">Agents, Memory, Tools</div>
             </div>
           </div>
           <div className="mt-4 p-4 rounded-lg bg-muted/50 text-center text-sm">
             <div className="font-medium mb-1">Syra Cloud</div>
             <div className="text-xs text-muted-foreground">Runtime • Memory Store • Agent Registry</div>
           </div>
         </div>
 
         <CodeBlock 
           code={`// The SDK handles all the complexity
 import { Syra } from "@syra/sdk";
 
 const syra = new Syra({ apiKey: "..." });
 const agent = syra.agent("my-agent");
 const result = await agent.run("Analyze this data");`}
           language="typescript"
         />
       </section>
 
       <section id="next-steps" className="mb-12 scroll-mt-24">
         <h2 className="text-2xl font-semibold mb-6">Next Steps</h2>
         
         <div className="grid sm:grid-cols-2 gap-4">
           <Link
             to="/docs/installation/cli"
             className="group p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
           >
             <div className="font-medium mb-1 group-hover:text-primary transition-colors flex items-center gap-2">
               Install the CLI
               <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
             </div>
             <div className="text-sm text-muted-foreground">Set up your development environment</div>
           </Link>
 
           <Link
             to="/docs/getting-started/quick-start"
             className="group p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
           >
             <div className="font-medium mb-1 group-hover:text-primary transition-colors flex items-center gap-2">
               Quick Start Guide
               <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
             </div>
             <div className="text-sm text-muted-foreground">Build your first agent in 5 minutes</div>
           </Link>
         </div>
       </section>
 
       {/* Navigation */}
       <div className="flex justify-between items-center pt-8 mt-8 border-t border-border">
         <div />
         <Link
           to="/docs/getting-started/key-concepts"
           className="group flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
         >
           Key Concepts
           <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
         </Link>
       </div>
     </DocsLayout>
   );
 }