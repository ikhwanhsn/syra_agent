import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { userPromptsApi, type UserPromptItem } from "@/lib/chatApi";
import { cn } from "@/lib/utils";

type PromptCardProps = {
  prompt: UserPromptItem;
  anonymousId: string;
  queryKey: readonly unknown[];
  onEdit: (prompt: UserPromptItem) => void;
};

export function PromptCard({ prompt, anonymousId, queryKey, onEdit }: PromptCardProps) {
  const queryClient = useQueryClient();

  const deleteM = useMutation({
    mutationFn: () => userPromptsApi.delete(prompt.id, anonymousId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ["earn", "summary"] });
    },
  });

  return (
    <li className={cn(overviewCardShell, "flex flex-wrap items-center justify-between gap-3 p-4")}>
      <div className="min-w-0">
        <p className="truncate font-medium">{prompt.title}</p>
        <p className="text-xs text-muted-foreground">{prompt.useCount} uses</p>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(prompt)} disabled={deleteM.isPending}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => deleteM.mutate()}
          disabled={deleteM.isPending}
        >
          {deleteM.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </li>
  );
}
