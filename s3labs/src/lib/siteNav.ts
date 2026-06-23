export interface SiteNavItem {
  to: string;
  label: string;
  soon?: boolean;
}

export const mainNavLinks: SiteNavItem[] = [
  { to: "/", label: "Home" },
  { to: "/kol", label: "KOL" },
  { to: "/campaign", label: "Campaign", soon: true },
  { to: "/contest", label: "Contest", soon: true },
];
