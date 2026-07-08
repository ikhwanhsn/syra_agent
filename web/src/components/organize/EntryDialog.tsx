import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ORGANIZE_ENTRY_STATUS_LABELS,
  ORGANIZE_ENTRY_TYPE_LABELS,
  type OrganizeEntry,
  type OrganizeEntryInput,
  type OrganizeEntryStatus,
  type OrganizeEntryType,
} from "@/lib/organizeApi";

const ENTRY_TYPES = Object.keys(ORGANIZE_ENTRY_TYPE_LABELS) as OrganizeEntryType[];
const ENTRY_STATUSES = Object.keys(ORGANIZE_ENTRY_STATUS_LABELS) as OrganizeEntryStatus[];

/** Above Dialog (`z-[250]`) so selects stay clickable inside the modal. */
const MODAL_SELECT_CONTENT_CLASS = "z-[300]";

const DIALOG_SHELL_CLASS =
  "flex w-[calc(100vw-1.25rem)] max-w-[calc(100vw-1.25rem)] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-xl md:max-w-2xl";

const FIELD_LABEL_CLASS = "text-xs font-medium sm:text-sm";
const FIELD_GRID_CLASS = "grid min-w-0 gap-3 sm:gap-4";

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

interface EntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: OrganizeEntryInput) => void;
  isPending: boolean;
  entry?: OrganizeEntry | null;
}

export function EntryDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  entry,
}: EntryDialogProps) {
  const [type, setType] = useState<OrganizeEntryType>("hackathon");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<OrganizeEntryStatus>("interested");
  const [organizer, setOrganizer] = useState("");
  const [url, setUrl] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setType(entry.type);
      setTitle(entry.title);
      setStatus(entry.status);
      setOrganizer(entry.organizer);
      setUrl(entry.url);
      setAmount(entry.amount != null ? String(entry.amount) : "");
      setDeadline(toDateInputValue(entry.deadline));
      setEventDate(toDateInputValue(entry.eventDate));
      setTags(entry.tags.join(", "));
      setNotes(entry.notes);
    } else {
      setType("hackathon");
      setTitle("");
      setStatus("interested");
      setOrganizer("");
      setUrl("");
      setAmount("");
      setDeadline("");
      setEventDate("");
      setTags("");
      setNotes("");
    }
  }, [open, entry]);

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const parsedAmount = amount.trim() ? Number(amount) : null;
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({
      type,
      title: trimmedTitle,
      status,
      organizer: organizer.trim(),
      url: url.trim(),
      amount: parsedAmount != null && Number.isFinite(parsedAmount) ? parsedAmount : null,
      deadline: deadline || null,
      eventDate: eventDate || null,
      tags: tagList,
      notes: notes.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={DIALOG_SHELL_CLASS}>
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-4 pb-4 pt-1 text-left sm:px-6 sm:pt-2">
          <DialogTitle className="pr-8 text-base sm:text-lg">
            {entry ? "Edit entry" : "Add entry"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Track a hackathon, funding application, event, or partnership you are working on.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          <div className="space-y-4 sm:space-y-5">
            <div className={cn(FIELD_GRID_CLASS, "grid-cols-1 sm:grid-cols-2")}>
              <div className="min-w-0 space-y-2">
                <Label className={FIELD_LABEL_CLASS}>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as OrganizeEntryType)}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={MODAL_SELECT_CONTENT_CLASS}>
                    {ENTRY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ORGANIZE_ENTRY_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-2">
                <Label className={FIELD_LABEL_CLASS}>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as OrganizeEntryStatus)}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={MODAL_SELECT_CONTENT_CLASS}>
                    {ENTRY_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ORGANIZE_ENTRY_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organize-title" className={FIELD_LABEL_CLASS}>
                Title
              </Label>
              <Input
                id="organize-title"
                className="h-10"
                placeholder="e.g. Colosseum Breakout Hackathon"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organize-organizer" className={FIELD_LABEL_CLASS}>
                Organizer / Program
              </Label>
              <Input
                id="organize-organizer"
                className="h-10"
                placeholder="e.g. Colosseum, Solana Foundation"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organize-url" className={FIELD_LABEL_CLASS}>
                URL
              </Label>
              <Input
                id="organize-url"
                className="h-10"
                type="url"
                inputMode="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className={cn(FIELD_GRID_CLASS, "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="organize-amount" className={FIELD_LABEL_CLASS}>
                  Amount (USD)
                </Label>
                <Input
                  id="organize-amount"
                  className="h-10"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Optional"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="organize-deadline" className={FIELD_LABEL_CLASS}>
                  Deadline
                </Label>
                <Input
                  id="organize-deadline"
                  className="h-10 min-w-0"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="min-w-0 space-y-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="organize-event-date" className={FIELD_LABEL_CLASS}>
                  Event date
                </Label>
                <Input
                  id="organize-event-date"
                  className="h-10 min-w-0"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organize-tags" className={FIELD_LABEL_CLASS}>
                Tags
              </Label>
              <Input
                id="organize-tags"
                className="h-10"
                placeholder="solana, grant, q3 (comma-separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organize-notes" className={FIELD_LABEL_CLASS}>
                Notes
              </Label>
              <Textarea
                id="organize-notes"
                className="min-h-[7rem] resize-y sm:min-h-[6.5rem]"
                placeholder="What you registered for, next steps, contact person..."
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-background px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
          <Button
            variant="outline"
            className="h-10 w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="h-10 w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={!title.trim() || isPending}
          >
            {isPending ? "Saving…" : entry ? "Save changes" : "Add entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
