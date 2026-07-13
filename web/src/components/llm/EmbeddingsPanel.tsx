import { useCallback, useState } from "react";
import { Loader2, Braces } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/llm/ModelSelector";
import { useLlmEmbeddings } from "@/hooks/useLlmPlayground";

export function EmbeddingsPanel() {
  const [model, setModel] = useState("");
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<{
    dims: number;
    sample: number[];
    model?: string;
  } | null>(null);
  const embed = useLlmEmbeddings();

  const onModelChange = useCallback((id: string) => setModel(id), []);

  const onSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      toast.error("Enter text to embed");
      return;
    }
    try {
      const result = await embed.mutateAsync({
        input: trimmed,
        model: model || undefined,
      });
      const vector = result.data?.[0]?.embedding ?? [];
      setPreview({
        dims: vector.length,
        sample: vector.slice(0, 12),
        model: result.model,
      });
      toast.success(`Embedding created (${vector.length} dims)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Embeddings failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Braces className="h-5 w-5 text-primary" aria-hidden />
          Embeddings
        </CardTitle>
        <CardDescription>
          Convert text into vectors. Defaults to the cheapest embedding model.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ModelSelector modality="embeddings" value={model} onChange={onModelChange} />

        <div className="space-y-2">
          <Label htmlFor="llm-embed-input">Input text</Label>
          <Textarea
            id="llm-embed-input"
            placeholder="The quick brown fox jumps over the lazy dog"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
          />
        </div>

        <Button type="button" onClick={() => void onSubmit()} disabled={embed.isPending}>
          {embed.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Embedding…
            </>
          ) : (
            "Create embedding"
          )}
        </Button>

        {preview && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm">
              <span className="text-muted-foreground">Dimensions:</span>{" "}
              <span className="font-mono font-medium">{preview.dims}</span>
            </p>
            {preview.model && (
              <p className="truncate font-mono text-xs text-muted-foreground">{preview.model}</p>
            )}
            <p className="text-xs text-muted-foreground">First 12 values</p>
            <pre className="overflow-x-auto rounded-md bg-background p-3 font-mono text-xs">
              [{preview.sample.map((n) => n.toFixed(6)).join(", ")}
              {preview.dims > 12 ? ", …" : ""}]
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
