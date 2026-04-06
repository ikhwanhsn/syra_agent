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

  return (
    <div className="min-h-[100dvh] h-dvh bg-background flex flex-col w-full overflow-x-hidden max-w-[100vw]">
      <TopBar
        wallet={wallet}
        onOpenConnectModal={() => {}}
        onToggleSidebar={() => {}}
        isSidebarOpen={false}
        paymentNetwork={selectedPaymentChain}
      />
      <div className="flex-1 min-h-0 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4rem+env(safe-area-inset-top,0px))] w-full overflow-y-scroll overflow-x-hidden">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 min-w-0">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border/50">
                <FlaskConical className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">x402 Format Validator</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Test if an API returns a 402 response in the correct format for the playground.
                </p>
              </div>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Endpoint</CardTitle>
              <CardDescription>
                Enter the API URL. We'll probe both GET and POST (no payment) and validate the first method that returns a 402.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="format-url">URL</Label>
                <Input
                  id="format-url"
                  type="url"
                  placeholder="https://api.example.com/paid-endpoint"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={onTest} disabled={loading || !url.trim()} className="w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing…
                  </>
                ) : (
                  'Test format'
                )}
              </Button>
            </CardContent>
          </Card>

          {fetchError && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}

          {result && !fetchError && (
            <Card className={cn(result.valid ? 'border-accent/35' : 'border-destructive/30')}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  {result.valid ? (
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <CardTitle className="text-base">
                    {result.valid ? 'Format is valid' : 'Format has issues'}
                  </CardTitle>
                </div>
                <CardDescription>
                  {detectedMethod ? `Detected via ${detectedMethod}. ` : ''}
                  {result.valid
                    ? 'This endpoint returns a 402 response that the playground can parse and pay. You can use it in the playground without format errors.'
                    : 'Fix the issues below so the playground can pay and retry correctly.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.errors.length > 0 && (
                  <Alert variant="destructive">
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
                  <Alert className="border-amber-500/30 bg-amber-500/5">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle>Warnings</AlertTitle>
                    <AlertDescription asChild>
                      <ul className="list-disc pl-4 mt-1 space-y-1 text-amber-700 dark:text-amber-400">
                        {result.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                {result.valid && result.paymentOption && (
                  <div className="rounded-lg bg-muted/30 border border-border/60 p-4 text-sm space-y-4">
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
                                  className="rounded-md border border-border/60 bg-background/40 p-3"
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
