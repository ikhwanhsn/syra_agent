import { QWERTI_ICON_URL } from "@/data/qwerti";
import { cn } from "@/lib/utils";

type QwertiIconProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass: Record<NonNullable<QwertiIconProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-7 w-7",
};

export function QwertiIcon({ className, size = "md" }: QwertiIconProps) {
  return (
    <img
      src={QWERTI_ICON_URL}
      alt=""
      width={size === "lg" ? 28 : size === "md" ? 24 : 16}
      height={size === "lg" ? 28 : size === "md" ? 24 : 16}
      className={cn(
        sizeClass[size],
        "shrink-0 rounded-full object-cover",
        className,
      )}
      draggable={false}
      aria-hidden
    />
  );
}
