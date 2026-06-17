export interface EventItem {
  id: string;
  title: string;
  description: string;
  image: string;
  date?: string;
  location?: string;
  link?: string;
  comingSoon: boolean;
}

export const EVENTS: EventItem[] = [
  {
    id: "web3-sharing-session-feb-2026",
    title: "Web3 Sharing Session",
    description: "How to transition from a non-IT background into Web3. Join our live Space on X.",
    image: "/images/event1.jpg",
    date: "4 Feb 2026",
    location: "Online · Space on X",
    link: "https://x.com/i/spaces/1MYGNlMWzeQxw?s=20",
    comingSoon: false,
  },
  {
    id: "coming-soon-2",
    title: "Coming Soon",
    description: "We're preparing something exciting. Stay tuned for updates.",
    image: "",
    comingSoon: true,
  },
  {
    id: "coming-soon-3",
    title: "Coming Soon",
    description: "We're preparing something exciting. Stay tuned for updates.",
    image: "",
    comingSoon: true,
  },
  {
    id: "coming-soon-4",
    title: "Coming Soon",
    description: "We're preparing something exciting. Stay tuned for updates.",
    image: "",
    comingSoon: true,
  },
  {
    id: "coming-soon-5",
    title: "Coming Soon",
    description: "We're preparing something exciting. Stay tuned for updates.",
    image: "",
    comingSoon: true,
  },
];

export const EVENTS_LANDING_LIMIT = 3;
