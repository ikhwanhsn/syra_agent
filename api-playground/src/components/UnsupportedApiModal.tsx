import { X, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnsupportedApiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnsupportedApiModal({ isOpen, onClose }: UnsupportedApiModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/90 backdrop-blur-md z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="w-full max-w-md glass-panel animate-scale-in overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-5 py-4 border-b border-border bg-gradient-to-r from-primary/10 via-accent/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warning/80 to-black/60 flex items-center justify-center border border-border/30">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-base">API Not Supported</h2>
                  <p className="text-xs text-muted-foreground">Limited to Syra API only</p>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose} className="h-9 w-9">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-warning font-medium">This API is not supported right now</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The API Playground is currently limited to Syra API endpoints only. Support for other APIs will be available soon.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Supported APIs</span>
              </div>
              <p className="text-xs text-foreground">
                Please use Syra API endpoints (api.syraa.fun) to test the x402 payment protocol.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-5 pt-0">
            <Button 
              variant="neon" 
              className="w-full h-11 gap-2 text-sm font-semibold" 
              onClick={onClose}
            >
              Got it
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
