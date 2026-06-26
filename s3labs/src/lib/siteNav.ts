export interface SiteNavItem {
  to: string;
  label: string;
  soon?: boolean;
}

export const mainNavLinks: SiteNavItem[] = [
  { to: "/", label: "Home" },
];

export const programNavLinks: SiteNavItem[] = [
  { to: "/kol", label: "KOL" },
  { to: "/campaign", label: "Campaign", soon: true },
  { to: "/contest", label: "Contest", soon: true },
];

export const otherNavLinks: SiteNavItem[] = [
  { to: "/jobs", label: "Jobs" },
  { to: "/events", label: "Events" },
  { to: "/hackathon", label: "Hackathons" },
];

export const adminNavLinks: SiteNavItem[] = [
  { to: "/internal", label: "Internal" },
];
