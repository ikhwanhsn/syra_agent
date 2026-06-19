import type { ReactNode } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  playgroundHeroCard,
  playgroundHeroGlow,
  playgroundKickerClass,
  playgroundSectionSubtitleClass,
  playgroundSectionTitleClass,
  playgroundStatLabel,
  playgroundStatTile,
  playgroundStatValue,
  playgroundWalletChipClass,
} from "@/components/playground/playgroundStyles";
import { playgroundSectionEnter } from "@/components/playground/playgroundMotion";
import { cn } from "@/lib/utils";

export interface PlaygroundHeroStat {
  label: string;
  value: string;
}

interface PlaygroundHeroProps {
  kicker: string;
  title: string;
  description: string;
  stats?: PlaygroundHeroStat[];
  badges?: ReactNode;
  walletConnected?: boolean;
  walletBalance?: string;
  onConnectWallet?: () => void;
  actions?: ReactNode;
  className?: string;
}

export function PlaygroundHero({
  kicker,
  title,
  description,
  stats,
  badges,
  walletConnected,
  walletBalance,
  onConnectWallet,
  actions,
  className,
}: PlaygroundHeroProps) {
  return (
    <section className={cn(playgroundHeroCard, playgroundSectionEnter, className)}>
      <div className={playgroundHeroGlow} aria-hidden />
      <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className={playgroundKickerClass}>{kicker}</p>
          <h1 className={cn(playgroundSectionTitleClass, "mt-2")}>{title}</h1>
          <p className={playgroundSectionSubtitleClass}>{description}</p>
          {badges ? <div className="mt-4 flex flex-wrap gap-2">{badges}</div> : null}
          {stats && stats.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:max-w-xl">
              {stats.map((stat) => (
                <div key={stat.label} className={playgroundStatTile}>
                  <p className={playgroundStatLabel}>{stat.label}</p>
                  <p className={playgroundStatValue}>{stat.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-end">
          {walletConnected ? (
            <span className={playgroundWalletChipClass}>
              <Wallet className="h-4 w-4 text-primary" aria-hidden />
              {walletBalance || "0 USDC"}
            </span>
          ) : onConnectWallet ? (
            <Button
              variant="neon"
              size="sm"
              className="h-10 rounded-xl px-5 shadow-sm"
              onClick={onConnectWallet}
            >
              <Wallet className="mr-2 h-4 w-4" aria-hidden />
              Connect wallet
            </Button>
          ) : null}
          {actions}
        </div>
      </div>
    </section>
  );
}
