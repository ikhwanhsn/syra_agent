import { useState, useEffect } from 'react';
import { Send, Loader2, Sparkles, Plus, Trash2, ArrowRight, Info, Globe, FileJson, Settings2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { JsonEditor } from '@/components/JsonEditor';
import { HttpMethod, RequestHeader, RequestParam, WalletState } from '@/types/api';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import type { PlaygroundPaymentLane } from '@/lib/paymentLane';
import { BRAND_NAME } from '@/lib/branding';

interface RequestBuilderProps {
  method: HttpMethod;
  url: string;
  headers: RequestHeader[];
  body: string;
  params: RequestParam[];
  isLoading: boolean;
  isAutoDetecting?: boolean;
  /** When set, only these methods are enabled for the current API; empty = both GET and POST */
  allowedMethods?: HttpMethod[];
  /** Shown in subtitle; derived on Index from URL / last response. */
  paymentLane?: PlaygroundPaymentLane;
  wallet: WalletState;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onHeadersChange: (headers: RequestHeader[]) => void;
  onBodyChange: (body: string) => void;
  onParamsChange: (params: RequestParam[]) => void;
  onSend: () => void;
  onTryDemo: () => void;
  /** Create share link for current request; returns full URL or null. Called when user clicks Share. */
  onCreateShareLink?: () => Promise<string | null>;
  /** Called after share link is created and copied; pass the full URL so parent can update browser URL. */
  onAfterShare?: (link: string) => void;
}

// x402 API only supports GET and POST
const methods: HttpMethod[] = ['GET', 'POST'];

const methodConfig: Record<'GET' | 'POST', { color: string; bg: string; description: string }> = {
  GET: {
    color: 'text-foreground',
    bg: 'bg-foreground/[0.06] hover:bg-foreground/10 border-border',
    description: 'Retrieve data from the API',
  },
  POST: {
    color: 'text-foreground',
    bg: 'bg-foreground/10 hover:bg-foreground/[0.14] border-border',
    description: 'Send data to the API',
  },
};

export function RequestBuilder({
  method,
  url,
  headers,
  body,
  params,
  isLoading,
  isAutoDetecting = false,
  allowedMethods = [],
  paymentLane = 'x402',
  wallet,
  onMethodChange,
  onUrlChange,
  onHeadersChange,
  onBodyChange,
  onParamsChange,
  onSend,
  onTryDemo,
  onCreateShareLink,
  onAfterShare,
}: RequestBuilderProps) {
  const [activeTab, setActiveTab] = useState('body');
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  const isGetMethod = method === 'GET';
  // When API type is known, disable method buttons that aren't supported
  const isMethodDisabled = (m: HttpMethod) =>
    allowedMethods.length > 0 && !allowedMethods.includes(m);

  // Auto-switch tab when method changes or params are detected
  useEffect(() => {
    if (isGetMethod && activeTab === 'body') {
      setActiveTab('params');
    }
  }, [method, isGetMethod, activeTab]);

  const hasEnabledParams = params.filter(p => p.enabled && p.key).length > 0;
  useEffect(() => {
    if (hasEnabledParams) {
      setActiveTab('params');
    }
  }, [hasEnabledParams]);

  const addHeader = () => {
    onHeadersChange([...headers, { key: '', value: '', enabled: true }]);
  };

  const updateHeader = (index: number, field: keyof RequestHeader, value: string | boolean) => {
    const updated = [...headers];
    updated[index] = { ...updated[index], [field]: value };
    onHeadersChange(updated);
  };

  const removeHeader = (index: number) => {
    onHeadersChange(headers.filter((_, i) => i !== index));
  };

  const addParam = () => {
    onParamsChange([...params, { key: '', value: '', enabled: true }]);
  };

  const updateParam = (index: number, field: keyof RequestParam, value: string | boolean) => {
    const updated = [...params];
    updated[index] = { ...updated[index], [field]: value };
    onParamsChange(updated);
  };

  const removeParam = (index: number) => {
    onParamsChange(params.filter((_, i) => i !== index));
  };

  const currentMethod = method as 'GET' | 'POST';
  const config = methodConfig[currentMethod] || methodConfig.GET;

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'w-9 h-9 shrink-0 rounded-lg overflow-hidden border border-border/80 ring-1 ring-black/5 dark:ring-white/10',
                paymentLane === 'mpp' && 'ring-accent/30 border-accent/40',
              )}
            >
              <img
                src="/images/logo.jpg"
                alt={BRAND_NAME}
                width={36}
                height={36}
                className="h-full w-full object-cover"
                decoding="async"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground truncate">
                {paymentLane === 'mpp' ? 'MPP request' : 'Request'}
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
            {wallet.connected && (
              <Badge
                variant="outline"
                className="text-[11px] sm:text-xs gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border-primary/30 bg-primary/10 text-foreground"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                <span className="sm:hidden">Ready</span>
                <span className="hidden sm:inline">Ready to pay</span>
              </Badge>
            )}
            {onCreateShareLink && (
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading || isSharing}
                className="gap-1.5 h-9 px-2.5 sm:px-3"
                onClick={async () => {
                  if (!onCreateShareLink) return;
                  setIsSharing(true);
                  try {
                    const link = await onCreateShareLink();
                    if (link) {
                      await navigator.clipboard.writeText(link);
                      onAfterShare?.(link);
                      toast({ title: 'Link copied', description: 'Share link copied to clipboard. Anyone with the link can open the same request.' });
                    } else {
                      toast({ title: 'Could not create link', variant: 'destructive' });
                    }
                  } finally {
                    setIsSharing(false);
                  }
                }}
              >
                <Share2 className="h-4 w-4 shrink-0" />
                <span className="text-sm">Share</span>
              </Button>
            )}
            <Button variant="neon-outline" size="sm" onClick={onTryDemo} className="gap-2 h-9 w-full sm:w-auto">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="text-sm">Try Demo</span>
            </Button>
          </div>
        </div>

        {/* Method Selector - fixed */}
        <div className="shrink-0 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Method</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px]">
                <p className="text-xs">
                  {paymentLane === 'mpp'
                    ? 'Syra MPP routes support GET and POST like the rest of the API'
                    : 'GET for reads; POST for writes (x402 & MPP payment-gated endpoints)'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            {methods.map((m) => {
              const methodKey = m as 'GET' | 'POST';
              const mConfig = methodConfig[methodKey];
              const isSelected = method === m;
              const disabled = isMethodDisabled(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => !disabled && onMethodChange(m)}
                  disabled={disabled}
                  className={cn(
                    "flex-1 min-w-0 py-3 px-4 rounded-lg border text-sm font-semibold transition-all duration-200",
                    "flex items-center justify-center gap-2 h-11",
                    disabled && "opacity-50 cursor-not-allowed",
                    isSelected 
                      ? cn(mConfig.bg, mConfig.color, "border-current") 
                      : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {m === 'GET' ? <Globe className="h-4 w-4 shrink-0" /> : <FileJson className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{m}</span>
                  {isSelected && (
                    <span className="text-xs font-normal opacity-70 hidden sm:inline truncate">
                      · {mConfig.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Endpoint URL - fixed */}
        <div className="shrink-0 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Endpoint URL</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
            <div className="flex-1 min-w-0 relative">
              <Input
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="https://api.example.com/v1/resource"
                className="font-mono text-base sm:text-sm bg-secondary/50 border-border h-11 pl-3 sm:pl-4 pr-12 sm:pr-14 min-w-0 w-full max-w-full"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                {isAutoDetecting && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {url && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs px-2 py-1',
                      url.toLowerCase().includes('/mpp/') &&
                        'border border-accent/40 bg-accent/10 text-accent'
                    )}
                  >
                    {url.includes('x402') || url.includes('demo')
                      ? 'x402'
                      : url.toLowerCase().includes('/mpp/')
                        ? 'MPP'
                        : 'API'}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="neon"
              onClick={onSend}
              disabled={isLoading || !url.trim()}
              className="w-full sm:w-auto sm:min-w-28 h-11 gap-2 text-sm shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span>Sending</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs - on mobile: min-height so section is visible in flow; on desktop: flex-1 and scrolls internally */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-[320px] lg:min-h-0 min-w-0">
          <TabsList className="shrink-0 bg-secondary/30 w-full sm:w-fit p-1 gap-1 flex flex-wrap !h-auto">
            {!isGetMethod && (
              <TabsTrigger 
                value="body" 
                className="data-[state=active]:bg-primary/20 gap-2 px-3 py-2 text-sm"
              >
                <FileJson className="h-4 w-4" />
                Body
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="params" 
              className="data-[state=active]:bg-primary/20 gap-2 px-3 py-2 text-sm"
            >
              <Globe className="h-4 w-4" />
              Params
              {params.filter(p => p.enabled && p.key).length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {params.filter(p => p.enabled && p.key).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="headers" 
              className="data-[state=active]:bg-primary/20 gap-2 px-3 py-2 text-sm"
            >
              <Settings2 className="h-4 w-4" />
              Headers
              {headers.filter(h => h.enabled && h.key).length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {headers.filter(h => h.enabled && h.key).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 mt-3 min-h-0 overflow-auto lg:overflow-hidden flex flex-col">
            {!isGetMethod && (
              <TabsContent value="body" className="m-0 flex-1 min-h-0 overflow-auto custom-scrollbar">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">JSON request body</span>
                    <Badge variant="secondary" className="text-xs px-2 py-1">application/json</Badge>
                  </div>
                  <div className="flex-1 min-h-0">
                    <JsonEditor
                      value={body}
                      onChange={onBodyChange}
                      placeholder='{\n  "message": "Hello, agent!",\n  "data": {}\n}'
                      minHeight="100%"
                    />
                  </div>
                </div>
              </TabsContent>
            )}

            <TabsContent value="params" className="m-0 flex-1 min-h-0 overflow-auto custom-scrollbar">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {isGetMethod ? 'Query parameters will be appended to the URL' : 'Parameters will be sent as JSON body'}
                  </span>
                </div>
                {params.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Globe className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">No query parameters added</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addParam}
                      className="gap-2 h-9"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">Add Parameter</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    {params.map((param, index) => (
                      <div key={index} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <div className="flex items-center gap-3 sm:shrink-0">
                          <Switch
                            checked={param.enabled}
                            onCheckedChange={(checked) => updateParam(index, 'enabled', checked)}
                          />
                          <span className="text-muted-foreground text-sm sm:hidden">=</span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <Input
                            value={param.key}
                            onChange={(e) => updateParam(index, 'key', e.target.value)}
                            placeholder="key"
                            className={cn(
                              "flex-1 min-w-0 h-10 bg-secondary/50 border-border font-mono text-sm",
                              !param.enabled && "opacity-50"
                            )}
                          />
                          <span className="text-muted-foreground hidden sm:inline">=</span>
                          <Input
                            value={param.value}
                            onChange={(e) => updateParam(index, 'value', e.target.value)}
                            placeholder={param.description ?? 'value'}
                            className={cn(
                              "flex-1 min-w-0 h-10 bg-secondary/50 border-border font-mono text-sm",
                              !param.enabled && "opacity-50"
                            )}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeParam(index)}
                          className="text-muted-foreground hover:text-destructive shrink-0 h-9 w-9 self-end sm:self-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addParam}
                      className="gap-2 h-9"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">Add Parameter</span>
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="headers" className="m-0 flex-1 min-h-0 overflow-auto custom-scrollbar">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Custom HTTP headers for your request</span>
                </div>
                {headers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Settings2 className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">No custom headers added</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addHeader}
                      className="gap-2 h-9"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">Add Header</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    {headers.map((header, index) => (
                      <div key={index} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <div className="flex items-center gap-3 sm:shrink-0">
                          <Switch
                            checked={header.enabled}
                            onCheckedChange={(checked) => updateHeader(index, 'enabled', checked)}
                          />
                          <span className="text-muted-foreground text-sm sm:hidden">:</span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <Input
                            value={header.key}
                            onChange={(e) => updateHeader(index, 'key', e.target.value)}
                            placeholder="Header-Name"
                            className={cn(
                              "flex-1 min-w-0 h-10 bg-secondary/50 border-border font-mono text-sm",
                              !header.enabled && "opacity-50"
                            )}
                          />
                          <span className="text-muted-foreground hidden sm:inline">:</span>
                          <Input
                            value={header.value}
                            onChange={(e) => updateHeader(index, 'value', e.target.value)}
                            placeholder="value"
                            className={cn(
                              "flex-1 min-w-0 h-10 bg-secondary/50 border-border font-mono text-sm",
                              !header.enabled && "opacity-50"
                            )}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeHeader(index)}
                          className="text-muted-foreground hover:text-destructive shrink-0 h-9 w-9 self-end sm:self-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addHeader}
                      className="gap-2 h-9"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">Add Header</span>
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
