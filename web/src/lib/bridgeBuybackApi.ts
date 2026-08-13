import { getApiBaseUrl } from "@/lib/env";

/** Report a completed Relay request so the API can verify paid app fees and queue buyback. */
export async function reportBridgeBuyback(requestId: string): Promise<void> {
  const id = requestId?.trim();
  if (!id) return;

  const base = getApiBaseUrl().replace(/\/$/, "");
  try {
    await fetch(`${base}/bridge/buyback/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id }),
    });
  } catch {
    // Best-effort: buyback queue is not critical to the user's bridge UX.
  }
}

/** Pull requestId from Relay Execute payload (onSwapSuccess). */
export function extractRelayRequestId(data: {
  steps?: Array<{ requestId?: string }>;
}): string | null {
  for (const step of data?.steps ?? []) {
    if (typeof step?.requestId === "string" && step.requestId.trim()) {
      return step.requestId.trim();
    }
  }
  return null;
}
