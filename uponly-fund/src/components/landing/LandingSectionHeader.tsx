import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LandingSectionHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  id?: string;
  className?: string;
  titleClassName?: string;
};

export function LandingSectionHeader({
  eyebrow,
  title,
  description,
  id,
  className,
  titleClassName,
}: LandingSectionHeaderProps) {
  return (
    <header className={cn("max-w-3xl", className)}>
      <p className="landing-eyebrow">{eyebrow}</p>
      <h2
        id={id}
        className={cn(
          "landing-section-title mt-4 text-foreground",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base md:text-[1.0625rem] md:leading-relaxed">
          {description}
        </p>
      ) : null}
    </header>
  );
}
