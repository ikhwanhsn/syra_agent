import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Film } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ModelSelector } from "@/components/llm/ModelSelector";
import { useLlmSubmitVideo, useLlmVideoStatus } from "@/hooks/useLlmPlayground";
import { fetchLlmVideoContentBlob } from "@/lib/llmPlaygroundApi";
import { useWalletContext } from "@/contexts/WalletContext";

const CONTENT_FETCH_ATTEMPTS = 4;
const CONTENT_FETCH_RETRY_MS = 2000;

function extractVideoUrl(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  if (typeof data.url === "string" && data.url.trim()) return data.url;
  if (typeof data.video_url === "string" && data.video_url.trim()) return data.video_url;
  const unsigned = data.unsigned_urls;
  if (Array.isArray(unsigned) && typeof unsigned[0] === "string" && unsigned[0].trim()) {
    return unsigned[0];
  }
  const nested = data.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const obj = nested as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url;
    if (typeof obj.video_url === "string") return obj.video_url;
  }
  if (Array.isArray(nested) && nested[0] && typeof nested[0] === "object") {
    const first = nested[0] as Record<string, unknown>;
    if (typeof first.url === "string") return first.url;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function VideoPanel() {
  const [model, setModel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(5);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const playUrlRef = useRef<string | null>(null);
  const submit = useLlmSubmitVideo();
  const { address } = useWalletContext();

  const statusQ = useLlmVideoStatus(generationId, Boolean(generationId));
  const statusData = statusQ.data as Record<string, unknown> | undefined;
  const status = String(statusData?.status ?? (generationId ? "pending" : "")).toLowerCase();
  const upstreamUrl = extractVideoUrl(statusData);
  const done =
    status === "completed" ||
    status === "complete" ||
    status === "failed" ||
    status === "error" ||
    Boolean(upstreamUrl);

  const onModelChange = useCallback((id: string) => setModel(id), []);

  const revokePlayUrl = useCallback(() => {
    if (playUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(playUrlRef.current);
    }
    playUrlRef.current = null;
    setPlayUrl(null);
  }, []);

  useEffect(() => {
    return () => {
      if (playUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(playUrlRef.current);
      }
      playUrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!generationId || !address || !done) return;
    if (status === "failed" || status === "error") return;
    if (!upstreamUrl && status !== "completed" && status !== "complete") return;

    let cancelled = false;
    setLoadingContent(true);
    void (async () => {
      let lastError: unknown;
      for (let attempt = 0; attempt < CONTENT_FETCH_ATTEMPTS; attempt += 1) {
        if (cancelled) return;
        try {
          const blob = await fetchLlmVideoContentBlob(address, generationId);
          if (cancelled) return;
          if (blob.size === 0) {
            throw new Error("Video content was empty");
          }
          const objectUrl = URL.createObjectURL(blob);
          if (playUrlRef.current?.startsWith("blob:")) {
            URL.revokeObjectURL(playUrlRef.current);
          }
          playUrlRef.current = objectUrl;
          setPlayUrl(objectUrl);
          setLoadingContent(false);
          return;
        } catch (e) {
          lastError = e;
          if (attempt < CONTENT_FETCH_ATTEMPTS - 1) {
            await sleep(CONTENT_FETCH_RETRY_MS);
          }
        }
      }
      if (!cancelled) {
        setLoadingContent(false);
        toast.error(
          lastError instanceof Error ? lastError.message : "Failed to load video content",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [generationId, address, done, status, upstreamUrl]);

  const onSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast.error("Enter a prompt");
      return;
    }
    try {
      revokePlayUrl();
      const result = await submit.mutateAsync({
        prompt: trimmed,
        model: model || undefined,
        duration,
      });
      const id =
        (typeof result.id === "string" && result.id) ||
        (typeof result.generation_id === "string" && result.generation_id) ||
        null;
      if (!id) {
        toast.message("Video submitted", {
          description: "No generation id returned — check raw response.",
        });
        setGenerationId(null);
        return;
      }
      setGenerationId(id);
      toast.success("Video job submitted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Video generation failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Film className="h-5 w-5 text-primary" aria-hidden />
          Video generation
        </CardTitle>
        <CardDescription>
          Submit an async video job and poll until complete. Defaults to the cheapest video model.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ModelSelector modality="video" value={model} onChange={onModelChange} />

        <div className="space-y-2">
          <Label htmlFor="llm-video-prompt">Prompt</Label>
          <Textarea
            id="llm-video-prompt"
            placeholder="A drone shot flying over misty mountains at sunrise…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="llm-video-duration">Duration (seconds)</Label>
          <Input
            id="llm-video-duration"
            type="number"
            min={1}
            max={30}
            value={duration}
            onChange={(e) =>
              setDuration(Math.max(1, Math.min(30, Number(e.target.value) || 5)))
            }
          />
        </div>

        <Button type="button" onClick={() => void onSubmit()} disabled={submit.isPending}>
          {submit.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            "Generate video"
          )}
        </Button>

        {generationId && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{status || "pending"}</Badge>
              {(!done || loadingContent) && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <span className="font-mono text-xs text-muted-foreground">{generationId}</span>
            </div>
            {playUrl && (
              <video
                key={playUrl}
                controls
                src={playUrl}
                className="w-full rounded-md border border-border"
              />
            )}
            {statusQ.isError && (
              <p className="text-sm text-destructive">
                {statusQ.error instanceof Error ? statusQ.error.message : "Status poll failed"}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
