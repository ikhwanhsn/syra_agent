"use client";

import { useState, useRef, useEffect } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { useConnectModal } from "@/contexts/ConnectModalContext";
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
  const { address, connected, disconnect } = useWalletContext();
  const { openConnectModal } = useConnectModal();
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

  const short = address ? shortenAddress(address) : "";

  if (!connected || !address) {
    return (
      <button
        type="button"
        onClick={() => openConnectModal()}
        className="btn-primary inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
      >
        {iconWallet}
        Connect wallet
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-muted/50"
      >
        {iconWallet}
        <span className="font-mono text-xs sm:text-sm">{short}</span>
        {IS_DEVNET ? (
          <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-warning">
            devnet
          </span>
        ) : null}
        {iconChevronDown}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-border bg-popover p-1 shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(address);
                toast.success("Address copied");
              } catch {
                toast.error("Could not copy");
              }
              setOpen(false);
            }}
          >
            {iconCopy}
            Copy address
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-muted"
            onClick={() => {
              void disconnect();
              setOpen(false);
            }}
          >
            {iconLogOut}
            Disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}
