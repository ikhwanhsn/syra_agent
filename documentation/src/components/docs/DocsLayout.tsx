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
    <div className="flex min-h-[100dvh] flex-col bg-background">
       <Header 
         onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
         isSidebarOpen={sidebarOpen}
       />
       <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
       
       <div className="flex-1 w-full min-w-0 lg:pl-64">
         <main className="w-full max-w-none px-4 sm:px-6 py-6 sm:py-8 lg:px-8 xl:px-10 2xl:px-12">
           <div className="flex flex-col gap-0 xl:flex-row xl:gap-10 2xl:gap-12">
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