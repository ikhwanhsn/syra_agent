 import { useState } from "react";
 import { Link, useLocation } from "react-router-dom";
 import { Search, Menu, X, Github, ExternalLink } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 
 interface HeaderProps {
   onMenuToggle: () => void;
   isSidebarOpen: boolean;
 }
 
 export function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const location = useLocation();
 
   const navItems = [
     { label: "Docs", href: "/docs" },
     { label: "API", href: "/docs/api-reference" },
     { label: "Examples", href: "/docs/tutorials" },
     { label: "Changelog", href: "/docs/changelog" },
   ];
 
   return (
     <header className="sticky top-0 z-50 glass-strong">
       <div className="flex h-16 items-center justify-between px-4 lg:px-6">
         {/* Left section */}
         <div className="flex items-center gap-4">
           <Button
             variant="ghost"
             size="icon"
             className="lg:hidden"
             onClick={onMenuToggle}
           >
             {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
           </Button>
 
           <Link to="/" className="flex items-center gap-2 group">
             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
               <span className="font-bold text-primary-foreground text-sm">S</span>
             </div>
             <span className="font-semibold text-lg tracking-tight">
               Syra
             </span>
             <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
               docs
             </span>
           </Link>
         </div>
 
         {/* Center navigation */}
         <nav className="hidden md:flex items-center gap-1">
           {navItems.map((item) => (
             <Link
               key={item.href}
               to={item.href}
               className={cn(
                 "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                 location.pathname === item.href || location.pathname.startsWith(item.href + "/")
                   ? "text-foreground bg-muted"
                   : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
               )}
             >
               {item.label}
             </Link>
           ))}
         </nav>
 
         {/* Right section */}
         <div className="flex items-center gap-2">
           <Button
             variant="ghost"
             size="sm"
             className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground px-3"
             onClick={() => setIsSearchOpen(true)}
           >
             <Search className="h-4 w-4" />
             <span className="text-sm">Search...</span>
             <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
               ⌘K
             </kbd>
           </Button>
 
           <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
             <a href="https://github.com/syra" target="_blank" rel="noopener noreferrer">
               <Github className="h-5 w-5" />
             </a>
           </Button>
 
           <Button variant="primary" size="sm" className="hidden sm:flex" asChild>
             <a href="https://app.syra.ai" target="_blank" rel="noopener noreferrer">
               Get Started
               <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
             </a>
           </Button>
         </div>
       </div>
 
       {/* Search modal would go here */}
       {isSearchOpen && (
         <div 
           className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
           onClick={() => setIsSearchOpen(false)}
         >
           <div 
             className="fixed left-1/2 top-1/4 -translate-x-1/2 w-full max-w-lg p-4"
             onClick={(e) => e.stopPropagation()}
           >
             <div className="glass-strong rounded-xl p-4">
               <div className="flex items-center gap-3 border-b border-border pb-3">
                 <Search className="h-5 w-5 text-muted-foreground" />
                 <input
                   type="text"
                   placeholder="Search documentation..."
                   className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                   autoFocus
                 />
                 <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                   ESC
                 </kbd>
               </div>
               <div className="pt-4 text-center text-sm text-muted-foreground">
                 Start typing to search...
               </div>
             </div>
           </div>
         </div>
       )}
     </header>
   );
 }