"use client";

import { useEffect, useRef } from "react";
import { Link, useLocation } from "@/lib/navigation";
import { isPlaygroundNavItemActive } from "@/lib/playgroundRoute";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/useMounted";
import { ArrowUpRight, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SITE_NAV_GROUPS,
  SITE_NAV_ADMIN_MORE,
  SITE_NAV_MORE,
  type NavGroup,
  type NavLinkItem,
} from "@/lib/siteNav";
import { WalletNav } from "@/components/chat/WalletNav";
import { Button } from "@/components/ui/button";
import { GlobalNavAssetSearch } from "@/components/layout/GlobalNavAssetSearch";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { isAdminWallet } from "@/constants/adminWallet";
import { useWalletContext } from "@/contexts/WalletContext";
import { NavbarLogo } from "@/components/NavbarLogo";
import { GlobalNavMobileSheet } from "@/components/layout/GlobalNavMobileSheet";

const navDropdownPanelClass = cn(
  "overflow-hidden rounded-2xl border border-border/50 bg-popover/95 text-popover-foreground",
  "shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl backdrop-saturate-150",
  "dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.55)]",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  "data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]",
  "duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
);

const navDropdownContentClass = cn(
  "absolute left-0 top-full z-50 mt-2 origin-top-left p-0 md:w-auto",
  navDropdownPanelClass,
);

const navTriggerClass = cn(
  "group inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium outline-none transition-[color,background-color,box-shadow] duration-200",
  "text-muted-foreground hover:bg-accent/55 hover:text-foreground",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "data-[state=open]:bg-accent/80 data-[state=open]:text-foreground",
);

function isItemActive(pathname: string, href: string) {
  if (href === "/playground") {
    return isPlaygroundNavItemActive(pathname, href);
  }
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function NavMenuLink({
  item,
  pathname,
}: {
  item: NavLinkItem;
  pathname: string;
}) {
  const ItemIcon = item.icon;
  const active = isItemActive(pathname, item.href);

  const content = (
    <>
      {ItemIcon ? (
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/40 transition-[border-color,background-color,transform] duration-200",
            "group-hover:border-border/80 group-hover:bg-background/80",
            active && "border-border bg-background",
          )}
        >
          <ItemIcon className="h-4 w-4 text-foreground/75" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          <span className="truncate text-sm font-medium leading-tight">{item.label}</span>
          {item.external ? (
            <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          ) : null}
        </span>
        {item.description ? (
          <span className="mt-0.5 block truncate text-xs leading-snug text-muted-foreground">
            {item.description}
          </span>
        ) : null}
      </span>
    </>
  );

  const linkClass = cn(
    "group flex w-full select-none items-center gap-3 rounded-xl p-2.5 no-underline outline-none transition-colors duration-200",
    "hover:bg-accent/70 focus:bg-accent/70",
    active && "bg-accent/90",
  );

  if (item.external) {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {content}
          </a>
        </NavigationMenuLink>
      </li>
    );
  }

  return (
    <li>
      <NavigationMenuLink asChild>
        <Link to={item.href} className={linkClass}>
          {content}
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

function NavMenuGroup({
  group,
  pathname,
  isAdmin,
}: {
  group: NavGroup;
  pathname: string;
  isAdmin: boolean;
}) {
  const active = group.match(pathname);
  const Icon = group.icon;
  const items = group.items?.filter((item) => !item.adminOnly || isAdmin) ?? [];
  const isWide = items.length > 4;

  if (items.length === 0 && group.href) {
    return (
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <Link
            to={group.href}
            className={cn(
              navTriggerClass,
              active && "bg-accent/80 text-foreground",
            )}
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-75" /> : null}
            {group.label}
          </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem value={group.id}>
      <NavigationMenuTrigger
        className={cn(
          navTriggerClass,
          "bg-transparent data-[active]:bg-accent/80 data-[active]:text-foreground",
          active && "text-foreground",
        )}
      >
        {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-75" /> : null}
        {group.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent className={navDropdownContentClass}>
        <ul
          className={cn(
            "p-2",
            isWide
              ? "grid w-[min(100vw-2rem,32rem)] grid-cols-1 gap-0.5 sm:grid-cols-2"
              : "w-[min(100vw-2rem,17.5rem)]",
          )}
        >
          {items.map((item) => (
            <NavMenuLink key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

export function GlobalNav() {
  const { pathname } = useLocation();
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();
  const { connected, address } = useWalletContext();
  const isAdmin = isAdminWallet(connected, address ?? undefined);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable)
        return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header
      className="sticky top-0 z-[200] overflow-visible border-b border-border/40 bg-background/80 shadow-[0_1px_0_0_hsl(var(--border)/0.35)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/70"
      style={{ height: "var(--syra-global-nav-height, 3.5rem)" }}
    >
      <div className="flex h-full w-full items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6">
        <GlobalNavMobileSheet pathname={pathname} isAdmin={isAdmin} searchRef={searchRef} />

        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 rounded-xl pr-1 transition-opacity duration-200 hover:opacity-90"
          aria-label="Syra home"
        >
          <div className="hidden sm:block">
            <NavbarLogo />
          </div>
          <span className="font-display text-base font-semibold tracking-tight sm:text-lg">
            <span className="gradient-text">Syra</span>
          </span>
        </Link>

        <NavigationMenu
          delayDuration={60}
          skipDelayDuration={120}
          viewport={false}
          className="relative z-10 hidden shrink-0 lg:flex"
        >
          <NavigationMenuList className="gap-0.5">
            {SITE_NAV_GROUPS.map((group) => (
              <NavMenuGroup
                key={group.id}
                group={group}
                pathname={pathname}
                isAdmin={isAdmin}
              />
            ))}

            <NavigationMenuItem value="more">
              <NavigationMenuTrigger className={cn(navTriggerClass, "bg-transparent")}>
                More
              </NavigationMenuTrigger>
              <NavigationMenuContent className={navDropdownContentClass}>
                <ul className="w-[min(100vw-2rem,17.5rem)] p-2">
                  {SITE_NAV_MORE.map((item) => (
                    <NavMenuLink key={item.href} item={item} pathname={pathname} />
                  ))}
                  {isAdmin ? (
                    <>
                      <li className="mx-2.5 my-1.5 h-px bg-border/50" role="separator" aria-hidden />
                      <li className="px-2.5 pb-1 pt-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/55">
                          Internal
                        </span>
                      </li>
                      {SITE_NAV_ADMIN_MORE.map((item) => (
                        <NavMenuLink key={item.href} item={item} pathname={pathname} />
                      ))}
                    </>
                  ) : null}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            suppressHydrationWarning
          >
            {!mounted || resolvedTheme !== "light" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <GlobalNavAssetSearch
            inputRef={searchRef}
            isAdmin={isAdmin}
            className="hidden w-44 min-w-0 sm:w-52 md:flex lg:w-64"
          />

          <WalletNav />
        </div>
      </div>
    </header>
  );
}
