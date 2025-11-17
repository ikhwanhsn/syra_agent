export function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const formatted = date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatted.replace(",", ""); // remove comma if locale adds it
}
