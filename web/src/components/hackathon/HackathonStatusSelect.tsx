import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HACKATHON_STATUSES,
  HACKATHON_STATUS_LABELS,
  type HackathonStatus,
} from "@/lib/hackathonsApi";

interface HackathonStatusSelectProps {
  value: HackathonStatus;
  onChange: (status: HackathonStatus) => void;
  disabled?: boolean;
}

export function HackathonStatusSelect({ value, onChange, disabled }: HackathonStatusSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as HackathonStatus)} disabled={disabled}>
      <SelectTrigger className="h-8 w-[140px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {HACKATHON_STATUSES.map((status) => (
          <SelectItem key={status} value={status} className="text-xs">
            {HACKATHON_STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
