import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { useMounted } from "@/hooks/useMounted";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const theme = (mounted ? resolvedTheme : "dark") as ToasterProps["theme"];

  return (
    <Sonner
      theme={theme}
      position="bottom-left"
      closeButton={false}
      richColors={false}
      expand={false}
      gap={10}
      offset={20}
      duration={4500}
      visibleToasts={4}
      className="syra-sonner"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "!p-0 !bg-transparent !border-0 !shadow-none !w-auto",
          content: "!p-0",
          title: "hidden",
          description: "hidden",
          icon: "hidden",
          closeButton: "hidden",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
