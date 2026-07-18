import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Volume2 } from "lucide-react";
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
import { useLlmModels, useLlmSpeech } from "@/hooks/useLlmPlayground";

const FALLBACK_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;

/** Strip params and map common TTS MIME types to browser-playable values. */
function normalizeAudioMime(contentType: string): string {
  const raw = contentType.split(";")[0]?.trim().toLowerCase() || "audio/mpeg";
  if (raw === "audio/mp3" || raw === "audio/x-mpeg" || raw === "application/octet-stream") {
    return "audio/mpeg";
  }
  if (raw === "audio/x-wav" || raw === "audio/wave") {
    return "audio/wav";
  }
  if (raw.startsWith("audio/")) return raw;
  return "audio/mpeg";
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function AudioPanel() {
  const [model, setModel] = useState("");
  const [input, setInput] = useState("");
  const [voice, setVoice] = useState<string>("");
  const [audio, setAudio] = useState<{ base64: string; contentType: string } | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const speech = useLlmSpeech();
  const modelsQ = useLlmModels("speech");

  const onModelChange = useCallback((id: string) => setModel(id), []);

  const voices = useMemo(() => {
    const selected = modelsQ.data?.models.find((m) => m.id === model);
    if (selected?.supported_voices && selected.supported_voices.length > 0) {
      return selected.supported_voices;
    }
    return [...FALLBACK_VOICES];
  }, [modelsQ.data, model]);

  useEffect(() => {
    if (voices.length === 0) return;
    if (!voice || !voices.includes(voice)) {
      setVoice(voices[0]);
    }
  }, [voices, voice]);

  useEffect(() => {
    if (!audio) {
      if (audioUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      audioUrlRef.current = null;
      setAudioUrl(null);
      return;
    }

    const mime = normalizeAudioMime(audio.contentType);
    const bytes = base64ToUint8Array(audio.base64);
    const blob = new Blob([bytes], { type: mime });
    const objectUrl = URL.createObjectURL(blob);

    if (audioUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(audioUrlRef.current);
    }
    audioUrlRef.current = objectUrl;
    setAudioUrl(objectUrl);

    return () => {
      if (audioUrlRef.current === objectUrl) {
        URL.revokeObjectURL(objectUrl);
        audioUrlRef.current = null;
      }
    };
  }, [audio]);

  const onSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      toast.error("Enter text to synthesize");
      return;
    }
    try {
      const result = await speech.mutateAsync({
        input: trimmed,
        model: model || undefined,
        voice: voice || undefined,
        response_format: "mp3",
      });
      setAudio({ base64: result.audioBase64, contentType: result.contentType });
      toast.success("Speech generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Speech synthesis failed");
    }
  };

  const mimeLabel = audio ? normalizeAudioMime(audio.contentType) : "audio";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Volume2 className="h-5 w-5 text-primary" aria-hidden />
          Audio (text-to-speech)
        </CardTitle>
        <CardDescription>
          Synthesize speech from text. Defaults to the cheapest TTS model and a valid voice for that model.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ModelSelector modality="speech" value={model} onChange={onModelChange} />

        <div className="space-y-2">
          <Label htmlFor="llm-tts-input">Text</Label>
          <Textarea
            id="llm-tts-input"
            placeholder="Hello from Syra. This is a text-to-speech test."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>Voice</Label>
          <Select value={voice || undefined} onValueChange={setVoice}>
            <SelectTrigger>
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {voices.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Voices are provider-specific (Kokoro: af_*, Voxtral: en_*, Gemini: Kore/Puck, …).
          </p>
        </div>

        <Button type="button" onClick={() => void onSubmit()} disabled={speech.isPending || !voice}>
          {speech.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Synthesizing…
            </>
          ) : (
            "Generate speech"
          )}
        </Button>

        {audioUrl && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
            <audio key={audioUrl} controls src={audioUrl} className="w-full" />
            <Input
              readOnly
              value={`${mimeLabel} · ${Math.round((audio?.base64.length ?? 0) * 0.75)} bytes (approx)`}
              className="font-mono text-xs"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
