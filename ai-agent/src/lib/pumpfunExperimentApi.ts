import { getApiBaseUrl } from "@/lib/chatApi";
import {
  normalizePumpfunLedger,
  type PumpfunExperimentPersisted,
} from "@/lib/pumpfunExperimentModel";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/pumpfun`;

async function parseJson<T>(res: Response): Promise<{ ok: boolean; body: T }> {
  const body = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, body };
}

export async function fetchPumpfunExperimentLedger(): Promise<PumpfunExperimentPersisted> {
  const res = await fetch(`${base()}/ledger`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { ledger?: PumpfunExperimentPersisted };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.ledger) {
    throw new Error(body.error || "Failed to load Pumpfun experiment ledger");
  }
  return normalizePumpfunLedger(body.data.ledger);
}

export async function savePumpfunExperimentLedger(
  ledger: PumpfunExperimentPersisted,
): Promise<PumpfunExperimentPersisted> {
  const res = await fetch(`${base()}/ledger`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ledger }),
  });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { ledger?: PumpfunExperimentPersisted };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.ledger) {
    throw new Error(body.error || "Failed to save Pumpfun experiment ledger");
  }
  return normalizePumpfunLedger(body.data.ledger);
}
