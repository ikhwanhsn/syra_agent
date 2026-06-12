import { ArrowRightLeft, Building2, Share2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const ACTIONS = [
  { id: "spcx-trade", label: "Buy SPCXx", icon: ArrowRightLeft, primary: true },
  { id: "spcx-playbook", label: "Compare venues", icon: Building2, primary: false },
  { id: "spcx-verify", label: "Verify mint", icon: ShieldCheck, primary: false },
  { id: "spcx-share", label: "Share intel", icon: Share2, primary: false },
] as const;

export function SpcxActionRail({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "sticky top-16 z-20 -mx-1 rounded-2xl border border-border/55 bg-background/85 px-2 py-2 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/70",
        className,
      )}
    >
      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ACTIONS.map(({ id, label, icon: Icon, primary }) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={primary ? "default" : "outline"}
            className={cn(
              "shrink-0 gap-1.5 rounded-xl",
              primary && "font-semibold shadow-sm",
            )}
            onClick={() => scrollToSection(id)}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
