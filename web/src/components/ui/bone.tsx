import type { ReactNode } from "react";
import { useMemo } from "react";
import { Skeleton as BoneyardBone } from "boneyard-js/react";
import { getRegisteredBones, resolveResponsive } from "boneyard-js/shared";

function capturedHeight(name: string): number {
  const bones = getRegisteredBones(name);
  if (!bones) return 0;
  const width = typeof window !== "undefined" ? window.innerWidth : 1280;
  const active = resolveResponsive(bones, width);
  return active?.height ?? 0;
}

/** Boneyard skeleton. While loading, sizes the overlay from captured bones. */
export function Bone({
  name,
  loading,
  className,
  fixture,
  children,
}: {
  name: string;
  loading: boolean;
  className?: string;
  fixture?: ReactNode;
  children?: ReactNode;
}) {
  const height = useMemo(() => capturedHeight(name), [name]);
  const body = loading && height > 0 ? <div aria-hidden style={{ height }} /> : children;

  return (
    <BoneyardBone name={name} loading={loading} className={className} fixture={fixture}>
      {body}
    </BoneyardBone>
  );
}

/** Named skeleton used as an early-return loader. */
export function BoneFallback({
  name,
  loading = true,
  className,
  children,
}: {
  name: string;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Bone name={name} loading={loading} className={className}>
      {children}
    </Bone>
  );
}
