import { ExternalLink, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/** Compact MPP lane notice — keeps copy short; technical details in tooltip. */
export function MppLaneStrip() {
  return (
    <div className="rounded-xl border border-accent/25 bg-accent/5 px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-start gap-2.5 min-w-0">
        <div
          className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-accent"
          aria-hidden
        />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground tracking-tight">
              Machine payments (MPP)
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                  aria-label="MPP technical details"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[260px] text-xs leading-relaxed">
                Same HTTP 402 / x402 v2 wallet flow. Paid responses may include{' '}
                <span className="font-mono text-[11px]">X-Syra-Payment-Lane</span> and JSON{' '}
                <span className="font-mono text-[11px]">protocol: &quot;mpp-test&quot;</span>.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pay the same way as x402. This lane uses Solana in the playground.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[calc(0.25rem+2px)] sm:pl-0 shrink-0 text-xs">
        <a
          href="https://docs.tempo.xyz/guide/payments/make-machine-payments"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-accent hover:underline font-medium"
        >
          Tempo
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
        <a
          href="https://docs.stripe.com/payments/machine/x402"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-accent hover:underline font-medium"
        >
          Stripe
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
      </div>
    </div>
  );
}
