 import { DocsLayout } from "@/components/docs/DocsLayout";
 import { Button } from "@/components/ui/button";
 import { MessageCircle, Github, Twitter, BookOpen, Users, Heart } from "lucide-react";
 
 const communities = [
   {
     icon: MessageCircle,
     title: "Discord",
     description: "Join our active Discord community for real-time support and discussions.",
     href: "https://discord.gg/syra",
     cta: "Join Discord",
   },
   {
     icon: Github,
     title: "GitHub",
     description: "Star us, report issues, and contribute to the Syra ecosystem.",
     href: "https://github.com/syra",
     cta: "View GitHub",
   },
   {
     icon: Twitter,
     title: "Twitter",
     description: "Follow us for the latest updates, tips, and community highlights.",
     href: "https://twitter.com/syra",
     cta: "Follow @syra",
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
         <h1 className="text-4xl font-bold tracking-tight mb-4">Community & Support</h1>
         <p className="text-xl text-muted-foreground leading-relaxed">
           Connect with the Syra community and get help when you need it.
         </p>
       </div>
 
       {/* Main communities */}
       <section className="mb-12">
         <h2 className="text-2xl font-semibold mb-6">Join the Community</h2>
         <div className="grid sm:grid-cols-3 gap-4">
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
         <div className="p-6 rounded-xl border border-border bg-card">
           <p className="text-muted-foreground mb-4">
             Need help? Our community is here for you:
           </p>
           <ul className="space-y-2 text-sm text-muted-foreground">
             <li className="flex items-center gap-2">
               <span className="text-primary">•</span>
               <strong className="text-foreground">Discord:</strong> Best for quick questions and real-time help
             </li>
             <li className="flex items-center gap-2">
               <span className="text-primary">•</span>
               <strong className="text-foreground">GitHub Issues:</strong> For bug reports and feature requests
             </li>
             <li className="flex items-center gap-2">
               <span className="text-primary">•</span>
               <strong className="text-foreground">Email:</strong> support@syra.ai for enterprise inquiries
             </li>
           </ul>
         </div>
       </section>
     </DocsLayout>
   );
 }