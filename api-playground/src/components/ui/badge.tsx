import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive/20 text-destructive",
        outline: "text-foreground border-border",
        success: "border-transparent bg-primary/12 text-foreground",
        warning: "border-transparent bg-muted text-foreground",
        // HTTP Method badges (monochrome — matches landing/docs)
        get: "border-border bg-foreground/[0.06] text-foreground uppercase tracking-wide",
        post: "border-border bg-foreground/10 text-foreground uppercase tracking-wide",
        put: "border-border/80 bg-muted text-foreground uppercase tracking-wide",
        patch: "border-border/80 bg-secondary text-foreground uppercase tracking-wide",
        delete: "border-border bg-destructive/15 text-foreground uppercase tracking-wide",
        // Status badges
        "status-success": "border-border bg-primary/10 text-foreground",
        "status-error": "border-border bg-destructive/15 text-foreground",
        "status-payment": "border-border bg-muted text-foreground",
        "status-pending": "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
