import { useEffect, useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { TableOfContents } from "./TableOfContents";
import { DocBreadcrumbs } from "./DocBreadcrumbs";
import { DocFooter } from "./DocFooter";
import { DocsFooter } from "./DocsFooter";
import { MobileToc } from "./MobileToc";
import { cn } from "@/lib/utils";

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface DocsLayoutProps {
  children: React.ReactNode;
  toc?: TOCItem[];
  hideToc?: boolean;
  hideBreadcrumbs?: boolean;
  hideFooter?: boolean;
  /** @deprecated Layout is full width by default */
  wide?: boolean;
  /** @deprecated Layout is full width by default */
  fullWidth?: boolean;
}

export function DocsLayout({
  children,
  toc = [],
  hideToc = false,
  hideBreadcrumbs = false,
  hideFooter = false,
}: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTocId, setActiveTocId] = useState("");
  const [readingProgress, setReadingProgress] = useState(0);
  const showToc = !hideToc && toc.length > 0;

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to content
      </a>

      <div className="reading-progress" aria-hidden>
        <div className="reading-progress-bar" style={{ width: `${readingProgress}%` }} />
      </div>

      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 w-full min-w-0 lg:pl-docs-sidebar">
        <main
          id="main-content"
          className={cn(
            "w-full min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10",
            showToc && "pb-24 xl:pb-8"
          )}
        >
          <div className="flex w-full min-w-0 flex-col gap-8 xl:flex-row xl:items-start xl:gap-10 2xl:gap-12">
            <div className="flex-1 min-w-0 w-full animate-fade-in">
              {!hideBreadcrumbs && <DocBreadcrumbs />}
              <article className="docs-article w-full min-w-0">{children}</article>
              {!hideFooter && (
                <>
                  <DocFooter />
                  <DocsFooter />
                </>
              )}
            </div>
            {showToc && (
              <TableOfContents
                items={toc}
                activeId={activeTocId}
                onActiveChange={setActiveTocId}
              />
            )}
          </div>
        </main>
      </div>

      {showToc && <MobileToc items={toc} activeId={activeTocId} />}
    </div>
  );
}
