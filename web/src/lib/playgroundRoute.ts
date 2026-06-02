/** True when the route should use the playground shell layout in AppShell. */
export function isPlaygroundPath(pathname: string): boolean {
  return pathname === "/playground" || pathname.startsWith("/playground/");
}

/** Active state for the Playground nav link (any `/playground` route). */
export function isPlaygroundNavItemActive(pathname: string, href: string): boolean {
  if (href !== "/playground") return pathname === href || pathname.startsWith(`${href}/`);
  return pathname === "/playground" || pathname.startsWith("/playground/");
}
