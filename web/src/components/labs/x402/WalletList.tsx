import { Copy, Wallet, ArrowDownToLine, Play } from "lucide-react";
import { WalletListSkeleton } from "@/components/labs/LabsSkeleton";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";
import type { LabChain, LabWallet } from "@/lib/labsX402Api";

function shortenAddress(addr: string, chain: LabChain): string {
  if (addr.length <= 12) return addr;
  if (chain === "base") return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  // Solana + Algorand: 4…4
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function nativeSymbolForChain(chain: LabChain): string {
  if (chain === "base") return "ETH";
  if (chain === "algorand") return "ALGO";
  return "SOL";
}

function formatBalance(n: number | null | undefined, decimals = 4): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: decimals });
}

interface WalletListProps {
  wallets: LabWallet[];
  isLoading: boolean;
  onDeposit: (wallet: LabWallet) => void;
  onRunPayer: (address: string) => void;
  isRunning: boolean;
  chain?: LabChain;
}

export function WalletList({
  wallets,
  isLoading,
  onDeposit,
  onRunPayer,
  isRunning,
  chain = "solana",
}: WalletListProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const showSkeleton = useMinimumSkeleton(isLoading);
  const nativeSymbol = nativeSymbolForChain(chain);

  const copy = async (addr: string) => {
    await navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  if (showSkeleton) {
    return <WalletListSkeleton />;
  }

  if (wallets.length === 0) {
    return (
      <div className={cn(overviewCardShell, "p-8 text-center text-sm text-muted-foreground")}>
        No lab wallets yet. Create a payTo wallet first, then add payer wallets.
      </div>
    );
  }

  return (
    <div className={cn(overviewCardShell, "overflow-hidden")}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="text-right">{nativeSymbol}</TableHead>
            <TableHead className="text-right">USDC</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wallets.map((w) => {
            const native = w.nativeBalance ?? w.solBalance;
            return (
              <TableRow key={w.id}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {w.label}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={w.role === "payto" ? "default" : "secondary"}>
                    {w.role === "payto" ? "PayTo" : "Payer"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => void copy(w.address)}
                    title={w.address}
                  >
                    {shortenAddress(w.address, chain)}
                    <Copy className="h-3 w-3" aria-hidden />
                    {copied === w.address ? (
                      <span className="text-green-500">Copied</span>
                    ) : null}
                  </button>
                </TableCell>
                <TableCell
                  className="text-right font-mono text-sm"
                  title={native == null ? "Balance unavailable — RPC read failed" : undefined}
                >
                  {formatBalance(native)}
                </TableCell>
                <TableCell
                  className="text-right font-mono text-sm"
                  title={w.usdcBalance == null ? "Balance unavailable — RPC read failed" : undefined}
                >
                  {formatBalance(w.usdcBalance, 2)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onDeposit(w)}>
                      <ArrowDownToLine className="mr-1 h-3.5 w-3.5" aria-hidden />
                      Deposit
                    </Button>
                    {w.role === "payer" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isRunning}
                        onClick={() => onRunPayer(w.address)}
                      >
                        <Play className="mr-1 h-3.5 w-3.5" aria-hidden />
                        Run
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
