import { useEffect, useState } from "react";

import { listItemAvatarStyle, listItemInitial } from "@/lib/listAvatar";
import { normalizeImageUrl } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";

type DiscoveryListThumbSize = "sm" | "md";

const SIZE_CLASS: Record<DiscoveryListThumbSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
};

interface DiscoveryListThumbProps {
  imageUrl?: string | null;
  label: string;
  size?: DiscoveryListThumbSize;
  className?: string;
}

export function DiscoveryListThumb({
  imageUrl,
  label,
  size = "md",
  className,
}: DiscoveryListThumbProps) {
  const [failed, setFailed] = useState(false);
  const src = normalizeImageUrl(imageUrl);
  const showImage = Boolean(src) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl ring-1 ring-border/60",
        SIZE_CLASS[size],
        !showImage && "flex items-center justify-center font-semibold dark:opacity-90",
        className,
      )}
      style={!showImage ? listItemAvatarStyle(label) : undefined}
    >
      {showImage ? (
        <img
          src={src!}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden>{listItemInitial(label)}</span>
      )}
    </div>
  );
}
