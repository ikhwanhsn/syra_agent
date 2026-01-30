import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-black/30 transition-all",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-transparent hover:bg-secondary hover:text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        neon: "bg-accent text-accent-foreground font-semibold hover:bg-accent/90 hover:shadow-md hover:shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all border border-accent/30 shadow-md dark:bg-gradient-to-r dark:from-gray-500 dark:to-gray-600 dark:text-white dark:border-white/20 dark:shadow-lg dark:shadow-black/30 dark:hover:from-gray-400 dark:hover:to-gray-500 dark:hover:shadow-lg dark:hover:shadow-black/50",
        "neon-outline": "border-2 border-slate-600 bg-transparent text-slate-800 hover:bg-accent/10 hover:border-accent hover:text-accent hover:shadow-sm transition-all dark:border-gray-400 dark:bg-transparent dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-100 dark:hover:border-gray-300 dark:hover:shadow-lg dark:hover:shadow-black/30",
        glass: "bg-card/60 backdrop-blur-sm border border-glass-border text-foreground hover:bg-card/80 hover:border-primary/20 transition-all",
        success: "bg-success text-success-foreground hover:bg-success/90",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        xl: "h-12 rounded-xl px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
