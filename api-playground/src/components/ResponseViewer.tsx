import { useState } from 'react';
import { Copy, Check, Clock, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JsonEditor } from '@/components/JsonEditor';
import { ApiResponse, RequestStatus, PaymentDetails } from '@/types/api';
import { cn } from '@/lib/utils';

interface ResponseViewerProps {
  response?: ApiResponse;
  status: RequestStatus;
  paymentDetails?: PaymentDetails;
  onPayAndRetry?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusVariant(status: number): "status-success" | "status-error" | "status-payment" | "status-pending" {
  if (status === 402) return 'status-payment';
  if (status >= 200 && status < 300) return 'status-success';
  if (status >= 400) return 'status-error';
  return 'status-pending';
}

function getStatusColor(status: number): string {
  if (status === 402) return 'text-warning';
  if (status >= 200 && status < 300) return 'text-success';
  if (status >= 400) return 'text-destructive';
  return 'text-muted-foreground';
}

export function ResponseViewer({ response, status, paymentDetails, onPayAndRetry }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState('body');
  const [viewMode, setViewMode] = useState<'pretty' | 'raw'>('pretty');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (response?.body) {
      await navigator.clipboard.writeText(response.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatBody = (body: string): string => {
    if (viewMode === 'raw') return body;
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Response
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3 mx-auto animate-pulse">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-32 bg-muted rounded animate-shimmer mx-auto" />
              <div className="h-2 w-24 bg-muted rounded animate-shimmer mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Idle state
  if (status === 'idle' || !response) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Response
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 mx-auto">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Send a request to see the response</p>
          </div>
        </div>
      </div>
    );
  }

  const isPaymentRequired = response.status === 402;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Response
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(response.status)} className="font-mono">
            {response.status} {response.statusText}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {response.time}ms
          </span>
          <span className="text-xs text-muted-foreground">
            {formatBytes(response.size)}
          </span>
        </div>
      </div>

      {/* Payment Required Alert */}
      {isPaymentRequired && paymentDetails && (
        <div className="mb-4 p-4 rounded-lg bg-warning/10 border border-warning/30 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-warning mb-2">Payment Required</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {paymentDetails.amount} {paymentDetails.token}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="font-mono text-foreground">{paymentDetails.network}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Recipient:</span>
                  <span className="font-mono text-xs text-foreground break-all ml-4">
                    {paymentDetails.recipient}
                  </span>
                </div>
                {paymentDetails.memo && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Memo:</span>
                    <span className="font-mono text-foreground">{paymentDetails.memo}</span>
                  </div>
                )}
              </div>
              <Button 
                variant="warning" 
                size="sm" 
                className="mt-4 w-full"
                onClick={onPayAndRetry}
              >
                Pay & Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <TabsList className="bg-secondary/50 w-fit">
            <TabsTrigger value="body" className="data-[state=active]:bg-primary/20">
              Body
            </TabsTrigger>
            <TabsTrigger value="headers" className="data-[state=active]:bg-primary/20">
              Headers
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="flex rounded-md overflow-hidden border border-border">
              <button
                onClick={() => setViewMode('pretty')}
                className={cn(
                  "px-2 py-1 text-xs transition-colors",
                  viewMode === 'pretty' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                Pretty
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={cn(
                  "px-2 py-1 text-xs transition-colors",
                  viewMode === 'raw' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                Raw
              </button>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 mt-3 overflow-hidden">
          <TabsContent value="body" className="m-0 h-full">
            <JsonEditor
              value={formatBody(response.body)}
              onChange={() => {}}
              readOnly
              minHeight="calc(100% - 1rem)"
            />
          </TabsContent>

          <TabsContent value="headers" className="m-0 h-full overflow-auto custom-scrollbar">
            <div className="space-y-1 p-3 bg-secondary/50 rounded-lg">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2 text-sm font-mono">
                  <span className="text-accent shrink-0">{key}:</span>
                  <span className="text-foreground break-all">{value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
