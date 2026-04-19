import { useState, useCallback, useEffect, Fragment } from 'react';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/button';
import { useWalletContext } from '@/contexts/WalletContext';
import {
  getExampleFlowsX402,
  getParamsForExampleFlow,
  type ExampleFlowPreset,
} from '@/hooks/useApiPlayground';
import {
  parseX402Response,
  getBestPaymentOption,
  getPaymentOptionsByChain,
  executePayment,
  executeBasePayment,
  isBaseNetwork,
  formatPaymentAmount,
  type X402Response,
  type X402PaymentOption,
} from '@/lib/x402Client';
import { connection } from '@/contexts/WalletContext';
import { Play, CheckCircle, XCircle, Zap, Loader2, ChevronDown, ChevronRight, BarChart3, Plus, Trash2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RequestParam } from '@/types/api';
import { resolveApiBaseUrl } from '@/lib/resolveApiBaseUrl';
import { MAIN_CONTENT_PT_CLASS, MAIN_CONTENT_PB_SAFE_CLASS } from '@/lib/branding';

function getRequestOrigin(urlStr: string): string | null {
  try {
    const u = urlStr.trim();
    if (!u) return null;
    return new URL(u).origin;
  } catch {
    return null;
  }
}

function useBackendPlaygroundProxy(targetUrl: string): boolean {
  if (typeof window === 'undefined') return false;
  const targetOrigin = getRequestOrigin(targetUrl);
  const pageOrigin = window.location.origin;
  return !!targetOrigin && targetOrigin !== pageOrigin;
}

function getPlaygroundProxyUrl(_targetUrl: string): string {
  return `${resolveApiBaseUrl()}/api/playground-proxy`;
}

/** Default endpoint IDs for batch test. */
const DEFAULT_BATCH_FLOW_IDS = [
  'check-status',
  'preview-news',
  'preview-sentiment',
  'preview-signal',
  '8004-stats',
  '8004-leaderboard',
  'token-statistic',
  'dashboard-summary',
  'news',
  'sentiment',
  'event',
  'trending-headline',
  'sundown-digest',
  'signal',
  'analytics-summary',
  'arbitrage',
  'exa-search',
  'website-crawl',
  'browser-use',
  'brain',
  'token-risk-alerts',
  '8004scan-stats',
  '8004scan-chains',
  'purch-vault-search',
];

const BATCH_SELECTION_STORAGE_KEY = 'x402_batch_test_flow_ids';
const BATCH_CUSTOM_ENDPOINTS_KEY = 'x402_batch_test_custom_endpoints';

/** Custom x402 API added by user (URL + method). */
export interface CustomEndpoint {
  id: string;
  method: 'GET' | 'POST';
  url: string;
  body?: string;
}

function loadSelectedFlowIds(): string[] {
  try {
    const raw = localStorage.getItem(BATCH_SELECTION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) return parsed;
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_BATCH_FLOW_IDS];
}

function saveSelectedFlowIds(ids: string[]): void {
  try {
    localStorage.setItem(BATCH_SELECTION_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

function loadCustomEndpoints(): CustomEndpoint[] {
  try {
    const raw = localStorage.getItem(BATCH_CUSTOM_ENDPOINTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (p): p is CustomEndpoint =>
            p &&
            typeof p === 'object' &&
            typeof (p as CustomEndpoint).id === 'string' &&
            typeof (p as CustomEndpoint).url === 'string' &&
            ((p as CustomEndpoint).method === 'GET' || (p as CustomEndpoint).method === 'POST')
        );
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function saveCustomEndpoints(list: CustomEndpoint[]): void {
  try {
    localStorage.setItem(BATCH_CUSTOM_ENDPOINTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

const BATCH_ESTIMATE_CACHE_KEY = 'x402_batch_estimate_cache';

/** Cache key for estimate: preset id, or url for custom so same URL reuses. */
function getEstimateCacheKey(entry: { id: string; url: string }): string {
  return entry.id.startsWith('custom-') ? 'url:' + entry.url.trim() : entry.id;
}

function loadEstimateCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(BATCH_ESTIMATE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, string>;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveEstimateCache(cache: Record<string, string>): void {
  try {
    localStorage.setItem(BATCH_ESTIMATE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

/** Single entry in the batch (preset or custom) for run/display. */
interface BatchEntry {
  id: string;
  label: string;
  method: 'GET' | 'POST';
  url: string;
  params: RequestParam[];
  body: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

type RowStatus = 'pending' | 'running' | 'success' | 'error' | 'payment_failed';

interface BatchRow {
  id: string;
  label: string;
  method: string;
  url: string;
  status: RowStatus;
  statusCode?: number;
  timeMs?: number;
  paidUsd?: string;
  error?: string;
  bodyPreview?: string;
  bodyRaw?: string;
}

interface BatchStats {
  total: number;
  success: number;
  error: number;
  paymentFailed: number;
  totalPaidUsd: string;
  durationMs: number;
}

function buildFinalUrl(url: string, method: string, params: { key: string; value: string; enabled: boolean }[]): string {
  let finalUrl = url.trim();
  if (method === 'GET') {
    const enabledParams = params.filter((p) => p.enabled && p.key);
    if (enabledParams.length > 0) {
      const searchParams = new URLSearchParams();
      enabledParams.forEach((p) => searchParams.append(p.key, p.value));
      finalUrl += (url.includes('?') ? '&' : '?') + searchParams.toString();
    }
  }
  return finalUrl;
}

function buildBodyFromParams(params: { key: string; value: string; enabled: boolean }[]): string {
  const enabledParams = params.filter((p) => p.enabled && p.key);
  if (enabledParams.length === 0) return '{}';
  const bodyObj: Record<string, unknown> = {};
  enabledParams.forEach(p => {
    const v = p.value?.trim() ?? '';
    if (v === 'true') bodyObj[p.key] = true;
    else if (v === 'false') bodyObj[p.key] = false;
    else if (v !== '' && !Number.isNaN(Number(v))) bodyObj[p.key] = Number(v);
    else if (v.startsWith('{') || v.startsWith('[')) {
      try { bodyObj[p.key] = JSON.parse(v); } catch { bodyObj[p.key] = v; }
    } else {
      bodyObj[p.key] = v;
    }
  });
  return JSON.stringify(bodyObj);
}

async function doFetch(
  finalUrl: string,
  method: string,
  body: string,
  paymentHeader?: string,
  paymentVersion?: 1 | 2
): Promise<{ status: number; statusText: string; body: string; timeMs: number }> {
  const useProxy = useBackendPlaygroundProxy(finalUrl);
  const start = Date.now();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (paymentHeader) {
    if (paymentVersion === 1) {
      headers['X-PAYMENT'] = paymentHeader;
    } else {
      headers['PAYMENT-SIGNATURE'] = paymentHeader;
    }
  }

  if (useProxy) {
    const proxyUrl = getPlaygroundProxyUrl(finalUrl);
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: finalUrl,
        method,
        body: method === 'POST' && body.trim() ? body : undefined,
        headers,
      }),
    });
    const text = await res.text();
    return { status: res.status, statusText: res.statusText, body: text, timeMs: Date.now() - start };
  }

  const opts: RequestInit = { method, headers };
  if (method === 'POST' && body.trim()) opts.body = body;
  const res = await fetch(finalUrl, opts);
  const text = await res.text();
  return { status: res.status, statusText: res.statusText, body: text, timeMs: Date.now() - start };
}

/** Probe an API without payment; returns true only if it returns 402 Payment Required (x402). */
async function probeIsX402(finalUrl: string, method: string, body: string): Promise<boolean> {
  try {
    const r = await doFetch(finalUrl, method, body || '{}');
    return r.status === 402;
  } catch {
    return false;
  }
}

/** Parse 402 response body and return amount in micro-units (string), or null. */
function parse402Amount(body: string): string | null {
  try {
    const data = JSON.parse(body);
    const accepts = data?.accepts;
    if (Array.isArray(accepts) && accepts.length > 0) {
      const first = accepts[0];
      const amount = first?.price?.amount ?? first?.amount ?? first?.maxAmountRequired;
      if (amount != null) return String(amount);
    }
    return null;
  } catch {
    return null;
  }
}

function bodyPreview(body: string, maxLen: number = 120): string {
  const s = typeof body === 'string' ? body : '';
  if (!s) return '—';
  try {
    const parsed = JSON.parse(s);
    const str = JSON.stringify(parsed);
    return str.length <= maxLen ? str : str.slice(0, maxLen) + '…';
  } catch {
    return s.length <= maxLen ? s : s.slice(0, maxLen) + '…';
  }
}

export default function BatchTest() {
  const walletContext = useWalletContext();
  const { wallet, selectPaymentChain } = useApiPlayground();
  const { connect, setConnectChainPickListener } = walletContext;

  useEffect(() => {
    setConnectChainPickListener((option) => {
      if (option !== 'email') selectPaymentChain(option);
    });
    return () => setConnectChainPickListener(null);
  }, [selectPaymentChain, setConnectChainPickListener]);
  const [selectedFlowIds, setSelectedFlowIds] = useState<string[]>(loadSelectedFlowIds);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<BatchStats | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paymentChain, setPaymentChain] = useState<'solana' | 'base'>('solana');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customEndpoints, setCustomEndpoints] = useState<CustomEndpoint[]>(loadCustomEndpoints);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalPresetChecked, setModalPresetChecked] = useState<Set<string>>(new Set());
  const [customUrl, setCustomUrl] = useState('');
  const [customMethod, setCustomMethod] = useState<'GET' | 'POST'>('GET');
  const [customBody, setCustomBody] = useState('');
  const [isCheckingX402, setIsCheckingX402] = useState(false);
  const [estimatedTotalUsd, setEstimatedTotalUsd] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const allFlows = getExampleFlowsX402();
  const flows = selectedFlowIds
    .map((id) => allFlows.find((f) => f.id === id))
    .filter((f): f is ExampleFlowPreset => f != null);
  const entries: BatchEntry[] = [
    ...flows.map((f) => ({
      id: f.id,
      label: f.label,
      method: f.method,
      url: f.url,
      params: f.params.length > 0 ? f.params : getParamsForExampleFlow(f),
      body: f.body ?? '{}',
    })),
    ...customEndpoints.map((c) => ({
      id: c.id,
      label: (() => {
        try {
          const path = new URL(c.url.trim()).pathname || c.url;
          return path.length > 40 ? path.slice(0, 40) + '…' : path || 'Custom API';
        } catch {
          return c.url.length > 40 ? c.url.slice(0, 40) + '…' : c.url || 'Custom API';
        }
      })(),
      method: c.method,
      url: c.url,
      params: [] as RequestParam[],
      body: c.body ?? '{}',
    })),
  ];
  const availableToAdd = allFlows.filter((f) => !selectedFlowIds.includes(f.id));

  const addFlow = useCallback((flowId: string) => {
    setSelectedFlowIds((prev) => (prev.includes(flowId) ? prev : [...prev, flowId]));
  }, []);
  const addFlows = useCallback((flowIds: string[]) => {
    setSelectedFlowIds((prev) => {
      const set = new Set(prev);
      flowIds.forEach((id) => set.add(id));
      return [...set];
    });
  }, []);
  const addCustomEndpoint = useCallback((url: string, method: 'GET' | 'POST', body: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const id = 'custom-' + generateId();
    const newEntry: CustomEndpoint = { id, method, url: trimmed, body: body.trim() || undefined };
    setCustomEndpoints((prev) => {
      const next = [...prev, newEntry];
      saveCustomEndpoints(next);
      return next;
    });
    setCustomUrl('');
    setCustomBody('');
    toast({ title: 'Added', description: 'Custom API added to batch.' });
  }, []);
  const removeFlow = useCallback((id: string) => {
    if (id.startsWith('custom-')) {
      setCustomEndpoints((prev) => {
        const next = prev.filter((e) => e.id !== id);
        saveCustomEndpoints(next);
        return next;
      });
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    } else {
      setSelectedFlowIds((prev) => prev.filter((fid) => fid !== id));
    }
  }, []);
  const resetToDefault = useCallback(() => {
    setSelectedFlowIds([...DEFAULT_BATCH_FLOW_IDS]);
    saveSelectedFlowIds(DEFAULT_BATCH_FLOW_IDS);
    setCustomEndpoints([]);
    saveCustomEndpoints([]);
    setSelectedIds([]);
    toast({ title: 'Reset to default', description: 'Endpoint list restored to default.' });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(entries.map((e) => e.id));
  }, [entries]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isAllSelected = entries.length > 0 && selectedIds.length === entries.length;
  const isSomeSelected = selectedIds.length > 0;

  const removeSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const customIds = selectedIds.filter((id) => id.startsWith('custom-'));
    const flowIds = selectedIds.filter((id) => !id.startsWith('custom-'));
    if (flowIds.length) {
      const nextFlowIds = selectedFlowIds.filter((id) => !flowIds.includes(id));
      setSelectedFlowIds(nextFlowIds);
      saveSelectedFlowIds(nextFlowIds);
    }
    if (customIds.length) {
      setCustomEndpoints((prev) => {
        const next = prev.filter((e) => !customIds.includes(e.id));
        saveCustomEndpoints(next);
        return next;
      });
    }
    setSelectedIds([]);
    toast({ title: 'Removed', description: `${selectedIds.length} endpoint(s) removed from batch.` });
  }, [selectedIds, selectedFlowIds]);

  useEffect(() => {
    saveSelectedFlowIds(selectedFlowIds);
  }, [selectedFlowIds]);

  useEffect(() => {
    saveCustomEndpoints(customEndpoints);
  }, [customEndpoints]);

  const entryIdsKey = entries.map((e) => e.id).join(',');
  const ESTIMATE_DEBOUNCE_MS = 200;
  useEffect(() => {
    if (entries.length === 0) {
      setEstimatedTotalUsd(null);
      setIsEstimating(false);
      return;
    }
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      const cache = loadEstimateCache();
      let totalMicro = 0;
      const toProbe: BatchEntry[] = [];
      for (const entry of entries) {
        const key = getEstimateCacheKey(entry);
        const cached = cache[key];
        if (cached != null) {
          totalMicro += Number(cached);
        } else {
          toProbe.push(entry);
        }
      }
      if (toProbe.length === 0) {
        setEstimatedTotalUsd(formatPaymentAmount(String(totalMicro)));
        setIsEstimating(false);
        return;
      }
      setIsEstimating(true);
      setEstimatedTotalUsd(null);
      Promise.allSettled(
        toProbe.map((entry) => {
          const finalUrl = buildFinalUrl(entry.url, entry.method, entry.params);
          return doFetch(finalUrl, entry.method, entry.body || '{}').then((r) => ({ entry, r }));
        })
      ).then((results) => {
        if (cancelled) return;
        const nextCache = { ...cache };
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.r.status === 402) {
            const amount = parse402Amount(result.value.r.body);
            if (amount) {
              totalMicro += Number(amount);
              nextCache[getEstimateCacheKey(result.value.entry)] = amount;
            }
          }
        });
        saveEstimateCache(nextCache);
        setEstimatedTotalUsd(formatPaymentAmount(String(totalMicro)));
        setIsEstimating(false);
      });
    }, ESTIMATE_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [entryIdsKey]);

  const runAll = useCallback(async () => {
    const isBase = paymentChain === 'base';
    if (isBase && !walletContext.baseConnected) {
      toast({ title: 'Connect Base wallet', description: 'Connect a Base wallet to pay for APIs.', variant: 'destructive' });
      return;
    }
    if (!isBase && !walletContext.connected) {
      toast({ title: 'Connect wallet', description: 'Connect a Solana wallet to pay for APIs.', variant: 'destructive' });
      return;
    }

    setRunning(true);
    const startTotal = Date.now();
    const initialRows: BatchRow[] = entries.map((e) => ({
      id: e.id,
      label: e.label,
      method: e.method,
      url: e.url,
      status: 'pending',
    }));
    setRows(initialRows);
    setStats(null);

    let successCount = 0;
    let errorCount = 0;
    let paymentFailedCount = 0;
    let totalPaidMicro = 0;

    const updateRow = (id: string, update: Partial<BatchRow>) => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...update } : r)));
    };

    for (const entry of entries) {
      const finalUrl = buildFinalUrl(entry.url, entry.method, entry.params);
      const rawBody = entry.body ?? '{}';
      const emptyBody = !rawBody.trim() || /^\s*\{\s*\}\s*$/.test(rawBody.trim());
      const body = (entry.method === 'POST' && emptyBody && entry.params.filter(p => p.enabled && p.key).length > 0)
        ? buildBodyFromParams(entry.params)
        : rawBody;

      updateRow(entry.id, { status: 'running' });

      let paymentHeader: string | undefined;
      let first = await doFetch(finalUrl, entry.method, body);

      if (first.status === 402) {
        let parsed: X402Response | null = null;
        try {
          const json = JSON.parse(first.body);
          parsed = parseX402Response(json);
        } catch {
          updateRow(entry.id, { status: 'payment_failed', statusCode: 402, error: 'Invalid 402 response', timeMs: first.timeMs });
          paymentFailedCount++;
          continue;
        }

        if (!parsed?.accepts?.length) {
          updateRow(entry.id, { status: 'payment_failed', statusCode: 402, error: 'No payment options', timeMs: first.timeMs });
          paymentFailedCount++;
          continue;
        }

        const byChain = getPaymentOptionsByChain(parsed);
        const option: X402PaymentOption | null = (isBase ? byChain.base : byChain.solana) ?? getBestPaymentOption(parsed, paymentChain);

        if (!option) {
          updateRow(entry.id, { status: 'payment_failed', statusCode: 402, error: 'No payment option for selected chain', timeMs: first.timeMs });
          paymentFailedCount++;
          continue;
        }

        const rawV1 = parsed.x402Version === 1 && parsed._rawV1Accepts?.[0] ? parsed._rawV1Accepts[0] : undefined;
        const payVersion: 1 | 2 = parsed.x402Version === 1 ? 1 : 2;

        try {
          let result: { success: boolean; paymentHeader?: string; error?: string };
          if (isBaseNetwork(option)) {
            const signer = await walletContext.getEvmSigner();
            if (!signer) {
              updateRow(entry.id, { status: 'payment_failed', statusCode: 402, error: 'Base wallet not available', timeMs: first.timeMs });
              paymentFailedCount++;
              continue;
            }
            result = await executeBasePayment(signer, option);
          } else {
            if (!walletContext.publicKey) {
              updateRow(entry.id, { status: 'payment_failed', statusCode: 402, error: 'Solana wallet not available', timeMs: first.timeMs });
              paymentFailedCount++;
              continue;
            }
            result = await executePayment(
              { connection, publicKey: walletContext.publicKey, signTransaction: walletContext.signTransaction },
              option,
              rawV1
            );
          }

          if (result.success && result.paymentHeader) {
            paymentHeader = result.paymentHeader;
            const amountNum = BigInt(option.amount);
            totalPaidMicro += Number(amountNum);
          } else {
            updateRow(entry.id, { status: 'payment_failed', statusCode: 402, error: result.error ?? 'Payment failed', timeMs: first.timeMs });
            paymentFailedCount++;
            continue;
          }
        } catch (e: any) {
          updateRow(entry.id, { status: 'payment_failed', statusCode: 402, error: e?.message ?? 'Payment error', timeMs: first.timeMs });
          paymentFailedCount++;
          continue;
        }

        const second = await doFetch(finalUrl, entry.method, body, paymentHeader, payVersion);
        if (second.status >= 200 && second.status < 300) {
          successCount++;
          updateRow(entry.id, {
            status: 'success',
            statusCode: second.status,
            timeMs: first.timeMs + second.timeMs,
            paidUsd: formatPaymentAmount(option.amount),
            bodyPreview: bodyPreview(second.body),
            bodyRaw: second.body,
          });
        } else {
          errorCount++;
          updateRow(entry.id, {
            status: 'error',
            statusCode: second.status,
            timeMs: first.timeMs + second.timeMs,
            paidUsd: formatPaymentAmount(option.amount),
            error: second.body.slice(0, 200),
            bodyRaw: second.body,
          });
        }
        continue;
      }

      if (first.status >= 200 && first.status < 300) {
        successCount++;
        updateRow(entry.id, {
          status: 'success',
          statusCode: first.status,
          timeMs: first.timeMs,
          bodyPreview: bodyPreview(first.body),
          bodyRaw: first.body,
        });
      } else {
        errorCount++;
        updateRow(entry.id, {
          status: 'error',
          statusCode: first.status,
          timeMs: first.timeMs,
          error: first.body.slice(0, 200),
          bodyRaw: first.body,
        });
      }
    }

    const durationMs = Date.now() - startTotal;
    const totalPaidUsd = totalPaidMicro ? formatPaymentAmount(String(totalPaidMicro)) : '0';
    setStats({
      total: entries.length,
      success: successCount,
      error: errorCount,
      paymentFailed: paymentFailedCount,
      totalPaidUsd,
      durationMs,
    });
    setRunning(false);
    toast({ title: 'Batch complete', description: `${successCount} OK, ${errorCount} errors, ${paymentFailedCount} payment failed. Total paid: $${totalPaidUsd}` });
  }, [entries, paymentChain, walletContext]);

  const hasWallet = walletContext.connected || walletContext.baseConnected;

  return (
    <div className="min-h-[100dvh] h-dvh bg-background flex flex-col w-full overflow-x-hidden max-w-[100vw] playground-ambient relative">
      <TopBar
        wallet={wallet}
        onOpenConnectModal={() => connect()}
        onToggleSidebar={() => {}}
        isSidebarOpen={false}
        paymentNetwork={paymentChain}
        flowStatus={running ? 'loading' : 'idle'}
      />
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg max-h-[85dvh] overflow-hidden flex flex-col rounded-2xl border-border/60">
          <DialogHeader>
            <DialogTitle className="font-display text-lg tracking-tight">Add endpoints</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1 leading-relaxed">
            Only payment-gated APIs (HTTP 402 with x402 body) can be added. Others will be skipped.
          </p>
          <div className="flex flex-col gap-6 overflow-y-auto min-h-0">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Select preset endpoints</h3>
              {availableToAdd.length === 0 ? (
                <p className="text-sm text-muted-foreground">All preset endpoints are already in the batch.</p>
              ) : (
                <>
                  <div className="border border-border/60 rounded-xl divide-y divide-border/50 max-h-[220px] overflow-y-auto custom-scrollbar bg-muted/10 dark:bg-black/15">
                    {availableToAdd.map((f) => (
                      <label
                        key={f.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-background/60 dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={modalPresetChecked.has(f.id)}
                          onCheckedChange={(checked) => {
                            setModalPresetChecked((prev) => {
                              const next = new Set(prev);
                              if (checked) next.add(f.id);
                              else next.delete(f.id);
                              return next;
                            });
                          }}
                        />
                        <span className="text-sm text-foreground truncate flex-1">{f.label}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{f.method}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={modalPresetChecked.size === 0 || isCheckingX402}
                      className="gap-1.5"
                      onClick={async () => {
                        const toAdd = [...modalPresetChecked];
                        if (toAdd.length === 0) return;
                        setIsCheckingX402(true);
                        const flowsToCheck = toAdd
                          .map((id) => allFlows.find((f) => f.id === id))
                          .filter((f): f is ExampleFlowPreset => f != null);
                        const results: { id: string; label: string; is402: boolean }[] = [];
                        for (const f of flowsToCheck) {
                          const params = f.params.length > 0 ? f.params : getParamsForExampleFlow(f);
                          const finalUrl = buildFinalUrl(f.url, f.method, params);
                          const is402 = await probeIsX402(finalUrl, f.method, f.body ?? '{}');
                          results.push({ id: f.id, label: f.label, is402 });
                        }
                        const x402Ids = results.filter((r) => r.is402).map((r) => r.id);
                        const notX402 = results.filter((r) => !r.is402);
                        if (x402Ids.length) addFlows(x402Ids);
                        setModalPresetChecked(new Set());
                        if (notX402.length > 0) {
                          toast({
                            title: 'Only 402-gated APIs can be added',
                            description: `Added ${x402Ids.length} endpoint(s). ${notX402.length} did not return 402 and were skipped: ${notX402.map((r) => r.label).join(', ')}`,
                            variant: 'destructive',
                          });
                        } else if (x402Ids.length > 0) {
                          toast({ title: 'Added', description: `${x402Ids.length} endpoint(s) added to batch.` });
                        }
                        setIsCheckingX402(false);
                      }}
                    >
                      {isCheckingX402 ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Checking…
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Add selected ({modalPresetChecked.size})
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={availableToAdd.length === 0 || isCheckingX402}
                      className="gap-1.5"
                      onClick={async () => {
                        if (availableToAdd.length === 0) return;
                        setIsCheckingX402(true);
                        const results: { id: string; label: string; is402: boolean }[] = [];
                        for (const f of availableToAdd) {
                          const params = f.params.length > 0 ? f.params : getParamsForExampleFlow(f);
                          const finalUrl = buildFinalUrl(f.url, f.method, params);
                          const is402 = await probeIsX402(finalUrl, f.method, f.body ?? '{}');
                          results.push({ id: f.id, label: f.label, is402 });
                        }
                        const x402Ids = results.filter((r) => r.is402).map((r) => r.id);
                        const notX402 = results.filter((r) => !r.is402);
                        if (x402Ids.length) addFlows(x402Ids);
                        setModalPresetChecked(new Set());
                        if (notX402.length > 0) {
                          toast({
                            title: 'Only 402-gated APIs can be added',
                            description: `Added ${x402Ids.length} payment-gated endpoint(s). ${notX402.length} did not return 402 and were skipped: ${notX402.map((r) => r.label).join(', ')}`,
                            variant: 'destructive',
                          });
                        } else if (x402Ids.length > 0) {
                          toast({ title: 'Added', description: `All ${x402Ids.length} payment-gated endpoint(s) added to batch.` });
                        }
                        setIsCheckingX402(false);
                      }}
                    >
                      {isCheckingX402 ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Checking…
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Add all ({availableToAdd.length})
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
            <div className="space-y-3 border-t border-border/60 pt-5">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Or add your own 402-gated API</h3>
              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="custom-url">API URL</Label>
                  <Input
                    id="custom-url"
                    placeholder="https://api.example.com/v1/endpoint"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="font-mono text-sm rounded-xl border-border/80 bg-secondary/30"
                  />
                </div>
                <div className="flex gap-3 items-center">
                  <div className="space-y-1.5 flex-1">
                    <Label>Method</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={customMethod === 'GET' ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full"
                        onClick={() => setCustomMethod('GET')}
                      >
                        GET
                      </Button>
                      <Button
                        type="button"
                        variant={customMethod === 'POST' ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full"
                        onClick={() => setCustomMethod('POST')}
                      >
                        POST
                      </Button>
                    </div>
                  </div>
                </div>
                {customMethod === 'POST' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="custom-body">Body (JSON, optional)</Label>
                    <textarea
                      id="custom-body"
                      placeholder='{"key": "value"}'
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      className="w-full min-h-[80px] rounded-xl border border-border/80 bg-secondary/20 px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                )}
                <Button
                  size="sm"
                  disabled={!customUrl.trim() || isCheckingX402}
                  className="gap-1.5"
                  onClick={async () => {
                    const url = customUrl.trim();
                    if (!url) {
                      toast({ title: 'Enter URL', description: 'Please enter an API URL.', variant: 'destructive' });
                      return;
                    }
                    setIsCheckingX402(true);
                    const is402 = await probeIsX402(url, customMethod, customBody || '{}');
                    if (!is402) {
                      toast({
                        title: 'Only 402-gated APIs can be added',
                        description: 'This API did not return 402 Payment Required. Only payment-gated (x402) endpoints can be added to the batch test.',
                        variant: 'destructive',
                      });
                      setIsCheckingX402(false);
                      return;
                    }
                    addCustomEndpoint(url, customMethod, customBody);
                    setIsCheckingX402(false);
                  }}
                >
                  {isCheckingX402 ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Checking…
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Add custom API
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <main
        className={cn(
          'flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden relative z-[1]',
          MAIN_CONTENT_PT_CLASS,
          MAIN_CONTENT_PB_SAFE_CLASS,
        )}
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0 flex flex-col gap-8 pb-24">
          <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/25 via-ring/12 to-transparent blur-md opacity-80"
                  aria-hidden
                />
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-card/90 ring-1 ring-border/60 dark:ring-white/[0.08] shadow-md flex items-center justify-center border border-border/40">
                  <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  Agentic batch test
                </h1>
                <p className="text-sm sm:text-[15px] text-muted-foreground mt-2 leading-relaxed max-w-3xl text-balance">
                  Run many payment-gated APIs in one pass. Pay each 402, see per-endpoint results and rollups. Add or
                  remove URLs from the table toolbar and rows.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="neon"
                onClick={runAll}
                disabled={running || !hasWallet || entries.length === 0}
                className="gap-2 h-10 rounded-full px-5 font-semibold shadow-sm"
              >
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {running ? 'Running…' : 'Run all'}
              </Button>
              {!hasWallet && (
                <span className="text-sm text-muted-foreground font-medium">Connect a wallet to run batch.</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[240px]">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Pay with</span>
              <div className="flex p-1 rounded-xl border border-border/50 bg-muted/25 dark:bg-black/20 shadow-inner shadow-black/5">
              <button
                type="button"
                onClick={() => setPaymentChain('solana')}
                disabled={running}
                className={cn(
                  'flex-1 sm:flex-initial rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
                  paymentChain === 'solana'
                    ? 'bg-background/90 dark:bg-white/[0.08] text-foreground shadow-sm ring-1 ring-border/60'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Solana
              </button>
              <button
                type="button"
                onClick={() => setPaymentChain('base')}
                disabled={running}
                className={cn(
                  'flex-1 sm:flex-initial rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
                  paymentChain === 'base'
                    ? 'bg-background/90 dark:bg-white/[0.08] text-foreground shadow-sm ring-1 ring-border/60'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Base
              </button>
              </div>
            </div>
          </div>

          {entries.length > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm px-4 py-3.5 sm:px-5 sm:py-4 flex flex-wrap items-center gap-3 shadow-sm dark:shadow-black/15">
              <span className="text-sm font-semibold text-foreground">Estimated cost to run batch</span>
              {isEstimating ? (
                <span className="text-sm text-muted-foreground inline-flex items-center gap-2 font-medium">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Estimating…
                </span>
              ) : estimatedTotalUsd != null ? (
                <span className="font-display text-xl sm:text-2xl font-semibold text-primary tabular-nums">
                  ${estimatedTotalUsd} <span className="text-sm font-medium text-muted-foreground">USDC</span>
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          )}

          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-4 shadow-sm dark:shadow-black/15">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Total</p>
                <p className="font-display text-2xl font-semibold text-foreground tabular-nums mt-1">{stats.total}</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-4 shadow-sm dark:shadow-black/15">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Success</p>
                <p className="font-display text-2xl font-semibold text-success tabular-nums mt-1">{stats.success}</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-4 shadow-sm dark:shadow-black/15">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Errors</p>
                <p className="font-display text-2xl font-semibold text-destructive tabular-nums mt-1">
                  {stats.error + stats.paymentFailed}
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-4 shadow-sm dark:shadow-black/15">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Total paid</p>
                <p className="font-display text-2xl font-semibold text-foreground tabular-nums mt-1">
                  ${stats.totalPaidUsd}
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-4 sm:col-span-2 sm:col-start-1 shadow-sm dark:shadow-black/15">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Duration</p>
                <p className="font-display text-2xl font-semibold text-foreground tabular-nums mt-1">
                  {(stats.durationMs / 1000).toFixed(1)}s
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm dark:shadow-black/20">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5 border-b border-border/60 bg-muted/15 dark:bg-black/25">
              <span className="text-sm font-semibold text-foreground tracking-tight">
                Endpoints to test{' '}
                <span className="tabular-nums text-muted-foreground font-medium">({entries.length})</span>
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {isSomeSelected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeSelected}
                    disabled={running}
                    className="gap-1.5 rounded-full h-9 text-destructive border-destructive/25 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove ({selectedIds.length})
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  disabled={running}
                  className="gap-1.5 rounded-full h-9 font-medium"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add endpoint
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefault}
                  disabled={running}
                  className="gap-1.5 rounded-full h-9 font-medium"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to default
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 dark:bg-black/25">
                    <th className="w-12 py-3 pl-4 pr-0">
                      <Checkbox
                        checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                        onCheckedChange={(checked) => {
                          if (checked === true) selectAll();
                          else deselectAll();
                        }}
                        disabled={running || entries.length === 0}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Endpoint
                    </th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Code
                    </th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Time
                    </th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Paid
                    </th>
                    <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-[108px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && entries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center">
                        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                          No endpoints selected. Use <span className="font-semibold text-foreground">Add endpoint</span>{' '}
                          for presets or your own 402-gated URL.
                        </p>
                      </td>
                    </tr>
                  )}
                  {rows.length === 0 &&
                    entries.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b border-border/40 transition-colors hover:bg-muted/10 dark:hover:bg-white/[0.02]"
                      >
                        <td className="w-12 py-3 pl-4 pr-0 align-middle">
                          <Checkbox
                            checked={selectedIds.includes(e.id)}
                            onCheckedChange={() => toggleSelect(e.id)}
                            disabled={running}
                            aria-label={`Select ${e.label}`}
                          />
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium align-middle">{e.label}</td>
                        <td className="py-3 px-4 text-muted-foreground align-middle">—</td>
                        <td className="py-3 px-4 text-muted-foreground align-middle">—</td>
                        <td className="py-3 px-4 text-muted-foreground align-middle">—</td>
                        <td className="py-3 px-4 text-muted-foreground align-middle">—</td>
                        <td className="py-3 px-4 text-right align-middle">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                            onClick={() => removeFlow(e.id)}
                            disabled={running}
                            aria-label={`Remove ${e.label}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  {rows.map((r) => (
                    <Fragment key={r.id}>
                      <tr
                        className={cn(
                          'border-b border-border/40 transition-colors hover:bg-muted/10 dark:hover:bg-white/[0.02]',
                          r.status === 'running' && 'bg-primary/[0.06]',
                        )}
                      >
                        <td className="w-12 py-3 pl-4 pr-0 align-middle">
                          <Checkbox
                            checked={selectedIds.includes(r.id)}
                            onCheckedChange={() => toggleSelect(r.id)}
                            disabled={running}
                            aria-label={`Select ${r.label}`}
                          />
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground align-middle">{r.label}</td>
                        <td className="py-3 px-4 align-middle">
                          {r.status === 'pending' && <span className="text-muted-foreground">Pending</span>}
                          {r.status === 'running' && (
                            <span className="inline-flex items-center gap-1 text-primary">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Running
                            </span>
                          )}
                          {r.status === 'success' && (
                            <span className="inline-flex items-center gap-1 text-accent">
                              <CheckCircle className="h-3.5 w-3.5" /> OK
                            </span>
                          )}
                          {r.status === 'error' && (
                            <span className="inline-flex items-center gap-1 text-destructive">
                              <XCircle className="h-3.5 w-3.5" /> Error
                            </span>
                          )}
                          {r.status === 'payment_failed' && (
                            <span className="inline-flex items-center gap-1 text-warning">
                              <Zap className="h-3.5 w-3.5" /> Payment failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-foreground/90 tabular-nums align-middle">
                          {r.statusCode ?? '—'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground tabular-nums align-middle">
                          {r.timeMs != null ? `${r.timeMs}ms` : '—'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-medium align-middle">
                          {r.paidUsd ? `$${r.paidUsd}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right align-middle">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                              onClick={() => removeFlow(r.id)}
                              disabled={running}
                              aria-label={`Remove ${r.label}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {(r.bodyRaw != null || r.error) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                                aria-label={expandedId === r.id ? 'Collapse' : 'Expand'}
                              >
                                {expandedId === r.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedId === r.id && (r.bodyRaw != null || r.error) && (
                        <tr key={`${r.id}-exp`} className="border-b border-border/40 bg-muted/15 dark:bg-black/20">
                          <td colSpan={7} className="p-4 sm:p-5">
                            <div className="rounded-xl bg-background/80 border border-border/60 p-4 font-mono text-xs overflow-auto max-h-64 whitespace-pre-wrap break-all shadow-inner">
                              {r.error && <p className="text-destructive mb-2">{r.error}</p>}
                              {r.bodyRaw != null && <pre className="text-foreground">{r.bodyRaw}</pre>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
