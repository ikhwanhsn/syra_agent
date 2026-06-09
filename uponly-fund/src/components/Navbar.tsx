import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { BrandMark } from "./BrandMark";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EMAIL_SUPPORT } from "../../config/global";
import { cn } from "@/lib/utils";
import { siteShell } from "@/lib/siteLayout";

const navLinks = [
  { label: "Fund", href: "/#uof-landing-hero", desc: "Overview" },
  { label: "Thesis", href: "/#thesis", desc: "80/20 allocation" },
  { label: "Mandate", href: "/#mandate", desc: "Strategy" },
  { label: "Risk", href: "/#risk-disclosure", desc: "Legal" },
] as const;

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const isLanding = location.pathname === "/" || location.pathname === "/landing";

  const isActiveLink = (href: string) => {
    if (!href.startsWith("/#")) return location.pathname === href;
    if (!isLanding) return false;
    const hash = href.slice(1);
    return location.hash === hash;
  };

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-[9999] pt-[env(safe-area-inset-top,0px)]"
    >
      <nav
        className="uof-institutional-nav"
        aria-label="Main"
      >
        <div
          className={cn(
            siteShell,
            "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3.5 sm:py-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:py-5",
          )}
        >
          <BrandMark
            className="min-w-0 max-w-full justify-self-start md:max-w-none"
            compact
            hardRefreshHome
          />

          <div className="hidden min-w-0 items-center justify-center gap-6 md:flex lg:gap-8">
            {navLinks.map((link) => {
              const active = isActiveLink(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  title={`${link.label} · ${link.desc}`}
                  className={cn(
                    "relative whitespace-nowrap py-1 text-[13px] font-medium tracking-wide transition-colors",
                    active
                      ? "text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:bg-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center justify-self-end gap-0.5 sm:gap-1 md:col-start-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="relative h-8 w-8 text-muted-foreground sm:h-9 sm:w-9"
                >
                  <Sun className="h-3.5 w-3.5 scale-100 transition-all dark:scale-0" />
                  <Moon className="absolute h-3.5 w-3.5 scale-0 transition-all dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{theme === "dark" ? "Light" : "Dark"} mode</p>
              </TooltipContent>
            </Tooltip>

            <button
              onClick={() => setIsOpen((o) => !o)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-foreground/[0.05] md:hidden"
              type="button"
              aria-expanded={isOpen}
              aria-controls="uof-nav-drawer"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isOpen ? (
          <div id="uof-nav-drawer" className="border-t border-border/50 md:hidden">
            <div
              className={cn(
                siteShell,
                "max-h-[min(70vh,28rem)] overflow-y-auto overscroll-y-contain py-3",
              )}
              style={{
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <div className="flex flex-col gap-0.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-md px-1 py-2.5 text-foreground active:bg-foreground/[0.06]",
                      isActiveLink(link.href) && "font-semibold",
                    )}
                  >
                    <span>{link.label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{link.desc}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-3 border-t border-border/40 pt-3">
                <a
                  href={`mailto:${EMAIL_SUPPORT}`}
                  className="flex min-h-11 min-w-0 items-center break-words px-1 text-sm text-muted-foreground"
                >
                  Email support
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </nav>
    </motion.header>
  );
};
