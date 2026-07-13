import { useMutation, useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/contexts/WalletContext";
import { isAdminWallet } from "@/constants/adminWallet";
import {
  createLlmEmbeddings,
  fetchLlmModels,
  fetchLlmVideoStatus,
  generateLlmImage,
  rerankLlmDocuments,
  submitLlmVideo,
  synthesizeLlmSpeech,
  transcribeLlmAudio,
  type LlmModality,
} from "@/lib/llmPlaygroundApi";

const MODELS_STALE_MS = 5 * 60_000;

function useAdminWallet() {
  const { connected, address } = useWalletContext();
  const allowed = isAdminWallet(connected, address);
  const adminWallet = address ?? "";
  return { allowed, adminWallet };
}

export function useLlmModels(modality: LlmModality) {
  const { allowed, adminWallet } = useAdminWallet();
  return useQuery({
    queryKey: ["llm-playground", "models", modality, adminWallet],
    queryFn: () => fetchLlmModels(adminWallet, modality),
    enabled: allowed && Boolean(adminWallet),
    staleTime: MODELS_STALE_MS,
  });
}

export function useLlmGenerateImage() {
  const { adminWallet } = useAdminWallet();
  return useMutation({
    mutationFn: (input: {
      prompt: string;
      model?: string;
      n?: number;
      aspect_ratio?: string;
      size?: string;
      quality?: string;
    }) => generateLlmImage(adminWallet, input),
  });
}

export function useLlmSubmitVideo() {
  const { adminWallet } = useAdminWallet();
  return useMutation({
    mutationFn: (input: {
      prompt: string;
      model?: string;
      duration?: number;
      aspect_ratio?: string;
      resolution?: string;
    }) => submitLlmVideo(adminWallet, input),
  });
}

export function useLlmVideoStatus(generationId: string | null, enabled: boolean) {
  const { allowed, adminWallet } = useAdminWallet();
  return useQuery({
    queryKey: ["llm-playground", "video-status", generationId, adminWallet],
    queryFn: () => fetchLlmVideoStatus(adminWallet, generationId!),
    enabled: allowed && Boolean(adminWallet) && Boolean(generationId) && enabled,
    refetchInterval: (query) => {
      const status = String(query.state.data?.status ?? "").toLowerCase();
      if (status === "completed" || status === "complete" || status === "failed" || status === "error") {
        return false;
      }
      return 3000;
    },
  });
}

export function useLlmEmbeddings() {
  const { adminWallet } = useAdminWallet();
  return useMutation({
    mutationFn: (input: { input: string | string[]; model?: string; dimensions?: number }) =>
      createLlmEmbeddings(adminWallet, input),
  });
}

export function useLlmRerank() {
  const { adminWallet } = useAdminWallet();
  return useMutation({
    mutationFn: (input: {
      query: string;
      documents: string[];
      model?: string;
      top_n?: number;
    }) => rerankLlmDocuments(adminWallet, input),
  });
}

export function useLlmSpeech() {
  const { adminWallet } = useAdminWallet();
  return useMutation({
    mutationFn: (input: {
      input: string;
      model?: string;
      voice?: string;
      response_format?: string;
      speed?: number;
    }) => synthesizeLlmSpeech(adminWallet, input),
  });
}

export function useLlmTranscription() {
  const { adminWallet } = useAdminWallet();
  return useMutation({
    mutationFn: (input: {
      model?: string;
      language?: string;
      input_audio: { data: string; format: string };
    }) => transcribeLlmAudio(adminWallet, input),
  });
}
