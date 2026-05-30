import type { ReactNode } from "react";
import { toast as sonner } from "sonner";
import { SyraToast, type SyraToastVariant } from "@/components/ui/SyraToast";

const DEFAULT_DURATION_MS = 4500;

function show(variant: SyraToastVariant, title: ReactNode, description?: ReactNode) {
  sonner.custom(
    (id) => (
      <SyraToast
        variant={variant}
        title={title}
        description={description}
        durationMs={DEFAULT_DURATION_MS}
        onClose={() => sonner.dismiss(id)}
      />
    ),
    { duration: DEFAULT_DURATION_MS },
  );
}

/** Premium alerts — glass card, icon, accent bar, progress (bottom-left). */
export const notify = {
  success(title: ReactNode, description?: ReactNode) {
    show("success", title, description);
  },
  error(title: ReactNode, description?: ReactNode) {
    show("error", title, description);
  },
  info(title: ReactNode, description?: ReactNode) {
    show("info", title, description);
  },
  message(title: ReactNode, description?: ReactNode) {
    show("info", title, description);
  },
  default(title: ReactNode, description?: ReactNode) {
    show("default", title, description);
  },
};
