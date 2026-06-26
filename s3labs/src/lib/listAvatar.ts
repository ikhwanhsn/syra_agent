import type { CSSProperties } from "react";

export function listItemInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

export function listItemAvatarStyle(name: string): CSSProperties {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return {
    background: `hsl(${hue} 55% 92%)`,
    color: `hsl(${hue} 45% 32%)`,
  };
}
