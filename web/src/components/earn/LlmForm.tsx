import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  EarnDialogError,
  EarnDialogField,
  EarnDialogSection,
  EarnDialogShell,
  earnFieldControlClass,
  earnSelectTriggerClass,
  earnTextareaClass,
} from "@/components/earn/EarnDialogShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createLlmProvider,
  testLlmConnection,
  type CreateLlmProviderPayload,
  type LlmAuthConfig,
  type LlmPricingMode,
  type LlmProtocol,
  type LlmProviderRecord,
} from "@/lib/earnLlmApi";
import { cn } from "@/lib/utils";

type LlmFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (provider: LlmProviderRecord) => void;
};

const PROTOCOL_DEFAULTS: Record<
  LlmProtocol,
  { models: string; basePlaceholder: string; baseRequired: boolean; keyPlaceholder: string }
> = {
  openai: {
    models: "deepseek-chat",
    basePlaceholder: "https://api.deepseek.com/v1",
    baseRequired: true,
    keyPlaceholder: "sk-…",
  },
  anthropic: {
    models: "claude-3-5-sonnet-latest",
    basePlaceholder: "https://api.anthropic.com (default)",
    baseRequired: false,
    keyPlaceholder: "sk-ant-…",
  },
  google: {
    models: "gemini-1.5-pro",
    basePlaceholder: "https://generativelanguage.googleapis.com (default)",
    baseRequired: false,
    keyPlaceholder: "AIza…",
  },
  openai_custom: {
    models: "my-model",
    basePlaceholder: "https://gateway.example.com/v1",
    baseRequired: true,
    keyPlaceholder: "api-key",
  },
};

export function LlmForm({ open, onOpenChange, onCreated }: LlmFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [protocol, setProtocol] = useState<LlmProtocol>("openai");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelIds, setModelIds] = useState(PROTOCOL_DEFAULTS.openai.models);
  const [apiVersion, setApiVersion] = useState("2023-06-01");
  const [chatPath, setChatPath] = useState("/chat/completions");
  const [authHeader, setAuthHeader] = useState("Authorization");
  const [authScheme, setAuthScheme] = useState("bearer");
  const [pricingMode, setPricingMode] = useState<LlmPricingMode>("per_million_tokens");
  const [inputUsdPer1M, setInputUsdPer1M] = useState("0.15");
  const [outputUsdPer1M, setOutputUsdPer1M] = useState("0.60");
  const [flatUsdPerCall, setFlatUsdPerCall] = useState("0.01");
  const [contextWindow, setContextWindow] = useState("8192");
  const [tools, setTools] = useState(true);
  const [activateAfterCreate, setActivateAfterCreate] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testNote, setTestNote] = useState<string | null>(null);

  const protocolMeta = PROTOCOL_DEFAULTS[protocol];

  const applyProtocol = (next: LlmProtocol) => {
    setProtocol(next);
    setModelIds(PROTOCOL_DEFAULTS[next].models);
    if (next === "anthropic") setApiVersion("2023-06-01");
    if (next === "openai_custom") {
      setChatPath("/chat/completions");
      setAuthHeader("Authorization");
      setAuthScheme("bearer");
    }
    setTestNote(null);
    setError(null);
  };

  const reset = () => {
    setTitle("");
    setDescription("");
    setProtocol("openai");
    setBaseUrl("");
    setApiKey("");
    setModelIds(PROTOCOL_DEFAULTS.openai.models);
    setApiVersion("2023-06-01");
    setChatPath("/chat/completions");
    setAuthHeader("Authorization");
    setAuthScheme("bearer");
    setPricingMode("per_million_tokens");
    setInputUsdPer1M("0.15");
    setOutputUsdPer1M("0.60");
    setFlatUsdPerCall("0.01");
    setContextWindow("8192");
    setTools(true);
    setActivateAfterCreate(true);
    setError(null);
    setTestNote(null);
  };

  const buildAuthConfig = (): LlmAuthConfig | undefined => {
    if (protocol === "anthropic") {
      return { apiVersion: apiVersion.trim() || "2023-06-01" };
    }
    if (protocol === "openai_custom") {
      return {
        chatPath: chatPath.trim() || "/chat/completions",
        authHeader: authHeader.trim() || "Authorization",
        authScheme: authScheme.trim() || "bearer",
      };
    }
    return undefined;
  };

  const buildPayload = (): CreateLlmProviderPayload => {
    const models = modelIds
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      title: title.trim(),
      description: description.trim(),
      protocol,
      baseUrl: baseUrl.trim() || undefined,
      authConfig: buildAuthConfig(),
      apiKey: apiKey.trim(),
      models,
      pricing:
        pricingMode === "flat"
          ? { mode: "flat", flatUsdPerCall: Number(flatUsdPerCall) }
          : {
              mode: "per_million_tokens",
              inputUsdPer1M: Number(inputUsdPer1M),
              outputUsdPer1M: Number(outputUsdPer1M),
            },
      capabilities: {
        contextWindow: Number(contextWindow) || 8192,
        tools,
        streaming: false,
        modalities: ["text"],
      },
      activate: activateAfterCreate,
    };
  };

  const testM = useMutation({
    mutationFn: async () => {
      const models = modelIds
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      return testLlmConnection({
        baseUrl: baseUrl.trim() || undefined,
        apiKey: apiKey.trim(),
        modelId: models[0],
        protocol,
        authConfig: buildAuthConfig(),
      });
    },
    onSuccess: (result) => {
      if (result.ok) {
        setTestNote(`Connected (${result.latencyMs ?? "-"} ms)`);
        setError(null);
      } else {
        setTestNote(null);
        setError(result.error || "Connection test failed");
      }
    },
    onError: (e: Error) => {
      setTestNote(null);
      setError(e.message);
    },
  });

  const mutation = useMutation({
    mutationFn: async () => createLlmProvider(buildPayload()),
    onSuccess: (provider) => {
      onCreated(provider);
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => {
      setError(e.message);
    },
  });

  const canSubmit =
    title.trim() &&
    apiKey.trim() &&
    modelIds.trim() &&
    (protocolMeta.baseRequired ? Boolean(baseUrl.trim()) : true) &&
    (pricingMode === "flat"
      ? Number(flatUsdPerCall) > 0
      : Number(inputUsdPer1M) > 0 || Number(outputUsdPer1M) > 0);

  return (
    <EarnDialogShell
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      icon={Sparkles}
      title="List an LLM"
      description="Sell access to any LLM — OpenAI-compatible, Claude, Gemini, or a custom gateway. Agents pay via x402; Syra smart-routes traffic."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-border/60"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-10 rounded-xl"
            onClick={() => testM.mutate()}
            disabled={
              testM.isPending ||
              !apiKey.trim() ||
              (protocolMeta.baseRequired && !baseUrl.trim())
            }
          >
            {testM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Test connection
          </Button>
          <Button
            type="button"
            variant="neon"
            className="h-10 rounded-xl"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !canSubmit}
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            List LLM
          </Button>
        </>
      }
    >
      <EarnDialogSection title="Listing" description="How agents discover your model.">
        <EarnDialogField label="Title" htmlFor="llm-title">
          <Input
            id="llm-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Claude Sonnet reseller"
            className={earnFieldControlClass}
          />
        </EarnDialogField>

        <EarnDialogField label="Description" htmlFor="llm-description" optional>
          <Textarea
            id="llm-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What makes this model useful for agents?"
            rows={2}
            className={cn(earnTextareaClass, "min-h-[4.5rem]")}
          />
        </EarnDialogField>

        <EarnDialogField
          label="Model ids"
          htmlFor="llm-models"
          hint="Comma or newline separated. Must match upstream model names."
        >
          <Textarea
            id="llm-models"
            value={modelIds}
            onChange={(e) => setModelIds(e.target.value)}
            placeholder={protocolMeta.models}
            rows={2}
            className={cn(earnTextareaClass, "min-h-[4rem] font-mono text-[13px]")}
          />
        </EarnDialogField>
      </EarnDialogSection>

      <EarnDialogSection
        title="Provider"
        description="Pick the wire protocol. Callers still use one OpenAI-shaped POST /llm/route."
      >
        <EarnDialogField label="Provider type">
          <Select value={protocol} onValueChange={(v) => applyProtocol(v as LlmProtocol)}>
            <SelectTrigger className={earnSelectTriggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">
                OpenAI-compatible (DeepSeek, Together, Groq, vLLM…)
              </SelectItem>
              <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
              <SelectItem value="google">Google (Gemini)</SelectItem>
              <SelectItem value="openai_custom">Custom OpenAI-compatible</SelectItem>
            </SelectContent>
          </Select>
        </EarnDialogField>

        <EarnDialogField
          label="Base URL"
          htmlFor="llm-base"
          optional={!protocolMeta.baseRequired}
          hint={
            protocolMeta.baseRequired
              ? "HTTPS base URL for the upstream API."
              : "Leave blank to use the official default endpoint."
          }
        >
          <Input
            id="llm-base"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={protocolMeta.basePlaceholder}
            className={cn(earnFieldControlClass, "font-mono text-[13px]")}
          />
        </EarnDialogField>

        <EarnDialogField label="API key" htmlFor="llm-key" hint="Encrypted at rest. Never shown again.">
          <Input
            id="llm-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={protocolMeta.keyPlaceholder}
            className={cn(earnFieldControlClass, "font-mono text-[13px]")}
            autoComplete="off"
          />
        </EarnDialogField>

        {protocol === "anthropic" ? (
          <EarnDialogField
            label="Anthropic version"
            htmlFor="llm-api-version"
            hint="Sent as anthropic-version header."
          >
            <Input
              id="llm-api-version"
              value={apiVersion}
              onChange={(e) => setApiVersion(e.target.value)}
              placeholder="2023-06-01"
              className={cn(earnFieldControlClass, "font-mono text-[13px]")}
            />
          </EarnDialogField>
        ) : null}

        {protocol === "openai_custom" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <EarnDialogField label="Chat path" htmlFor="llm-chat-path">
              <Input
                id="llm-chat-path"
                value={chatPath}
                onChange={(e) => setChatPath(e.target.value)}
                placeholder="/chat/completions"
                className={cn(earnFieldControlClass, "font-mono text-[13px]")}
              />
            </EarnDialogField>
            <EarnDialogField label="Auth header" htmlFor="llm-auth-header">
              <Input
                id="llm-auth-header"
                value={authHeader}
                onChange={(e) => setAuthHeader(e.target.value)}
                placeholder="Authorization"
                className={cn(earnFieldControlClass, "font-mono text-[13px]")}
              />
            </EarnDialogField>
            <EarnDialogField label="Auth scheme">
              <Select value={authScheme} onValueChange={setAuthScheme}>
                <SelectTrigger className={earnSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bearer">Bearer</SelectItem>
                  <SelectItem value="raw">Raw (header = key)</SelectItem>
                </SelectContent>
              </Select>
            </EarnDialogField>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <EarnDialogField label="Context window" htmlFor="llm-ctx">
            <Input
              id="llm-ctx"
              type="number"
              min="1024"
              step="1024"
              value={contextWindow}
              onChange={(e) => setContextWindow(e.target.value)}
              className={cn(earnFieldControlClass, "font-mono tabular-nums")}
            />
          </EarnDialogField>
          <div
            className={cn(
              "flex items-start gap-3 rounded-xl border border-border/45 bg-muted/15 px-3.5 py-3",
              "mt-6",
            )}
          >
            <Checkbox
              id="llm-tools"
              checked={tools}
              onCheckedChange={(v) => setTools(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="llm-tools" className="cursor-pointer text-sm font-medium">
              Supports tools / function calling
            </Label>
          </div>
        </div>
      </EarnDialogSection>

      <EarnDialogSection title="Pricing" description="Syra adds ~20% platform fee on top for buyback.">
        <EarnDialogField label="Pricing mode">
          <Select
            value={pricingMode}
            onValueChange={(v) => setPricingMode(v as LlmPricingMode)}
          >
            <SelectTrigger className={earnSelectTriggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per_million_tokens">Per 1M tokens</SelectItem>
              <SelectItem value="flat">Flat per call</SelectItem>
            </SelectContent>
          </Select>
        </EarnDialogField>

        {pricingMode === "flat" ? (
          <EarnDialogField label="Price per call (USD)" htmlFor="llm-flat">
            <Input
              id="llm-flat"
              type="number"
              min="0.0001"
              step="0.001"
              value={flatUsdPerCall}
              onChange={(e) => setFlatUsdPerCall(e.target.value)}
              className={cn(earnFieldControlClass, "font-mono tabular-nums")}
            />
          </EarnDialogField>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <EarnDialogField label="Input $/1M tokens" htmlFor="llm-in">
              <Input
                id="llm-in"
                type="number"
                min="0"
                step="0.01"
                value={inputUsdPer1M}
                onChange={(e) => setInputUsdPer1M(e.target.value)}
                className={cn(earnFieldControlClass, "font-mono tabular-nums")}
              />
            </EarnDialogField>
            <EarnDialogField label="Output $/1M tokens" htmlFor="llm-out">
              <Input
                id="llm-out"
                type="number"
                min="0"
                step="0.01"
                value={outputUsdPer1M}
                onChange={(e) => setOutputUsdPer1M(e.target.value)}
                className={cn(earnFieldControlClass, "font-mono tabular-nums")}
              />
            </EarnDialogField>
          </div>
        )}
      </EarnDialogSection>

      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border border-border/45 bg-muted/15 px-3.5 py-3",
          "transition-colors duration-150 hover:border-border/70 hover:bg-muted/25",
        )}
      >
        <Checkbox
          id="llm-activate"
          checked={activateAfterCreate}
          onCheckedChange={(v) => setActivateAfterCreate(v === true)}
          className="mt-0.5"
        />
        <div className="min-w-0 space-y-0.5">
          <Label htmlFor="llm-activate" className="cursor-pointer text-sm font-medium text-foreground">
            Activate in router now
          </Label>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Runs a connection test, then makes your model routable on POST /llm/route.
          </p>
        </div>
      </div>

      {testNote ? (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{testNote}</p>
      ) : null}
      {error ? <EarnDialogError message={error} /> : null}
    </EarnDialogShell>
  );
}
