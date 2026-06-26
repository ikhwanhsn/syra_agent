import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import {
  deleteSkill,
  publishSkill,
  unpublishSkill,
  type SkillRecord,
} from "@/lib/skillsApi";
import { cn } from "@/lib/utils";

type SkillCardProps = {
  skill: SkillRecord;
  queryKey: readonly unknown[];
};

export function SkillCard({ skill, queryKey }: SkillCardProps) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey });
    void queryClient.invalidateQueries({ queryKey: ["earn", "summary"] });
  };

  const publishM = useMutation({
    mutationFn: () => publishSkill(skill.id),
    onSuccess: invalidate,
  });

  const unpublishM = useMutation({
    mutationFn: () => unpublishSkill(skill.id),
    onSuccess: invalidate,
  });

  const deleteM = useMutation({
    mutationFn: () => deleteSkill(skill.id),
    onSuccess: invalidate,
  });

  const pending = publishM.isPending || unpublishM.isPending || deleteM.isPending;
  const isPublished = skill.status === "published";

  return (
    <li className={cn(overviewCardShell, "flex flex-wrap items-center justify-between gap-3 p-4")}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{skill.title}</p>
          <Badge variant={isPublished ? "default" : "secondary"} className="text-xs">
            {skill.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          ${skill.priceUsd.toFixed(3)}/call · {skill.useCount} calls
        </p>
      </div>
      <div className="flex gap-1">
        {isPublished ? (
          <Button variant="ghost" size="sm" onClick={() => unpublishM.mutate()} disabled={pending}>
            Unpublish
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => publishM.mutate()} disabled={pending}>
            {publishM.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Publish"}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => deleteM.mutate()}
          disabled={pending}
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
