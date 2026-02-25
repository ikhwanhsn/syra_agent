import { useState, useCallback, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { WalletReadyState, type WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletModalContext,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import { cn } from "../lib/utils";

function IconWallet({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}
function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

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
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      hideModal();
    },
    [hideModal]
  );

  const handleWalletClick = useCallback(
    (e: React.MouseEvent, walletName: string) => {
      e.stopPropagation();
      select(walletName as WalletName);
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
    ? "Choose a wallet to connect"
    : "Install a wallet below to get started";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      className={cn("fixed inset-0 z-50 flex items-center justify-center p-4", className)}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
          mounted ? "opacity-100" : "opacity-0"
        )}
        onMouseDown={handleClose}
        onTouchStart={handleClose}
        aria-hidden
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-gray-800 bg-syra-card shadow-xl",
          "transition-all duration-200 ease-out",
          mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-800 bg-syra-card px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-syra-primary/20">
                <IconWallet className="h-5 w-5 text-syra-primary" />
              </div>
              <div>
                <h2
                  id="wallet-modal-title"
                  className="text-lg font-semibold text-white"
                >
                  {title}
                </h2>
                <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              aria-label="Close"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 rounded border border-gray-700 bg-gray-800/50 px-2 py-0.5 text-xs text-gray-400">
              Solana
            </span>
          </div>
        </div>

        <div className="max-h-[min(60vh,320px)] overflow-y-auto p-4">
          {hasInstalled ? (
            <>
              <ul className="space-y-1.5">
                {listedWallets.map((wallet, i) => (
                  <li key={`listed-${i}`}>
                    <button
                      type="button"
                      className={cn(
                        "flex h-12 w-full items-center justify-start gap-3 rounded-lg border border-gray-700 bg-gray-800/50 px-4 text-left font-medium text-gray-200",
                        "hover:bg-gray-700/80 hover:border-syra-primary/30 active:scale-[0.99]"
                      )}
                      onClick={(e) => handleWalletClick(e, wallet.adapter.name)}
                    >
                      {wallet.adapter.icon && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-900">
                          <img
                            src={wallet.adapter.icon}
                            alt=""
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        </span>
                      )}
                      <span className="flex-1 truncate">{wallet.adapter.name}</span>
                      {wallet.readyState === WalletReadyState.Installed && (
                        <span className="shrink-0 rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-400">
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
                    onClick={() => setExpanded((e) => !e)}
                    className="mt-3 w-full text-left text-sm text-gray-400 hover:text-gray-200"
                  >
                    {expanded ? "Show less" : "More options"}
                    <IconChevronDown
                      className={cn(
                        "ml-1 inline-block h-4 w-4 transition-transform",
                        expanded && "rotate-180"
                      )}
                    />
                  </button>
                  {expanded && (
                    <ul className="mt-2 space-y-1.5">
                      {collapsedWallets.map((wallet, i) => (
                        <li key={`collapsed-${i}`}>
                          <button
                            type="button"
                            className={cn(
                              "flex h-12 w-full items-center justify-start gap-3 rounded-lg border border-gray-700 bg-gray-800/50 px-4 text-left font-medium text-gray-200 opacity-90",
                              "hover:bg-gray-700/80 hover:border-syra-primary/30"
                            )}
                            onClick={(e) =>
                              handleWalletClick(e, wallet.adapter.name)
                            }
                          >
                            {wallet.adapter.icon && (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-900">
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
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-800/30 py-10 px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-syra-primary/20">
                  <IconWallet className="h-7 w-7 text-syra-primary" />
                </div>
                <p className="mt-3 text-center text-sm text-gray-400">
                  No wallet detected. Install one of the options below to
                  continue.
                </p>
              </div>
              {collapsedWallets.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => !e)}
                    className="mt-4 w-full text-left text-sm text-gray-400 hover:text-gray-200"
                  >
                    {expanded ? "Hide" : "View wallet options"}
                    <IconChevronDown
                      className={cn(
                        "ml-1 inline-block h-4 w-4 transition-transform",
                        expanded && "rotate-180"
                      )}
                    />
                  </button>
                  {expanded && (
                    <ul className="mt-3 space-y-1.5">
                      {collapsedWallets.map((wallet, i) => (
                        <li key={`collapsed-${i}`}>
                          <button
                            type="button"
                            className={cn(
                              "flex h-12 w-full items-center justify-start gap-3 rounded-lg border border-gray-700 bg-gray-800/50 px-4 text-left font-medium text-gray-200",
                              "hover:bg-gray-700/80 hover:border-syra-primary/30"
                            )}
                            onClick={(e) =>
                              handleWalletClick(e, wallet.adapter.name)
                            }
                          >
                            {wallet.adapter.icon && (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-900">
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

        <div className="border-t border-gray-800 bg-gray-800/30 px-5 py-3">
          <p className="text-xs text-gray-500">
            Only the authorized wallet can use this dashboard. If your wallet
            doesn’t connect, refresh the page or restart your wallet extension.
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
  const value = useMemo(() => ({ visible, setVisible }), [visible]);
  return (
    <WalletModalContext.Provider value={value}>
      {children}
      {visible && <WalletModalInner {...props} />}
    </WalletModalContext.Provider>
  );
}
