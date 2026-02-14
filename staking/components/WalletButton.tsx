"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { shortenAddress } from "@/lib/solana";
import { IS_DEVNET } from "@/constants/config";
import { toast } from "sonner";

const iconWallet = (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 0010.5 4H6A2.25 2.25 0 003.75 6v10.5A2.25 2.25 0 006 18.75h2.25M21 12a2.25 2.25 0 01-2.25 2.25H15a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 0115 3.75h2.25A2.25 2.25 0 0121 6v10.5m-9-6h.008v.008H12V12zm0 0h.008v.008H12V15zm0 0h.008v.008H12V18z" />
  </svg>
);
const iconChevronDown = (
  <svg className="h-4 w-4 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const iconCopy = (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
);
const iconLogOut = (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v3.75M15.75 9L12 12.75m0 0L8.25 9m3.75 3.75V21M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
  </svg>
);

export function WalletButton() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleCopy = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey.toBase58()).then(
      () => toast.success("Address copied to clipboard"),
      () => toast.error("Copy failed")
    );
    setOpen(false);
  };

  const handleChangeWallet = () => {
    setOpen(false);
    setVisible(true);
  };

  const handleDisconnect = () => {
    disconnect();
    setOpen(false);
  };

  if (!connected || !publicKey) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="inline-flex h-10 min-h-[44px] sm:min-h-0 sm:h-9 items-center gap-2 rounded-lg bg-primary px-3 sm:px-4 font-medium text-sm text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
        >
          {iconWallet}
          Connect Wallet
        </button>
      </div>
    );
  }

  const short = shortenAddress(publicKey.toBase58());

  return (
    <div className="relative flex items-center gap-2" ref={ref}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex h-10 min-h-[44px] sm:min-h-0 sm:h-9 min-w-0 max-w-[180px] sm:max-w-[200px] items-center justify-between gap-2 rounded-lg border border-border bg-secondary px-3 sm:px-3.5 font-medium text-xs sm:text-sm text-secondary-foreground touch-manipulation hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-primary/30 transition"
        >
          <span className="truncate font-mono">{short}</span>
          {iconChevronDown}
        </button>

        {open && (
          <div
            className="wallet-dropdown absolute right-0 top-full z-50 mt-1.5 w-56 min-w-[12rem] overflow-hidden rounded-xl border border-border bg-card shadow-xl"
            role="menu"
          >
            {IS_DEVNET && (
              <div className="border-b border-border px-3 py-2">
                <span className="inline-flex rounded-lg bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  Devnet
                </span>
              </div>
            )}
            <div className="border-b border-border px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Connected wallet
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="mt-1 flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-secondary transition"
              >
                <span className="truncate font-mono text-xs text-foreground" title={publicKey.toBase58()}>
                  {short}
                </span>
                {iconCopy}
              </button>
            </div>

            <div className="py-1.5 px-2 space-y-0.5">
              <button
                type="button"
                onClick={handleChangeWallet}
                className="flex w-full items-center gap-2 rounded-lg border border-transparent bg-transparent px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary hover:border-border transition text-left"
              >
                {iconWallet}
                Change wallet
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                className="flex w-full items-center gap-2 rounded-lg border border-transparent bg-transparent px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition text-left"
              >
                {iconLogOut}
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
