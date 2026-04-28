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
  { label: "Overview", href: "/#uof-landing-hero", desc: "Landing" },
  { label: "Token", href: "/#landing-token", desc: "$UPONLY" },
  { label: "Mandate", href: "/#mandate", desc: "Treasury" },
  { label: "Risk", href: "/#risk-disclosure", desc: "Disclosure" },
] as const;

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const isActiveLink = (href: string) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    if (!href.startsWith("/#")) return location.pathname === href;
    const hash = href.slice(1);
    return location.pathname === "/" && location.hash === hash;
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-[9999] pt-[env(safe-area-inset-top,0px)]"
    >
      <div className={siteShell}>
        <nav
          className="mt-2 max-h-[min-content] border border-border/50 bg-background/80 shadow-[0_4px_24px_-8px_hsl(0_0%_0%_/_0.4)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 sm:mt-3 sm:rounded-2xl sm:px-2 sm:py-2"
          aria-label="Main"
        >
          <div className="flex min-w-0 items-center justify-between gap-2 py-2 pl-1.5 pr-1 sm:gap-3 sm:pl-2 sm:pr-2.5 sm:py-2.5 lg:pl-3">
            <BrandMark className="min-w-0 max-w-[55%] shrink sm:max-w-[60%] lg:max-w-none" compact />

            <div className="hidden min-w-0 items-center gap-0.5 lg:flex lg:flex-1 lg:justify-center">
              {navLinks.map((link) => {
                const active = isActiveLink(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    title={`${link.label} · ${link.desc}`}
                    className={cn(
                      "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-foreground/[0.08] text-foreground"
                        : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
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

              <Button
                asChild
                size="sm"
                className="h-8 shrink-0 px-2.5 text-xs font-semibold !text-[hsl(var(--uof-foreground))] sm:h-9 sm:px-3 sm:text-sm"
              >
                <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                  Open dashboard
                </Link>
              </Button>

              <button
                onClick={() => setIsOpen((o) => !o)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-foreground/[0.05] lg:hidden"
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
            <div
              id="uof-nav-drawer"
              className="border-t border-border/50 lg:hidden"
            >
              <div
                className="max-h-[min(70vh,28rem)] overflow-y-auto overscroll-y-contain px-1 py-3 sm:px-2"
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
                        "flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-foreground active:bg-foreground/[0.06]",
                        isActiveLink(link.href) && "bg-foreground/[0.06]",
                      )}
                    >
                      <span className="font-medium">{link.label}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {link.desc}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="mt-2 border-t border-border/40 pt-3">
                  <a
                    href={`mailto:${EMAIL_SUPPORT}`}
                    className="flex min-h-11 min-w-0 items-center break-words rounded-lg px-3 text-sm text-muted-foreground"
                  >
                    {EMAIL_SUPPORT}
                  </a>
                </div>
              </div>
            </div>
          ) : null}
        </nav>
      </div>
    </motion.header>
  );
};
