import { getApiBaseUrl } from "@/lib/env";

export type LlmModality =
  | "image"
  | "embeddings"
  | "speech"
  | "video"
  | "rerank"
  | "transcription";

export type LlmModelPricing = {
  prompt: number | null;
  completion: number | null;
  image: number | null;
  request: number | null;
  audio: number | null;
  video: number | null;
};

export type LlmModelInfo = {
  id: string;
  name: string;
  pricing: LlmModelPricing;
  cheapest: boolean;
  priceScore?: number;
};

export type LlmModelsResponse = {
  default_model: string;
  models: LlmModelInfo[];
};

export type LlmImageResult = {
  created?: number;
  data?: Array<{ url?: string; b64_json?: string }>;
  usage?: Record<string, unknown>;
};

export type LlmVideoResult = {
  id?: string;
  status?: string;
  url?: string;
  video_url?: string;
  data?: unknown;
  [key: string]: unknown;
};

export type LlmEmbeddingsResult = {
  object?: string;
  model?: string;
  data?: Array<{ embedding: number[]; index?: number; object?: string }>;
  usage?: Record<string, unknown>;
};

export type LlmRerankResult = {
  results?: Array<{
    index: number;
    relevance_score?: number;
    document?: string | { text?: string };
  }>;
  model?: string;
  [key: string]: unknown;
};

export type LlmSpeechResult = {
  audioBase64: string;
  contentType: string;
  generationId: string | null;
};

export type LlmTranscriptionResult = {
  text?: string;
  language?: string;
  [key: string]: unknown;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: string;
};

async function fetchLlmJson<T>(
  path: string,
  adminWallet: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("x-admin-wallet", adminWallet);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...init, headers, credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (typeof body.error === "string" && body.error) ||
      (typeof body.message === "string" && body.message) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

export async function fetchLlmModels(
  adminWallet: string,
  modality: LlmModality,
): Promise<LlmModelsResponse> {
  const res = await fetchLlmJson<ApiEnvelope<LlmModelsResponse>>(
    `/labs/llm/models?modality=${encodeURIComponent(modality)}`,
    adminWallet,
  );
  return res.data;
}

export async function generateLlmImage(
  adminWallet: string,
  input: {
    prompt: string;
    model?: string;
    n?: number;
    aspect_ratio?: string;
    size?: string;
    quality?: string;
  },
): Promise<LlmImageResult> {
  const res = await fetchLlmJson<ApiEnvelope<LlmImageResult>>(
    "/labs/llm/image",
    adminWallet,
    { method: "POST", body: JSON.stringify(input) },
  );
  return res.data;
}

export async function submitLlmVideo(
  adminWallet: string,
  input: {
    prompt: string;
    model?: string;
    duration?: number;
    aspect_ratio?: string;
    resolution?: string;
  },
): Promise<LlmVideoResult> {
  const res = await fetchLlmJson<ApiEnvelope<LlmVideoResult>>(
    "/labs/llm/video",
    adminWallet,
    { method: "POST", body: JSON.stringify(input) },
  );
  return res.data;
}

export async function fetchLlmVideoStatus(
  adminWallet: string,
  generationId: string,
): Promise<LlmVideoResult> {
  const res = await fetchLlmJson<ApiEnvelope<LlmVideoResult>>(
    `/labs/llm/video/${encodeURIComponent(generationId)}`,
    adminWallet,
  );
  return res.data;
}

export async function createLlmEmbeddings(
  adminWallet: string,
  input: { input: string | string[]; model?: string; dimensions?: number },
): Promise<LlmEmbeddingsResult> {
  const res = await fetchLlmJson<ApiEnvelope<LlmEmbeddingsResult>>(
    "/labs/llm/embeddings",
    adminWallet,
    { method: "POST", body: JSON.stringify(input) },
  );
  return res.data;
}

export async function rerankLlmDocuments(
  adminWallet: string,
  input: {
    query: string;
    documents: string[];
    model?: string;
    top_n?: number;
  },
): Promise<LlmRerankResult> {
  const res = await fetchLlmJson<ApiEnvelope<LlmRerankResult>>(
    "/labs/llm/rerank",
    adminWallet,
    { method: "POST", body: JSON.stringify(input) },
  );
  return res.data;
}

export async function synthesizeLlmSpeech(
  adminWallet: string,
  input: {
    input: string;
    model?: string;
    voice?: string;
    response_format?: string;
    speed?: number;
  },
): Promise<LlmSpeechResult> {
  const res = await fetchLlmJson<ApiEnvelope<LlmSpeechResult>>(
    "/labs/llm/speech",
    adminWallet,
    { method: "POST", body: JSON.stringify(input) },
  );
  return res.data;
}

export async function transcribeLlmAudio(
  adminWallet: string,
  input: {
    model?: string;
    language?: string;
    input_audio: { data: string; format: string };
  },
): Promise<LlmTranscriptionResult> {
  const res = await fetchLlmJson<ApiEnvelope<LlmTranscriptionResult>>(
    "/labs/llm/transcription",
    adminWallet,
    { method: "POST", body: JSON.stringify(input) },
  );
  return res.data;
}

/** Format a pricing rate for display in the model selector. */
export function formatLlmPrice(
  modality: LlmModality,
  pricing: LlmModelPricing,
): string {
  const pick = (n: number | null, suffix: string): string | null => {
    if (n == null || !Number.isFinite(n) || n < 0) return null;
    if (n === 0) return `Free`;
    if (n < 0.000001) return `$${n.toExponential(2)}${suffix}`;
    if (n < 0.01) return `$${n.toFixed(6)}${suffix}`;
    return `$${n.toFixed(4)}${suffix}`;
  };

  switch (modality) {
    case "image":
      return pick(pricing.image, "/img") ?? pick(pricing.prompt, "/tok") ?? "—";
    case "video":
      return pick(pricing.video, "/s") ?? pick(pricing.request, "/req") ?? "—";
    case "embeddings":
      return pick(pricing.prompt, "/tok") ?? "—";
    case "rerank":
      return pick(pricing.request, "/req") ?? pick(pricing.prompt, "/tok") ?? "—";
    case "speech":
    case "transcription":
      return (
        pick(pricing.audio, "/aud") ??
        pick(pricing.request, "/req") ??
        pick(pricing.prompt, "/tok") ??
        "—"
      );
    default:
      return "—";
  }
}
