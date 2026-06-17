
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Send } from "lucide-react";

const TELEGRAM_COMMUNITY_URL = "https://t.me/s3labs";

interface TelegramCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
}

const TelegramCommunityModal = ({
  open,
  onOpenChange,
  onDismiss,
}: TelegramCommunityModalProps) => {

  const handleClose = (next: boolean) => {
    if (!next) onDismiss();
    onOpenChange(next);
  };

  const handleJoinClick = () => {
    window.open(TELEGRAM_COMMUNITY_URL, "_blank", "noopener,noreferrer");
    onDismiss();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md bg-card border-border"
        onPointerDownOutside={() => handleClose(false)}
        onEscapeKeyDown={() => handleClose(false)}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {"Join S3Labs Community"}
          </DialogTitle>
          <DialogDescription className="text-left">
            {"Join our Telegram community for event updates, discussions with builders, and collaboration opportunities in the Solana ecosystem."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            variant="hero"
            size="lg"
            className="w-full group"
            onClick={handleJoinClick}
          >
            <Send className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            {"Open Telegram"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {"Link: t.me/s3labs"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramCommunityModal;
