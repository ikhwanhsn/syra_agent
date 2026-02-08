import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RequestParam } from '@/types/api';
import type { ExampleFlowPreset } from '@/hooks/useApiPlayground';

interface QueryParamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  flow: ExampleFlowPreset | null;
  /** Params to show (from getParamsForExampleFlow). Used when preset has no params but API supports them. */
  initialParams: RequestParam[];
  onRun: (params: RequestParam[]) => void;
}

export function QueryParamsModal({ isOpen, onClose, flow, initialParams, onRun }: QueryParamsModalProps) {
  const [paramValues, setParamValues] = useState<RequestParam[]>([]);

  useEffect(() => {
    if (flow && isOpen) {
      const source = initialParams.length > 0 ? initialParams : flow.params;
      setParamValues(source.map((p) => ({ ...p })));
    } else {
      setParamValues([]);
    }
  }, [flow, isOpen, initialParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flow || paramValues.length === 0) return;
    const enabledParams: RequestParam[] = paramValues.map((p) => ({
      ...p,
      enabled: true,
    }));
    onRun(enabledParams);
    onClose();
  };

  const handleChange = (index: number, value: string) => {
    setParamValues((prev) =>
      prev.map((p, i) => (i === index ? { ...p, value } : p))
    );
  };

  if (!flow) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{flow.label}</DialogTitle>
          <DialogDescription>
            Fill in the query parameters for this endpoint, then run the request.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {paramValues.map((param, index) => (
              <div key={param.key} className="space-y-2">
                <Label htmlFor={`param-${param.key}`} className="capitalize">
                  {param.key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Input
                  id={`param-${param.key}`}
                  value={param.value}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder={param.description || `Enter ${param.key}`}
                  className="font-mono text-sm"
                />
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="gap-1.5">
              <Play className="h-3.5 w-3.5" />
              Run
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
