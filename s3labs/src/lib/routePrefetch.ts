const prefetched = new Set<string>();

const routeLoaders: Record<string, () => Promise<unknown>> = {
  "/community": () => import("@/pages/Community"),
  "/about": () => import("@/pages/About"),
  "/kol": () => import("@/pages/Kol"),
  "/jobs": () => import("@/pages/JobsPage"),
  "/campaign": () => import("@/pages/ComingSoon"),
  "/contest": () => import("@/pages/ComingSoon"),
  "/hackathon": () => import("@/pages/Hackathon"),
  "/events": () => import("@/pages/EventsAdmin"),
  "/internal": () => import("@/pages/InternalPage"),
};

export function prefetchRoute(path: string): void {
  const loader = routeLoaders[path];
  if (!loader || prefetched.has(path)) return;
  prefetched.add(path);
  void loader();
}

export function prefetchNavRoutes(paths: string[]): void {
  paths.forEach(prefetchRoute);
}
