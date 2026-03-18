import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { validateX402Format, type X402FormatValidationResult } from '@/lib/x402FormatValidation';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { CheckCircle2, XCircle, AlertCircle, Loader2, ArrowLeft, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000';
  }
  return 'https://api.syraa.fun';
}

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
  return `${getApiBaseUrl()}/api/playground-proxy`;
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
        body: method === 'POST' && body.trim() ? body : undefined,
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
  if (method === 'POST' && body.trim()) opts.body = body;
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
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [body, setBody] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<X402FormatValidationResult | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const onTest = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    setLoading(true);
    setResult(null);
    setFetchError(null);
    try {
      const { status, body: responseBody, headers } = await fetch402(
        trimmedUrl,
        method,
        method === 'POST' ? body : '{}'
      );
      const validation = validateX402Format(status, responseBody, headers);
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
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <TopBar
        wallet={wallet}
        onOpenConnectModal={() => {}}
        onToggleSidebar={() => {}}
        isSidebarOpen={false}
        paymentNetwork={selectedPaymentChain}
      />
      <main className="flex-1 pt-14 sm:pt-16 pb-8 px-4 sm:px-6 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Playground
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5">
            <FlaskConical className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">x402 Format Validator</h1>
            <p className="text-sm text-muted-foreground">
              Test if an API returns a 402 response in the correct format for the playground.
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Endpoint</CardTitle>
            <CardDescription>
              Enter the API URL and optional body. We'll send a request without payment; the API should return 402 with a valid x402 payload.
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
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-2 sm:w-32">
                <Label>Method</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as 'GET' | 'POST')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {method === 'POST' && (
                <div className="flex-1 space-y-2">
                  <Label htmlFor="format-body">Body (JSON)</Label>
                  <textarea
                    id="format-body"
                    className={cn(
                      'flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono',
                      'ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder='{"query": "example"}'
                  />
                </div>
              )}
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
          <Card className={cn(result.valid ? 'border-green-500/30' : 'border-destructive/30')}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {result.valid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <CardTitle className="text-base">
                  {result.valid ? 'Format is valid' : 'Format has issues'}
                </CardTitle>
              </div>
              <CardDescription>
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
                <div className="rounded-lg bg-muted/50 border border-border p-3 text-sm space-y-1">
                  <p className="font-medium text-foreground">Selected payment option</p>
                  <p className="text-muted-foreground">
                    Network: {result.paymentOption.network} · Amount: {result.paymentOption.amount} · PayTo: {result.paymentOption.payTo.slice(0, 8)}…
                  </p>
                  {result.parsed?.x402Version && (
                    <p className="text-muted-foreground">x402 version: {result.parsed.x402Version}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
