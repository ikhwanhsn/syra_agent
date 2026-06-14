import { cn } from "@/lib/utils";

interface StatMetricProps {
  value: string;
  label: string;
  className?: string;
}

const StatMetric = ({ value, label, className }: StatMetricProps) => (
  <div className={cn("text-center px-4 py-2", className)}>
    <div className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-gradient tabular-nums">
      {value}
    </div>
    <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-medium">{label}</p>
  </div>
);

export default StatMetric;
