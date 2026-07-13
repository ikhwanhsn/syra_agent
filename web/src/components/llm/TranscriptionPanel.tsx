import { useCallback, useState } from "react";
import { Loader2, Mic } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/llm/ModelSelector";
import { useLlmTranscription } from "@/hooks/useLlmPlayground";

function fileToBase64(file: File): Promise<{ data: string; format: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }
      const comma = result.indexOf(",");
      const data = comma >= 0 ? result.slice(comma + 1) : result;
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
      const format =
        ext === "wav" ||
        ext === "mp3" ||
        ext === "flac" ||
        ext === "m4a" ||
        ext === "ogg" ||
        ext === "webm"
          ? ext
          : "mp3";
      resolve({ data, format });
    };
    reader.onerror = () => reject(new Error("Failed to read audio file"));
    reader.readAsDataURL(file);
  });
}

export function TranscriptionPanel() {
  const [model, setModel] = useState("");
  const [language, setLanguage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const transcribe = useLlmTranscription();

  const onModelChange = useCallback((id: string) => setModel(id), []);

  const onSubmit = async () => {
    if (!file) {
      toast.error("Choose an audio file");
      return;
    }
    try {
      const input_audio = await fileToBase64(file);
      const result = await transcribe.mutateAsync({
        model: model || undefined,
        language: language.trim() || undefined,
        input_audio,
      });
      setText(typeof result.text === "string" ? result.text : JSON.stringify(result, null, 2));
      toast.success("Transcription complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transcription failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic className="h-5 w-5 text-primary" aria-hidden />
          Speech transcription
        </CardTitle>
        <CardDescription>
          Upload audio and get text. Defaults to the cheapest transcription model.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ModelSelector modality="transcription" value={model} onChange={onModelChange} />

        <div className="space-y-2">
          <Label htmlFor="llm-stt-file">Audio file</Label>
          <Input
            id="llm-stt-file"
            type="file"
            accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg,.webm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file && (
            <p className="text-xs text-muted-foreground">
              {file.name} · {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="llm-stt-lang">Language (optional ISO-639-1)</Label>
          <Input
            id="llm-stt-lang"
            placeholder="en"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
        </div>

        <Button type="button" onClick={() => void onSubmit()} disabled={transcribe.isPending}>
          {transcribe.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Transcribing…
            </>
          ) : (
            "Transcribe"
          )}
        </Button>

        {text && (
          <div className="space-y-2">
            <Label>Transcript</Label>
            <Textarea value={text} readOnly rows={8} className="font-mono text-sm" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
