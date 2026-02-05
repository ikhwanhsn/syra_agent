 import { Link } from "react-router-dom";
 import { DocsLayout } from "@/components/docs/DocsLayout";
 import { CodeBlock } from "@/components/docs/CodeBlock";
 import { ArrowLeft, ArrowRight, Terminal, Package, Settings } from "lucide-react";
 
 const tocItems = [
   { id: "cli-installation", title: "CLI Installation", level: 2 },
   { id: "sdk-setup", title: "SDK Setup", level: 2 },
   { id: "environment-config", title: "Environment Configuration", level: 2 },
   { id: "verify-installation", title: "Verify Installation", level: 2 },
 ];
 
 export default function Installation() {
   return (
     <DocsLayout toc={tocItems}>
       <div className="mb-8">
         <div className="text-sm text-primary font-medium mb-2">Installation</div>
         <h1 className="text-4xl font-bold tracking-tight mb-4">CLI Setup</h1>
         <p className="text-xl text-muted-foreground leading-relaxed">
           Install the Syra CLI and SDK to start building AI agents.
         </p>
       </div>
 
       <section id="cli-installation" className="mb-12 scroll-mt-24">
         <div className="flex items-center gap-2 mb-4">
           <Terminal className="h-5 w-5 text-primary" />
           <h2 className="text-2xl font-semibold">CLI Installation</h2>
         </div>
         
         <p className="text-muted-foreground mb-6">
           The Syra CLI is the fastest way to scaffold projects, manage agents, and deploy to production.
         </p>
 
         <div className="mb-6">
           <div className="text-sm font-medium mb-2">Using npm</div>
           <CodeBlock code="npm install -g @syra/cli" language="bash" />
         </div>
 
         <div className="mb-6">
           <div className="text-sm font-medium mb-2">Using pnpm</div>
           <CodeBlock code="pnpm add -g @syra/cli" language="bash" />
         </div>
 
         <div className="mb-6">
           <div className="text-sm font-medium mb-2">Using Homebrew (macOS)</div>
           <CodeBlock code="brew install syra" language="bash" />
         </div>
 
         <div className="p-4 rounded-lg border border-border bg-muted/30">
           <p className="text-sm text-muted-foreground">
             <strong className="text-foreground">Note:</strong> The CLI requires Node.js 18+ and npm 8+.
           </p>
         </div>
       </section>
 
       <section id="sdk-setup" className="mb-12 scroll-mt-24">
         <div className="flex items-center gap-2 mb-4">
           <Package className="h-5 w-5 text-primary" />
           <h2 className="text-2xl font-semibold">SDK Setup</h2>
         </div>
         
         <p className="text-muted-foreground mb-6">
           Add the Syra SDK to your project to start building agents programmatically.
         </p>
 
         <CodeBlock code="npm install @syra/sdk" language="bash" />
 
         <p className="text-muted-foreground my-6">
           Then import and initialize the SDK in your code:
         </p>
 
         <CodeBlock 
           code={`import { Syra } from "@syra/sdk";
 
 // Initialize with your API key
 const syra = new Syra({
   apiKey: process.env.SYRA_API_KEY,
   // Optional: specify region
   region: "us-west-2",
 });
 
 // The SDK is now ready to use
 export { syra };`}
           language="typescript"
           filename="lib/syra.ts"
           showLineNumbers
         />
       </section>
 
       <section id="environment-config" className="mb-12 scroll-mt-24">
         <div className="flex items-center gap-2 mb-4">
           <Settings className="h-5 w-5 text-primary" />
           <h2 className="text-2xl font-semibold">Environment Configuration</h2>
         </div>
         
         <p className="text-muted-foreground mb-6">
           Configure your environment variables for local development.
         </p>
 
         <CodeBlock 
           code={`# .env.local
 
 # Your Syra API key (required)
 SYRA_API_KEY=syra_sk_live_...
 
 # Optional: Enable debug logging
 SYRA_DEBUG=true
 
 # Optional: Specify environment
 SYRA_ENV=development
 
 # For Web3 features (optional)
 SOLANA_RPC_URL=https://api.mainnet-beta.solana.com`}
           language="env"
           filename=".env.local"
         />
 
         <div className="mt-6 p-4 rounded-lg border border-warning/20 bg-warning/5">
           <p className="text-sm">
             <strong className="text-warning">Security Warning:</strong>{" "}
             Never commit your API keys to version control. Add <code className="text-primary">.env.local</code> to your <code className="text-primary">.gitignore</code>.
           </p>
         </div>
       </section>
 
       <section id="verify-installation" className="mb-12 scroll-mt-24">
         <h2 className="text-2xl font-semibold mb-4">Verify Installation</h2>
         
         <p className="text-muted-foreground mb-6">
           Run the following command to verify your installation:
         </p>
 
         <CodeBlock 
           code={`$ syra --version
 Syra CLI v2.0.0
 
 $ syra doctor
 ✓ Node.js v20.10.0
 ✓ npm v10.2.0
 ✓ API key configured
 ✓ Network connectivity
 
 All checks passed!`}
           language="bash"
         />
       </section>
 
       {/* Navigation */}
       <div className="flex justify-between items-center pt-8 mt-8 border-t border-border">
         <Link
           to="/docs/getting-started/what-is-syra"
           className="group flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
         >
           <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
           What is Syra?
         </Link>
         <Link
           to="/docs/core-concepts/agents"
           className="group flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
         >
           Core Concepts
           <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
         </Link>
       </div>
     </DocsLayout>
   );
 }