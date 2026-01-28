import { useState } from 'react';
import { Trash2, Clock, ChevronLeft, History, Zap, CheckCircle, XCircle, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HistoryItem, HttpMethod } from '@/types/api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface HistoryPanelProps {
  history: HistoryItem[];
  selectedId?: string;
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'payment' | 'success' | 'error';

const methodVariants: Record<HttpMethod, "get" | "post" | "put" | "patch" | "delete"> = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  PATCH: 'patch',
  DELETE: 'delete',
};

const statusVariants = {
  idle: 'status-pending',
  loading: 'status-pending',
  success: 'status-success',
  error: 'status-error',
  payment_required: 'status-payment',
} as const;

const statusIcons = {
  idle: Clock,
  loading: Loader2,
  success: CheckCircle,
  error: XCircle,
  payment_required: Zap,
};

function getPathFromUrl(url: string): { domain: string; path: string } {
  try {
    const parsed = new URL(url);
    return {
      domain: parsed.hostname,
      path: parsed.pathname + parsed.search,
    };
  } catch {
    return { domain: '', path: url };
  }
}

export function HistoryPanel({ 
  history, 
  selectedId, 
  onSelect, 
  onClear, 
  isOpen, 
  onClose 
}: HistoryPanelProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  // Filter history based on selected filter
  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'payment') return item.status === 'payment_required';
    if (filter === 'success') return item.status === 'success';
    if (filter === 'error') return item.status === 'error';
    return true;
  });

  // Count by status
  const counts = {
    all: history.length,
    payment: history.filter(h => h.status === 'payment_required').length,
    success: history.filter(h => h.status === 'success').length,
    error: history.filter(h => h.status === 'error').length,
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto",
          "w-72 lg:w-80 bg-sidebar border-r border-sidebar-border",
          "flex flex-col transition-transform duration-300 ease-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <History className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Request History</h2>
                <p className="text-[10px] text-muted-foreground">{history.length} requests</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  onClick={onClear}
                  className="text-muted-foreground hover:text-destructive h-7 w-7"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="lg:hidden h-7 w-7"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter pills */}
          {history.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1">
              {[
                { id: 'all', label: 'All', icon: Filter },
                { id: 'payment', label: '402', icon: Zap },
                { id: 'success', label: 'OK', icon: CheckCircle },
                { id: 'error', label: 'Error', icon: XCircle },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id as FilterType)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors shrink-0",
                    filter === id 
                      ? "bg-primary/20 text-primary" 
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                  {counts[id as FilterType] > 0 && (
                    <span className={cn(
                      "ml-0.5 px-1 rounded text-[9px]",
                      filter === id ? "bg-primary/30" : "bg-muted"
                    )}>
                      {counts[id as FilterType]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* History list */}
        <ScrollArea className="flex-1 custom-scrollbar">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-4 border border-border/50">
                <Clock className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No requests yet</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                Your API requests will appear here. Try the demo to get started!
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <p className="text-sm text-muted-foreground">No {filter} requests</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredHistory.map((item) => {
                const { domain, path } = getPathFromUrl(item.request.url);
                const isSelected = selectedId === item.id;
                const StatusIcon = statusIcons[item.status];
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all duration-200",
                      "hover:bg-sidebar-accent group border border-transparent",
                      isSelected && "bg-sidebar-accent border-primary/30 shadow-sm"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Method & Status indicator */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <Badge 
                          variant={methodVariants[item.request.method]}
                          className="text-[10px] px-1.5 py-0.5 font-semibold"
                        >
                          {item.request.method}
                        </Badge>
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center",
                          item.status === 'payment_required' && "bg-warning/20",
                          item.status === 'success' && "bg-success/20",
                          item.status === 'error' && "bg-destructive/20",
                          item.status === 'loading' && "bg-muted",
                          item.status === 'idle' && "bg-muted"
                        )}>
                          <StatusIcon className={cn(
                            "h-3 w-3",
                            item.status === 'payment_required' && "text-warning",
                            item.status === 'success' && "text-success",
                            item.status === 'error' && "text-destructive",
                            item.status === 'loading' && "text-muted-foreground animate-spin",
                            item.status === 'idle' && "text-muted-foreground"
                          )} />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-foreground truncate leading-tight">
                          {path || '/'}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {domain}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant={statusVariants[item.status]}
                            className="text-[9px] px-1.5 py-0 font-mono"
                          >
                            {item.response?.status || (item.status === 'loading' ? '...' : '—')}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                          </span>
                          {item.response?.time && (
                            <span className="text-[10px] text-muted-foreground/70">
                              {item.response.time}ms
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </aside>
    </>
  );
}
