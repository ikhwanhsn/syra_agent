 import { useState } from "react";
 import { Header } from "./Header";
 import { Sidebar } from "./Sidebar";
 import { TableOfContents } from "./TableOfContents";
 
 interface TOCItem {
   id: string;
   title: string;
   level: number;
 }
 
 interface DocsLayoutProps {
   children: React.ReactNode;
   toc?: TOCItem[];
 }
 
 export function DocsLayout({ children, toc = [] }: DocsLayoutProps) {
   const [sidebarOpen, setSidebarOpen] = useState(false);
 
   return (
     <div className="min-h-screen bg-background">
       <Header 
         onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
         isSidebarOpen={sidebarOpen}
       />
       <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
       
       <div className="lg:pl-64">
         <main className="max-w-6xl mx-auto px-4 py-8 lg:px-8">
           <div className="flex gap-8">
             <article className="flex-1 min-w-0 animate-fade-in">
               {children}
             </article>
             <TableOfContents items={toc} />
           </div>
         </main>
       </div>
     </div>
   );
 }