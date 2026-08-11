export function FollowUpSuggestions({
  questions,
  onSelect,
  disabled,
}: {
  questions: string[];
  onSelect?: (question: string) => void;
  disabled?: boolean;
}) {
  if (!questions.length) return null;
  return (
    <div className="space-y-2" aria-label="Follow-up questions">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Follow-ups
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {questions.map((q) => (
          <li key={q}>
            <button
              type="button"
              disabled={disabled || !onSelect}
              onClick={() => onSelect?.(q)}
              className="max-w-full rounded-full border border-border/50 bg-card/40 px-3 py-2 text-left text-[13px] text-foreground/88 touch-manipulation hover:border-border hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
