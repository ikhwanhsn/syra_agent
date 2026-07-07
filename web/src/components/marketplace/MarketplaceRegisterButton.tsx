import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MARKETPLACE_REGISTER_MAILTO } from "@/lib/marketplaceConstants";
import { cn } from "@/lib/utils";

interface MarketplaceRegisterButtonProps {
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}

/** Opens Syra support email to register a new marketplace service. */
export function MarketplaceRegisterButton({
  variant = "default",
  size = "sm",
  className,
}: MarketplaceRegisterButtonProps) {
  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn(
        "h-10 shrink-0 gap-2 rounded-xl px-4 font-semibold shadow-sm",
        variant === "outline" &&
          "border-border/60 bg-background text-foreground hover:bg-muted/60 hover:text-foreground",
        className,
      )}
    >
      <a href={MARKETPLACE_REGISTER_MAILTO}>
        <Plus className="h-4 w-4" aria-hidden />
        Register service
      </a>
    </Button>
  );
}
