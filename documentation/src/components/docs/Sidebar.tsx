 import { Link, useLocation } from "react-router-dom";
 import { ChevronRight, ChevronDown } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { useState } from "react";
 
 interface NavItem {
   title: string;
   href?: string;
   items?: NavItem[];
   badge?: string;
 }
 
 const navigation: NavItem[] = [
   {
     title: "Getting Started",
     items: [
       { title: "Introduction", href: "/docs" },
       { title: "What is Syra?", href: "/docs/getting-started/what-is-syra" },
       { title: "Key Concepts", href: "/docs/getting-started/key-concepts" },
       { title: "Architecture", href: "/docs/getting-started/architecture" },
       { title: "Quick Start", href: "/docs/getting-started/quick-start" },
     ],
   },
   {
     title: "Installation",
     items: [
       { title: "CLI Setup", href: "/docs/installation/cli" },
       { title: "SDK Installation", href: "/docs/installation/sdk" },
       { title: "Environment Config", href: "/docs/installation/environment" },
     ],
   },
   {
     title: "Core Concepts",
     items: [
       { title: "Agents", href: "/docs/core-concepts/agents" },
       { title: "Multi-Agent Workflows", href: "/docs/core-concepts/multi-agent" },
       { title: "Memory", href: "/docs/core-concepts/memory" },
       { title: "Tools & Actions", href: "/docs/core-concepts/tools" },
       { title: "Prompts & Orchestration", href: "/docs/core-concepts/prompts" },
     ],
   },
   {
     title: "Agent Marketplace",
     badge: "New",
     items: [
       { title: "Overview", href: "/docs/marketplace/overview" },
       { title: "Using Templates", href: "/docs/marketplace/templates" },
       { title: "Publishing Agents", href: "/docs/marketplace/publishing" },
     ],
   },
   {
     title: "Web3 Integration",
     items: [
       { title: "Wallet Connection", href: "/docs/web3/wallet" },
       { title: "Smart Contracts", href: "/docs/web3/contracts" },
       { title: "On-Chain Automation", href: "/docs/web3/automation" },
     ],
   },
   {
     title: "API Reference",
     items: [
       { title: "Overview", href: "/docs/api-reference" },
       { title: "Endpoints", href: "/docs/api-reference/endpoints" },
       { title: "Error Handling", href: "/docs/api-reference/errors" },
       { title: "Rate Limits", href: "/docs/api-reference/rate-limits" },
     ],
   },
   {
     title: "Tutorials",
     items: [
       { title: "Build Your First Agent", href: "/docs/tutorials/first-agent" },
       { title: "Multi-Agent Collab", href: "/docs/tutorials/multi-agent" },
       { title: "Real-World Examples", href: "/docs/tutorials/examples" },
     ],
   },
   {
     title: "Security",
     items: [
       { title: "Best Practices", href: "/docs/security/best-practices" },
       { title: "API Key Handling", href: "/docs/security/api-keys" },
       { title: "Agent Sandboxing", href: "/docs/security/sandboxing" },
     ],
   },
   {
     title: "Resources",
     items: [
       { title: "Roadmap", href: "/docs/changelog" },
       { title: "Community", href: "/docs/community" },
     ],
   },
 ];
 
 interface SidebarProps {
   isOpen: boolean;
   onClose: () => void;
 }
 
 export function Sidebar({ isOpen, onClose }: SidebarProps) {
   const location = useLocation();
   const [openSections, setOpenSections] = useState<string[]>(
     navigation.map((n) => n.title)
   );
 
   const toggleSection = (title: string) => {
     setOpenSections((prev) =>
       prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
     );
   };
 
   const isActive = (href: string) => location.pathname === href;
 
   return (
     <>
       {/* Mobile overlay */}
       {isOpen && (
         <div
           className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
           onClick={onClose}
         />
       )}
 
       {/* Sidebar */}
       <aside
         className={cn(
           "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border bg-sidebar overflow-y-auto transition-transform duration-300 lg:translate-x-0",
           isOpen ? "translate-x-0" : "-translate-x-full"
         )}
       >
         <nav className="p-4 space-y-1">
           {navigation.map((section) => (
             <div key={section.title} className="mb-2">
               <button
                 onClick={() => toggleSection(section.title)}
                 className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors"
               >
                 <span className="flex items-center gap-2">
                   {section.title}
                   {section.badge && (
                     <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                       {section.badge}
                     </span>
                   )}
                 </span>
                 {openSections.includes(section.title) ? (
                   <ChevronDown className="h-4 w-4 text-muted-foreground" />
                 ) : (
                   <ChevronRight className="h-4 w-4 text-muted-foreground" />
                 )}
               </button>
 
               {openSections.includes(section.title) && section.items && (
                 <div className="mt-1 ml-2 border-l border-border/50 pl-2 space-y-0.5">
                   {section.items.map((item) => (
                     <Link
                       key={item.href}
                       to={item.href!}
                       onClick={onClose}
                       className={cn(
                         "block px-2 py-1.5 text-sm rounded-md transition-all duration-200",
                         isActive(item.href!)
                           ? "text-primary bg-primary/10 font-medium"
                           : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                       )}
                     >
                       {item.title}
                     </Link>
                   ))}
                 </div>
               )}
             </div>
           ))}
         </nav>
       </aside>
     </>
   );
 }