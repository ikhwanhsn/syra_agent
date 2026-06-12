import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { spcxKickerClass, spcxSectionDescClass, spcxSectionTitleClass } from "@/components/spcx/spcxStyles";

export function SpcxSection({
  id,
  title,
  description,
  icon,
  kicker,
  children,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  kicker?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-28 space-y-4", className)}>
      <div className="space-y-1.5">
        {kicker ? <p className={spcxKickerClass}>{kicker}</p> : null}
        <div className="flex items-center gap-2.5">
          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
          <h2 className={spcxSectionTitleClass}>{title}</h2>
        </div>
        {description ? <p className={cn("max-w-2xl", spcxSectionDescClass)}>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
