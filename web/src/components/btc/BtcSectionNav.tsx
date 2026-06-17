import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { btcCardInset, btcKickerClass } from "@/components/btc/btcStyles";
import {
  BTC_SECTION_NAV,
  resolveBtcActiveSection,
  scrollToBtcSection,
  subscribeBtcScrollSpy,
} from "@/lib/btcPageScroll";

export { BTC_SECTION_NAV } from "@/lib/btcPageScroll";

function NavLink({
  item,
  active,
  onNavigate,
  className,
}: {
  item: (typeof BTC_SECTION_NAV)[number];
  active: boolean;
  onNavigate: (id: string) => void;
  className: string;
}) {
  return (
    <a
      href={`#${item.id}`}
      onClick={(e) => {
        e.preventDefault();
        onNavigate(item.id);
      }}
      className={className}
      aria-current={active ? "true" : undefined}
    >
      {item.label}
    </a>
  );
}

export function BtcSectionNav() {
  const [active, setActive] = useState<string>(BTC_SECTION_NAV[0].id);

  const syncActive = useCallback(() => {
    setActive(resolveBtcActiveSection());
  }, []);

  useEffect(() => {
    syncActive();

    const unsubscribeScroll = subscribeBtcScrollSpy(syncActive);

    const mo = new MutationObserver(() => {
      syncActive();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      unsubscribeScroll();
      mo.disconnect();
    };
  }, [syncActive]);

  const onNavigate = useCallback((sectionId: string) => {
    setActive(sectionId);
    scrollToBtcSection(sectionId);
  }, []);

  return (
    <>
      <nav
        className="hidden xl:block fixed right-4 top-28 z-30 w-44"
        aria-label="BTC page sections"
      >
        <div className={cn(btcCardInset, "max-h-[calc(100vh-8rem)] overflow-y-auto p-2 shadow-lg")}>
          <p className={cn(btcKickerClass, "px-2 py-1")}>Sections</p>
          <ul className="space-y-0.5">
            {BTC_SECTION_NAV.map((item) => (
              <li key={item.id}>
                <NavLink
                  item={item}
                  active={active === item.id}
                  onNavigate={onNavigate}
                  className={cn(
                    "block rounded-lg px-2 py-1.5 text-xs transition-colors",
                    active === item.id
                      ? "bg-primary/10 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="sticky top-14 z-20 -mx-1 mb-2 overflow-x-auto border-b border-border/40 bg-background/80 px-1 py-2 backdrop-blur-md xl:hidden">
        <div className="flex w-max gap-1.5">
          {BTC_SECTION_NAV.map((item) => (
            <NavLink
              key={item.id}
              item={item}
              active={active === item.id}
              onNavigate={onNavigate}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                active === item.id
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
              )}
            />
          ))}
        </div>
      </div>
    </>
  );
}
