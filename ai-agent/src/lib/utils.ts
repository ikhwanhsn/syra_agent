import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Uppercase the first character only (e.g. chat titles and previews). Empty / nullish unchanged. */
export function capitalizeFirstLetter(value: string | null | undefined): string {
  if (value == null || value === "") return "";
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}
