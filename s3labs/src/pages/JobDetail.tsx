import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  EyeOff,
  MapPin,
  Star,
} from "lucide-react";

import { DiscoveryDetailShell } from "@/components/discovery/DiscoveryDetailShell";
import { DiscoveryListThumb } from "@/components/discovery/DiscoveryListThumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDiscoveryDetail } from "@/hooks/useDiscoveryDetail";
import { useJobFlags } from "@/hooks/useJobFlags";
import {
  formatRelativeDate,
  JOB_CATEGORY_STYLES,
} from "@/lib/discoveryFormatters";
import { faviconFromPageUrl } from "@/lib/imageUrl";
import type { JobListing } from "@/lib/jobsApi";
import { cn } from "@/lib/utils";

function JobDetailContent({ job }: { job: JobListing }) {
  const navigate = useNavigate();
  const { toggleFlag, getFlags } = useJobFlags();
  const flags = getFlags(job.jobIdentityKey);
  const company = job.company || "Company not listed";
  const categoryStyle = JOB_CATEGORY_STYLES[job.category];

  const handleHide = () => {
    toggleFlag(job.jobIdentityKey, "hidden");
    void navigate("/jobs");
  };

  const applyCta = (
    <Button variant="hero" className="w-full gap-2 rounded-xl" asChild>
      <a href={job.url} target="_blank" rel="noopener noreferrer">
        Apply on {job.source}
        <ExternalLink className="h-4 w-4" aria-hidden />
      </a>
    </Button>
  );

  return (
    <DiscoveryDetailShell
      backHref="/jobs"
      backLabel="Back to jobs"
      title={job.title}
      subtitle={company}
      eyebrow={
        <p className="eyebrow">
          <Briefcase className="h-4 w-4" aria-hidden />
          Role details
        </p>
      }
      stickyCta={applyCta}
      sidebar={
        <div className="panel-glass space-y-5 p-5">
          <div className="flex items-center gap-3">
            <DiscoveryListThumb
              imageUrl={faviconFromPageUrl(job.url)}
              label={company}
              className="h-14 w-14"
            />
            <div>
              <p className="text-sm font-medium text-foreground">{company}</p>
              <p className="text-xs text-muted-foreground capitalize">{job.source}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={categoryStyle.badge}>
              {categoryStyle.label}
            </Badge>
            {job.remote ? <Badge variant="outline">Remote</Badge> : null}
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">Location</dt>
                <dd className="mt-0.5 font-medium">
                  {job.remote ? "Remote" : job.location || "Not listed"}
                </dd>
              </div>
            </div>
            {job.salaryLabel ? (
              <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">Compensation</dt>
                  <dd className="mt-0.5 font-mono font-medium">{job.salaryLabel}</dd>
                </div>
              </div>
            ) : null}
            <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">Posted</dt>
                <dd className="mt-0.5 font-medium">
                  {formatRelativeDate(job.lastSeenAt ?? job.publishedAt)}
                </dd>
              </div>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={flags.interesting ? "default" : "outline"}
              size="sm"
              className="rounded-lg"
              onClick={() => toggleFlag(job.jobIdentityKey, "interesting")}
            >
              <Star className={cn("mr-1.5 h-4 w-4", flags.interesting && "fill-current")} />
              {flags.interesting ? "Saved" : "Save"}
            </Button>
            <Button
              type="button"
              variant={flags.applied ? "default" : "outline"}
              size="sm"
              className="rounded-lg"
              onClick={() => toggleFlag(job.jobIdentityKey, "applied")}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {flags.applied ? "Applied" : "Mark applied"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg text-muted-foreground"
              onClick={handleHide}
            >
              <EyeOff className="mr-1.5 h-4 w-4" />
              Hide
            </Button>
          </div>

          <div className="hidden lg:block">{applyCta}</div>
        </div>
      }
    >
      {job.description ? (
        <section className="panel-glass p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">About this role</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
            {job.description}
          </p>
        </section>
      ) : (
        <section className="panel-glass p-6 text-sm text-muted-foreground sm:p-8">
          No description available. Apply on the original listing for full details.
        </section>
      )}
    </DiscoveryDetailShell>
  );
}

export default function JobDetail() {
  const { record, isLoading, isNotFound } = useDiscoveryDetail<JobListing>("jobs");

  if (isLoading) {
    return (
      <DiscoveryDetailShell
        backHref="/jobs"
        backLabel="Back to jobs"
        isLoading
      />
    );
  }

  if (isNotFound || !record) {
    return (
      <DiscoveryDetailShell
        backHref="/jobs"
        backLabel="Back to jobs"
        notFound={{
          title: "Role not found",
          description: "This job may have been removed or the link is outdated.",
        }}
      />
    );
  }

  return <JobDetailContent job={record} />;
}
