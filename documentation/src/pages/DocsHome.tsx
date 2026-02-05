 import { Link } from "react-router-dom";
 import { DocsLayout } from "@/components/docs/DocsLayout";
 import { CodeBlock } from "@/components/docs/CodeBlock";
 import { Button } from "@/components/ui/button";
 import { 
   ArrowRight, 
   Github, 
   MessageCircle, 
   Zap, 
   Cpu, 
   Layers,
   Globe,
   Rocket,
   Shield,
   BookOpen
 } from "lucide-react";
 
 const quickStartCode = `import { Syra, Agent } from "@syra/sdk";
 
 // Initialize Syra
 const syra = new Syra({ apiKey: process.env.SYRA_API_KEY });
 
 // Create your first agent
 const agent = new Agent({
   name: "Assistant",
   model: "syra-3",
   instructions: "You are a helpful AI assistant.",
 });
 
 // Run the agent
 const response = await agent.run("Hello, world!");
 console.log(response.output);`;
 
 const features = [
   {
     icon: Cpu,
     title: "AI Agents",
     description: "Build intelligent agents with memory, tools, and autonomous decision-making capabilities.",
     href: "/docs/core-concepts/agents",
   },
   {
     icon: Layers,
     title: "Multi-Agent Systems",
     description: "Orchestrate multiple agents to work together on complex tasks and workflows.",
     href: "/docs/core-concepts/multi-agent",
   },
   {
     icon: Globe,
     title: "Web3 Native",
     description: "First-class Solana integration for on-chain automation and wallet interactions.",
     href: "/docs/web3/wallet",
   },
   {
     icon: Zap,
     title: "Lightning Fast",
     description: "Optimized runtime with sub-100ms latency for real-time agent responses.",
     href: "/docs/getting-started/architecture",
   },
   {
     icon: Shield,
     title: "Secure by Default",
     description: "Sandboxed execution, encrypted memory, and enterprise-grade security.",
     href: "/docs/security/best-practices",
   },
   {
     icon: Rocket,
     title: "Agent Marketplace",
     description: "Deploy and monetize your agents. Use community-built templates.",
     href: "/docs/marketplace/overview",
   },
 ];
 
 export default function DocsHome() {
   return (
     <DocsLayout>
       {/* Hero Section */}
       <div className="relative pb-12 mb-12 border-b border-border">
         {/* Background glow */}
         <div className="absolute inset-0 -z-10 bg-hero-gradient" />
         
         <div className="max-w-3xl">
           <div className="flex items-center gap-2 mb-4">
             <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
               <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
               v2.0 Now Available
             </span>
           </div>
 
           <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 animate-fade-in">
             Build, deploy, and scale{" "}
             <span className="gradient-text-primary">AI agents</span>{" "}
             with Syra
           </h1>
 
           <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed animate-fade-in animation-delay-100">
             Syra is the modern platform for building autonomous AI agents. 
             From solo indie hackers to enterprise teams, power your next-gen 
             applications with multi-agent systems, Web3 integration, and 
             intelligent automation.
           </p>
 
           <div className="flex flex-wrap gap-3 animate-fade-in animation-delay-200">
             <Button variant="primary" size="lg" asChild>
               <Link to="/docs/getting-started/quick-start">
                 Get Started
                 <ArrowRight className="ml-2 h-4 w-4" />
               </Link>
             </Button>
             <Button variant="outline" size="lg" asChild>
               <a href="https://github.com/syra" target="_blank" rel="noopener noreferrer">
                 <Github className="mr-2 h-4 w-4" />
                 View on GitHub
               </a>
             </Button>
             <Button variant="ghost" size="lg" asChild>
               <a href="https://discord.gg/syra" target="_blank" rel="noopener noreferrer">
                 <MessageCircle className="mr-2 h-4 w-4" />
                 Join Community
               </a>
             </Button>
           </div>
         </div>
       </div>
 
       {/* Quick Start */}
       <section className="mb-16">
         <div className="flex items-center gap-2 mb-4">
           <BookOpen className="h-5 w-5 text-primary" />
           <h2 className="text-2xl font-semibold">Quick Start</h2>
         </div>
         <p className="text-muted-foreground mb-6">
           Get up and running with Syra in under 5 minutes.
         </p>
         
         <CodeBlock code={quickStartCode} language="typescript" filename="index.ts" showLineNumbers />
 
         <div className="flex gap-3 mt-6">
           <Button variant="default" size="sm" asChild>
             <Link to="/docs/installation/cli">
               Installation Guide
               <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
             </Link>
           </Button>
           <Button variant="ghost" size="sm" asChild>
             <Link to="/docs/tutorials/first-agent">
               Full Tutorial
             </Link>
           </Button>
         </div>
       </section>
 
       {/* Features Grid */}
       <section className="mb-16">
         <h2 className="text-2xl font-semibold mb-6">Why Syra?</h2>
         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
           {features.map((feature) => (
             <Link
               key={feature.title}
               to={feature.href}
               className="group p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/30 transition-all duration-300 hover-lift"
             >
               <feature.icon className="h-8 w-8 text-primary mb-3 transition-transform group-hover:scale-110" />
               <h3 className="font-semibold mb-1.5 group-hover:text-primary transition-colors">
                 {feature.title}
               </h3>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 {feature.description}
               </p>
             </Link>
           ))}
         </div>
       </section>
 
       {/* Getting Started Links */}
       <section className="mb-16">
         <h2 className="text-2xl font-semibold mb-6">Explore the Docs</h2>
         <div className="grid sm:grid-cols-2 gap-4">
           <Link
             to="/docs/getting-started/what-is-syra"
             className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors group"
           >
             <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
               <BookOpen className="h-5 w-5" />
             </div>
             <div>
               <div className="font-medium group-hover:text-primary transition-colors">What is Syra?</div>
               <div className="text-sm text-muted-foreground">Learn the fundamentals</div>
             </div>
             <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
           </Link>
 
           <Link
             to="/docs/core-concepts/agents"
             className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors group"
           >
             <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
               <Cpu className="h-5 w-5" />
             </div>
             <div>
               <div className="font-medium group-hover:text-primary transition-colors">Core Concepts</div>
               <div className="text-sm text-muted-foreground">Agents, memory, tools</div>
             </div>
             <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
           </Link>
 
           <Link
             to="/docs/api-reference"
             className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors group"
           >
             <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
               <Layers className="h-5 w-5" />
             </div>
             <div>
               <div className="font-medium group-hover:text-primary transition-colors">API Reference</div>
               <div className="text-sm text-muted-foreground">Complete SDK docs</div>
             </div>
             <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
           </Link>
 
           <Link
             to="/docs/tutorials/first-agent"
             className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors group"
           >
             <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
               <Rocket className="h-5 w-5" />
             </div>
             <div>
               <div className="font-medium group-hover:text-primary transition-colors">Tutorials</div>
               <div className="text-sm text-muted-foreground">Step-by-step guides</div>
             </div>
             <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
           </Link>
         </div>
       </section>
 
       {/* Footer */}
       <footer className="pt-8 border-t border-border text-sm text-muted-foreground">
         <div className="flex flex-wrap justify-between items-center gap-4">
           <div>© 2024 Syra. Built for builders.</div>
           <div className="flex gap-4">
             <a href="https://github.com/syra" className="hover:text-foreground transition-colors">
               GitHub
             </a>
             <a href="https://twitter.com/syra" className="hover:text-foreground transition-colors">
               Twitter
             </a>
             <a href="https://discord.gg/syra" className="hover:text-foreground transition-colors">
               Discord
             </a>
           </div>
         </div>
       </footer>
     </DocsLayout>
   );
 }