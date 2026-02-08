import { useState } from 'react';
import { Copy, Check, Clock, FileText, Zap, CheckCircle, XCircle, Wallet, ArrowRight, Timer, HardDrive, Code2 } from 'lucide-react';
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

function getStatusIcon(status: number) {
  if (status === 402) return Zap;
  if (status >= 200 && status < 300) return CheckCircle;
  if (status >= 400) return XCircle;
  return Clock;
}

function getStatusMessage(status: number): string {
  if (status === 402) return 'Payment required to access this resource';
  if (status >= 200 && status < 300) return 'Request completed successfully';
  if (status >= 400 && status < 500) return 'Client error - check your request';
  if (status >= 500) return 'Server error - try again later';
  return 'Processing...';
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

  // Loading state - fixed header, scrollable content below; on mobile use min-height so section is visible in scroll
  if (status === 'loading') {
    return (
      <div className="flex flex-col min-h-[280px] lg:h-full lg:min-h-0 overflow-hidden">
        <div className="shrink-0 flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
              <Code2 className="h-4.5 w-4.5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Response</h2>
              <p className="text-xs text-muted-foreground">Awaiting response...</p>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex items-center justify-center">
          <div className="text-center py-4">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-medium text-foreground mb-2">Processing Request</p>
            <p className="text-xs text-muted-foreground">Please wait while we fetch the response...</p>
          </div>
        </div>
      </div>
    );
  }

  // Idle state - on mobile use min-height so Response section is visible when scrolling
  if (status === 'idle' || !response) {
    return (
      <div className="flex flex-col min-h-[280px] lg:h-full lg:min-h-0 overflow-hidden">
        <div className="shrink-0 flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center">
              <Code2 className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Response</h2>
              <p className="text-xs text-muted-foreground">No response yet</p>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar flex items-center justify-center">
          <div className="text-center max-w-xs py-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-4 mx-auto border border-border/50">
              <FileText className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground mb-2">Ready to Send</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Configure your request and click Send to see the API response here
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Use request status as source of truth: after a successful retry we have status 'success'
  // and must show success UI even if response object was briefly stale
  const isPaymentRequired = response.status === 402 && status !== 'success';
  const StatusIcon = getStatusIcon(response.status);
  const isSuccess = response.status >= 200 && response.status < 300;

  return (
    <div className="flex flex-col min-h-[280px] lg:h-full lg:min-h-0 overflow-hidden">
      {/* Header with Status - fixed */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            isPaymentRequired && "bg-warning/20",
            isSuccess && "bg-success/20",
            !isPaymentRequired && !isSuccess && "bg-destructive/20"
          )}>
            <StatusIcon className={cn(
              "h-4.5 w-4.5",
              isPaymentRequired && "text-warning",
              isSuccess && "text-success",
              !isPaymentRequired && !isSuccess && "text-destructive"
            )} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Response</h2>
            <p className="text-xs text-muted-foreground truncate">{getStatusMessage(response.status)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={getStatusVariant(response.status)} className="font-mono text-xs px-3 py-1.5">
            {response.status} {response.statusText}
          </Badge>
        </div>
      </div>

      {/* Response Metrics - fixed */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 sm:gap-4 mb-4 px-3 sm:px-4 py-2.5 rounded-lg bg-secondary/30">
        <div className="flex items-center gap-2 text-xs">
          <Timer className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Time:</span>
          <span className="font-mono font-medium text-foreground">{response.time}ms</span>
        </div>
        <div className="w-px h-4 bg-border hidden sm:block" />
        <div className="flex items-center gap-2 text-xs">
          <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Size:</span>
          <span className="font-mono font-medium text-foreground">{formatBytes(response.size)}</span>
        </div>
      </div>

      {/* Payment Required Card - fixed */}
      {isPaymentRequired && paymentDetails && (
        <div className="shrink-0 mb-4 rounded-xl bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border border-warning/30 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-3 sm:px-4 py-3 bg-warning/10 border-b border-warning/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-warning/30 to-warning/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">x402 Payment Required</h3>
              <p className="text-xs text-muted-foreground">This endpoint requires payment to access</p>
            </div>
          </div>
          
          {/* Payment Details */}
          <div className="p-3 sm:p-4 space-y-3">
            {/* Amount - Prominent */}
            <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between gap-2 p-3 rounded-lg bg-background/50 border border-border/50">
              <span className="text-sm text-muted-foreground">Amount</span>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-xl sm:text-2xl font-bold gradient-text break-all">{paymentDetails.amount}</span>
                <span className="text-sm font-semibold text-foreground">{paymentDetails.token}</span>
              </div>
            </div>
            
            {/* Network & Memo */}
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-background/30">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Network</span>
                <p className="text-sm font-medium text-foreground mt-1">{paymentDetails.network}</p>
              </div>
              {paymentDetails.memo && (
                <div className="p-3 rounded-lg bg-background/30">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Memo</span>
                  <p className="text-sm font-mono text-foreground mt-1">{paymentDetails.memo}</p>
                </div>
              )}
            </div>
            
            {/* Recipient */}
            <div className="p-3 rounded-lg bg-background/30">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Recipient Address</span>
              <p className="text-xs font-mono text-foreground mt-1.5 break-all leading-relaxed">{paymentDetails.recipient}</p>
            </div>
            
            {/* CTA Button */}
            <Button 
              variant="warning" 
              className="w-full h-11 gap-2 text-sm font-semibold"
              onClick={onPayAndRetry}
            >
              <Wallet className="h-4 w-4" />
              Pay & Unlock Access
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Tabs - Body/Headers; ensure body viewer has good height for UX */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-[280px] lg:min-h-[360px] overflow-hidden">
        {/* Tab Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 mb-3">
          <TabsList className="bg-secondary/30 w-fit p-1 gap-1 shrink-0">
            <TabsTrigger value="body" className="data-[state=active]:bg-primary/20 gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Body
            </TabsTrigger>
            <TabsTrigger value="headers" className="data-[state=active]:bg-primary/20 gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm">
              <span className="hidden sm:inline">Headers</span>
              <span className="sm:hidden">Hdrs</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs shrink-0">
                {Object.keys(response.headers).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex rounded-lg overflow-hidden border border-border">
              <button
                onClick={() => setViewMode('pretty')}
                className={cn(
                  "px-2 sm:px-3 py-2 text-xs font-medium transition-colors h-9",
                  viewMode === 'pretty' ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                )}
              >
                Pretty
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={cn(
                  "px-2 sm:px-3 py-2 text-xs font-medium transition-colors h-9",
                  viewMode === 'raw' ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                )}
              >
                Raw
              </button>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={handleCopy} className="h-9 w-9 shrink-0">
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Tab Content Container - min height so JSON body viewer is comfortably tall */}
        <div className="flex-1 min-h-[280px] lg:min-h-[320px] overflow-hidden relative">
          <TabsContent 
            value="body" 
            className="m-0 absolute inset-0 flex flex-col overflow-hidden"
          >
            <JsonEditor
              value={formatBody(response.body)}
              onChange={() => {}}
              readOnly
              minHeight="100%"
            />
          </TabsContent>

          <TabsContent 
            value="headers" 
            className="m-0 absolute inset-0 overflow-auto custom-scrollbar"
          >
            <div className="space-y-2 p-3 bg-secondary/30 rounded-lg border border-border/50">
              {Object.entries(response.headers || {}).length > 0 ? (
                Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:gap-3 gap-1 text-xs sm:text-sm font-mono py-2 px-3 rounded hover:bg-secondary/50 transition-colors">
                    <span className="text-accent shrink-0 font-semibold">{key}:</span>
                    <span className="text-foreground break-all">{value}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No headers available
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
