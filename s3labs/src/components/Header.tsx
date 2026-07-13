import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";

import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import { NavbarWalletButton } from "@/components/NavbarWalletButton";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import {
  mainNavLinks,
  otherNavLinks,
  programNavLinks,
  adminNavLinks,
  type SiteNavItem,
} from "@/lib/siteNav";
import { isAdminWallet } from "@/lib/adminWallet";
import { siteNavDropdownZ, siteNavShell, siteNavZ } from "@/lib/siteLayout";
import { prefetchRoute } from "@/lib/routePrefetch";
import { cn } from "@/lib/utils";
import { Moon, Sun, Menu, ChevronDown } from "lucide-react";

function NavItemLabel({ label, soon }: { label: string; soon?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {label}
      {soon ? (
        <Badge
          variant="outline"
          className="text-[9px] px-1.5 py-0 uppercase tracking-wider border-amber-500/40 text-amber-400 bg-amber-500/10 font-semibold"
        >
          Soon
        </Badge>
      ) : null}
    </span>
  );
}

const HOVER_CLOSE_DELAY_MS = 150;

function isNavGroupActive(pathname: string, links: SiteNavItem[]): boolean {
  return links.some((item) =>
    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to),
  );
}

/**
 * Hover/click nav group — absolute panel (no Radix portal) so the pointer
 * stays inside one hit-target from trigger → menu (padding bridge).
 */
function NavHoverDropdown({
  label,
  links,
  isActive,
}: {
  label: string;
  links: SiteNavItem[];
  isActive: boolean;
}) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const closeMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer]);

  const toggleMenu = useCallback(() => {
    clearCloseTimer();
    setOpen((prev) => !prev);
  }, [clearCloseTimer]);

  useEffect(() => {
    clearCloseTimer();
    setOpen(false);
  }, [location.pathname, clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) return;
      closeMenu();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeMenu]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={openMenu}
      onPointerLeave={scheduleClose}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={toggleMenu}
        className={cn(
          "nav-link-premium group inline-flex items-center gap-1 whitespace-nowrap outline-none",
          (isActive || open) && "text-foreground after:w-full",
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 opacity-60 transition-transform duration-150 ease-out",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute left-1/2 top-full z-[280] min-w-[168px] -translate-x-1/2 pt-2",
            siteNavDropdownZ,
          )}
        >
          <div className="nav-bar-panel rounded-xl border-border/60 p-1.5 shadow-elevated">
            {links.map((item) => {
              const itemActive =
                item.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  role="menuitem"
                  to={item.to}
                  onClick={closeMenu}
                  onPointerEnter={() => prefetchRoute(item.to)}
                  onFocus={() => prefetchRoute(item.to)}
                  className={cn(
                    "flex cursor-pointer items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors duration-150",
                    "text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent",
                    itemActive && "bg-accent/60",
                  )}
                >
                  <NavItemLabel label={item.label} soon={item.soon} />
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58() ?? null;
  const isAdmin = isAdminWallet(address);

  const othersLinks = useMemo(
    () => (isAdmin ? [...otherNavLinks, ...adminNavLinks] : otherNavLinks),
    [isAdmin],
  );

  const isProgramActive = isNavGroupActive(location.pathname, programNavLinks);
  const isOthersActive = isNavGroupActive(location.pathname, othersLinks);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname, closeMobileMenu]);

  return (
    <header
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 pt-[env(safe-area-inset-top,0px)]",
        siteNavZ,
      )}
    >
      <div className={cn(siteNavShell, "pointer-events-auto mt-2 min-[400px]:mt-3 sm:mt-4")}>
        <div className="nav-bar-panel relative w-full min-w-0 rounded-2xl">
          <div className="flex h-12 min-w-0 items-center justify-between gap-1.5 px-3 sm:h-14 sm:gap-2 sm:px-4 lg:h-16 lg:gap-4 lg:px-5">
            <Link
              to="/"
              className="group flex min-w-0 shrink-0 items-center gap-2 touch-manipulation"
            >
              <img
                src="/images/logo.png"
                alt="S3Labs"
                className="h-8 w-8 shrink-0 rounded-xl ring-1 ring-border/50 transition-all group-hover:ring-primary/30 sm:h-9 sm:w-9"
              />
              <span className="hidden truncate font-semibold tracking-tight text-foreground min-[380px]:inline sm:text-lg">
                S3Labs
              </span>
            </Link>

            <nav
              className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:flex lg:gap-4 xl:gap-6 2xl:gap-7"
              aria-label="Main navigation"
            >
              {mainNavLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={cn("nav-link-premium shrink-0", item.soon && "opacity-80")}
                  activeClassName="text-foreground after:w-full"
                  onPointerEnter={() => prefetchRoute(item.to)}
                  onFocus={() => prefetchRoute(item.to)}
                >
                  <NavItemLabel label={item.label} soon={item.soon} />
                </NavLink>
              ))}

              <NavHoverDropdown
                label="Program"
                links={programNavLinks}
                isActive={isProgramActive}
              />
              <NavHoverDropdown
                label="Others"
                links={othersLinks}
                isActive={isOthersActive}
              />
            </nav>

            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hidden h-10 w-10 rounded-full touch-manipulation md:inline-flex lg:h-9 lg:w-9"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              <NavbarWalletButton layout="header" />

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full touch-manipulation lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav-drawer"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <MobileNavDrawer open={mobileMenuOpen} onClose={closeMobileMenu} />
    </header>
  );
};

export default Header;
