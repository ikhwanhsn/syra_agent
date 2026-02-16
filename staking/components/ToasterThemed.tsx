"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/app/ThemeContext";

export function ToasterThemed() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-center"
      theme={theme === "dark" ? "dark" : "light"}
      closeButton
      richColors={false}
      toastOptions={{
        className: "staking-toast",
        style: {
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
          borderRadius: "var(--radius)",
          boxShadow: "var(--glass-shadow)",
          padding: "14px 16px",
        },
        classNames: {
          success: "staking-toast-success",
          error: "staking-toast-error",
        },
      }}
    />
  );
}
