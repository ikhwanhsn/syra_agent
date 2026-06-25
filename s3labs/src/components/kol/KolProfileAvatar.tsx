import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

/** Prefer a higher-res X profile image when the URL uses the default suffix. */
export function normalizeXProfilePictureUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return trimmed.replace(/_normal(\.(jpe?g|png|webp))$/i, "_400x400$1");
}

function cleanHandle(handle: string): string {
  return handle.trim().replace(/^@/, "");
}

/** Fallback when API cache has no picture yet (common for project source authors). */
export function xProfileAvatarFallbackUrl(handle: string): string | null {
  const clean = cleanHandle(handle);
  if (!clean) return null;
  return `https://unavatar.io/x/${encodeURIComponent(clean)}`;
}

interface KolProfileAvatarProps {
  handle: string;
  name?: string;
  profilePicture?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 rounded-lg text-xs",
  md: "h-10 w-10 rounded-xl text-sm",
  lg: "h-20 w-20 rounded-2xl text-2xl",
} as const;

export function KolProfileAvatar({
  handle,
  name,
  profilePicture,
  className,
  size = "md",
}: KolProfileAvatarProps) {
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const primarySrc = normalizeXProfilePictureUrl(profilePicture);
  const fallbackSrc = useMemo(() => xProfileAvatarFallbackUrl(handle), [handle]);
  const src =
    primarySrc && !primaryFailed
      ? primarySrc
      : fallbackSrc && !fallbackFailed
        ? fallbackSrc
        : null;

  const initial = (name?.trim() || handle).slice(0, 1).toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          if (primarySrc && !primaryFailed) {
            setPrimaryFailed(true);
            return;
          }
          setFallbackFailed(true);
        }}
        className={cn(
          sizeClasses[size],
          "object-cover shrink-0 ring-1 ring-border bg-muted",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClasses[size],
        "bg-muted flex items-center justify-center font-bold text-muted-foreground shrink-0 ring-1 ring-border uppercase",
        className,
      )}
      aria-hidden
    >
      {initial}
    </div>
  );
}
