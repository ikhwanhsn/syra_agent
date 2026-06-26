import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[min(90dvh,720px)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New API skill</DialogTitle>
          <DialogDescription>
            Point Syra at your HTTPS API. Agents pay USDC per call.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="skill-title">Title</Label>
            <Input
              id="skill-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Token sentiment API"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="skill-description">Description</Label>
            <Textarea
              id="skill-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this skill return?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as SkillCategory)}>
                <SelectTrigger>
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skill-price">Price (USD)</Label>
              <Input
                id="skill-price"
                type="number"
                min="0.001"
                step="0.001"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="skill-upstream">Upstream URL (HTTPS)</Label>
            <Input
              id="skill-upstream"
              value={upstreamUrl}
              onChange={(e) => setUpstreamUrl(e.target.value)}
              placeholder="https://your-service.com/api/skill"
            />
          </div>

          <div className="grid gap-2">
            <Label>Upstream method</Label>
            <Select
              value={upstreamMethod}
              onValueChange={(v) => setUpstreamMethod(v as "GET" | "POST")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="skill-auth-name">Auth header (optional)</Label>
              <Input
                id="skill-auth-name"
                value={authHeaderName}
                onChange={(e) => setAuthHeaderName(e.target.value)}
                placeholder="Authorization"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skill-auth-value">Header value</Label>
              <Input
                id="skill-auth-value"
                type="password"
                value={authHeaderValue}
                onChange={(e) => setAuthHeaderValue(e.target.value)}
                placeholder="Bearer …"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={publishAfterCreate}
              onChange={(e) => setPublishAfterCreate(e.target.checked)}
              className="rounded border-border"
            />
            Publish immediately to the skill marketplace
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !title.trim() || !upstreamUrl.trim()}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create API skill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
