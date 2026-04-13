import { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { validateX402Format, type X402FormatValidationResult } from '@/lib/x402FormatValidation';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { extractPaymentDetailsFromOption } from '@/lib/x402Client';
import { CheckCircle2, XCircle, AlertCircle, Loader2, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveApiBaseUrl } from '@/lib/resolveApiBaseUrl';
import { BRAND_NAME, MAIN_CONTENT_PT_CLASS, MAIN_CONTENT_PB_SAFE_CLASS } from '@/lib/branding';

function getRequestOrigin(urlStr: string): string | null {
  try {
    const u = urlStr.trim();
    if (!u) return null;
    return new URL(u).origin;
  } catch {
    return null;
  }
}

const PROXY_BASE_URL = '/api/proxy/';
const USE_PROXY = import.meta.env.DEV || import.meta.env.VITE_USE_PROXY === 'true';

function getProxiedUrl(url: string): string {
  if (!USE_PROXY) return url;
  if (url.startsWith('/') || url.startsWith(PROXY_BASE_URL)) return url;
  return `${PROXY_BASE_URL}${encodeURIComponent(url)}`;
}

function useBackendPlaygroundProxy(targetUrl: string): boolean {
  if (USE_PROXY) return false;
  if (typeof window === 'undefined') return false;
  const targetOrigin = getRequestOrigin(targetUrl);
  const pageOrigin = window.location.origin;
  return !!targetOrigin && targetOrigin !== pageOrigin;
}

function getPlaygroundProxyUrl(_targetUrl: string): string {
  return `${resolveApiBaseUrl()}/api/playground-proxy`;
}

async function fetch402(
  finalUrl: string,
  method: string,
  body: string
): Promise<{ status: number; body: string; headers: Record<string, string> }> {
  const useProxy = useBackendPlaygroundProxy(finalUrl);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (useProxy) {
    const res = await fetch(getPlaygroundProxyUrl(finalUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: finalUrl,
        method,
        body: method === 'POST' ? '{}' : undefined,
        headers,
      }),
    });
    const text = await res.text();
    const outHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      outHeaders[key] = value;
    });
    return { status: res.status, body: text, headers: outHeaders };
  }

  const opts: RequestInit = { method, headers };
  if (method === 'POST') opts.body = '{}';
  const res = await fetch(getProxiedUrl(finalUrl), opts);
  const text = await res.text();
  const outHeaders: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    outHeaders[key] = value;
  });
  return { status: res.status, body: text, headers: outHeaders };
}

export default function FormatValidator() {
  const { wallet, selectedPaymentChain } = useApiPlayground();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<X402FormatValidationResult | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [detectedMethod, setDetectedMethod] = useState<'GET' | 'POST' | null>(null);

  const selectedPaymentDetails =
    result?.valid && result.paymentOption ? extractPaymentDetailsFromOption(result.paymentOption) : null;
  const parsedX402Version = result?.parsed?.x402Version;
  const parsedResource = result?.parsed?.resource;
  const parsedAccepts = result?.parsed?.accepts ?? [];

  const onTest = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    setLoading(true);
    setResult(null);
    setFetchError(null);
    setDetectedMethod(null);

    try {
      const [getRes, postRes] = await Promise.allSettled([
        fetch402(trimmedUrl, 'GET', '{}'),
        fetch402(trimmedUrl, 'POST', '{}'),
      ]);

      const getFulfilled = getRes.status === 'fulfilled' ? getRes.value : null;
      const postFulfilled = postRes.status === 'fulfilled' ? postRes.value : null;

      // If both methods return 402, pick POST (more common for richer schema).
      const chosen =
        postFulfilled?.status === 402
          ? { method: 'POST' as const, ...postFulfilled }
          : getFulfilled?.status === 402
            ? { method: 'GET' as const, ...getFulfilled }
            : postFulfilled
              ? { method: 'POST' as const, ...postFulfilled }
              : getFulfilled
                ? { method: 'GET' as const, ...getFulfilled }
                : null;

      if (!chosen) {
        // Both probes failed (network / DNS / blocked).
        const msg =
          (postRes.status === 'rejected' ? postRes.reason : null) ??
          (getRes.status === 'rejected' ? getRes.reason : null) ??
          'Request failed';
        throw msg instanceof Error ? msg.message : String(msg);
      }

      setDetectedMethod(chosen.method);

      const validation = validateX402Format(chosen.status, chosen.body, chosen.headers);
      setResult(validation);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setFetchError(msg || 'Request failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const flowStatus =
    loading ? 'loading'
    : fetchError || (result && !result.valid) ? 'error'
    : result?.valid ? 'success'
    : 'idle';

  return (
    <div className="min-h-[100dvh] h-dvh bg-background flex flex-col w-full overflow-x-hidden max-w-[100vw] playground-ambient relative">
      <TopBar
        wallet={wallet}
        onOpenConnectModal={() => {}}
        onToggleSidebar={() => {}}
        isSidebarOpen={false}
        paymentNetwork={selectedPaymentChain}
        flowStatus={flowStatus}
      />
      <div
        className={cn(
          'flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden relative z-[1]',
          MAIN_CONTENT_PT_CLASS,
          MAIN_CONTENT_PB_SAFE_CLASS,
        )}
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0 pb-24">
          <div className="glass-panel rounded-2xl p-5 sm:p-6 mb-8 border border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/25 via-ring/12 to-transparent blur-md opacity-80"
                  aria-hidden
                />
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-card/90 ring-1 ring-border/60 dark:ring-white/[0.08] shadow-md flex items-center justify-center border border-border/40">
                  <FlaskConical className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  402 response validator
                </h1>
                <p className="text-sm sm:text-[15px] text-muted-foreground mt-2 leading-relaxed text-balance">
                  {`Validate x402-shaped 402 JSON so ${BRAND_NAME} can pay and retry. MPP (machine payments) uses the same HTTP 402 wallet flow when the challenge is payable.`}
                </p>
              </div>
            </div>
          </div>

          <Card className="mb-8 rounded-2xl border-border/50 bg-card/70 backdrop-blur-sm shadow-sm dark:shadow-black/20 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-lg tracking-tight">Endpoint</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-1.5">
                Enter the API URL. We probe GET and POST (no payment) and validate the first method that returns a 402.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-0">
              <div className="space-y-2">
                <Label htmlFor="format-url" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  URL
                </Label>
                <Input
                  id="format-url"
                  type="url"
                  placeholder="https://api.example.com/paid-endpoint"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="font-mono text-sm h-11 rounded-xl border-border/80 bg-secondary/30 focus-visible:ring-primary/25"
                />
              </div>

              <Button
                variant="neon"
                onClick={onTest}
                disabled={loading || !url.trim()}
                className="w-full sm:w-auto h-10 rounded-full px-6 font-semibold shadow-sm gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Testing…
                  </>
                ) : (
                  'Test format'
                )}
              </Button>
            </CardContent>
          </Card>

          {fetchError && (
            <Alert variant="destructive" className="mb-8 rounded-2xl border-destructive/35 bg-destructive/[0.06] backdrop-blur-sm">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}

          {result && !fetchError && (
            <Card
              className={cn(
                'rounded-2xl backdrop-blur-sm shadow-sm dark:shadow-black/20 overflow-hidden',
                result.valid
                  ? 'border-success/30 bg-card/70'
                  : 'border-destructive/35 bg-card/70',
              )}
            >
              <CardHeader className="pb-3 space-y-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
                      result.valid
                        ? 'bg-success/12 text-success ring-success/25'
                        : 'bg-destructive/10 text-destructive ring-destructive/25',
                    )}
                  >
                    {result.valid ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <CardTitle className="font-display text-lg tracking-tight">
                      {result.valid ? 'Format is valid' : 'Format has issues'}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {detectedMethod ? `Detected via ${detectedMethod}. ` : ''}
                      {result.valid
                        ? `This 402 response matches what ${BRAND_NAME} expects. You can run it from the main workspace without format errors.`
                        : `Fix the issues below so ${BRAND_NAME} can complete payment and retry.`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.errors.length > 0 && (
                  <Alert variant="destructive" className="rounded-xl border-destructive/35">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Errors</AlertTitle>
                    <AlertDescription asChild>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        {result.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                {result.warnings.length > 0 && (
                  <Alert className="rounded-xl border-border/60 bg-muted/25 dark:bg-black/20">
                    <AlertCircle className="h-4 w-4 text-foreground" />
                    <AlertTitle>Warnings</AlertTitle>
                    <AlertDescription asChild>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
                        {result.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                {result.valid && result.paymentOption && (
                  <div className="rounded-xl bg-muted/20 dark:bg-black/20 border border-border/50 p-4 sm:p-5 text-sm space-y-4 shadow-inner">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">Selected payment option</p>
                        {parsedX402Version ? <Badge variant="success">{`x402 v${parsedX402Version}`}</Badge> : null}
                      </div>

                      {detectedMethod ? (
                        <Badge
                          variant={detectedMethod === 'POST' ? 'post' : 'get'}
                          className="uppercase"
                        >
                          {`Detected via ${detectedMethod}`}
                        </Badge>
                      ) : null}
                    </div>

                    <Separator />

                    {selectedPaymentDetails ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Network</div>
                            <div className="font-medium text-foreground">{selectedPaymentDetails.network}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Token</div>
                            <div className="font-medium text-foreground">{selectedPaymentDetails.token}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Amount</div>
                            <div className="font-medium text-foreground">{selectedPaymentDetails.amount}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">PayTo</div>
                            <div className="font-mono text-xs text-foreground break-all">{result.paymentOption.payTo}</div>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Scheme: {result.paymentOption.scheme ?? 'exact'} · Max timeout:{' '}
                          {result.paymentOption.maxTimeoutSeconds ?? 60}s · Asset: {result.paymentOption.asset ?? 'USDC'}
                          {selectedPaymentDetails.memo ? (
                            <>
                              {' '}
                              · Memo: <span className="text-foreground/90">{selectedPaymentDetails.memo}</span>
                            </>
                          ) : null}
                        </div>
                      </>
                    ) : null}

                    {parsedResource ? (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-foreground">Resource</p>
                            {parsedResource.mimeType ? (
                              <Badge variant="outline" className="font-mono text-[11px]">
                                {parsedResource.mimeType}
                              </Badge>
                            ) : null}
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">URL</div>
                            <div className="font-mono text-xs text-foreground break-all">{parsedResource.url}</div>
                          </div>

                          {parsedResource.description ? (
                            <p className="text-xs text-muted-foreground">{parsedResource.description}</p>
                          ) : null}
                        </div>
                      </>
                    ) : null}

                    {parsedAccepts.length ? (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-foreground">Available payment accepts</p>
                            <p className="text-xs text-muted-foreground">{`Showing up to 5 of ${parsedAccepts.length} options.`}</p>
                          </div>

                          <div className="space-y-2">
                            {parsedAccepts.slice(0, 5).map((a, idx) => {
                              const d = extractPaymentDetailsFromOption(a);
                              return (
                                <div
                                  key={idx}
                                  className="rounded-xl border border-border/50 bg-background/50 dark:bg-card/40 p-3 sm:p-4"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                      <div className="text-sm font-medium text-foreground">
                                        {d.network} · {d.token} · {d.amount}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1 font-mono break-all">
                                        {a.payTo}
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                                      <div className="font-medium text-foreground/90">{a.scheme ?? 'exact'}</div>
                                      <div>{`${a.maxTimeoutSeconds ?? 60}s`}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {parsedAccepts.length > 5 ? (
                              <div className="text-xs text-muted-foreground">+ {parsedAccepts.length - 5} more</div>
                            ) : null}
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
