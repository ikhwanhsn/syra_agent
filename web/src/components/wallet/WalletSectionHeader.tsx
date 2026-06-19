import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { walletSectionDesc, walletSectionTitle } from "@/components/wallet/walletPageStyles";

type WalletSectionHeaderProps = {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function WalletSectionHeader({
  id,
  title,
  description,
  action,
  className,
}: WalletSectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h2 id={id} className={walletSectionTitle}>{title}</h2>
        {description ? <p className={walletSectionDesc}>{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
