import type { CSSProperties } from "react";
import { Img, staticFile } from "remotion";
import { useIsRemotionReveal } from "@/video/engine/revealContext";
import { cn } from "@/lib/utils";

const LOGO_PUBLIC = "/images/logo.jpg";

type PostLogoImgProps = {
  className?: string;
  alt?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
};

/**
 * Ship-log logo that works in both the Vite app and Remotion Studio/export.
 * Remotion requires `staticFile()` (plain `/images/...` fails in Studio).
 */
export function PostLogoImg({
  className,
  alt = "",
  style,
  width,
  height,
}: PostLogoImgProps) {
  const remotion = useIsRemotionReveal();

  if (remotion) {
    return (
      <Img
        src={staticFile("images/logo.jpg")}
        alt={alt}
        className={cn(className)}
        style={style}
        width={width}
        height={height}
      />
    );
  }

  return (
    <img
      src={LOGO_PUBLIC}
      alt={alt}
      className={cn(className)}
      style={style}
      width={width}
      height={height}
    />
  );
}
