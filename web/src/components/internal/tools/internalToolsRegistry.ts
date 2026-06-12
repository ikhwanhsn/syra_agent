import type { LucideIcon } from "lucide-react";
import { BarChart3, ImageIcon, Layers, Megaphone, MessageSquareQuote, Wand2 } from "lucide-react";

export type InternalToolId =
  | "narrative"
  | "quote-response"
  | "thread-expander"
  | "proof-drop"
  | "copy-polisher"
  | "image-prompt";

export type InternalToolCategory = "content" | "ops" | "growth";

export const INTERNAL_TOOL_CATEGORY_LABELS: Record<InternalToolCategory, string> = {
  content: "Content",
  ops: "Ops",
  growth: "Growth",
};

export interface InternalToolDefinition {
  id: InternalToolId;
  label: string;
  description: string;
  category: InternalToolCategory;
  icon: LucideIcon;
  status: "live" | "soon";
}

export const INTERNAL_TOOLS: InternalToolDefinition[] = [
  {
    id: "narrative",
    label: "Narrative generator",
    description: "X-ready Syra hype copy — product themes or trending news.",
    category: "content",
    icon: Megaphone,
    status: "live",
  },
  {
    id: "quote-response",
    label: "Quote response",
    description: "Paste another project's post — get a Syra quote caption with hype + $SYRA pull.",
    category: "content",
    icon: MessageSquareQuote,
    status: "live",
  },
  {
    id: "thread-expander",
    label: "Thread expander",
    description: "Turn any hook into a 3–5 tweet Syra thread with thesis + CTA.",
    category: "content",
    icon: Layers,
    status: "live",
  },
  {
    id: "copy-polisher",
    label: "Copy polisher",
    description: "Paste your draft — same context, better hype and copywriting.",
    category: "content",
    icon: Wand2,
    status: "live",
  },
  {
    id: "image-prompt",
    label: "Image prompt",
    description: "Rough idea → detailed Syra-themed image prompt + X caption.",
    category: "content",
    icon: ImageIcon,
    status: "live",
  },
  {
    id: "proof-drop",
    label: "Proof drop",
    description: "Live KPIs → hype post + export matching metrics share image.",
    category: "growth",
    icon: BarChart3,
    status: "live",
  },
];

export const INTERNAL_TOOL_ORDER: InternalToolCategory[] = ["content", "ops", "growth"];

export const DEFAULT_INTERNAL_TOOL_ID: InternalToolId = "narrative";

export function parseInternalToolId(param: string | null): InternalToolId {
  if (param === "image-prompt") return "image-prompt";
  if (param === "copy-polisher") return "copy-polisher";
  if (param === "proof-drop") return "proof-drop";
  if (param === "thread-expander") return "thread-expander";
  if (param === "quote-response") return "quote-response";
  if (param === "narrative") return "narrative";
  return DEFAULT_INTERNAL_TOOL_ID;
}

export function getInternalTool(id: InternalToolId): InternalToolDefinition {
  return INTERNAL_TOOLS.find((t) => t.id === id) ?? INTERNAL_TOOLS[0]!;
}

export function toolsByCategory(): Array<{ category: InternalToolCategory; tools: InternalToolDefinition[] }> {
  return INTERNAL_TOOL_ORDER.map((category) => ({
    category,
    tools: INTERNAL_TOOLS.filter((t) => t.category === category),
  })).filter((g) => g.tools.length > 0);
}
