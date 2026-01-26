import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(270_70%_60%/0.4)] hover:-translate-y-0.5 active:translate-y-0",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_20px_hsl(0_84%_60%/0.4)] hover:-translate-y-0.5 active:translate-y-0",
        outline: "border border-border bg-transparent hover:bg-secondary hover:border-primary/50 hover:shadow-[0_0_15px_hsl(270_70%_60%/0.2)] hover:-translate-y-0.5 active:translate-y-0",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border hover:border-primary/40 hover:shadow-[0_0_15px_hsl(270_70%_60%/0.2)] hover:-translate-y-0.5 active:translate-y-0",
        ghost: "hover:bg-secondary hover:text-foreground hover:scale-105 active:scale-95",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        gradient: "text-foreground [background:linear-gradient(135deg,hsl(270_70%_60%)_0%,hsl(210_100%_60%)_50%,hsl(190_90%_50%)_100%)] hover:-translate-y-1 hover:shadow-[0_0_30px_hsl(270_70%_60%/0.5),0_0_60px_hsl(190_90%_50%/0.3)] hover:scale-105 active:translate-y-0 active:scale-100",
        hero: "text-foreground [background:linear-gradient(135deg,hsl(270_70%_60%)_0%,hsl(210_100%_60%)_50%,hsl(190_90%_50%)_100%)] hover:-translate-y-1 hover:shadow-[0_0_40px_hsl(270_70%_60%/0.6),0_0_80px_hsl(190_90%_50%/0.4)] hover:scale-105 active:translate-y-0 active:scale-100 px-8 py-4 text-base",
        glass: "bg-card/60 backdrop-blur-lg border border-border/50 hover:border-primary/40 hover:bg-card/80 hover:shadow-[0_0_20px_hsl(270_70%_60%/0.2)] hover:-translate-y-0.5 active:translate-y-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
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
