import { useState, useEffect, useMemo, useCallback } from 'react';
import { Play, Copy, Check, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RequestParam } from '@/types/api';
import type { ExampleFlowPreset } from '@/hooks/useApiPlayground';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface QueryParamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  flow: ExampleFlowPreset | null;
  /** Params to show (from getParamsForExampleFlow). Used when preset has no params but API supports them. */
  initialParams: RequestParam[];
  onRun: (params: RequestParam[]) => void;
}

type SectionId = 'tokens' | 'accounts' | 'amounts' | 'advanced' | 'general';

const SECTION_ORDER: SectionId[] = ['tokens', 'accounts', 'amounts', 'advanced', 'general'];

const SECTION_META: Record<
  SectionId,
  { title: string; description: string }
> = {
  tokens: { title: 'Tokens & contracts', description: 'Mints and program identifiers' },
  accounts: { title: 'Wallets & parties', description: 'User or authority context' },
  amounts: { title: 'Amounts & risk', description: 'Size, slippage, and fees' },
  advanced: { title: 'Execution & encoding', description: 'Wire format and safety flags' },
  general: { title: 'Other parameters', description: 'Additional query fields' },
};

function humanizeParamKey(key: string): string {
  const spaced = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
}

function sectionIdForKey(key: string): SectionId {
  const k = key.toLowerCase();
  if (/(^|_)(input|output)?mint|token$|_token|contract|program/.test(k)) return 'tokens';
  if (/mint/.test(k)) return 'tokens';
  if (/(address|pubkey|wallet|user|owner|signer|authority)/.test(k)) return 'accounts';
  if (/(amount|slippage|tip|fee|price|pct|percent|minimum|max|leverage)/.test(k)) return 'amounts';
  if (/(encoding|protection|priority|compute|skip|pref|deadline|preflight|commitment)/.test(k)) return 'advanced';
  return 'general';
}

function isBooleanStringParam(param: RequestParam): boolean {
  const v = param.value.trim().toLowerCase();
  return v === 'true' || v === 'false';
}

function isLongValueField(key: string, value: string): boolean {
  if (value.length > 52) return true;
  const k = key.toLowerCase();
  return /mint|address|pubkey|program|account|hash|signature/.test(k);
}

const ENCODING_PRESETS = ['base64', 'json', 'utf8'] as const;

function parseRequestPreviewUrl(url: string): {
  href: string;
  origin: string;
  pathWithQuery: string;
  host: string;
} {
  try {
    const u = new URL(url);
    return {
      href: u.href,
      origin: u.origin,
      pathWithQuery: `${u.pathname}${u.search}`,
      host: u.host,
    };
  } catch {
    return { href: url, origin: '', pathWithQuery: url, host: '' };
  }
}

export function QueryParamsModal({ isOpen, onClose, flow, initialParams, onRun }: QueryParamsModalProps) {
  const [paramValues, setParamValues] = useState<RequestParam[]>([]);
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (flow && isOpen) {
      const source = initialParams.length > 0 ? initialParams : flow.params;
      setParamValues(source.map((p) => ({ ...p })));
    } else {
      setParamValues([]);
    }
  }, [flow, isOpen, initialParams]);

  const grouped = useMemo(() => {
    const map = new Map<SectionId, { param: RequestParam; index: number }[]>();
    for (const id of SECTION_ORDER) map.set(id, []);
    paramValues.forEach((param, index) => {
      const id = sectionIdForKey(param.key);
      map.get(id)!.push({ param, index });
    });
    return map;
  }, [paramValues]);

  const nonEmptySectionIds = useMemo(
    () => SECTION_ORDER.filter((sid) => (grouped.get(sid)?.length ?? 0) > 0),
    [grouped],
  );

  const isQueryPreviewEmpty = nonEmptySectionIds.length === 0;

  const requestPreview = useMemo(() => {
    if (!flow?.url) return null;
    return parseRequestPreviewUrl(flow.url);
  }, [flow]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flow) return;
    const enabledParams: RequestParam[] = paramValues.map((p) => ({
      ...p,
      enabled: true,
    }));
    onRun(enabledParams);
    onClose();
  };

  const handleChange = (index: number, value: string) => {
    setParamValues((prev) => prev.map((p, i) => (i === index ? { ...p, value } : p)));
  };

  const copyValue = useCallback(
    async (fieldId: string, value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopiedFieldId(fieldId);
        toast({ title: 'Copied', description: 'Value copied to clipboard.' });
        window.setTimeout(() => setCopiedFieldId(null), 1600);
      } catch {
        toast({ title: 'Copy failed', variant: 'destructive' });
      }
    },
    [toast]
  );

  if (!flow) return null;

  const fieldShell =
    'rounded-xl border border-border/60 bg-muted/15 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04)] transition-[border-color,box-shadow] duration-200 ' +
    'focus-within:border-primary/35 focus-within:ring-1 focus-within:ring-primary/25 dark:bg-black/20';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'flex max-h-[min(90dvh,720px)] w-[calc(100%-1.5rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-w-xl sm:rounded-2xl',
          'border-border/60 bg-card/95 shadow-2xl shadow-black/40 backdrop-blur-2xl dark:border-white/[0.08]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
          aria-hidden
        />

        <DialogHeader className="shrink-0 space-y-3 border-b border-border/50 px-6 pb-5 pt-6 text-left sm:pr-14">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-primary/25 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground"
            >
              Step 1
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-full border border-border/50 px-2.5 py-0.5 font-mono text-[10px] font-semibold"
            >
              {flow.method}
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {isQueryPreviewEmpty ? (
                <>
                  <Sparkles className="h-3 w-3 text-primary/60" aria-hidden />
                  Preview
                </>
              ) : (
                <>
                  <SlidersHorizontal className="h-3 w-3 opacity-70" aria-hidden />
                  Configure
                </>
              )}
            </span>
          </div>
          <DialogTitle className="font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
            {flow.label}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {initialParams.length > 0 || flow.params.length > 0
              ? 'Tune query parameters for this example. When you continue, the playground opens with this request ready to send.'
              : 'This call ships without a query string. Continue and we will stage it in the Agentic Playground, ready to send.'}
          </DialogDescription>

          <div className="rounded-xl border border-border/45 bg-muted/25 px-3.5 py-3 shadow-inner shadow-black/[0.03] dark:bg-muted/15 dark:shadow-black/20">
            <div className="flex items-center justify-between gap-2 pb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Syra API URL
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 gap-1 rounded-md px-2 text-[10px] font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                onClick={() => void copyValue('modal-syra-endpoint-url', flow.url)}
              >
                {copiedFieldId === 'modal-syra-endpoint-url' ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copy
              </Button>
            </div>
            <p className="break-all font-mono text-[11px] leading-relaxed text-foreground/95 sm:text-xs">{flow.url}</p>
            {(initialParams.length > 0 || flow.params.length > 0) && flow.method === 'GET' && !flow.url.includes('?') ? (
              <p className="mt-2 border-t border-border/35 pt-2 text-[11px] leading-snug text-muted-foreground/90">
                Enabled query fields below are appended when you send from the playground.
              </p>
            ) : null}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <form id="query-params-form" onSubmit={handleSubmit} className="px-6 py-5">
            <div className="space-y-0 pr-3">
              {nonEmptySectionIds.length === 0 && requestPreview ? (
                <div className="relative overflow-hidden rounded-2xl border border-border/35 bg-gradient-to-br from-primary/[0.07] via-transparent to-ring/[0.06] p-[1px] shadow-[0_1px_0_hsl(0_0%_100%/0.04)_inset] dark:from-primary/[0.12] dark:via-transparent dark:to-ring/[0.08] dark:shadow-[0_1px_0_hsl(0_0%_100%/0.03)_inset]">
                  <div className="relative overflow-hidden rounded-[15px] bg-card/90 backdrop-blur-sm">
                    <div
                      className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/25 blur-3xl dark:bg-primary/20"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute -bottom-28 -left-16 h-52 w-52 rounded-full bg-ring/20 blur-3xl dark:bg-violet-500/10"
                      aria-hidden
                    />
                    <div className="relative space-y-6 px-5 py-8 sm:px-8 sm:py-9">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/45 bg-background/70 shadow-sm dark:bg-background/40">
                          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                        </span>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/90">
                            Request preview
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground/80">Nothing to configure on the wire</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                          <span className="shrink-0 rounded-md border border-border/55 bg-muted/35 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-foreground shadow-sm dark:bg-muted/25">
                            {flow.method}
                          </span>
                          <span className="min-w-0 break-all font-mono text-[13px] font-medium leading-snug tracking-tight text-foreground/95 sm:text-sm">
                            {requestPreview.pathWithQuery || requestPreview.href}
                          </span>
                        </div>
                        {requestPreview.origin ? (
                          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                            {requestPreview.host}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              {nonEmptySectionIds.map((sectionId, sectionIdx) => {
                const rows = grouped.get(sectionId) ?? [];
                const meta = SECTION_META[sectionId];
                return (
                  <section
                    key={sectionId}
                    className={cn('space-y-4', sectionIdx > 0 && 'mt-8 border-t border-border/45 pt-8')}
                  >
                    <div className="space-y-1">
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {meta.title}
                      </h3>
                      <p className="text-xs text-muted-foreground/90">{meta.description}</p>
                    </div>
                    <div className="space-y-5">
                      {rows.map(({ param, index }) => {
                        const id = `param-${param.key}-${index}`;
                        const label = humanizeParamKey(param.key);
                        const boolMode = isBooleanStringParam(param);
                        const long = isLongValueField(param.key, param.value);
                        const isEncoding = param.key.toLowerCase() === 'encoding';

                        return (
                          <div key={id} className="space-y-2">
                            <div className="flex items-end justify-between gap-3">
                              <Label htmlFor={id} className="text-[13px] font-medium text-foreground">
                                {label}
                              </Label>
                              {param.description ? (
                                <span className="hidden max-w-[55%] truncate text-right text-[11px] text-muted-foreground sm:inline">
                                  {param.description}
                                </span>
                              ) : null}
                            </div>

                            {boolMode ? (
                              <div
                                className={cn(
                                  'flex items-center justify-between gap-4 px-4 py-3.5',
                                  fieldShell,
                                )}
                              >
                                <p className="text-xs text-muted-foreground">
                                  {param.value.trim().toLowerCase() === 'true' ? 'Enabled' : 'Disabled'}
                                </p>
                                <Switch
                                  id={id}
                                  checked={param.value.trim().toLowerCase() === 'true'}
                                  onCheckedChange={(checked) => handleChange(index, checked ? 'true' : 'false')}
                                />
                              </div>
                            ) : long ? (
                              <div className={cn('relative p-1', fieldShell)}>
                                <Textarea
                                  id={id}
                                  value={param.value}
                                  onChange={(e) => handleChange(index, e.target.value)}
                                  placeholder={param.description || `Enter ${param.key}`}
                                  rows={3}
                                  spellCheck={false}
                                  className="min-h-[4.5rem] resize-y border-0 bg-transparent px-3 py-2.5 font-mono text-xs leading-relaxed shadow-none focus-visible:ring-0 sm:text-[13px]"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-2 top-2 h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                  aria-label={`Copy ${label}`}
                                  onClick={() => void copyValue(id, param.value)}
                                >
                                  {copiedFieldId === id ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <div className={cn('relative flex items-center p-1', fieldShell)}>
                                <Input
                                  id={id}
                                  value={param.value}
                                  onChange={(e) => handleChange(index, e.target.value)}
                                  placeholder={param.description || `Enter ${param.key}`}
                                  className="h-10 border-0 bg-transparent pl-3 pr-11 font-mono text-xs shadow-none focus-visible:ring-0 sm:h-11 sm:text-[13px]"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="mr-1 h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                  aria-label={`Copy ${label}`}
                                  onClick={() => void copyValue(id, param.value)}
                                >
                                  {copiedFieldId === id ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                            )}

                            {isEncoding ? (
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {ENCODING_PRESETS.map((preset) => {
                                  const active = param.value.trim().toLowerCase() === preset;
                                  return (
                                    <button
                                      key={preset}
                                      type="button"
                                      onClick={() => handleChange(index, preset)}
                                      className={cn(
                                        'rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide transition-colors',
                                        active
                                          ? 'border-primary/40 bg-primary/15 text-foreground'
                                          : 'border-border/50 bg-muted/10 text-muted-foreground hover:border-border hover:bg-muted/25 hover:text-foreground',
                                      )}
                                    >
                                      {preset}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}

                            {param.description && !boolMode ? (
                              <p className="text-[11px] text-muted-foreground sm:hidden">{param.description}</p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </form>
        </div>

        <div className="shrink-0 border-t border-border/50 bg-card/80 px-6 py-4 backdrop-blur-md">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-11 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground sm:h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="query-params-form"
              variant="neon"
              className="h-11 gap-2 rounded-xl px-6 shadow-md transition-transform duration-200 hover:translate-y-[-1px] sm:h-10"
            >
              <Play className="h-3.5 w-3.5" />
              Continue to playground
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
