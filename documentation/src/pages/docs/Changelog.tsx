 import { DocsLayout } from "@/components/docs/DocsLayout";
 import { Badge } from "@/components/ui/badge";
 
 const releases = [
   {
     version: "2.0.0",
     date: "January 15, 2024",
     type: "major" as const,
     changes: [
       "Multi-agent orchestration with team workflows",
       "New syra-3 model with improved reasoning",
       "Native Solana wallet integration",
       "Agent marketplace launch",
       "Streaming responses support",
       "60% latency improvement",
     ],
   },
   {
     version: "1.5.0",
     date: "December 1, 2023",
     type: "minor" as const,
     changes: [
       "Memory persistence across sessions",
       "Custom tool definitions",
       "Rate limit improvements",
       "TypeScript SDK enhancements",
     ],
   },
   {
     version: "1.4.0",
     date: "October 15, 2023",
     type: "minor" as const,
     changes: [
       "Improved error handling",
       "Agent debugging tools",
       "Webhook support",
       "CLI v2 release",
     ],
   },
 ];
 
 const roadmap = [
   { title: "Voice agents", status: "In Progress", q: "Q1 2024" },
   { title: "Visual reasoning", status: "Planned", q: "Q2 2024" },
   { title: "Agent-to-agent protocols", status: "Planned", q: "Q2 2024" },
   { title: "Self-improving agents", status: "Research", q: "Q3 2024" },
 ];
 
 export default function Changelog() {
   return (
     <DocsLayout>
       <div className="mb-8">
         <div className="text-sm text-primary font-medium mb-2">Resources</div>
         <h1 className="text-4xl font-bold tracking-tight mb-4">Changelog & Roadmap</h1>
         <p className="text-xl text-muted-foreground leading-relaxed">
           Track our progress and see what's coming next.
         </p>
       </div>
 
       {/* Roadmap */}
       <section className="mb-12">
         <h2 className="text-2xl font-semibold mb-6">Roadmap</h2>
         <div className="grid sm:grid-cols-2 gap-4">
           {roadmap.map((item) => (
             <div
               key={item.title}
               className="p-4 rounded-lg border border-border bg-card"
             >
               <div className="flex items-center justify-between mb-2">
                 <span className="font-medium">{item.title}</span>
                 <span className="text-xs text-muted-foreground">{item.q}</span>
               </div>
               <Badge
                 variant={
                   item.status === "In Progress"
                     ? "default"
                     : item.status === "Planned"
                     ? "secondary"
                     : "outline"
                 }
                 className="text-xs"
               >
                 {item.status}
               </Badge>
             </div>
           ))}
         </div>
       </section>
 
       {/* Releases */}
       <section>
         <h2 className="text-2xl font-semibold mb-6">Releases</h2>
         <div className="space-y-8">
           {releases.map((release) => (
             <div key={release.version} className="relative pl-6 border-l-2 border-border">
               <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-primary" />
               <div className="flex items-center gap-3 mb-3">
                 <span className="text-lg font-semibold">v{release.version}</span>
                 <Badge
                   variant={release.type === "major" ? "default" : "secondary"}
                   className="text-xs"
                 >
                   {release.type}
                 </Badge>
                 <span className="text-sm text-muted-foreground">{release.date}</span>
               </div>
               <ul className="space-y-1.5">
                 {release.changes.map((change, i) => (
                   <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                     <span className="text-primary mt-1">•</span>
                     {change}
                   </li>
                 ))}
               </ul>
             </div>
           ))}
         </div>
       </section>
     </DocsLayout>
   );
 }