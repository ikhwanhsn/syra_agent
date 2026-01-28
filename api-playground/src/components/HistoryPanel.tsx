import { Trash2, Clock, ChevronLeft, History } from 'lucide-react';
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
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">History</h2>
            <Badge variant="secondary" className="text-xs">
              {history.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={onClear}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* History list */}
        <ScrollArea className="flex-1 custom-scrollbar">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No requests yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Send a request to see it here
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {history.map((item) => {
                const { domain, path } = getPathFromUrl(item.request.url);
                const isSelected = selectedId === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all duration-200",
                      "hover:bg-sidebar-accent group",
                      isSelected && "bg-sidebar-accent border border-primary/30"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Badge 
                        variant={methodVariants[item.request.method]}
                        className="text-[10px] px-1.5 py-0 shrink-0 mt-0.5"
                      >
                        {item.request.method}
                      </Badge>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-foreground truncate">
                          {path || '/'}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {domain}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant={statusVariants[item.status]}
                            className="text-[9px] px-1.5 py-0"
                          >
                            {item.response?.status || (item.status === 'loading' ? '...' : '—')}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                          </span>
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
