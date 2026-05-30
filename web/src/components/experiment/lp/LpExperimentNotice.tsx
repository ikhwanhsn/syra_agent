import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { lpNoticeClass, type LpNoticeVariant } from "./lpExperimentStyles";

export interface LpExperimentNoticeProps {
  variant?: LpNoticeVariant;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function LpExperimentNotice({
  variant = "info",
  icon: Icon,
  children,
  className,
}: LpExperimentNoticeProps) {
  const styles = lpNoticeClass(variant);
  return (
    <div className={cn(styles.shell, className)}>
      <Icon className={styles.icon} aria-hidden />
      <div className={styles.text}>{children}</div>
    </div>
  );
}
