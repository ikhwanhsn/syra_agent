import { useCallback, useState } from "react";
import { Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModelSelector } from "@/components/llm/ModelSelector";
import { useLlmGenerateImage } from "@/hooks/useLlmPlayground";

export function ImagePanel() {
  const [model, setModel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [n, setN] = useState(1);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [images, setImages] = useState<Array<{ url?: string; b64_json?: string }>>([]);
  const generate = useLlmGenerateImage();

  const onModelChange = useCallback((id: string) => setModel(id), []);

  const onSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast.error("Enter a prompt");
      return;
    }
    try {
      const result = await generate.mutateAsync({
        prompt: trimmed,
        model: model || undefined,
        n,
        aspect_ratio: aspectRatio,
      });
      setImages(result.data ?? []);
      toast.success(`Generated ${result.data?.length ?? 0} image(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ImageIcon className="h-5 w-5 text-primary" aria-hidden />
          Image generation
        </CardTitle>
        <CardDescription>
          Create images from a text prompt via OpenRouter. Defaults to the cheapest model.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ModelSelector modality="image" value={model} onChange={onModelChange} />

        <div className="space-y-2">
          <Label htmlFor="llm-image-prompt">Prompt</Label>
          <Textarea
            id="llm-image-prompt"
            placeholder="A cyberpunk city skyline at dusk, neon reflections on wet streets…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="llm-image-n">Count (n)</Label>
            <Input
              id="llm-image-n"
              type="number"
              min={1}
              max={4}
              value={n}
              onChange={(e) => setN(Math.max(1, Math.min(4, Number(e.target.value) || 1)))}
            />
          </div>
          <div className="space-y-2">
            <Label>Aspect ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["1:1", "16:9", "9:16", "4:3", "3:4"].map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="button" onClick={() => void onSubmit()} disabled={generate.isPending}>
          {generate.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate image"
          )}
        </Button>

        {images.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {images.map((img, i) => {
              const src = img.url
                ? img.url
                : img.b64_json
                  ? `data:image/png;base64,${img.b64_json}`
                  : null;
              if (!src) return null;
              return (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-lg border border-border"
                >
                  <img src={src} alt={`Generated ${i + 1}`} className="h-auto w-full object-cover" />
                </a>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
