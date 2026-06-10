"use client";

import { useState, type RefObject } from "react";
import { Link } from "@/lib/navigation";
import { isPlaygroundNavItemActive } from "@/lib/playgroundRoute";
import { useTheme } from "next-themes";
import { ArrowUpRight, Menu, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";
import {
  SITE_NAV_GROUPS,
  SITE_NAV_ADMIN_MORE,
  SITE_NAV_MORE,
  type NavGroup,
  type NavLinkItem,
} from "@/lib/siteNav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DrawerDismissButton } from "@/components/ui/drawer-dismiss-button";
import { GlobalNavAssetSearch } from "@/components/layout/GlobalNavAssetSearch";

function isItemActive(pathname: string, href: string) {
  if (href === "/playground") {
    return isPlaygroundNavItemActive(pathname, href);
  }
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function MobileSectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 pb-1.5 pt-5 first:pt-2">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/45">
        {children}
      </span>
      <span className="h-px min-w-0 flex-1 bg-gradient-to-r from-border/40 to-transparent" aria-hidden />
    </div>
  );
}

function mobileNavItemClasses(active: boolean) {
  return cn(
    "group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left outline-none transition-[background,box-shadow,color,transform] duration-200 ease-out",
    active
      ? "bg-gradient-to-r from-primary/[0.14] via-primary/[0.08] to-transparent text-foreground shadow-[inset_0_1px_0_0_hsl(var(--primary)/0.12)] ring-1 ring-primary/15"
      : "text-muted-foreground hover:bg-muted/45 hover:text-foreground active:scale-[0.98]",
  );
}

function mobileNavIconClasses(active: boolean) {
  return cn(
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition-all duration-200",
    active
      ? "bg-primary/15 text-primary ring-1 ring-primary/25"
      : "bg-muted/25 text-muted-foreground group-hover:bg-muted/50 group-hover:text-foreground",
  );
}

function MobileNavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavLinkItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isItemActive(pathname, item.href);
  const Icon = item.icon;

  const inner = (
    <>
      {active ? (
        <span
          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-primary shadow-[0_0_14px_2px_hsl(var(--primary)/0.35)]"
          aria-hidden
        />
      ) : null}
      {Icon ? (
        <span className={mobileNavIconClasses(active)}>
          <Icon className="h-4 w-4" strokeWidth={active ? 2.25 : 2} aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-medium tracking-tight">{item.label}</span>
          {item.external ? (
            <ArrowUpRight className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
          ) : null}
        </span>
        {item.description ? (
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground/75">
            {item.description}
          </span>
        ) : null}
      </span>
    </>
  );

  const className = mobileNavItemClasses(active);

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onNavigate}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link to={item.href} className={className} onClick={onNavigate}>
      {inner}
    </Link>
  );
}

function MobileNavGroupSection({
  group,
  pathname,
  isAdmin,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  isAdmin: boolean;
  onNavigate: () => void;
}) {
  const items = group.items?.filter((item) => !item.adminOnly || isAdmin) ?? [];
  const GroupIcon = group.icon;

  if (items.length === 0 && group.href) {
    const active = group.match(pathname);
    return (
      <div className="px-1">
        <Link
          to={group.href}
          className={mobileNavItemClasses(active)}
          onClick={onNavigate}
        >
          {active ? (
            <span
              className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-primary"
              aria-hidden
            />
          ) : null}
          {GroupIcon ? (
            <span className={mobileNavIconClasses(active)}>
              <GroupIcon className="h-4 w-4" strokeWidth={active ? 2.25 : 2} aria-hidden />
            </span>
          ) : null}
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium tracking-tight">
            {group.label}
          </span>
        </Link>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="px-1">
      <MobileSectionLabel>{group.label}</MobileSectionLabel>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.href}>
            <MobileNavItem item={item} pathname={pathname} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GlobalNavMobileSheet({
  pathname,
  isAdmin,
  searchRef,
}: {
  pathname: string;
  isAdmin: boolean;
  searchRef?: RefObject<HTMLInputElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className={cn(
          "flex w-[min(304px,88vw)] max-w-none flex-col gap-0 border-sidebar-border/80 bg-sidebar p-0 text-sidebar-foreground",
          "shadow-[24px_0_64px_-24px_rgba(0,0,0,0.45)] supports-[backdrop-filter]:bg-sidebar/98",
          "[&>button]:hidden",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_-20%,hsl(var(--primary)/0.08),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-sidebar-border/90 to-transparent"
          aria-hidden
        />

        <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-sidebar-border/60 px-4 py-3.5">
          <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">Menu</p>
          <DrawerDismissButton label="Close menu" onClick={close} />
        </header>

        <div className="relative z-10 shrink-0 border-b border-sidebar-border/60 px-3 py-3">
          <GlobalNavAssetSearch
            inputRef={searchRef}
            isAdmin={isAdmin}
            className="w-full"
          />
        </div>

        <nav
          className="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4 scrollbar-thin"
          aria-label="Mobile"
        >
          {SITE_NAV_GROUPS.map((group) => (
            <MobileNavGroupSection
              key={group.id}
              group={group}
              pathname={pathname}
              isAdmin={isAdmin}
              onNavigate={close}
            />
          ))}

          <section className="px-1">
            <MobileSectionLabel>More</MobileSectionLabel>
            <ul className="flex flex-col gap-0.5">
              {SITE_NAV_MORE.map((item) => (
                <li key={item.href}>
                  <MobileNavItem item={item} pathname={pathname} onNavigate={close} />
                </li>
              ))}
            </ul>
            {isAdmin ? (
              <section className="px-1">
                <MobileSectionLabel>Internal</MobileSectionLabel>
                <ul className="flex flex-col gap-0.5">
                  {SITE_NAV_ADMIN_MORE.map((item) => (
                    <li key={item.href}>
                      <MobileNavItem item={item} pathname={pathname} onNavigate={close} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </section>
        </nav>

        <footer className="relative z-10 shrink-0 border-t border-sidebar-border/60 bg-gradient-to-t from-muted/25 to-transparent px-4 py-4">
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full justify-start gap-3 rounded-xl px-2.5 text-muted-foreground hover:bg-muted/45 hover:text-foreground"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            suppressHydrationWarning
          >
            <span className={mobileNavIconClasses(false)}>
              {!mounted || resolvedTheme !== "light" ? (
                <Sun className="h-4 w-4" aria-hidden />
              ) : (
                <Moon className="h-4 w-4" aria-hidden />
              )}
            </span>
            <span className="text-[13px] font-medium">
              {!mounted || resolvedTheme !== "light" ? "Light mode" : "Dark mode"}
            </span>
          </Button>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
