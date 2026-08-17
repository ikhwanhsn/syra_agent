import { useEffect, useMemo } from "react";
import { Dropdown } from "@/components/interior/dropdown";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { BoneFallback } from "@/components/ui/bone";
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

  const items = useMemo(
    () =>
      (data?.models ?? []).map((m) => ({
        value: m.id,
        label: m.cheapest ? `${m.name} (cheapest)` : m.name,
        hint: formatLlmPrice(modality, m.pricing),
      })),
    [data?.models, modality],
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Model</Label>
        <BoneFallback name="llm-model-selector" />
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
        <Label>Model</Label>
        {priceLabel && priceLabel !== "-" && (
          <Badge variant="secondary" className="font-mono text-xs">
            {priceLabel}
            {selected?.cheapest ? " · cheapest" : ""}
          </Badge>
        )}
      </div>
      <Dropdown
        items={items}
        value={value || undefined}
        onChange={onChange}
        label={selected?.name ?? "Model"}
        placeholder="Select a model"
        disabled={disabled}
        className="w-full [&_button]:h-10 [&_button]:w-full"
      />
      {selected && (
        <p className="truncate font-mono text-xs text-muted-foreground">{selected.id}</p>
      )}
    </div>
  );
}
