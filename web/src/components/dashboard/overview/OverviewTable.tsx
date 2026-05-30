import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function OverviewTableShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full caption-bottom text-sm">{children}</table>
    </div>
  );
}

export function OverviewTableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border/50 bg-muted/[0.12]">{children}</tr>
    </thead>
  );
}

export function OverviewTableHeadCell({
  children,
  className,
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cn(
        "h-9 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function OverviewTableBody({ children }: { children: ReactNode }) {
  return <tbody className="[&_tr:last-child]:border-0">{children}</tbody>;
}

export function OverviewTableRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("border-b border-border/35 transition-colors hover:bg-muted/25", className)}>{children}</tr>
  );
}

export function OverviewTableCell({
  children,
  className,
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <td className={cn("px-4 py-3 align-middle", align === "right" && "text-right", className)}>{children}</td>
  );
}
