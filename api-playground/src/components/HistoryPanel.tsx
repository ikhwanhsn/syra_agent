import { useState, useRef, useEffect } from 'react';
import { Trash2, Clock, ChevronLeft, ChevronRight, History, Zap, CheckCircle, XCircle, Loader2, Filter, Plus, Copy, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  isDesktopSidebarOpen?: boolean;
  onToggleDesktopSidebar?: () => void;
  sidebarWidth?: number;
  onSidebarWidthChange?: (width: number) => void;
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
  onClose,
  isDesktopSidebarOpen = true,
  onToggleDesktopSidebar,
  sidebarWidth = 448,
  onSidebarWidthChange
}: HistoryPanelProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Detect desktop viewport
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);
  
  // Handle resize
  useEffect(() => {
    if (!isResizing || !onSidebarWidthChange) {
      document.body.style.cursor = '';
      return;
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      // Constrain width between 300px and 600px
      const constrainedWidth = Math.min(Math.max(300, newWidth), 600);
      onSidebarWidthChange(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onSidebarWidthChange]);

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
      
      {/* Desktop toggle button - only visible when sidebar is closed */}
      {!isDesktopSidebarOpen && onToggleDesktopSidebar && (
        <button
          onClick={onToggleDesktopSidebar}
          className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 items-center justify-center w-8 h-16 bg-sidebar border-r border-sidebar-border rounded-r-lg hover:bg-sidebar-accent transition-colors shadow-lg"
          title="Show History"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto h-full",
          "w-[min(384px,90vw)] sm:w-96 bg-sidebar border-r border-sidebar-border",
          "flex flex-col overflow-hidden transition-all duration-300 ease-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          !isDesktopSidebarOpen && "lg:-translate-x-full lg:absolute"
        )}
        style={{
          ...(isDesktop && {
            width: isDesktopSidebarOpen ? `${sidebarWidth}px` : '0px',
          })
        }}
      >
        {/* Resize handle - only on desktop when sidebar is open */}
        {isDesktopSidebarOpen && onSidebarWidthChange && (
          <div
            ref={resizeRef}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
            className={cn(
              "hidden lg:flex absolute top-0 right-0 w-1 h-full cursor-col-resize z-50",
              "hover:bg-primary/30 transition-colors",
              "group/resize"
            )}
          >
            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-6 h-12 rounded-r-md bg-background/80 backdrop-blur-sm border border-border/60 opacity-0 group-hover/resize:opacity-100 transition-opacity flex items-center justify-center">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Header - fixed, does not scroll */}
        <div className="shrink-0 p-3 sm:p-4 border-b border-sidebar-border">
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
              {/* Desktop close button - on the right with different color */}
              {isDesktopSidebarOpen && onToggleDesktopSidebar && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onToggleDesktopSidebar}
                  className="hidden lg:flex h-9 w-9 text-muted-foreground hover:text-warning bg-warning/10 hover:bg-warning/20 border border-warning/20 hover:border-warning/30"
                  title="Hide History"
                >
                  <ChevronLeft className="h-4 w-4" />
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
                      ? "bg-primary/15 text-primary border border-primary/20" 
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

        {/* History list - scrollable vertically */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
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
            <div className="p-3 pr-2 space-y-2">
              {filteredHistory.map((item) => {
                const { domain, path } = getPathFromUrl(item.request.url);
                const isSelected = selectedId === item.id;
                const StatusIcon = statusIcons[item.status];
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-start gap-2 w-full rounded-xl transition-all duration-200 overflow-hidden",
                      "hover:bg-sidebar-accent group border border-transparent",
                      isSelected && "bg-sidebar-accent border-primary/20 shadow-sm"
                    )}
                  >
                    {/* Content row - grows and truncates so buttons always fit */}
                    <button
                      onClick={() => onSelect(item)}
                      className="flex items-start gap-2 p-3 flex-1 min-w-0 text-left overflow-hidden rounded-lg hover:bg-transparent focus:bg-transparent"
                    >
                      {/* Method & Status indicator */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <Badge 
                          variant={methodVariants[item.request.method]}
                          className="text-xs px-2 py-1 font-semibold"
                        >
                          {item.request.method}
                        </Badge>
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
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
                      {/* Path, domain, meta */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-mono text-xs text-foreground break-words leading-tight truncate sm:truncate">
                          {path || '/'}
                        </p>
                        <p className="text-xs text-muted-foreground break-words mt-1 truncate">
                          {domain}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge 
                            variant={statusVariants[item.status]}
                            className="text-xs px-2 py-0.5 font-mono shrink-0"
                          >
                            {item.response?.status || (item.status === 'loading' ? '...' : '—')}
                          </Badge>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                          </span>
                          {item.response?.time && (
                            <span className="text-xs text-muted-foreground/70 shrink-0">
                              {item.response.time}ms
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Action buttons - in flow so always visible and responsive */}
                    <div className="flex items-center gap-1.5 shrink-0 p-2 sm:p-3 pt-0 sm:pt-3 sm:pl-0 justify-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClone(item);
                        }}
                        className="h-8 w-8 sm:h-8 sm:w-8 text-muted-foreground hover:text-primary bg-background/95 backdrop-blur-md hover:bg-primary/20 border border-border/60 hover:border-primary/30 transition-all shadow-sm hover:shadow-md"
                        title="Clone Request"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(item.id);
                        }}
                        className="h-8 w-8 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive bg-background/95 backdrop-blur-md hover:bg-destructive/20 border border-border/60 hover:border-destructive/40 transition-all shadow-sm hover:shadow-md"
                        title="Remove Request"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
