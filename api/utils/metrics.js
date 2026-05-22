/**
 * Prometheus metrics for the agent wallet broker (P1.8).
 *
 * Exposes a default registry served at GET /metrics (protected by admin gate in index.js wiring).
 *
 * Key counters:
 *   - syra_sign_audit_total{policy_decision,action,status}
 *   - syra_sign_audit_denies_total{reason}
 *   - syra_sign_audit_confirm_required_total{action}
 *   - syra_withdraws_total{status}
 *   - syra_policy_cap_hits_total{cap}
 *
 * Histograms:
 *   - syra_sign_audit_amount_usd (bucketed 0.01, 0.1, 1, 10, 100, 1000)
 */
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry, prefix: 'syra_' });

export const signAuditCounter = new Counter({
  name: 'syra_sign_audit_total',
  help: 'Sign-audit events by policy decision, action, and final status',
  labelNames: ['policy_decision', 'action', 'status', 'chain'],
  registers: [registry],
});

export const denyReasonCounter = new Counter({
  name: 'syra_sign_audit_denies_total',
  help: 'Policy-engine deny reasons (one increment per reason; events with multiple reasons increment each)',
  labelNames: ['reason'],
  registers: [registry],
});

export const confirmRequiredCounter = new Counter({
  name: 'syra_sign_audit_confirm_required_total',
  help: 'Intents that required user confirmation',
  labelNames: ['action', 'tool_id'],
  registers: [registry],
});

export const withdrawCounter = new Counter({
  name: 'syra_withdraws_total',
  help: 'Withdraw outcomes',
  labelNames: ['status'],
  registers: [registry],
});

export const capHitCounter = new Counter({
  name: 'syra_policy_cap_hits_total',
  help: 'Times a policy cap was hit (per_tx, hourly, daily)',
  labelNames: ['cap'],
  registers: [registry],
});

export const amountHistogram = new Histogram({
  name: 'syra_sign_audit_amount_usd',
  help: 'Sign-audit amount distribution (USD)',
  buckets: [0.01, 0.1, 1, 10, 50, 100, 250, 1000, 10000],
  labelNames: ['action'],
  registers: [registry],
});

/**
 * Record a sign-audit row's metric labels. Called by writeSignAudit() after persisting.
 *
 * @param {{ policyDecision: string; action: string; status: string; chain?: string;
 *           policyReasons?: string[]; amountUsd?: number; toolId?: string }} row
 */
export function recordSignAuditMetrics(row) {
  if (!row) return;
  try {
    signAuditCounter.inc({
      policy_decision: row.policyDecision,
      action: row.action,
      status: row.status,
      chain: row.chain || 'solana',
    });
    if (row.policyDecision === 'deny' && Array.isArray(row.policyReasons)) {
      for (const r of row.policyReasons.slice(0, 8)) {
        denyReasonCounter.inc({ reason: r.split(':')[0] });
        if (r.startsWith('over_per_tx_cap')) capHitCounter.inc({ cap: 'per_tx' });
        if (r.startsWith('over_daily_cap')) capHitCounter.inc({ cap: 'daily' });
        if (r.startsWith('over_hourly_cap')) capHitCounter.inc({ cap: 'hourly' });
      }
    }
    if (row.policyDecision === 'require_confirm') {
      confirmRequiredCounter.inc({ action: row.action, tool_id: row.toolId || 'none' });
    }
    if (row.action === 'withdraw') {
      withdrawCounter.inc({ status: row.status });
    }
    if (Number.isFinite(row.amountUsd) && row.amountUsd > 0) {
      amountHistogram.observe({ action: row.action }, Number(row.amountUsd));
    }
  } catch {
    /* metrics best-effort */
  }
}

/**
 * Express handler for /metrics. Returns Prometheus text format.
 */
export async function metricsHandler(req, res) {
  res.setHeader('Content-Type', registry.contentType);
  res.send(await registry.metrics());
}
