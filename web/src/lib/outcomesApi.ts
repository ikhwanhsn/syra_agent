/**
 * Client helpers for Syra completed-work outcomes API.
 */
const API_BASE = import.meta.env.VITE_API_URL || "https://api.syraa.fun";

async function fetchJson(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  return body.data;
}

export async function fetchOutcomeCatalog() {
  return fetchJson("/outcomes/catalog");
}

export async function fetchEvGateStatus() {
  return fetchJson("/outcomes/ev-gate");
}

export async function fetchRobinhoodLpEvGateStatus() {
  return fetchJson("/outcomes/ev-gate/robinhood-lp");
}

export async function createOutcomeMandate(payload: {
  anonymousId: string;
  productId: string;
  chain: string;
  agentAddress: string;
  policy?: Record<string, unknown>;
  perTxCapUsd?: number;
  maxManagedCapitalUsd?: number;
}) {
  return fetchJson("/outcomes/mandates", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "x-anonymous-id": payload.anonymousId },
  });
}

export async function listOutcomeMandates(
  anonymousId: string,
  opts?: { productId?: string; status?: string },
) {
  const qs = new URLSearchParams();
  if (opts?.productId) qs.set("productId", opts.productId);
  if (opts?.status) qs.set("status", opts.status);
  const q = qs.toString();
  return fetchJson(`/outcomes/mandates${q ? `?${q}` : ""}`, {
    headers: { "x-anonymous-id": anonymousId },
  });
}

export async function enableOutcomeMandate(mandateId: string) {
  return fetchJson(`/outcomes/mandates/${encodeURIComponent(mandateId)}/enable`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function disableOutcomeMandate(mandateId: string) {
  return fetchJson(`/outcomes/mandates/${encodeURIComponent(mandateId)}/disable`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function fetchOutcomeMandateStatus(mandateId: string) {
  return fetchJson(`/outcomes/mandates/${encodeURIComponent(mandateId)}/status`);
}

export async function runOutcomeJob(mandateId: string, input?: Record<string, unknown>) {
  return fetchJson("/outcomes/jobs", {
    method: "POST",
    body: JSON.stringify({ mandateId, input }),
  });
}

export async function fetchOutcomeReport(reportId: string) {
  return fetchJson(`/outcomes/reports/${reportId}`);
}

export async function verifyOutcomeReport(reportId: string) {
  return fetchJson(`/outcomes/reports/${reportId}/verify`);
}

export type RobinhoodLpEvGate = {
  unlocked?: boolean;
  passed?: boolean;
  decided?: number;
  winRate?: number;
  sumNetPnlUsd?: number;
  reasons?: string[];
  requirements?: Record<string, unknown>;
  leader?: {
    strategyId?: number;
    strategyName?: string;
    decided?: number;
    winRate?: number;
    sumNetPnlUsd?: number;
  };
  poolUniverse?: { ok?: boolean; eligibleCount?: number };
};

export type RobinhoodLpLivePosition = {
  positionId: string;
  poolName?: string;
  poolAddress?: string;
  status?: string;
  depositUsd?: number;
  realizedPnlUsd?: number;
  feesEarnedUsd?: number;
  dryRun?: boolean;
  openTxHash?: string | null;
  closeTxHash?: string | null;
  openExplorerUrl?: string | null;
  closeExplorerUrl?: string | null;
  tokenId?: string | null;
  error?: string | null;
};
