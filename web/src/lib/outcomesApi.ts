/**
 * Client helpers for Syra completed-work outcomes API.
 */
import { getApiBaseUrl } from "@/lib/chatApi";
import { syraFetch } from "@/lib/agentAuthApi";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/outcomes`;

async function fetchJson(path: string, init?: RequestInit) {
  const res = await syraFetch(`${base()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: unknown;
    error?: string;
  };
  if (!res.ok || body.success === false) {
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return body.data;
}

export async function fetchOutcomeCatalog() {
  return fetchJson("/catalog");
}

export async function fetchEvGateStatus() {
  return fetchJson("/ev-gate");
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
  return fetchJson("/mandates", {
    method: "POST",
    body: JSON.stringify(payload),
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
  return fetchJson(`/mandates${q ? `?${q}` : ""}`);
}

export async function enableOutcomeMandate(mandateId: string) {
  return fetchJson(`/mandates/${encodeURIComponent(mandateId)}/enable`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function disableOutcomeMandate(mandateId: string) {
  return fetchJson(`/mandates/${encodeURIComponent(mandateId)}/disable`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function fetchOutcomeMandateStatus(mandateId: string) {
  return fetchJson(`/mandates/${encodeURIComponent(mandateId)}/status`);
}

export async function runOutcomeJob(mandateId: string, input?: Record<string, unknown>) {
  return fetchJson("/jobs", {
    method: "POST",
    body: JSON.stringify({ mandateId, input }),
  });
}

export async function fetchOutcomeReport(reportId: string) {
  return fetchJson(`/reports/${reportId}`);
}

export async function verifyOutcomeReport(reportId: string) {
  return fetchJson(`/reports/${reportId}/verify`);
}
