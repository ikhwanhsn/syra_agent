import { useState, useEffect } from 'react';
import { Send, Loader2, Sparkles, Plus, Trash2, Zap, ArrowRight, Info, Globe, FileJson, Settings2 } from 'lucide-react';
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

interface RequestBuilderProps {
  method: HttpMethod;
  url: string;
  headers: RequestHeader[];
  body: string;
  params: RequestParam[];
  isLoading: boolean;
  wallet: WalletState;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onHeadersChange: (headers: RequestHeader[]) => void;
  onBodyChange: (body: string) => void;
  onParamsChange: (params: RequestParam[]) => void;
  onSend: () => void;
  onTryDemo: () => void;
}

// x402 API only supports GET and POST
const methods: HttpMethod[] = ['GET', 'POST'];

const methodConfig: Record<'GET' | 'POST', { color: string; bg: string; description: string }> = {
  GET: { 
    color: 'text-success', 
    bg: 'bg-success/10 hover:bg-success/20 border-success/30',
    description: 'Retrieve data from the API'
  },
  POST: { 
    color: 'text-warning', 
    bg: 'bg-warning/10 hover:bg-warning/20 border-warning/30',
    description: 'Send data to the API'
  },
};

export function RequestBuilder({
  method,
  url,
  headers,
  body,
  params,
  isLoading,
  wallet,
  onMethodChange,
  onUrlChange,
  onHeadersChange,
  onBodyChange,
  onParamsChange,
  onSend,
  onTryDemo,
}: RequestBuilderProps) {
  const [activeTab, setActiveTab] = useState('body');
  const isGetMethod = method === 'GET';

  // Auto-switch tab when method changes
  useEffect(() => {
    if (isGetMethod && activeTab === 'body') {
      setActiveTab('params');
    }
  }, [method, isGetMethod, activeTab]);

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
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Zap className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Request Builder</h2>
              <p className="text-xs text-muted-foreground">Configure your x402 API request</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {wallet.connected && (
              <Badge variant="success" className="text-xs gap-2 px-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Ready to Pay
              </Badge>
            )}
            <Button variant="neon-outline" size="sm" onClick={onTryDemo} className="gap-2 h-9">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">Try Demo</span>
            </Button>
          </div>
        </div>

        {/* Method Selector - Prominent toggle for GET/POST */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Method</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground/50" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px]">
                <p className="text-xs">x402 API supports GET for fetching data and POST for sending data</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex gap-3">
            {methods.map((m) => {
              const methodKey = m as 'GET' | 'POST';
              const mConfig = methodConfig[methodKey];
              const isSelected = method === m;
              return (
                <button
                  key={m}
                  onClick={() => onMethodChange(m)}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-lg border text-sm font-semibold transition-all duration-200",
                    "flex items-center justify-center gap-2 h-11",
                    isSelected 
                      ? cn(mConfig.bg, mConfig.color, "border-current") 
                      : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {m === 'GET' ? <Globe className="h-4 w-4" /> : <FileJson className="h-4 w-4" />}
                  {m}
                  {isSelected && (
                    <span className="text-xs font-normal opacity-70 hidden sm:inline">
                      · {mConfig.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* URL Input */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Endpoint URL</span>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="https://api.example.com/v1/resource"
                className="font-mono text-sm bg-secondary/50 border-border h-11 pr-4 pl-4"
              />
              {url && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    {url.includes('x402') || url.includes('demo') ? 'x402' : 'API'}
                  </Badge>
                </div>
              )}
            </div>
            <Button
              variant="neon"
              onClick={onSend}
              disabled={isLoading || !url.trim()}
              className="min-w-28 h-11 gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs - Contextual based on method */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="bg-secondary/30 w-fit p-1 gap-1">
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

          <div className="flex-1 mt-3 overflow-hidden min-h-0">
            {!isGetMethod && (
              <TabsContent value="body" className="m-0 h-full">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">JSON request body</span>
                    <Badge variant="secondary" className="text-xs px-2 py-1">application/json</Badge>
                  </div>
                  <div className="flex-1 min-h-0">
                    <JsonEditor
                      value={body}
                      onChange={onBodyChange}
                      placeholder='{\n  "message": "Hello, x402!",\n  "data": {}\n}'
                      minHeight="100%"
                    />
                  </div>
                </div>
              </TabsContent>
            )}

            <TabsContent value="params" className="m-0 h-full overflow-auto custom-scrollbar">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Query parameters will be appended to the URL</span>
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
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <Switch
                          checked={param.enabled}
                          onCheckedChange={(checked) => updateParam(index, 'enabled', checked)}
                        />
                        <Input
                          value={param.key}
                          onChange={(e) => updateParam(index, 'key', e.target.value)}
                          placeholder="key"
                          className={cn(
                            "flex-1 h-10 bg-secondary/50 border-border font-mono text-sm",
                            !param.enabled && "opacity-50"
                          )}
                        />
                        <span className="text-muted-foreground">=</span>
                        <Input
                          value={param.value}
                          onChange={(e) => updateParam(index, 'value', e.target.value)}
                          placeholder="value"
                          className={cn(
                            "flex-1 h-10 bg-secondary/50 border-border font-mono text-sm",
                            !param.enabled && "opacity-50"
                          )}
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeParam(index)}
                          className="text-muted-foreground hover:text-destructive shrink-0 h-9 w-9"
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

            <TabsContent value="headers" className="m-0 h-full overflow-auto custom-scrollbar">
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
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <Switch
                          checked={header.enabled}
                          onCheckedChange={(checked) => updateHeader(index, 'enabled', checked)}
                        />
                        <Input
                          value={header.key}
                          onChange={(e) => updateHeader(index, 'key', e.target.value)}
                          placeholder="Header-Name"
                          className={cn(
                            "flex-1 h-10 bg-secondary/50 border-border font-mono text-sm",
                            !header.enabled && "opacity-50"
                          )}
                        />
                        <span className="text-muted-foreground">:</span>
                        <Input
                          value={header.value}
                          onChange={(e) => updateHeader(index, 'value', e.target.value)}
                          placeholder="value"
                          className={cn(
                            "flex-1 h-10 bg-secondary/50 border-border font-mono text-sm",
                            !header.enabled && "opacity-50"
                          )}
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeHeader(index)}
                          className="text-muted-foreground hover:text-destructive shrink-0 h-9 w-9"
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
