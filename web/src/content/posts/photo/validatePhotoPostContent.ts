import type { PostPhotoContent } from "./types";
import type { PostPhotoLayoutTemplate } from "./layouts";
import { POST_PHOTO_LAYOUT_REGISTRY_MAP } from "@/components/post/photo/postPhotoLayoutRegistry";
import type { PhotoBlockId } from "@/components/post/photo/postPhotoLayoutRegistry";

/** Max characters per content field — tuned for 1200×675 export without overflow. */
export const POST_PHOTO_FIELD_LIMITS: Record<string, number> = {
  eyebrow: 24,
  badge: 42,
  title: 36,
  subtitle: 180,
  kicker: 28,
  headline: 64,
  body: 240,
  quote: 120,
  narrative: 200,
  partnerName: 24,
};

const LIST_LIMITS = {
  highlightItem: 72,
  highlightCount: 5,
  stepTitle: 32,
  stepDescription: 88,
  stepCount: 4,
  cardTitle: 24,
  cardDetail: 72,
  cardCount: 4,
  statValue: 8,
  statLabel: 32,
  statCount: 3,
  item: 88,
  itemCount: 6,
  linkLabel: 16,
  linkValue: 36,
  linkCount: 4,
  terminalLine: 88,
  terminalLineCount: 6,
  compareBody: 160,
  compareTitle: 16,
};

type ContentField = keyof PostPhotoContent;

const BLOCK_FIELDS: Partial<Record<PhotoBlockId, ContentField[]>> = {
  eyebrow: ["eyebrow"],
  badge: ["badge"],
  title: ["title"],
  subtitle: ["subtitle"],
  kicker: ["kicker"],
  headline: ["headline"],
  body: ["body"],
  quote: ["quote"],
  narrative: ["narrative"],
  "logo-lockup": ["title"],
  "logo-hero": [],
  "brand-name": [],
  "highlights-all": ["highlights"],
  "highlights-3": ["highlights"],
  "highlights-4": ["highlights"],
  "stats-all": ["stats"],
  "stats-2": ["stats"],
  "stats-1": ["stats"],
  "stats-strip": ["stats"],
  "cards-2": ["cards"],
  "cards-4": ["cards"],
  "steps-timeline": ["steps"],
  "steps-pipeline": ["steps"],
  "steps-numbered": ["steps"],
  "steps-zigzag": ["steps"],
  "steps-arrows": ["steps"],
  compare: ["compareLeft", "compareRight"],
  links: ["links"],
  "items-all": ["items"],
  "items-numbered": ["items"],
  terminal: ["terminalLines"],
  "partnership-lockup": ["partnerName"],
};

function checkText(field: string, value: string, limit: number, cardLabel: string, errors: string[]): void {
  if (!value) return;
  if (value.length > limit) {
    errors.push(
      `${cardLabel}: "${field}" is ${value.length} chars (max ${limit}). Shorten copy or pick a roomier layout.`,
    );
  }
}

function validateBlock(block: PhotoBlockId, content: PostPhotoContent, cardLabel: string, errors: string[]): void {
  switch (block) {
    case "highlights-all":
    case "highlights-3":
    case "highlights-4": {
      const maxItems = block === "highlights-3" ? 3 : block === "highlights-4" ? 4 : LIST_LIMITS.highlightCount;
      content.highlights.slice(0, maxItems).forEach((item, i) => {
        checkText(`highlights[${i}]`, item, LIST_LIMITS.highlightItem, cardLabel, errors);
      });
      break;
    }
    case "steps-timeline":
    case "steps-pipeline":
    case "steps-numbered":
    case "steps-zigzag":
    case "steps-arrows": {
      content.steps.slice(0, LIST_LIMITS.stepCount).forEach((step, i) => {
        checkText(`steps[${i}].title`, step.title, LIST_LIMITS.stepTitle, cardLabel, errors);
        checkText(`steps[${i}].description`, step.description, LIST_LIMITS.stepDescription, cardLabel, errors);
      });
      break;
    }
    case "cards-2":
    case "cards-4": {
      const maxCards = block === "cards-2" ? 2 : LIST_LIMITS.cardCount;
      content.cards.slice(0, maxCards).forEach((card, i) => {
        checkText(`cards[${i}].title`, card.title, LIST_LIMITS.cardTitle, cardLabel, errors);
        if (card.detail) checkText(`cards[${i}].detail`, card.detail, LIST_LIMITS.cardDetail, cardLabel, errors);
      });
      break;
    }
    case "stats-all":
    case "stats-2":
    case "stats-1":
    case "stats-strip": {
      const maxStats = block === "stats-2" ? 2 : block === "stats-1" ? 1 : LIST_LIMITS.statCount;
      content.stats.slice(0, maxStats).forEach((stat, i) => {
        checkText(`stats[${i}].value`, stat.value, LIST_LIMITS.statValue, cardLabel, errors);
        checkText(`stats[${i}].label`, stat.label, LIST_LIMITS.statLabel, cardLabel, errors);
      });
      break;
    }
    case "compare":
      checkText("compareLeft.title", content.compareLeft.title, LIST_LIMITS.compareTitle, cardLabel, errors);
      checkText("compareLeft.body", content.compareLeft.body, LIST_LIMITS.compareBody, cardLabel, errors);
      checkText("compareRight.title", content.compareRight.title, LIST_LIMITS.compareTitle, cardLabel, errors);
      checkText("compareRight.body", content.compareRight.body, LIST_LIMITS.compareBody, cardLabel, errors);
      break;
    case "links": {
      content.links.slice(0, LIST_LIMITS.linkCount).forEach((link, i) => {
        checkText(`links[${i}].label`, link.label, LIST_LIMITS.linkLabel, cardLabel, errors);
        checkText(`links[${i}].value`, link.value, LIST_LIMITS.linkValue, cardLabel, errors);
      });
      break;
    }
    case "items-all":
    case "items-numbered": {
      content.items.slice(0, LIST_LIMITS.itemCount).forEach((item, i) => {
        checkText(`items[${i}]`, item, LIST_LIMITS.item, cardLabel, errors);
      });
      break;
    }
    case "terminal": {
      content.terminalLines.slice(0, LIST_LIMITS.terminalLineCount).forEach((line, i) => {
        checkText(`terminalLines[${i}]`, line, LIST_LIMITS.terminalLine, cardLabel, errors);
      });
      break;
    }
    case "partnership-lockup":
      checkText("partnerName", content.partnerName, POST_PHOTO_FIELD_LIMITS.partnerName, cardLabel, errors);
      break;
    default: {
      const fields = BLOCK_FIELDS[block] ?? [];
      for (const field of fields) {
        const value = content[field];
        if (typeof value === "string") {
          const limit = POST_PHOTO_FIELD_LIMITS[field] ?? 200;
          checkText(field, value, limit, cardLabel, errors);
        }
      }
    }
  }
}

export function validatePhotoCardContent(
  layout: PostPhotoLayoutTemplate,
  content: PostPhotoContent,
  cardRole: string,
): string[] {
  const def = POST_PHOTO_LAYOUT_REGISTRY_MAP.get(layout);
  if (!def) return [`${cardRole}: unknown layout "${layout}"`];

  const errors: string[] = [];
  const cardLabel = `card "${cardRole}" (${layout})`;
  const blocks = [...def.blocks, ...(def.asideBlocks ?? [])];

  for (const block of blocks) {
    validateBlock(block, content, cardLabel, errors);
  }

  return errors;
}

/** Dev/build guard — throws when photo copy exceeds safe export limits. */
export function assertPhotoPostContentValid(
  postId: string,
  cards: { role: string; layout: PostPhotoLayoutTemplate; content: PostPhotoContent }[],
): void {
  const errors = cards.flatMap((card) => validatePhotoCardContent(card.layout, card.content, card.role));
  if (errors.length === 0) return;

  const message = `[post/photo] "${postId}" content exceeds export-safe limits:\n${errors.join("\n")}`;
  if (import.meta.env.DEV) {
    console.warn(message);
    return;
  }

  throw new Error(message);
}
