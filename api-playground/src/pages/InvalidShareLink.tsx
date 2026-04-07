import { Link } from 'react-router-dom';
import { Link2Off, Zap, ArrowRight, LayoutGrid, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND_NAME } from '@/lib/branding';

interface InvalidShareLinkProps {
  /** Optional slug that was requested (for display). */
  slug?: string;
}

export function InvalidShareLink({ slug }: InvalidShareLinkProps) {
  return (
    <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 min-w-0">
        {/* Header - same structure as Examples / Explorer */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
              <Link2Off className="h-5 w-5 text-destructive" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-foreground">
                This link is invalid or has expired
              </h1>
              <p className="text-sm text-muted-foreground">
                The shared request could not be found. It may have been removed or the link might be incorrect.
              </p>
            </div>
          </div>
        </div>

        {/* What happened - card */}
        <section className="mb-8">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            What happened
          </h2>
          <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 sm:p-5">
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              The URL you opened points to a shared API request that no longer exists or was never saved.
              {`You can start fresh in ${BRAND_NAME} or pick an example flow to run.`}
            </p>
            {slug && slug.length <= 32 && (
              <p className="text-xs font-mono text-muted-foreground/90 bg-muted/50 px-3 py-2 rounded-lg inline-block">
                /s/{slug}
              </p>
            )}
          </div>
        </section>

        {/* Actions - card grid like example flows */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            What you can do
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-foreground block">{`Open ${BRAND_NAME}`}</span>
                  <span className="text-xs text-muted-foreground">Main workspace — request, pay, respond</span>
                </div>
              </div>
              <Button asChild variant="neon" size="sm" className="gap-1.5 shrink-0">
                <Link to="/">
                  Open
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-foreground block">Browse examples</span>
                  <span className="text-xs text-muted-foreground">Syra presets — payment-gated (x402)</span>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
                <Link to="/examples">Browse</Link>
              </Button>
            </div>

            <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <FileCode className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-foreground block">Try Agent</span>
                  <span className="text-xs text-muted-foreground">Use the Syra Agent</span>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
                <a href="https://agent.syraa.fun" target="_blank" rel="noopener noreferrer">
                  Open
                </a>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
