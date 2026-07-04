import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  EarnDialogError,
  EarnDialogField,
  EarnDialogShell,
  earnFieldControlClass,
  earnSelectTriggerClass,
  earnTextareaClass,
} from "@/components/earn/EarnDialogShell";
import { Button } from "@/components/ui/button";
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
import { userPromptsApi, type UserPromptItem } from "@/lib/chatApi";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "live_data", label: "Live data" },
  { value: "research", label: "Research" },
  { value: "trading", label: "Trading" },
  { value: "learning", label: "Learning" },
  { value: "tools", label: "Tools" },
] as const;

const CATEGORY_VALUES = new Set(CATEGORIES.map((c) => c.value));

type PromptFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anonymousId: string;
  onCreated: (prompt: UserPromptItem) => void;
  initial?: UserPromptItem | null;
};

export function PromptForm({ open, onOpenChange, anonymousId, onCreated, initial }: PromptFormProps) {
  const isEdit = Boolean(initial);
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [category, setCategory] = useState(initial?.category ?? "general");
  const [error, setError] = useState<string | null>(null);

  const aiQuotaKey = ["earn", "playbook-ai-quota", anonymousId] as const;

  const quotaQuery = useQuery({
    queryKey: aiQuotaKey,
    queryFn: async () => {
      const res = await userPromptsApi.getAiQuota(anonymousId);
      return res.quota;
    },
    enabled: open && Boolean(anonymousId.trim()),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setPrompt(initial?.prompt ?? "");
    setCategory(initial?.category ?? "general");
    setError(null);
  }, [open, initial]);

  const reset = () => {
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setPrompt(initial?.prompt ?? "");
    setCategory(initial?.category ?? "general");
    setError(null);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        prompt: prompt.trim(),
        category,
      };
      if (isEdit && initial) {
        const res = await userPromptsApi.update(initial.id, anonymousId, payload);
        return res.prompt;
      }
      const res = await userPromptsApi.create(anonymousId, payload);
      return res.prompt;
    },
    onSuccess: (item) => {
      onCreated(item);
      if (!isEdit) reset();
      onOpenChange(false);
    },
    onError: (e: Error) => {
      setError(e.message);
    },
  });

  const aiMutation = useMutation({
    mutationFn: () => userPromptsApi.generateWithAi(anonymousId),
    onSuccess: (res) => {
      setTitle(res.draft.title);
      setDescription(res.draft.description);
      setPrompt(res.draft.prompt);
      setCategory(CATEGORY_VALUES.has(res.draft.category) ? res.draft.category : "general");
      setError(null);
      queryClient.setQueryData(aiQuotaKey, res.quota);
    },
    onError: (e: Error) => {
      setError(e.message);
      void queryClient.invalidateQueries({ queryKey: aiQuotaKey });
    },
  });

  const quota = quotaQuery.data;
  const limitReached = Boolean(quota && quota.limit > 0 && quota.remaining <= 0);
  const aiBusy = aiMutation.isPending;
  const formBusy = mutation.isPending || aiBusy;
  const aiTitle = limitReached
    ? "Daily AI limit reached (5/day)"
    : quota
      ? `Fill with AI (${quota.remaining}/${quota.limit} left today)`
      : "Fill with AI";

  return (
    <EarnDialogShell
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      icon={BookOpen}
      title={isEdit ? "Edit playbook" : "New playbook"}
      description="Describe your strategy. You earn USDC when agents use it."
      className="sm:max-w-lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-border/60"
            onClick={() => onOpenChange(false)}
            disabled={formBusy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="neon"
            className="h-10 rounded-xl"
            onClick={() => mutation.mutate()}
            disabled={formBusy || !title.trim() || !prompt.trim()}
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? "Save changes" : "Create playbook"}
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label
            htmlFor="prompt-title"
            className="text-[13px] font-medium tracking-tight text-foreground/90"
          >
            Title
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 gap-1 rounded-lg px-2 text-xs font-medium text-primary",
              "hover:bg-primary/10 hover:text-primary",
              limitReached && "text-muted-foreground hover:bg-transparent hover:text-muted-foreground",
            )}
            onClick={() => aiMutation.mutate()}
            disabled={formBusy || limitReached || !anonymousId.trim()}
            title={aiTitle}
            aria-label={aiTitle}
          >
            {aiBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            AI
          </Button>
        </div>
        <Input
          id="prompt-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="SOL dip scanner"
          disabled={aiBusy}
          className={earnFieldControlClass}
        />
      </div>

      <EarnDialogField label="Short description" htmlFor="prompt-description" optional>
        <Input
          id="prompt-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Finds oversold alts with volume spikes"
          disabled={aiBusy}
          className={earnFieldControlClass}
        />
      </EarnDialogField>

      <EarnDialogField label="Category">
        <Select value={category} onValueChange={setCategory} disabled={aiBusy}>
          <SelectTrigger className={earnSelectTriggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </EarnDialogField>

      <EarnDialogField
        label="Instructions"
        htmlFor="prompt-body"
        hint="Write clear steps agents can follow when they run this playbook."
      >
        <Textarea
          id="prompt-body"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What should the agent do?"
          rows={5}
          disabled={aiBusy}
          className={earnTextareaClass}
        />
      </EarnDialogField>

      {error ? <EarnDialogError message={error} /> : null}
    </EarnDialogShell>
  );
}
