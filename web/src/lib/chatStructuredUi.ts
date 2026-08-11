export type ChatSource = {
  url: string;
  title: string;
  origin?: string;
};

export type ReasoningStepKind = "reasoning" | "search" | "tool" | "coding";

export type ReasoningStepStatus = "running" | "complete" | "error" | "skipped";

export type ReasoningStep = {
  id: string;
  label: string;
  kind: ReasoningStepKind;
  status: ReasoningStepStatus;
  costUsd?: number;
  included?: boolean;
};

export type ChatRecommendationAction = {
  id: string;
  label: string;
};

export type ChatRecommendation = {
  title: string;
  detail?: string;
  confidence?: number;
  actions?: ChatRecommendationAction[];
};

export function extraAssistantUiFromUnknown(m: {
  sources?: unknown;
  reasoningSteps?: unknown;
  followUps?: unknown;
  recommendation?: unknown;
}): {
  sources?: ChatSource[];
  reasoningSteps?: ReasoningStep[];
  followUps?: string[];
  recommendation?: ChatRecommendation;
} {
  const out: {
    sources?: ChatSource[];
    reasoningSteps?: ReasoningStep[];
    followUps?: string[];
    recommendation?: ChatRecommendation;
  } = {};
  if (Array.isArray(m.sources) && m.sources.length > 0) {
    const sources = m.sources
      .filter((s): s is ChatSource => {
        if (!s || typeof s !== "object") return false;
        const row = s as ChatSource;
        return typeof row.url === "string" && row.url.trim().length > 0;
      })
      .map((s) => ({
        url: s.url.trim(),
        title: typeof s.title === "string" && s.title.trim() ? s.title.trim() : s.url,
        ...(typeof s.origin === "string" && s.origin.trim()
          ? { origin: s.origin.trim() }
          : {}),
      }));
    if (sources.length) out.sources = sources;
  }
  if (Array.isArray(m.reasoningSteps) && m.reasoningSteps.length > 0) {
    const steps = m.reasoningSteps
      .filter((s): s is ReasoningStep => {
        if (!s || typeof s !== "object") return false;
        const row = s as ReasoningStep;
        return typeof row.id === "string" && typeof row.label === "string";
      })
      .map((s) => ({
        id: s.id,
        label: s.label,
        kind:
          s.kind === "search" || s.kind === "tool" || s.kind === "coding"
            ? s.kind
            : "reasoning",
        status:
          s.status === "running" ||
          s.status === "error" ||
          s.status === "skipped"
            ? s.status
            : "complete",
        ...(typeof s.costUsd === "number" ? { costUsd: s.costUsd } : {}),
        ...(s.included ? { included: true } : {}),
      }));
    if (steps.length) out.reasoningSteps = steps;
  }
  if (Array.isArray(m.followUps) && m.followUps.length > 0) {
    const followUps = m.followUps
      .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
      .map((q) => q.trim())
      .slice(0, 4);
    if (followUps.length) out.followUps = followUps;
  }
  if (m.recommendation && typeof m.recommendation === "object") {
    const rec = m.recommendation as ChatRecommendation;
    if (typeof rec.title === "string" && rec.title.trim()) {
      out.recommendation = {
        title: rec.title.trim(),
        ...(typeof rec.detail === "string" && rec.detail.trim()
          ? { detail: rec.detail.trim() }
          : {}),
        ...(typeof rec.confidence === "number" && Number.isFinite(rec.confidence)
          ? { confidence: rec.confidence }
          : {}),
        ...(Array.isArray(rec.actions) && rec.actions.length
          ? {
              actions: rec.actions
                .filter(
                  (a): a is ChatRecommendationAction =>
                    !!a &&
                    typeof a.id === "string" &&
                    typeof a.label === "string",
                )
                .map((a) => ({ id: a.id, label: a.label })),
            }
          : {}),
      };
    }
  }
  return out;
}
