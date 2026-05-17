import { getApiBaseUrl } from "@/lib/chatApi";
import { normalizeRiseLedger, type RiseExperimentPersisted } from "@/lib/riseExperimentModel";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/rise`;

async function parseJson<T>(res: Response): Promise<{ ok: boolean; body: T }> {
  const body = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, body };
}

export async function fetchRiseExperimentLedger(): Promise<RiseExperimentPersisted> {
  const res = await fetch(`${base()}/ledger`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { ledger?: RiseExperimentPersisted };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.ledger) {
    throw new Error(body.error || "Failed to load Rise experiment ledger");
  }
  return normalizeRiseLedger(body.data.ledger);
}

export async function saveRiseExperimentLedger(
  ledger: RiseExperimentPersisted,
): Promise<RiseExperimentPersisted> {
  const res = await fetch(`${base()}/ledger`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ledger }),
  });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { ledger?: RiseExperimentPersisted };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.ledger) {
    throw new Error(body.error || "Failed to save Rise experiment ledger");
  }
  return normalizeRiseLedger(body.data.ledger);
}
