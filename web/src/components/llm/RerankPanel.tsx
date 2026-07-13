import { useCallback, useState } from "react";
import { Loader2, ListOrdered } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/llm/ModelSelector";
import { useLlmRerank } from "@/hooks/useLlmPlayground";

type RankedRow = {
  index: number;
  score: number | null;
  text: string;
};

export function RerankPanel() {
  const [model, setModel] = useState("");
  const [query, setQuery] = useState("");
  const [documentsText, setDocumentsText] = useState(
    "Solana is a high-throughput L1 blockchain.\nBitcoin is digital gold.\nEthereum pioneered smart contracts.\nSyra is an AI-native finance product.",
  );
  const [topN, setTopN] = useState(3);
  const [results, setResults] = useState<RankedRow[]>([]);
  const rerank = useLlmRerank();

  const onModelChange = useCallback((id: string) => setModel(id), []);

  const onSubmit = async () => {
    const q = query.trim();
    const docs = documentsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!q) {
      toast.error("Enter a query");
      return;
    }
    if (docs.length === 0) {
      toast.error("Enter at least one document (one per line)");
      return;
    }
    try {
      const result = await rerank.mutateAsync({
        query: q,
        documents: docs,
        model: model || undefined,
        top_n: topN,
      });
      const rows: RankedRow[] = (result.results ?? []).map((r) => {
        let text = "";
        if (typeof r.document === "string") text = r.document;
        else if (r.document && typeof r.document === "object" && typeof r.document.text === "string") {
          text = r.document.text;
        } else if (typeof r.index === "number" && docs[r.index]) {
          text = docs[r.index];
        }
        return {
          index: r.index,
          score: typeof r.relevance_score === "number" ? r.relevance_score : null,
          text,
        };
      });
      setResults(rows);
      toast.success(`Reranked ${rows.length} result(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rerank failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListOrdered className="h-5 w-5 text-primary" aria-hidden />
          Rerank
        </CardTitle>
        <CardDescription>
          Re-score documents against a query. Defaults to the cheapest rerank model.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ModelSelector modality="rerank" value={model} onChange={onModelChange} />

        <div className="space-y-2">
          <Label htmlFor="llm-rerank-query">Query</Label>
          <Input
            id="llm-rerank-query"
            placeholder="What is Syra?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="llm-rerank-docs">Documents (one per line)</Label>
          <Textarea
            id="llm-rerank-docs"
            value={documentsText}
            onChange={(e) => setDocumentsText(e.target.value)}
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="llm-rerank-topn">Top N</Label>
          <Input
            id="llm-rerank-topn"
            type="number"
            min={1}
            max={20}
            value={topN}
            onChange={(e) => setTopN(Math.max(1, Math.min(20, Number(e.target.value) || 3)))}
          />
        </div>

        <Button type="button" onClick={() => void onSubmit()} disabled={rerank.isPending}>
          {rerank.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reranking…
            </>
          ) : (
            "Rerank"
          )}
        </Button>

        {results.length > 0 && (
          <ol className="space-y-2">
            {results.map((r, i) => (
              <li
                key={`${r.index}-${i}`}
                className="rounded-lg border border-border bg-muted/20 p-3 text-sm"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-medium">#{i + 1}</span>
                  {r.score != null && (
                    <span className="font-mono text-xs text-muted-foreground">
                      score {r.score.toFixed(4)}
                    </span>
                  )}
                </div>
                <p>{r.text || `(index ${r.index})`}</p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
