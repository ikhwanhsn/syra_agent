import { useCallback, useState } from "react";
import { Share2 } from "lucide-react";

import { KolProfileShareDialog } from "@/components/profile/KolProfileShareDialog";
import type { KolProfileShareCardData } from "@/components/profile/KolProfileShareCard";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ProfileShareActionProps {
  data: KolProfileShareCardData;
  thirdPerson?: boolean;
  prominent?: boolean;
  className?: string;
  buttonLabel?: string;
  tooltip?: string;
}

export function ProfileShareAction({
  data,
  thirdPerson = false,
  prominent = false,
  className,
  buttonLabel = "Share profile card",
  tooltip,
}: ProfileShareActionProps) {
  const [shareOpen, setShareOpen] = useState(false);

  const openShare = useCallback(() => {
    setShareOpen(true);
  }, []);

  const tooltipText =
    tooltip ??
    (thirdPerson
      ? "Share this profile card on social media"
      : "Share your reputation card on social media");

  return (
    <div className={cn(prominent && "w-full")}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size={prominent ? "default" : "sm"}
              className={cn(
                prominent
                  ? "h-11 w-full rounded-full gap-2 border-primary/35 bg-primary/10 font-semibold text-primary shadow-sm hover:bg-primary/15 hover:text-primary"
                  : "gap-2 rounded-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary",
                className,
              )}
              onClick={openShare}
            >
              <Share2 className="h-4 w-4 shrink-0" aria-hidden />
              {buttonLabel}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tooltipText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <KolProfileShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        data={data}
        thirdPerson={thirdPerson}
      />
    </div>
  );
}
