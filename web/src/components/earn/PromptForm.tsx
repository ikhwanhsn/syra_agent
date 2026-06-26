import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { userPromptsApi, type UserPromptItem } from "@/lib/chatApi";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "live_data", label: "Live data" },
  { value: "research", label: "Research" },
  { value: "trading", label: "Trading" },
  { value: "learning", label: "Learning" },
  { value: "tools", label: "Tools" },
] as const;

type PromptFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anonymousId: string;
  onCreated: (prompt: UserPromptItem) => void;
  initial?: UserPromptItem | null;
};

export function PromptForm({ open, onOpenChange, anonymousId, onCreated, initial }: PromptFormProps) {
  const isEdit = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [category, setCategory] = useState(initial?.category ?? "general");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit playbook" : "New playbook"}</DialogTitle>
          <DialogDescription>
            Describe your strategy. You earn USDC when agents use it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="prompt-title">Title</Label>
            <Input
              id="prompt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="SOL dip scanner"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="prompt-description">Short description</Label>
            <Input
              id="prompt-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Finds oversold alts with volume spikes"
            />
          </div>

          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
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
            <Label htmlFor="prompt-body">Instructions</Label>
            <Textarea
              id="prompt-body"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What should the agent do?"
              rows={5}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !title.trim() || !prompt.trim()}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
