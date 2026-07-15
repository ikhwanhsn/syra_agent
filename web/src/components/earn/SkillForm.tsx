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
  createSkill,
  publishSkill,
  type CreateSkillPayload,
  type SkillCategory,
  type SkillRecord,
} from "@/lib/skillsApi";
import { cn } from "@/lib/utils";

const CATEGORIES: { value: SkillCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "live_data", label: "Live data" },
  { value: "research", label: "Research" },
  { value: "trading", label: "Trading" },
  { value: "learning", label: "Learning" },
  { value: "tools", label: "Tools" },
];

type SkillFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (skill: SkillRecord) => void;
};

export function SkillForm({ open, onOpenChange, onCreated }: SkillFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SkillCategory>("general");
  const [upstreamUrl, setUpstreamUrl] = useState("");
  const [upstreamMethod, setUpstreamMethod] = useState<"GET" | "POST">("GET");
  const [priceUsd, setPriceUsd] = useState("0.01");
  const [authHeaderName, setAuthHeaderName] = useState("");
  const [authHeaderValue, setAuthHeaderValue] = useState("");
  const [publishAfterCreate, setPublishAfterCreate] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategory("general");
    setUpstreamUrl("");
    setUpstreamMethod("GET");
    setPriceUsd("0.01");
    setAuthHeaderName("");
    setAuthHeaderValue("");
    setPublishAfterCreate(true);
    setError(null);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: CreateSkillPayload = {
        title: title.trim(),
        description: description.trim(),
        category,
        upstreamUrl: upstreamUrl.trim(),
        upstreamMethod,
        priceUsd: Number(priceUsd),
      };

      if (authHeaderName.trim() && authHeaderValue.trim()) {
        payload.upstreamHeaders = {
          [authHeaderName.trim()]: authHeaderValue.trim(),
        };
      }

      const created = await createSkill(payload);
      if (publishAfterCreate) {
        return publishSkill(created.id);
      }
      return created;
    },
    onSuccess: (skill) => {
      onCreated(skill);
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => {
      setError(e.message);
    },
  });

  return (
    <EarnDialogShell
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      icon={Sparkles}
      title="New API skill"
      description="Point Syra at your HTTPS API. Agents pay USDC per call."
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
            variant="neon"
            className="h-10 rounded-xl"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !title.trim() || !upstreamUrl.trim()}
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create API skill
          </Button>
        </>
      }
    >
      <EarnDialogSection title="Listing" description="How agents discover your skill.">
        <EarnDialogField label="Title" htmlFor="skill-title">
          <Input
            id="skill-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Token sentiment API"
            className={earnFieldControlClass}
          />
        </EarnDialogField>

        <EarnDialogField label="Description" htmlFor="skill-description" optional>
          <Textarea
            id="skill-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this skill return?"
            rows={2}
            className={cn(earnTextareaClass, "min-h-[4.5rem]")}
          />
        </EarnDialogField>

        <div className="grid gap-4 sm:grid-cols-2">
          <EarnDialogField label="Category">
            <Select value={category} onValueChange={(v) => setCategory(v as SkillCategory)}>
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
          <EarnDialogField label="Price (USD)" htmlFor="skill-price" hint="Charged per successful call.">
            <Input
              id="skill-price"
              type="number"
              min="0.001"
              step="0.001"
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
              className={cn(earnFieldControlClass, "font-mono tabular-nums")}
            />
          </EarnDialogField>
        </div>
      </EarnDialogSection>

      <EarnDialogSection title="Upstream" description="Where Syra routes agent requests.">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_7.5rem]">
          <EarnDialogField label="Upstream URL (HTTPS)" htmlFor="skill-upstream">
            <Input
              id="skill-upstream"
              value={upstreamUrl}
              onChange={(e) => setUpstreamUrl(e.target.value)}
              placeholder="https://your-service.com/api/skill"
              className={cn(earnFieldControlClass, "font-mono text-[13px]")}
            />
          </EarnDialogField>

          <EarnDialogField label="Method">
            <Select
              value={upstreamMethod}
              onValueChange={(v) => setUpstreamMethod(v as "GET" | "POST")}
            >
              <SelectTrigger className={earnSelectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
              </SelectContent>
            </Select>
          </EarnDialogField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <EarnDialogField label="Auth header" htmlFor="skill-auth-name" optional>
            <Input
              id="skill-auth-name"
              value={authHeaderName}
              onChange={(e) => setAuthHeaderName(e.target.value)}
              placeholder="Authorization"
              className={cn(earnFieldControlClass, "font-mono text-[13px]")}
            />
          </EarnDialogField>
          <EarnDialogField label="Header value" htmlFor="skill-auth-value" optional>
            <Input
              id="skill-auth-value"
              type="password"
              value={authHeaderValue}
              onChange={(e) => setAuthHeaderValue(e.target.value)}
              placeholder="Bearer …"
              className={cn(earnFieldControlClass, "font-mono text-[13px]")}
            />
          </EarnDialogField>
        </div>
      </EarnDialogSection>

      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border border-border/45 bg-muted/15 px-3.5 py-3",
          "transition-colors duration-150 hover:border-border/70 hover:bg-muted/25",
        )}
      >
        <Checkbox
          id="skill-publish"
          checked={publishAfterCreate}
          onCheckedChange={(v) => setPublishAfterCreate(v === true)}
          className="mt-0.5"
        />
        <div className="min-w-0 space-y-0.5">
          <Label htmlFor="skill-publish" className="cursor-pointer text-sm font-medium text-foreground">
            Publish to marketplace
          </Label>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Make this skill available for agents to call immediately after create.
          </p>
        </div>
      </div>

      {error ? <EarnDialogError message={error} /> : null}
    </EarnDialogShell>
  );
}
