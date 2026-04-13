import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Play,
  User,
  Wallet,
  Mail,
  FileJson,
  List,
  Heading,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/TopBar';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { resolveApiBaseUrl } from '@/lib/resolveApiBaseUrl';
import { format } from 'date-fns';
import { BRAND_NAME, MAIN_CONTENT_PT_CLASS, MAIN_CONTENT_PB_SAFE_CLASS } from '@/lib/branding';

interface ShareDetail {
  slug: string;
  method: string;
  url: string;
  params: { key: string; value: string; enabled?: boolean }[];
  headers: { key: string; value: string; enabled?: boolean }[];
  body: string;
  createdAt: string;
  updatedAt: string;
  sharedByWallet: string | null;
  sharedByChain: string | null;
  sharedByEmail: string | null;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-secondary/90 text-foreground border border-border/80 font-semibold',
  POST: 'bg-warning/20 text-warning-foreground border border-warning/40 font-semibold',
  PUT: 'bg-warning/15 text-warning border border-warning/30 font-semibold',
  PATCH: 'bg-primary/15 text-foreground border border-primary/35 font-semibold',
  DELETE: 'bg-destructive/20 text-destructive-foreground border border-destructive/35 font-semibold',
};

const ExplorerDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { wallet } = useApiPlayground();
  const { toast } = useToast();
  const [data, setData] = useState<ShareDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const base = resolveApiBaseUrl();

  useEffect(() => {
    if (!slug) {
      setError(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`${base}/playground/share/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [base, slug]);

  const copyShareLink = () => {
    if (!data) return;
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${data.slug}`;
    navigator.clipboard.writeText(url).then(() => toast({ title: 'Share link copied' }));
  };

  if (loading && !data) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col playground-ambient">
        <TopBar
          wallet={wallet}
          onOpenConnectModal={() => {}}
          onToggleSidebar={() => {}}
          isSidebarOpen={false}
          flowStatus="idle"
        />
        <div
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground relative z-[1]',
            MAIN_CONTENT_PT_CLASS,
            MAIN_CONTENT_PB_SAFE_CLASS,
          )}
        >
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full bg-primary/15 animate-ping" aria-hidden />
            <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-card/80 ring-1 ring-border/50">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          </div>
          <p className="text-sm font-medium text-foreground">Loading request…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col playground-ambient">
        <TopBar
          wallet={wallet}
          onOpenConnectModal={() => {}}
          onToggleSidebar={() => {}}
          isSidebarOpen={false}
          flowStatus="idle"
        />
        <div
          className={cn(
            'flex-1 flex items-center justify-center px-4 relative z-[1]',
            MAIN_CONTENT_PT_CLASS,
            MAIN_CONTENT_PB_SAFE_CLASS,
          )}
        >
          <div className="glass-panel rounded-2xl p-8 max-w-md text-center border border-border/50">
            <p className="font-display text-lg font-semibold text-foreground mb-2">Request not found</p>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              The shared request may have been removed or the link is invalid.
            </p>
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/explorer">Back to Explorer</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col w-full playground-ambient relative">
      <TopBar
        wallet={wallet}
        onOpenConnectModal={() => {}}
        onToggleSidebar={() => {}}
        isSidebarOpen={false}
        flowStatus="idle"
      />
      <div
        className={cn(
          'flex-1 w-full overflow-y-auto relative z-[1]',
          MAIN_CONTENT_PT_CLASS,
          MAIN_CONTENT_PB_SAFE_CLASS,
        )}
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0 pb-16">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2 text-muted-foreground hover:text-foreground -ml-2 rounded-full"
            >
              <Link to="/explorer">
                <ArrowLeft className="h-4 w-4" />
                Back to Explorer
              </Link>
            </Button>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full h-9" onClick={copyShareLink}>
                <Copy className="h-3.5 w-3.5" />
                Copy share link
              </Button>
              <Button variant="neon" size="sm" className="gap-1.5 rounded-full h-9 font-semibold shadow-sm" asChild>
                <Link to={`/s/${data.slug}`}>
                  <Play className="h-3.5 w-3.5" />
                  {`Try in ${BRAND_NAME}`}
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Sharer info */}
            <section className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-5 sm:p-6 shadow-sm dark:shadow-black/15">
              <h2 className="font-display text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                Shared by
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                {data.sharedByWallet ? (
                  <>
                    <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
                    <code className="font-mono text-sm text-foreground/90 bg-muted border border-border/60 px-2 py-1 rounded break-all" title={data.sharedByWallet}>
                      {data.sharedByWallet}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(data.sharedByWallet!);
                        toast({ title: 'Address copied' });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {data.sharedByChain && (
                      <span
                        className={cn(
                          'text-xs font-medium rounded border px-2 py-0.5 shrink-0',
                          data.sharedByChain === 'base'
                            ? 'bg-primary/[0.08] border-primary/20 text-foreground'
                            : 'bg-accent/10 border-accent/25 text-accent'
                        )}
                      >
                        {data.sharedByChain}
                      </span>
                    )}
                  </>
                ) : data.sharedByEmail ? (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{data.sharedByEmail}</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Anonymous</p>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Created {format(new Date(data.createdAt), 'MMM d, yyyy HH:mm')}</span>
                <span>Updated {format(new Date(data.updatedAt), 'MMM d, yyyy HH:mm')}</span>
              </div>
            </section>

            {/* Request */}
            <section className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-5 sm:p-6 shadow-sm dark:shadow-black/15">
              <h2 className="font-display text-base font-semibold text-foreground mb-4">Request</h2>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={cn('rounded border px-2 py-0.5 text-xs font-medium', METHOD_COLORS[data.method] || 'bg-muted')}>
                  {data.method}
                </span>
                <code className="text-xs text-foreground/90 font-mono bg-muted border border-border/60 px-1.5 py-0.5 rounded">
                  {data.slug}
                </code>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                  onClick={() => {
                    navigator.clipboard.writeText(data.url);
                    toast({ title: 'URL copied' });
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <pre className="text-xs font-mono text-foreground break-all whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border border-border/50 overflow-x-auto">
                {data.url}
              </pre>
            </section>

            {/* Params */}
            {data.params.length > 0 && (
              <section className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-5 sm:p-6 shadow-sm dark:shadow-black/15">
                <h2 className="font-display text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Query params ({data.params.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium text-muted-foreground">Key</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">Value</th>
                        <th className="text-left py-2 font-medium text-muted-foreground w-20">Enabled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.params.map((p, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 font-mono text-xs">{p.key}</td>
                          <td className="py-2 font-mono text-xs break-all">{p.value}</td>
                          <td className="py-2 text-muted-foreground">{p.enabled !== false ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Headers */}
            {data.headers.length > 0 && (
              <section className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-5 sm:p-6 shadow-sm dark:shadow-black/15">
                <h2 className="font-display text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Heading className="h-4 w-4" />
                  Headers ({data.headers.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium text-muted-foreground">Key</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">Value</th>
                        <th className="text-left py-2 font-medium text-muted-foreground w-20">Enabled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.headers.map((h, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 font-mono text-xs">{h.key}</td>
                          <td className="py-2 font-mono text-xs break-all">{h.value}</td>
                          <td className="py-2 text-muted-foreground">{h.enabled !== false ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Body */}
            {data.body && data.body.trim() !== '' && (
              <section className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-5 sm:p-6 shadow-sm dark:shadow-black/15">
                <h2 className="font-display text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  Body ({data.body.length} chars)
                </h2>
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words bg-muted/30 p-3 rounded-lg border border-border/50 max-h-64 overflow-y-auto">
                  {data.body}
                </pre>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorerDetail;
