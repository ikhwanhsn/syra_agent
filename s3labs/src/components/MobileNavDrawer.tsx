import { useCallback, useEffect, useMemo } from "react";
import { flushSync } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";

import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { NavbarWalletButton } from "@/components/NavbarWalletButton";
import {
  mainNavLinks,
  otherNavLinks,
  programNavLinks,
  adminNavLinks,
  type SiteNavItem,
} from "@/lib/siteNav";
import { isAdminWallet } from "@/lib/adminWallet";
import { siteMobileNavDrawerZ, siteMobileNavOverlayZ } from "@/lib/siteLayout";
import { prefetchRoute } from "@/lib/routePrefetch";
import { cn } from "@/lib/utils";
import { Moon, Sun, User, X } from "lucide-react";

function DrawerNavLabel({ label, soon }: { label: string; soon?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      {label}
      {soon ? (
        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-400">
          Soon
        </span>
      ) : null}
    </span>
  );
}

function DrawerSection({
  title,
  links,
  onGoTo,
}: {
  title: string;
  links: SiteNavItem[];
  onGoTo: (to: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      {links.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className="flex min-h-11 touch-manipulation items-center rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-secondary/60 hover:text-foreground active:bg-secondary/80"
          activeClassName="bg-secondary/60 text-foreground"
          onClick={(event) => {
            event.preventDefault();
            onGoTo(item.to);
          }}
          onPointerEnter={() => prefetchRoute(item.to)}
          onFocus={() => prefetchRoute(item.to)}
        >
          <DrawerNavLabel label={item.label} soon={item.soon} />
        </NavLink>
      ))}
    </div>
  );
}

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58() ?? null;
  const isAdmin = isAdminWallet(address);

  const othersLinks = useMemo(
    () => (isAdmin ? [...otherNavLinks, ...adminNavLinks] : otherNavLinks),
    [isAdmin],
  );

  /**
   * Close the drawer synchronously, then navigate.
   * Closing on click alone unmounts the link before navigation completes.
   */
  const goTo = useCallback(
    (to: string) => {
      flushSync(() => {
        onClose();
      });
      navigate(to);
    },
    [onClose, navigate],
  );

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        className={cn(
          "fixed inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden",
          siteMobileNavOverlayZ,
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />

      <aside
        id="mobile-nav-drawer"
        aria-hidden={!open}
        className={cn(
          "mobile-nav-drawer nav-bar-panel fixed inset-y-0 right-0 flex w-[min(100vw,20rem)] flex-col border-l border-border/60 shadow-elevated transition-transform duration-200 ease-out lg:hidden",
          siteMobileNavDrawerZ,
          open ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2"
            onClick={(event) => {
              event.preventDefault();
              goTo("/");
            }}
          >
            <img
              src="/images/logo.png"
              alt=""
              className="h-8 w-8 shrink-0 rounded-xl ring-1 ring-border/50"
              width={32}
              height={32}
            />
            <span className="truncate font-semibold tracking-tight text-foreground">
              S3Labs
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav
          className="flex-1 overflow-y-auto overscroll-contain px-2 py-2 scrollbar-hide"
          aria-label="Mobile navigation"
        >
          {mainNavLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className="flex min-h-11 touch-manipulation items-center rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-secondary/60 hover:text-foreground active:bg-secondary/80"
              activeClassName="bg-secondary/60 text-foreground"
              onClick={(event) => {
                event.preventDefault();
                goTo(item.to);
              }}
              onPointerEnter={() => prefetchRoute(item.to)}
              onFocus={() => prefetchRoute(item.to)}
            >
              <DrawerNavLabel label={item.label} soon={item.soon} />
            </NavLink>
          ))}

          <DrawerSection title="Program" links={programNavLinks} onGoTo={goTo} />
          <DrawerSection title="Others" links={othersLinks} onGoTo={goTo} />

          {wallet.connected && address ? (
            <div className="space-y-1">
              <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Account
              </p>
              <NavLink
                to="/profile"
                className="flex min-h-11 touch-manipulation items-center rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-secondary/60 hover:text-foreground active:bg-secondary/80"
                activeClassName="bg-secondary/60 text-foreground"
                onClick={(event) => {
                  event.preventDefault();
                  goTo("/profile");
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile & Points
                </span>
              </NavLink>
            </div>
          ) : null}
        </nav>

        <div className="space-y-3 border-t border-border/60 px-4 py-4">
          <Button
            variant="outline"
            className="h-11 w-full justify-between rounded-xl px-4"
            onClick={toggleTheme}
          >
            <span className="text-sm font-medium">Theme</span>
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" />
                  Light
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Dark
                </>
              )}
            </span>
          </Button>

          <NavbarWalletButton layout="drawer" className="w-full" />
        </div>
      </aside>
    </>
  );
}
