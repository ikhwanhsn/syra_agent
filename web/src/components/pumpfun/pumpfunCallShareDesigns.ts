export const PUMPFUN_SHARE_DESIGN_IDS = [
  "intel",
  "terminal",
  "hero",
  "classic",
  "signal",
] as const;

export type PumpfunCallShareDesignId = (typeof PUMPFUN_SHARE_DESIGN_IDS)[number];

export interface PumpfunCallShareDesignMeta {
  id: PumpfunCallShareDesignId;
  label: string;
  description: string;
}

export const PUMPFUN_CALL_SHARE_DESIGNS: PumpfunCallShareDesignMeta[] = [
  {
    id: "intel",
    label: "Intel",
    description: "Institutional agent terminal with glass panels and mcap chart",
  },
  {
    id: "terminal",
    label: "Terminal",
    description: "Dense monospace feed — Hyperliquid / Nansen style",
  },
  {
    id: "hero",
    label: "Hero",
    description: "Centered mega gain — optimized for X screenshots",
  },
  {
    id: "classic",
    label: "Classic",
    description: "Clean split layout — token left, alpha right",
  },
  {
    id: "signal",
    label: "Signal",
    description: "Agent signal card with vertical mcap bars",
  },
];

const STORAGE_KEY = "syra-pumpfun-share-design";

export const DEFAULT_PUMPFUN_SHARE_DESIGN: PumpfunCallShareDesignId = "intel";

export function isPumpfunCallShareDesignId(value: string): value is PumpfunCallShareDesignId {
  return (PUMPFUN_SHARE_DESIGN_IDS as readonly string[]).includes(value);
}

export function getStoredPumpfunShareDesign(): PumpfunCallShareDesignId {
  if (typeof window === "undefined") return DEFAULT_PUMPFUN_SHARE_DESIGN;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && isPumpfunCallShareDesignId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_PUMPFUN_SHARE_DESIGN;
}

export function setStoredPumpfunShareDesign(id: PumpfunCallShareDesignId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
