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
        success: "border-transparent bg-success/20 text-success",
        warning: "border-transparent bg-warning/20 text-warning",
        // HTTP Method badges
        get: "border-transparent bg-success/20 text-success uppercase tracking-wide",
        post: "border-transparent bg-warning/20 text-warning uppercase tracking-wide",
        put: "border-transparent bg-accent/20 text-accent uppercase tracking-wide",
        patch: "border-transparent bg-primary/20 text-primary uppercase tracking-wide",
        delete: "border-transparent bg-destructive/20 text-destructive uppercase tracking-wide",
        // Status badges
        "status-success": "border-success/30 bg-success/20 text-success",
        "status-error": "border-destructive/30 bg-destructive/20 text-destructive",
        "status-payment": "border-warning/30 bg-warning/20 text-warning animate-pulse",
        "status-pending": "border-muted-foreground/30 bg-muted text-muted-foreground",
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
