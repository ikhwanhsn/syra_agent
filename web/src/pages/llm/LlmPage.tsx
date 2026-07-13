import { Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDashboardGate } from "@/components/dashboard/AdminDashboardGate";
import { ImagePanel } from "@/components/llm/ImagePanel";
import { EmbeddingsPanel } from "@/components/llm/EmbeddingsPanel";
import { AudioPanel } from "@/components/llm/AudioPanel";
import { VideoPanel } from "@/components/llm/VideoPanel";
import { RerankPanel } from "@/components/llm/RerankPanel";
import { TranscriptionPanel } from "@/components/llm/TranscriptionPanel";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

export default function LlmPage() {
  return (
    <AdminDashboardGate featureLabel="LLM">
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
          "pb-12",
        )}
      >
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Sparkles className="h-6 w-6 text-primary" aria-hidden />
            LLM Playground
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Internal OpenRouter testing — cheapest model selected by default. Admin access only.
          </p>
        </div>

        <Tabs defaultValue="image">
          <TabsList className="flex h-auto flex-wrap gap-1">
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="embeddings">Embeddings</TabsTrigger>
            <TabsTrigger value="speech">Audio</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="rerank">Rerank</TabsTrigger>
            <TabsTrigger value="transcription">Speech Transcription</TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="mt-6">
            <ImagePanel />
          </TabsContent>
          <TabsContent value="embeddings" className="mt-6">
            <EmbeddingsPanel />
          </TabsContent>
          <TabsContent value="speech" className="mt-6">
            <AudioPanel />
          </TabsContent>
          <TabsContent value="video" className="mt-6">
            <VideoPanel />
          </TabsContent>
          <TabsContent value="rerank" className="mt-6">
            <RerankPanel />
          </TabsContent>
          <TabsContent value="transcription" className="mt-6">
            <TranscriptionPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardGate>
  );
}
