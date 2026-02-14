"use client";

import { useState, useCallback, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletModalContext,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";

/**
 * Custom wallet modal matching the AI agent / playground UX.
 * Deduplicates wallet list and uses staking app theme (dark, accent).
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
    ? "Choose a wallet to connect and stake"
    : "Install a wallet below to get started";

  const iconWallet = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 0010.5 4H6A2.25 2.25 0 003.75 6v10.5A2.25 2.25 0 006 18.75h2.25M21 12a2.25 2.25 0 01-2.25 2.25H15a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 0115 3.75h2.25A2.25 2.25 0 0121 6v10.5m-9-6h.008v.008H12V12zm0 0h.008v.008H12V15zm0 0h.008v.008H12V18z" />
    </svg>
  );
  const iconClose = (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
  const iconChevron = (
    <svg className="h-4 w-4 flex-shrink-0 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${mounted ? "opacity-100" : "opacity-0"}`}
        onMouseDown={handleClose}
        onTouchStart={handleClose}
        aria-hidden
      />

      {/* Modal card */}
      <div
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-xl transition-all duration-200 ease-out ${mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border bg-secondary/50 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                {iconWallet}
              </div>
              <div>
                <h2
                  id="wallet-modal-title"
                  className="text-lg font-semibold text-white"
                >
                  {title}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {subtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center justify-center"
              onClick={handleClose}
              aria-label="Close"
            >
              {iconClose}
            </button>
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <span className="h-3 w-3 rounded-full bg-primary" />
              Solana
            </span>
          </div>
        </div>

        {/* Wallet list */}
        <div className="max-h-[min(60vh,320px)] overflow-y-auto p-4">
          {hasInstalled ? (
            <>
              <ul className="space-y-1.5 pr-1">
                {listedWallets.map((wallet, i) => (
                  <li key={`listed-${i}`}>
                    <button
                      type="button"
                      className="flex h-12 w-full items-center gap-3 rounded-lg border border-border bg-secondary/50 px-4 text-left font-medium text-foreground transition hover:border-accent/30 hover:bg-secondary active:scale-[0.99]"
                      onClick={(e) =>
                        handleWalletClick(e, wallet.adapter.name)
                      }
                    >
                      {wallet.adapter.icon && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/30">
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
                        <span className="shrink-0 rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                          Detected
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>

              {collapsedWallets.length > 0 && (
                <>
                  <button
                    type="button"
                    className="mt-3 flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5"
                    onClick={() => setExpanded((e) => !e)}
                  >
                    {expanded ? "Show less" : "More options"}
                    {iconChevron}
                  </button>
                  {expanded && (
                    <ul className="mt-2 space-y-1.5">
                      {collapsedWallets.map((wallet, i) => (
                        <li key={`collapsed-${i}`}>
                          <button
                            type="button"
                            className="flex h-12 w-full items-center gap-3 rounded-lg border border-border bg-secondary/50 px-4 text-left font-medium text-foreground opacity-90 transition hover:border-accent/30 hover:bg-secondary active:scale-[0.99]"
                            onClick={(e) =>
                              handleWalletClick(e, wallet.adapter.name)
                            }
                          >
                            {wallet.adapter.icon && (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/30">
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
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/50 py-10 px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 0010.5 4H6A2.25 2.25 0 003.75 6v10.5A2.25 2.25 0 006 18.75h2.25M21 12a2.25 2.25 0 01-2.25 2.25H15a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 0115 3.75h2.25A2.25 2.25 0 0121 6v10.5m-9-6h.008v.008H12V12zm0 0h.008v.008H12V15zm0 0h.008v.008H12V18z" />
                  </svg>
                </div>
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  No wallet detected. Install one of the options below to
                  continue.
                </p>
              </div>

              {collapsedWallets.length > 0 && (
                <>
                  <button
                    type="button"
                    className="mt-4 flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5"
                    onClick={() => setExpanded((e) => !e)}
                  >
                    {expanded ? "Hide" : "View wallet options"}
                    {iconChevron}
                  </button>
                  {expanded && (
                    <ul className="mt-3 space-y-1.5">
                      {collapsedWallets.map((wallet, i) => (
                        <li key={`collapsed-${i}`}>
                          <button
                            type="button"
                            className="flex h-12 w-full items-center gap-3 rounded-lg border border-border bg-secondary/50 px-4 text-left font-medium text-foreground transition hover:border-accent/30 hover:bg-secondary active:scale-[0.99]"
                            onClick={(e) =>
                              handleWalletClick(e, wallet.adapter.name)
                            }
                          >
                            {wallet.adapter.icon && (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/30">
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
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border bg-secondary/50 px-5 py-3">
          <p className="text-xs text-muted-foreground">
            If your wallet doesn’t connect, refresh the page or restart the Phantom extension and try again.
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
