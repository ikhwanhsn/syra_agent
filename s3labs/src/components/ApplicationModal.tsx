import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();

  const requirements = [
    t(
      "Produk sudah MVP (Ready di Devnet/Mainnet), atau",
      "MVP live on Devnet/Mainnet, or",
    ),
    t(
      "Produk masih on-going dengan tim yang proper",
      "On-going product with a solid team",
    ),
    t(
      "Tim berkomitmen untuk membangun & bertumbuh",
      "Committed & growth-focused founders",
    ),
    t("Fokus pada ekosistem Web3", "Web3 ecosystem oriented"),
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
            {t(
              "Syarat Project untuk Bergabung dengan S3 Labs",
              "Project Requirements to Join S3 Labs",
            )}
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
            {t(
              "Kami fokus pada project yang siap dieksekusi & memiliki arah yang jelas.",
              "We focus on projects that are ready to execute & have a clear direction.",
            )}
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button
            variant="hero"
            size="lg"
            className="flex-1 group h-auto sm:h-12 py-3 sm:py-0"
            onClick={handleContinue}
          >
            {t("Lanjutkan ke Form Pengajuan", "Continue to Submission Form")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" size="lg" onClick={onClose}>
            {t("Batalkan", "Cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationModal;
