import { useMemo, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { AdminDashboardGate } from "@/components/dashboard/AdminDashboardGate";
import { DeleteEntryDialog } from "@/components/organize/DeleteEntryDialog";
import { EntryDialog } from "@/components/organize/EntryDialog";
import { OrganizeSummarySkeleton } from "@/components/organize/OrganizeSkeleton";
import { OrganizeTable } from "@/components/organize/OrganizeTable";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useOrganize } from "@/hooks/useOrganize";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import type { OrganizeEntry, OrganizeEntryInput, OrganizeEntryStatus, OrganizeEntryType } from "@/lib/organizeApi";
import { cn } from "@/lib/utils";

const TERMINAL_STATUSES: OrganizeEntryStatus[] = ["won", "rejected", "done"];

export default function OrganizePage() {
  const [typeFilter, setTypeFilter] = useState<OrganizeEntryType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<OrganizeEntryStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OrganizeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<OrganizeEntry | null>(null);

  const { entriesQ, createM, updateM, deleteM } = useOrganize();
  const showSkeleton = useMinimumSkeleton(entriesQ.isLoading);
  const allEntries = useMemo(() => entriesQ.data ?? [], [entriesQ.data]);

  const entries = useMemo(() => {
    return allEntries.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      return true;
    });
  }, [allEntries, typeFilter, statusFilter]);

  const summary = useMemo(() => {
    const active = allEntries.filter((e) => !TERMINAL_STATUSES.includes(e.status)).length;
    const upcomingDeadlines = allEntries.filter((e) => {
      if (!e.deadline) return false;
      const d = new Date(e.deadline);
      if (Number.isNaN(d.getTime())) return false;
      const now = new Date();
      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);
      return d >= now && d <= in30;
    }).length;
    return { total: allEntries.length, active, upcomingDeadlines };
  }, [allEntries]);

  const handleCreate = (input: OrganizeEntryInput) => {
    createM.mutate(input, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const handleUpdate = (input: OrganizeEntryInput) => {
    if (!editingEntry) return;
    updateM.mutate(
      { id: editingEntry.id, patch: input },
      {
        onSuccess: () => {
          setEditingEntry(null);
          setDialogOpen(false);
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deletingEntry) return;
    deleteM.mutate(deletingEntry.id, {
      onSuccess: () => setDeletingEntry(null),
    });
  };

  const mutationError = createM.error ?? updateM.error ?? deleteM.error;

  return (
    <AdminDashboardGate featureLabel="Organize">
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
          "pb-12",
        )}
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <ClipboardList className="h-6 w-6 text-primary" aria-hidden />
              Organize
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Track hackathons, funding applications, events, and partnerships in one place so
              nothing slips through the cracks.
            </p>
          </div>
          <Button
            className="shrink-0 gap-2"
            onClick={() => {
              setEditingEntry(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add entry
          </Button>
        </div>

        {showSkeleton ? (
          <OrganizeSummarySkeleton />
        ) : (
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className={cn(overviewCardShell, "p-4")}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total entries
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.total}</p>
            </div>
            <div className={cn(overviewCardShell, "p-4")}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Active
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.active}</p>
            </div>
            <div className={cn(overviewCardShell, "p-4")}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Deadlines (30d)
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {summary.upcomingDeadlines}
              </p>
            </div>
          </div>
        )}

        {mutationError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{mutationError.message}</AlertDescription>
          </Alert>
        ) : null}

        <OrganizeTable
          entries={entries}
          isLoading={showSkeleton}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          onTypeFilterChange={setTypeFilter}
          onStatusFilterChange={setStatusFilter}
          onEdit={(entry) => {
            setEditingEntry(entry);
            setDialogOpen(true);
          }}
          onDelete={setDeletingEntry}
        />

        <EntryDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingEntry(null);
          }}
          onSubmit={editingEntry ? handleUpdate : handleCreate}
          isPending={createM.isPending || updateM.isPending}
          entry={editingEntry}
        />

        <DeleteEntryDialog
          entry={deletingEntry}
          open={Boolean(deletingEntry)}
          onOpenChange={(open) => {
            if (!open) setDeletingEntry(null);
          }}
          onConfirm={handleDelete}
          isPending={deleteM.isPending}
        />
      </div>
    </AdminDashboardGate>
  );
}
