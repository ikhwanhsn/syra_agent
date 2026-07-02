import {
  aboutProseClass,
  aboutSectionKickerClass,
  aboutSectionTitleClass,
} from "@/components/about/aboutStyles";
import { cn } from "@/lib/utils";

export function AboutSectionHeader({
  kicker,
  title,
  description,
  align = "left",
  className,
}: {
  kicker: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-7 sm:mb-8",
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      <p className={cn(aboutSectionKickerClass, align === "center" && "justify-center before:hidden")}>{kicker}</p>
      <h2 className={cn(aboutSectionTitleClass, "mt-3 text-balance")}>{title}</h2>
      {description ? (
        <p className={cn(aboutProseClass, "mt-2.5 max-w-2xl text-pretty", align === "center" && "mx-auto")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
