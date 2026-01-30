import { useState } from "react";
import { Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  onSave: (prompt: string) => void;
}

export function SystemPromptModal({ systemPrompt, onSave }: SystemPromptModalProps) {
  const [prompt, setPrompt] = useState(systemPrompt);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSave(prompt);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            System Prompt
          </DialogTitle>
          <DialogDescription>
            Customize how the AI behaves by setting a system prompt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="You are a helpful assistant..."
            className="w-full h-64 p-4 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none scrollbar-thin"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
