/**
 * Recharts colors — neutral zinc-style ramp aligned with landing monochrome.
 */
export const chartTheme = {
  grid: "#27272a",
  tick: "#a1a1aa",
  tooltipContentStyle: {
    backgroundColor: "hsl(0, 0%, 5.5%)",
    border: "1px solid hsl(0, 0%, 14%)",
    borderRadius: "8px",
  },
  /** Line / area / bar series */
  series: ["#e4e4e7", "#a1a1aa", "#71717a", "#52525b", "#d4d4d8"] as const,
  pie: ["#e4e4e7", "#a1a1aa", "#71717a", "#52525b", "#d4d4d8", "#3f3f46"] as const,
};

export const httpStatusColors: Record<string, string> = {
  "2xx": "#a1a1aa",
  "3xx": "#8d8d95",
  "4xx": "#71717a",
  "5xx": "#52525b",
};
