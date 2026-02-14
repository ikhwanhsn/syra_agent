"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/app/ThemeContext";

export function ToasterThemed() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-center"
      theme={theme === "dark" ? "dark" : "light"}
      toastOptions={{
        style: {
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
        },
      }}
    />
  );
}
