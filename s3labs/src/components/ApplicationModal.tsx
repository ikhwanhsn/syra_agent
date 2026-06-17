
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, ArrowRight, X } from "lucide-react";

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApplicationModal = ({ isOpen, onClose }: ApplicationModalProps) => {

  const requirements = [
    "MVP live on Devnet/Mainnet, or",
    "On-going product with a solid team",
    "Committed & growth-focused founders",
    "Web3 ecosystem oriented",
  ];

  const handleContinue = () => {
    // Redirect to Google Form (placeholder)
    window.open("https://forms.gle/LVLszMvQ1PZFB78X9", "_blank");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {"Project Requirements to Join S3 Labs"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-foreground">{req}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border">
          <p className="text-sm text-muted-foreground">
            {"We focus on projects that are ready to execute & have a clear direction."}
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button
            variant="hero"
            size="lg"
            className="flex-1 group h-auto sm:h-12 py-3 sm:py-0"
            onClick={handleContinue}
          >
            {"Continue to Submission Form"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" size="lg" onClick={onClose}>
            {"Cancel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationModal;
