import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { SectionHeader } from "./shared/SectionHeader";
import type { EngineeredFeature } from "@/lib/btc2/types";

const statusStyles = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  stale: "border-muted-foreground/30 bg-muted/30 text-muted-foreground",
  warming: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
};

export function FeatureTable({ features }: { features: EngineeredFeature[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(features.map((f) => f.category))).sort()],
    [features],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return features.filter((f) => {
      const matchCat = category === "all" || f.category === category;
      const matchSearch =
        !q || f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [features, search, category]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="space-y-4"
    >
      <SectionHeader
        kicker="Section 03"
        title="Feature Engineering"
        description={`${features.length} generated features from onchain oracle and market microstructure pipelines.`}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search features…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border/55 bg-background/45 pl-9 backdrop-blur-md"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-10 w-full rounded-xl border-border/55 bg-background/45 sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={cn(overviewCardShell, "overflow-hidden rounded-2xl")}>
        <div className="max-h-[420px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-wider">Feature</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Value</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Normalized</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Importance</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 50).map((f) => (
                <TableRow key={f.id} className="border-border/40">
                  <TableCell className="font-mono text-xs">{f.name}</TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">
                    {f.value.toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted/60">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${f.normalized * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                        {(f.normalized * 100).toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">
                    {(f.importance * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("rounded-md text-[9px] uppercase", statusStyles[f.status])}
                    >
                      {f.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="border-t border-border/40 px-4 py-2 text-xs text-muted-foreground">
          Showing {Math.min(50, filtered.length)} of {filtered.length} features
        </p>
      </div>
    </motion.section>
  );
}
