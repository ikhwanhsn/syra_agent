import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { OrganizeTableSkeleton } from "@/components/organize/OrganizeSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";
import {
  ORGANIZE_ENTRY_STATUS_LABELS,
  ORGANIZE_ENTRY_TYPE_LABELS,
  type OrganizeEntry,
  type OrganizeEntryStatus,
  type OrganizeEntryType,
} from "@/lib/organizeApi";

const ENTRY_TYPES = Object.keys(ORGANIZE_ENTRY_TYPE_LABELS) as OrganizeEntryType[];
const ENTRY_STATUSES = Object.keys(ORGANIZE_ENTRY_STATUS_LABELS) as OrganizeEntryStatus[];

function statusVariant(status: OrganizeEntryStatus) {
  switch (status) {
    case "won":
    case "done":
      return "default" as const;
    case "rejected":
      return "destructive" as const;
    case "in_progress":
    case "submitted":
    case "registered":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function formatAmount(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface OrganizeTableProps {
  entries: OrganizeEntry[];
  isLoading: boolean;
  typeFilter: OrganizeEntryType | "all";
  statusFilter: OrganizeEntryStatus | "all";
  onTypeFilterChange: (value: OrganizeEntryType | "all") => void;
  onStatusFilterChange: (value: OrganizeEntryStatus | "all") => void;
  onEdit: (entry: OrganizeEntry) => void;
  onDelete: (entry: OrganizeEntry) => void;
}

export function OrganizeTable({
  entries,
  isLoading,
  typeFilter,
  statusFilter,
  onTypeFilterChange,
  onStatusFilterChange,
  onEdit,
  onDelete,
}: OrganizeTableProps) {
  if (isLoading) {
    return <OrganizeTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={typeFilter} onValueChange={(v) => onTypeFilterChange(v as OrganizeEntryType | "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ENTRY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {ORGANIZE_ENTRY_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusFilterChange(v as OrganizeEntryStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ENTRY_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ORGANIZE_ENTRY_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {entries.length === 0 ? (
        <div className={cn(overviewCardShell, "p-8 text-center text-sm text-muted-foreground")}>
          No entries yet. Add a hackathon, funding application, or event to start tracking.
        </div>
      ) : (
        <div className={cn(overviewCardShell, "overflow-x-auto")}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[88px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="max-w-[220px]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium leading-tight">{entry.title}</span>
                        {entry.url ? (
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-muted-foreground hover:text-primary"
                            aria-label={`Open ${entry.title}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        ) : null}
                      </div>
                      {entry.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] font-normal">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {ORGANIZE_ENTRY_TYPE_LABELS[entry.type]}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(entry.status)}>
                      {ORGANIZE_ENTRY_STATUS_LABELS[entry.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">
                    {entry.organizer || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(entry.deadline)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(entry.eventDate)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatAmount(entry.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(entry)}
                        aria-label={`Edit ${entry.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(entry)}
                        aria-label={`Delete ${entry.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
