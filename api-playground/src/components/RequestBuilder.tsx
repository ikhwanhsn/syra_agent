import { useState } from 'react';
import { Send, Loader2, Play, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { JsonEditor } from '@/components/JsonEditor';
import { HttpMethod, RequestHeader, RequestParam, WalletState } from '@/types/api';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const methodColors: Record<HttpMethod, string> = {
  GET: 'text-success',
  POST: 'text-warning',
  PUT: 'text-accent',
  PATCH: 'text-primary',
  DELETE: 'text-destructive',
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

  return (
    <div className="flex flex-col h-full">
      {/* Header with Try Demo and Wallet Status */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Request
        </h2>
        <div className="flex items-center gap-2">
          {wallet.connected && (
            <Badge variant="success" className="text-xs gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              Wallet Ready
            </Badge>
          )}
          <Button variant="neon-outline" size="sm" onClick={onTryDemo} className="gap-1.5">
            <Play className="h-3.5 w-3.5" />
            Try Demo
          </Button>
        </div>
      </div>

      {/* URL Input Row */}
      <div className="flex gap-2 mb-4">
        <Select value={method} onValueChange={(v) => onMethodChange(v as HttpMethod)}>
          <SelectTrigger className="w-28 bg-secondary border-border">
            <SelectValue>
              <span className={cn("font-semibold", methodColors[method])}>
                {method}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {methods.map((m) => (
              <SelectItem key={m} value={m}>
                <span className={cn("font-semibold", methodColors[m])}>{m}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="Enter API URL..."
          className="flex-1 font-mono text-sm bg-secondary border-border"
        />

        <Button
          variant="neon"
          onClick={onSend}
          disabled={isLoading || !url.trim()}
          className="min-w-24"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="bg-secondary/50 w-fit">
          <TabsTrigger value="body" className="data-[state=active]:bg-primary/20">
            Body
          </TabsTrigger>
          <TabsTrigger value="headers" className="data-[state=active]:bg-primary/20">
            Headers
            {headers.filter(h => h.enabled && h.key).length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                {headers.filter(h => h.enabled && h.key).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="params" className="data-[state=active]:bg-primary/20">
            Params
            {params.filter(p => p.enabled && p.key).length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                {params.filter(p => p.enabled && p.key).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-3 overflow-hidden">
          <TabsContent value="body" className="m-0 h-full">
            <JsonEditor
              value={body}
              onChange={onBodyChange}
              placeholder='{\n  "key": "value"\n}'
              minHeight="calc(100% - 1rem)"
            />
          </TabsContent>

          <TabsContent value="headers" className="m-0 h-full overflow-auto custom-scrollbar">
            <div className="space-y-2">
              {headers.map((header, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Switch
                    checked={header.enabled}
                    onCheckedChange={(checked) => updateHeader(index, 'enabled', checked)}
                  />
                  <Input
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                    placeholder="Header name"
                    className="flex-1 h-9 bg-secondary border-border font-mono text-sm"
                  />
                  <Input
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 h-9 bg-secondary border-border font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeHeader(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addHeader}
                className="gap-1.5 mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Header
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="params" className="m-0 h-full overflow-auto custom-scrollbar">
            <div className="space-y-2">
              {params.map((param, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Switch
                    checked={param.enabled}
                    onCheckedChange={(checked) => updateParam(index, 'enabled', checked)}
                  />
                  <Input
                    value={param.key}
                    onChange={(e) => updateParam(index, 'key', e.target.value)}
                    placeholder="Parameter name"
                    className="flex-1 h-9 bg-secondary border-border font-mono text-sm"
                  />
                  <Input
                    value={param.value}
                    onChange={(e) => updateParam(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 h-9 bg-secondary border-border font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeParam(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addParam}
                className="gap-1.5 mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Parameter
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
