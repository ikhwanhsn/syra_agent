import { useState, useEffect } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SystemPromptModalProps {
  systemPrompt: string;
  onSave?: (prompt: string) => void;
  /** When true, prompt is read-only (view only); edit may be enabled in the future. */
  disabled?: boolean;
}

export function SystemPromptModal({ systemPrompt, onSave, disabled = false }: SystemPromptModalProps) {
  const [prompt, setPrompt] = useState(systemPrompt);
  const [open, setOpen] = useState(false);
  const isReadOnly = disabled || onSave == null;

  useEffect(() => {
    if (open) setPrompt(systemPrompt);
  }, [open, systemPrompt]);

  const handleSave = () => {
    if (onSave) {
      onSave(prompt);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0 touch-manipulation"
          aria-label="System prompt"
          title={isReadOnly ? "View system prompt (read-only)" : "System prompt settings"}
        >
          <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            System Prompt
          </DialogTitle>
          <DialogDescription>
            {isReadOnly
              ? "The system prompt that guides the AI."
              : "Customize how the AI behaves by setting a system prompt."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isReadOnly && (
            <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 border border-border px-3 py-2">
              For now you can&apos;t edit the prompt, but you&apos;ll be able to soon.
            </p>
          )}
          <textarea
            value={prompt}
            onChange={(e) => !isReadOnly && setPrompt(e.target.value)}
            readOnly={isReadOnly}
            placeholder="You are Syra Agent, a helpful assistant..."
            className={cn(
              "w-full h-64 p-4 rounded-xl border border-border resize-none scrollbar-thin",
              isReadOnly
                ? "bg-muted/50 text-foreground cursor-default"
                : "bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            )}
          />
          <div className="flex justify-end gap-2">
            {isReadOnly ? (
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
