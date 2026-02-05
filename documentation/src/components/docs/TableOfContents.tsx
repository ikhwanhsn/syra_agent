 import { useEffect, useState } from "react";
 import { cn } from "@/lib/utils";
 
 interface TOCItem {
   id: string;
   title: string;
   level: number;
 }
 
 interface TableOfContentsProps {
   items: TOCItem[];
 }
 
 export function TableOfContents({ items }: TableOfContentsProps) {
   const [activeId, setActiveId] = useState<string>("");
 
   useEffect(() => {
     const observer = new IntersectionObserver(
       (entries) => {
         entries.forEach((entry) => {
           if (entry.isIntersecting) {
             setActiveId(entry.target.id);
           }
         });
       },
       { rootMargin: "-100px 0px -80% 0px" }
     );
 
     items.forEach((item) => {
       const element = document.getElementById(item.id);
       if (element) observer.observe(element);
     });
 
     return () => observer.disconnect();
   }, [items]);
 
   if (items.length === 0) return null;
 
  return (
    <div className="hidden xl:block sticky top-20 xl:top-24 w-56 shrink-0 self-start">
       <div className="text-sm font-medium text-foreground mb-3">On this page</div>
       <nav className="space-y-1">
         {items.map((item) => (
           <a
             key={item.id}
             href={`#${item.id}`}
             className={cn(
               "block text-sm py-1 transition-colors border-l-2",
               item.level === 2 ? "pl-3" : "pl-6",
               activeId === item.id
                 ? "border-primary text-primary"
                 : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
             )}
           >
             {item.title}
           </a>
         ))}
       </nav>
     </div>
   );
 }