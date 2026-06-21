import type { PostPhotoContent } from "./types";

export const EMPTY_PHOTO_CONTENT: PostPhotoContent = {
  eyebrow: "",
  badge: "",
  title: "",
  subtitle: "",
  kicker: "",
  headline: "",
  body: "",
  quote: "",
  highlights: [],
  steps: [],
  cards: [],
  stats: [],
  narrative: "",
  links: [],
  items: [],
  compareLeft: { title: "", body: "" },
  compareRight: { title: "", body: "" },
  terminalLines: [],
  partnerName: "",
  partnerLogo: "",
  partnerLogoSolidBg: false,
};

/** Build card-scoped photo content — only the fields a template needs. */
export function photoContent(overrides: Partial<PostPhotoContent>): PostPhotoContent {
  return { ...EMPTY_PHOTO_CONTENT, ...overrides };
}
