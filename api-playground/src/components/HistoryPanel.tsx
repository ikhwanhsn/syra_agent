import { useState } from 'react';
import { Trash2, Clock, ChevronLeft, History, Zap, CheckCircle, XCircle, Loader2, Filter, Plus, Copy } from 'lucide-react';
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
  onRemove: (itemId: string) => void;
  onCreateNew: () => void;
  onClone: (item: HistoryItem) => void;
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
  onRemove,
  onCreateNew,
  onClone,
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <History className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-base">Request History</h2>
                <p className="text-xs text-muted-foreground">{history.length} requests</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={onCreateNew}
                className="text-muted-foreground hover:text-primary h-9 w-9"
                title="Create New Request"
              >
                <Plus className="h-4 w-4" />
              </Button>
              {history.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  onClick={onClear}
                  className="text-muted-foreground hover:text-destructive h-9 w-9"
                  title="Clear All History"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="lg:hidden h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter pills */}
          {history.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
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
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 h-8",
                    filter === id 
                      ? "bg-primary/20 text-primary" 
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {counts[id as FilterType] > 0 && (
                    <span className={cn(
                      "ml-0.5 px-1.5 py-0.5 rounded text-xs",
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-4 border border-border/50">
                <Clock className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground mb-2">No requests yet</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                Your API requests will appear here. Try the demo to get started!
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <p className="text-sm text-muted-foreground">No {filter} requests</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {filteredHistory.map((item) => {
                const { domain, path } = getPathFromUrl(item.request.url);
                const isSelected = selectedId === item.id;
                const StatusIcon = statusIcons[item.status];
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "relative w-full p-3 rounded-xl transition-all duration-200",
                      "hover:bg-sidebar-accent group border border-transparent",
                      isSelected && "bg-sidebar-accent border-primary/30 shadow-sm"
                    )}
                  >
                    <button
                      onClick={() => onSelect(item)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        {/* Method & Status indicator */}
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <Badge 
                            variant={methodVariants[item.request.method]}
                            className="text-xs px-2 py-1 font-semibold"
                          >
                            {item.request.method}
                          </Badge>
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center",
                            item.status === 'payment_required' && "bg-warning/20",
                            item.status === 'success' && "bg-success/20",
                            item.status === 'error' && "bg-destructive/20",
                            item.status === 'loading' && "bg-muted",
                            item.status === 'idle' && "bg-muted"
                          )}>
                            <StatusIcon className={cn(
                              "h-3.5 w-3.5",
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
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {domain}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant={statusVariants[item.status]}
                              className="text-xs px-2 py-0.5 font-mono"
                            >
                              {item.response?.status || (item.status === 'loading' ? '...' : '—')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                            </span>
                            {item.response?.time && (
                              <span className="text-xs text-muted-foreground/70">
                                {item.response.time}ms
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                    
                    {/* Action buttons - visible on hover */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClone(item);
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        title="Clone Request"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(item.id);
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Remove Request"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </aside>
    </>
  );
}
