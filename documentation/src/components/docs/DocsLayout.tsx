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
    <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: "var(--syra-background)" }}>
       <Header 
         onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
         isSidebarOpen={sidebarOpen}
       />
       <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
       
       <div className="flex-1 w-full lg:pl-64">
         <main className="max-w-6xl mx-auto px-4 sm:px-5 md:px-6 py-6 sm:py-8 lg:px-8">
           <div className="flex flex-col xl:flex-row xl:gap-8 gap-0">
             <article className="flex-1 min-w-0 w-full animate-fade-in overflow-x-hidden">
               {children}
             </article>
             <TableOfContents items={toc} />
           </div>
         </main>
       </div>
     </div>
   );
 }