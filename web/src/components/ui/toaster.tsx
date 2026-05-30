import { useToast } from "@/hooks/use-toast";
import { SyraToast, type SyraToastVariant } from "@/components/ui/SyraToast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

const SUCCESS_TITLE =
  /\b(copied|updated|created|saved|success|complete|ready|connected|disconnected|added|removed|reset|sent|submitted|applied)\b/i;

function variantFromToast(variant?: string | null, title?: string): SyraToastVariant {
  if (variant === "destructive") return "error";
  if (title && SUCCESS_TITLE.test(title)) return "success";
  return "default";
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={4500} swipeDirection="left">
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        const titleText = typeof title === "string" ? title : undefined;
        const descText = typeof description === "string" ? description : undefined;

        if (titleText) {
          return (
            <Toast key={id} variant={variant} {...props} className="border-0 bg-transparent p-0 shadow-none">
              <SyraToast
                variant={variantFromToast(variant, titleText)}
                title={titleText}
                description={descText}
                showProgress
              />
              {action}
            </Toast>
          );
        }

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
