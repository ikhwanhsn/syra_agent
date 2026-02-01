import { useState, useCallback, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletModalContext,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import { Wallet, ChevronDown, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/**
 * Custom wallet modal matching the app design system (same UX as AI agent).
 * Deduplicates wallet list and avoids "two children with the same key" from adapter.
 */
function WalletModalInner({
  className = "",
  container = "body",
}: {
  className?: string;
  container?: string;
}) {
  const { wallets, select } = useWallet();
  const { setVisible } = useWalletModal();
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portal, setPortal] = useState<Element | null>(null);

  const [listedWallets, collapsedWallets] = useMemo(() => {
    const seen = new Set<string>();
    const installed: typeof wallets = [];
    const notInstalled: typeof wallets = [];
    for (const wallet of wallets) {
      const name = wallet.adapter.name;
      if (seen.has(name)) continue;
      seen.add(name);
      if (wallet.readyState === WalletReadyState.Installed) {
        installed.push(wallet);
      } else {
        notInstalled.push(wallet);
      }
    }
    return installed.length ? [installed, notInstalled] : [notInstalled, []];
  }, [wallets]);

  const hideModal = useCallback(() => {
    setMounted(false);
    setTimeout(() => setVisible(false), 200);
  }, [setVisible]);

  const handleClose = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      hideModal();
    },
    [hideModal]
  );

  const handleWalletClick = useCallback(
    (event: React.MouseEvent, walletName: string) => {
      event.stopPropagation();
      select(walletName);
      hideModal();
    },
    [select, hideModal]
  );

  useLayoutEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideModal();
    };
    const { overflow } = window.getComputedStyle(document.body);
    setMounted(true);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown, false);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown, false);
    };
  }, [hideModal]);

  useLayoutEffect(() => {
    setPortal(document.querySelector(container));
  }, [container]);

  if (!portal) return null;

  const hasInstalled = listedWallets.length > 0;
  const title = hasInstalled
    ? "Connect your wallet"
    : "You'll need a Solana wallet";
  const subtitle = hasInstalled
    ? "Choose a wallet to connect and pay for x402 requests"
    : "Install a wallet below to get started";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        className
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
          mounted ? "opacity-100" : "opacity-0"
        )}
        onMouseDown={handleClose}
        onTouchStart={handleClose}
        aria-hidden
      />

      {/* Modal card */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-xl",
          "transition-all duration-200 ease-out",
          mounted
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0"
        )}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border bg-card/80 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <Wallet className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2
                  id="wallet-modal-title"
                  className="text-lg font-semibold text-foreground"
                >
                  {title}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {subtitle}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={handleClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3">
            <Badge
              variant="secondary"
              className="gap-1 border-border bg-secondary/50 text-muted-foreground"
            >
              <Zap className="h-3 w-3" />
              x402 · Solana
            </Badge>
          </div>
        </div>

        {/* Wallet list */}
        <div className="max-h-[min(60vh,320px)] p-4">
          {hasInstalled ? (
            <>
              <ScrollArea className="-mx-1">
                <ul className="space-y-1.5 pr-2">
                  {listedWallets.map((wallet, i) => (
                    <li key={`listed-${i}`}>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-12 w-full justify-start gap-3 rounded-lg border-border px-4 text-left font-medium",
                          "hover:bg-secondary/80 hover:border-accent/30 active:scale-[0.99]"
                        )}
                        onClick={(e) =>
                          handleWalletClick(e, wallet.adapter.name)
                        }
                      >
                        {wallet.adapter.icon && (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                            <img
                              src={wallet.adapter.icon}
                              alt=""
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          </span>
                        )}
                        <span className="flex-1 truncate">
                          {wallet.adapter.name}
                        </span>
                        {wallet.readyState === WalletReadyState.Installed && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-xs text-muted-foreground"
                          >
                            Detected
                          </Badge>
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>

              {collapsedWallets.length > 0 && (
                <Collapsible open={expanded} onOpenChange={setExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-3 w-full text-muted-foreground hover:text-foreground"
                    >
                      {expanded ? "Show less" : "More options"}
                      <ChevronDown
                        className={cn(
                          "ml-1 h-4 w-4 transition-transform",
                          expanded && "rotate-180"
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="mt-2 space-y-1.5">
                      {collapsedWallets.map((wallet, i) => (
                        <li key={`collapsed-${i}`}>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "h-12 w-full justify-start gap-3 rounded-lg border-border px-4 text-left font-medium opacity-90",
                              "hover:bg-secondary/80 hover:border-accent/30 active:scale-[0.99]"
                            )}
                            onClick={(e) =>
                              handleWalletClick(e, wallet.adapter.name)
                            }
                          >
                            {wallet.adapter.icon && (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                                <img
                                  src={wallet.adapter.icon}
                                  alt=""
                                  width={24}
                                  height={24}
                                  className="object-contain"
                                />
                              </span>
                            )}
                            <span className="flex-1 truncate">
                              {wallet.adapter.name}
                            </span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-10 px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                  <Wallet className="h-7 w-7 text-accent" />
                </div>
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  No wallet detected. Install one of the options below to
                  continue.
                </p>
              </div>

              {collapsedWallets.length > 0 && (
                <Collapsible open={expanded} onOpenChange={setExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-4 w-full text-muted-foreground hover:text-foreground"
                    >
                      {expanded ? "Hide" : "View wallet options"}
                      <ChevronDown
                        className={cn(
                          "ml-1 h-4 w-4 transition-transform",
                          expanded && "rotate-180"
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="mt-3 space-y-1.5">
                      {collapsedWallets.map((wallet, i) => (
                        <li key={`collapsed-${i}`}>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "h-12 w-full justify-start gap-3 rounded-lg border-border px-4 text-left font-medium",
                              "hover:bg-secondary/80 hover:border-accent/30 active:scale-[0.99]"
                            )}
                            onClick={(e) =>
                              handleWalletClick(e, wallet.adapter.name)
                            }
                          >
                            {wallet.adapter.icon && (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                                <img
                                  src={wallet.adapter.icon}
                                  alt=""
                                  width={24}
                                  height={24}
                                  className="object-contain"
                                />
                              </span>
                            )}
                            <span className="flex-1 truncate">
                              {wallet.adapter.name}
                            </span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}
        </div>

        {/* Troubleshooting: Phantom "disconnected port" / WalletConnectionError is an extension issue */}
        <div className="border-t border-border bg-muted/30 px-5 py-3">
          <p className="text-xs text-muted-foreground">
            If your wallet doesn’t connect, refresh the page or restart the Phantom extension (e.g. turn it off and on in your browser extensions) and try again.
          </p>
        </div>
      </div>
    </div>,
    portal
  );
}

export function WalletModalProviderFixed({
  children,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  container?: string;
}) {
  const [visible, setVisible] = useState(false);
  const value = useMemo(
    () => ({ visible, setVisible }),
    [visible]
  );
  return (
    <WalletModalContext.Provider value={value}>
      {children}
      {visible && <WalletModalInner {...props} />}
    </WalletModalContext.Provider>
  );
}
