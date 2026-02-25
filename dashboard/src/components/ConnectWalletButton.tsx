import { useState, useRef, useEffect } from "react";
import { useWalletContext } from "../contexts/WalletContext";
import { cn } from "../lib/utils";

function IconWallet({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}
function IconCoins({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="M16 14h1v4" />
    </svg>
  );
}
function IconLogOut({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/**
 * Connect wallet button with same UI/UX as api-playground TopBar:
 * - Disconnected: neon-style "Connect Wallet" button
 * - Connected: balance + short address, dropdown with SOL/USDC/SYRA and Disconnect; "View only" badge when not admin
 */
export function ConnectWalletButton() {
  const wallet = useWalletContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (wallet.connected) {
    return (
      <div className="relative flex items-center gap-3" ref={dropdownRef}>
        <div className="hidden sm:flex items-center gap-2">
          {wallet.canInteract ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Connected</span>
            </div>
          ) : wallet.canViewDashboard ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs font-medium text-amber-400">View only</span>
            </div>
          ) : null}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className={cn(
              "inline-flex items-center gap-1.5 sm:gap-2 h-9 px-3 rounded-lg text-xs font-medium",
              "bg-syra-card/80 backdrop-blur border border-gray-700 text-gray-200",
              "hover:bg-gray-800/80 hover:border-gray-600 max-w-[140px] sm:max-w-none min-w-0"
            )}
          >
            <IconCoins className="h-3.5 w-3.5 text-syra-primary shrink-0" />
            <span className="truncate">
              {wallet.usdcBalance !== null
                ? `${wallet.usdcBalance.toFixed(2)} USDC`
                : "0 USDC"}
            </span>
            <span className="text-gray-500 shrink-0 hidden sm:inline">|</span>
            <span className="truncate hidden sm:inline">
              {wallet.shortAddress}
            </span>
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-800 bg-syra-card shadow-xl z-50 py-1"
              role="menu"
            >
              <div className="px-3 py-2 border-b border-gray-800">
                <p className="text-sm font-medium text-white">
                  Wallet Connected
                  {!wallet.canInteract && wallet.canViewDashboard && (
                    <span className="ml-1.5 text-xs font-normal text-amber-400">(View only)</span>
                  )}
                </p>
                <p className="text-xs font-mono text-gray-500 truncate">
                  {wallet.address}
                </p>
              </div>
              <div className="px-3 py-2 flex justify-between text-sm">
                <span className="text-gray-400">SOL Balance</span>
                <span className="font-mono text-gray-200">
                  {wallet.solBalance?.toFixed(4) ?? "0"} SOL
                </span>
              </div>
              <div className="px-3 py-2 flex justify-between text-sm">
                <span className="text-gray-400">USDC Balance</span>
                <span className="font-mono text-gray-200">
                  {wallet.usdcBalance?.toFixed(2) ?? "0"} USDC
                </span>
              </div>
              <div className="px-3 py-2 flex justify-between text-sm">
                <span className="text-gray-400">SYRA Balance</span>
                <span className="font-mono text-gray-200">
                  {wallet.syraBalance !== null
                    ? wallet.syraBalance.toLocaleString()
                    : "—"}
                </span>
              </div>
              <div className="border-t border-gray-800" />
              <button
                type="button"
                onClick={() => {
                  wallet.disconnect();
                  setDropdownOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-800/80"
              >
                <IconLogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={wallet.connect}
      disabled={wallet.connecting}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold",
        "bg-syra-primary text-black hover:bg-syra-primary/90",
        "shadow-md hover:shadow-syra-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all border border-syra-primary/30",
        "disabled:opacity-50 disabled:pointer-events-none"
      )}
      title="Connect your Solana wallet to access the dashboard"
    >
      <IconWallet className="h-4 w-4" />
      {wallet.connecting ? (
        <span>Connecting...</span>
      ) : (
        <>
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </>
      )}
    </button>
  );
}
