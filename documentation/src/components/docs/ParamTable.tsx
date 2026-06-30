import { cn } from "@/lib/utils";

export interface ParamRow {
  name: string;
  type?: string;
  required?: boolean;
  description: string;
}

interface ParamTableProps {
  params: ParamRow[];
  title?: string;
  className?: string;
}

export function ParamTable({ params, title = "Parameters", className }: ParamTableProps) {
  if (params.length === 0) return null;

  return (
    <div className={cn("my-4", className)}>
      <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2.5 text-left font-medium text-foreground">Name</th>
              <th className="px-4 py-2.5 text-left font-medium text-foreground">Type</th>
              <th className="px-4 py-2.5 text-left font-medium text-foreground">Description</th>
            </tr>
          </thead>
          <tbody>
            {params.map((param) => (
              <tr key={param.name} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2.5 align-top">
                  <code className="text-xs font-mono text-primary">{param.name}</code>
                  {param.required && (
                    <span className="ml-1.5 text-[10px] uppercase tracking-wide text-destructive">
                      required
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 align-top text-muted-foreground font-mono text-xs">
                  {param.type ?? "—"}
                </td>
                <td className="px-4 py-2.5 align-top text-muted-foreground leading-relaxed">
                  {param.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ResponseTableProps {
  codes: { code: number | string; description: string }[];
  className?: string;
}

export function ResponseTable({ codes, className }: ResponseTableProps) {
  return (
    <div className={cn("my-4", className)}>
      <h4 className="text-sm font-semibold text-foreground mb-3">Response codes</h4>
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2.5 text-left font-medium text-foreground w-24">Code</th>
              <th className="px-4 py-2.5 text-left font-medium text-foreground">Description</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((row) => (
              <tr key={row.code} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2.5 align-top">
                  <code className="text-xs font-mono">{row.code}</code>
                </td>
                <td className="px-4 py-2.5 align-top text-muted-foreground">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
