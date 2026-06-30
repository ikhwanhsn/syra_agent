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
  wide?: boolean;
  fullWidth?: boolean;
}

export function DocsLayout({
  children,
  toc = [],
  hideToc = false,
  hideBreadcrumbs = false,
  hideFooter = false,
  wide = false,
  fullWidth = false,
}: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTocId, setActiveTocId] = useState("");
  const [readingProgress, setReadingProgress] = useState(0);

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
        <main id="main-content" className="w-full px-4 sm:px-6 py-6 sm:py-8 lg:px-8 xl:px-10">
          <div className="flex flex-col gap-0 xl:flex-row xl:gap-10 2xl:gap-12">
            <div
              className={cn(
                "flex-1 min-w-0 animate-fade-in",
                fullWidth ? "w-full" : wide ? "max-w-docs-wide" : "max-w-docs"
              )}
            >
              {!hideBreadcrumbs && <DocBreadcrumbs />}
              <article>{children}</article>
              {!hideFooter && (
                <>
                  <DocFooter />
                  <DocsFooter />
                </>
              )}
            </div>
            {!hideToc && toc.length > 0 && (
              <TableOfContents
                items={toc}
                activeId={activeTocId}
                onActiveChange={setActiveTocId}
              />
            )}
          </div>
        </main>
      </div>

      {!hideToc && toc.length > 0 && (
        <MobileToc items={toc} activeId={activeTocId} />
      )}
    </div>
  );
}
