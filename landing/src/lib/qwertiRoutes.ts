const HIDDEN_PATH_PREFIXES = [
  "/identity",
  "/brand",
  "/teams",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

export function isQwertiHiddenRoute(pathname: string): boolean {
  return HIDDEN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
