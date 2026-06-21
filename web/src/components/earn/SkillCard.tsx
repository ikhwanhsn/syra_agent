import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import {
  deleteSkill,
  publishSkill,
  skillCurlSnippet,
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
  const [copied, setCopied] = useState(false);

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

  const copySnippet = async () => {
    await navigator.clipboard.writeText(skillCurlSnippet(skill));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <li className={cn(overviewCardShell, "space-y-3 p-4")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{skill.title}</h3>
            <Badge variant={skill.status === "published" ? "default" : "secondary"}>
              {skill.status}
            </Badge>
          </div>
          {skill.description ? (
            <p className="text-sm text-muted-foreground">{skill.description}</p>
          ) : null}
        </div>
        <div className="text-right text-sm">
          <p className="font-medium">${skill.priceUsd.toFixed(3)} / call</p>
          <p className="text-muted-foreground">{skill.useCount} calls</p>
        </div>
      </div>

      <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Endpoint</p>
        <code className="mt-1 block break-all text-xs text-foreground">{skill.endpointUrl}</code>
        {skill.payToAddress ? (
          <p className="mt-2 text-xs text-muted-foreground">
            payTo: <span className="font-mono">{skill.payToAddress}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => void copySnippet()} disabled={pending}>
          {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy curl"}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={skill.endpointUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-1 h-3.5 w-3.5" />
            Open
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/wallet?wallet=earn">Earn wallet</Link>
        </Button>
        {skill.status === "draft" ? (
          <Button size="sm" onClick={() => publishM.mutate()} disabled={pending}>
            {publishM.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            Publish
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => unpublishM.mutate()} disabled={pending}>
            {unpublishM.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            Unpublish
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => deleteM.mutate()}
          disabled={pending}
        >
          {deleteM.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1 h-3.5 w-3.5" />}
          Delete
        </Button>
      </div>
    </li>
  );
}
