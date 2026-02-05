 import { DocsLayout } from "@/components/docs/DocsLayout";
 import { Button } from "@/components/ui/button";
 import { Send, Twitter, BookOpen, ExternalLink, Users, Heart } from "lucide-react";

 const communities = [
   {
     icon: Send,
     title: "Telegram",
     description: "Join our Telegram for updates, support, and community discussions.",
     href: "https://t.me/syra_ai",
     cta: "Join Telegram",
   },
   {
     icon: Twitter,
     title: "X (Twitter)",
     description: "Follow us for the latest updates, alpha, and community highlights.",
     href: "https://x.com/syra_agent",
     cta: "Follow @syra_agent",
   },
   {
     icon: BookOpen,
     title: "Documentation",
     description: "API reference, guides, and technical documentation.",
     href: "https://docs.syraa.fun",
     cta: "Open Docs",
   },
   {
     icon: ExternalLink,
     title: "Website",
     description: "Learn more about Syra and explore our products.",
     href: "https://syraa.fun",
     cta: "Visit syraa.fun",
   },
 ];
 
 const resources = [
   {
     icon: BookOpen,
     title: "Blog",
     description: "Deep dives, tutorials, and thought leadership on AI agents.",
     href: "#",
   },
   {
     icon: Users,
     title: "Showcase",
     description: "See what the community is building with Syra.",
     href: "#",
   },
   {
     icon: Heart,
     title: "Contributing",
     description: "Learn how to contribute to Syra's open-source projects.",
     href: "#",
   },
 ];
 
 export default function Community() {
   return (
     <DocsLayout>
       <div className="mb-8">
         <div className="text-sm text-primary font-medium mb-2">Resources</div>
         <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Community & Support</h1>
         <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
           Connect with the Syra community and get help when you need it.
         </p>
       </div>
 
       {/* Main communities */}
       <section className="mb-12">
         <h2 className="text-2xl font-semibold mb-6">Join the Community</h2>
         <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {communities.map((item) => (
             <a
               key={item.title}
               href={item.href}
               target="_blank"
               rel="noopener noreferrer"
               className="group p-5 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover-lift"
             >
               <item.icon className="h-8 w-8 text-primary mb-3" />
               <h3 className="font-semibold mb-1.5 group-hover:text-primary transition-colors">
                 {item.title}
               </h3>
               <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
               <Button variant="outline" size="sm" className="w-full">
                 {item.cta}
               </Button>
             </a>
           ))}
         </div>
       </section>
 
       {/* Resources */}
       <section className="mb-12">
         <h2 className="text-2xl font-semibold mb-6">Resources</h2>
         <div className="grid sm:grid-cols-3 gap-4">
           {resources.map((item) => (
             <a
               key={item.title}
               href={item.href}
               className="group flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
             >
               <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-primary shrink-0">
                 <item.icon className="h-5 w-5" />
               </div>
               <div>
                 <div className="font-medium group-hover:text-primary transition-colors">
                   {item.title}
                 </div>
                 <div className="text-sm text-muted-foreground">{item.description}</div>
               </div>
             </a>
           ))}
         </div>
       </section>
 
       {/* Support */}
       <section>
         <h2 className="text-2xl font-semibold mb-6">Get Support</h2>
         <div className="p-4 sm:p-6 rounded-xl border border-border bg-card">
           <p className="text-muted-foreground mb-5 sm:mb-6">
             Need help? Our community is here for you:
           </p>
           <ul className="space-y-4 sm:space-y-5 text-sm">
             <li className="flex flex-col gap-1.5 sm:gap-2">
               <span className="flex items-center gap-2">
                 <span className="text-primary font-medium">•</span>
                 <strong className="text-foreground">Telegram</strong>
               </span>
               <p className="text-muted-foreground pl-4 sm:pl-5">Best for quick questions and real-time help.</p>
               <a
                 href="https://t.me/syra_ai"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 w-fit min-h-[44px] px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors text-sm font-medium"
               >
                 t.me/syra_ai
                 <ExternalLink className="h-3.5 w-3.5 shrink-0" />
               </a>
             </li>
             <li className="flex flex-col gap-1.5 sm:gap-2">
               <span className="flex items-center gap-2">
                 <span className="text-primary font-medium">•</span>
                 <strong className="text-foreground">X (Twitter)</strong>
               </span>
               <p className="text-muted-foreground pl-4 sm:pl-5">Updates and community.</p>
               <a
                 href="https://x.com/syra_agent"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 w-fit min-h-[44px] px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors text-sm font-medium"
               >
                 @syra_agent
                 <ExternalLink className="h-3.5 w-3.5 shrink-0" />
               </a>
             </li>
             <li className="flex flex-col gap-1.5 sm:gap-2">
               <span className="flex items-center gap-2">
                 <span className="text-primary font-medium">•</span>
                 <strong className="text-foreground">Documentation</strong>
               </span>
               <p className="text-muted-foreground pl-4 sm:pl-5">API reference and guides.</p>
               <a
                 href="https://docs.syraa.fun"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 w-fit min-h-[44px] px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors text-sm font-medium"
               >
                 docs.syraa.fun
                 <ExternalLink className="h-3.5 w-3.5 shrink-0" />
               </a>
             </li>
             <li className="flex flex-col gap-1.5 sm:gap-2">
               <span className="flex items-center gap-2">
                 <span className="text-primary font-medium">•</span>
                 <strong className="text-foreground">API Playground</strong>
               </span>
               <p className="text-muted-foreground pl-4 sm:pl-5">Try the API interactively.</p>
               <a
                 href="https://playground.syraa.fun"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 w-fit min-h-[44px] px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors text-sm font-medium"
               >
                 playground.syraa.fun
                 <ExternalLink className="h-3.5 w-3.5 shrink-0" />
               </a>
             </li>
             <li className="flex flex-col gap-1.5 sm:gap-2">
               <span className="flex items-center gap-2">
                 <span className="text-primary font-medium">•</span>
                 <strong className="text-foreground">Email (dev)</strong>
               </span>
               <p className="text-muted-foreground pl-4 sm:pl-5">Reach out for development or partnership inquiries.</p>
               <a
                 href="mailto:ikhwanulhusna111@gmail.com"
                 className="inline-flex items-center w-fit min-h-[44px] px-3 py-2 rounded-lg bg-muted/80 text-foreground hover:bg-muted border border-border transition-colors text-sm font-medium break-all"
               >
                 ikhwanulhusna111@gmail.com
               </a>
             </li>
           </ul>
         </div>
       </section>
     </DocsLayout>
   );
 }