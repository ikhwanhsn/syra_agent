import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useLlmModels } from "@/hooks/useLlmPlayground";
import {
  formatLlmPrice,
  type LlmModality,
} from "@/lib/llmPlaygroundApi";

type ModelSelectorProps = {
  modality: LlmModality;
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
};

export function ModelSelector({ modality, value, onChange, disabled }: ModelSelectorProps) {
  const { data, isLoading, isError, error } = useLlmModels(modality);

  useEffect(() => {
    if (!data?.default_model) return;
    if (!value || !data.models.some((m) => m.id === value)) {
      onChange(data.default_model);
    }
  }, [data, value, onChange]);

  const selected = data?.models.find((m) => m.id === value);
  const priceLabel = selected
    ? formatLlmPrice(modality, selected.pricing)
    : null;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Model</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-2">
        <Label>Model</Label>
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load models"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`llm-model-${modality}`}>Model</Label>
        {priceLabel && priceLabel !== "—" && (
          <Badge variant="secondary" className="font-mono text-xs">
            {priceLabel}
            {selected?.cheapest ? " · cheapest" : ""}
          </Badge>
        )}
      </div>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={`llm-model-${modality}`} className="w-full">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {(data?.models ?? []).map((m) => (
            <SelectItem key={m.id} value={m.id}>
              <span className="flex items-center gap-2">
                <span>{m.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatLlmPrice(modality, m.pricing)}
                </span>
                {m.cheapest && (
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                    Cheapest
                  </Badge>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <p className="truncate font-mono text-xs text-muted-foreground">{selected.id}</p>
      )}
    </div>
  );
}
