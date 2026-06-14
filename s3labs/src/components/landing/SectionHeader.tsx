import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
  className?: string;
}

const SectionHeader = ({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeaderProps) => (
  <div
    className={cn(
      "mb-14 lg:mb-20 max-w-3xl",
      align === "center" && "mx-auto text-center",
      className,
    )}
  >
    {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
    <h2 className="heading-section text-foreground">{title}</h2>
    {description && (
      <p
        className={cn(
          "mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl",
          align === "center" && "mx-auto",
        )}
      >
        {description}
      </p>
    )}
  </div>
);

export default SectionHeader;
