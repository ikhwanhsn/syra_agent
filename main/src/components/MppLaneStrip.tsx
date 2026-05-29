import { ExternalLink, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/** Short notice when the URL is on the MPP (machine payments) lane. */
export function MppLaneStrip() {
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">MPP</span>
      <span className="hidden sm:inline">·</span>
      <span>Same 402 wallet step as x402 · Solana</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10"
            aria-label="MPP details"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-xs leading-relaxed">
          HTTP 402 / x402 v2 flow. Responses may include{' '}
          <span className="font-mono text-[11px]">X-Syra-Payment-Lane</span> and{' '}
          <span className="font-mono text-[11px]">protocol: &quot;mpp-test&quot;</span>.
        </TooltipContent>
      </Tooltip>
      <span className="hidden sm:inline w-px h-3 bg-border shrink-0" aria-hidden />
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
  );
}
