// src/cli/lib/wait.ts
import { spinner } from "@clack/prompts";
var wait = async ({ startText, stopText, ms }) => {
  const { start: startSpinner, stop: stopSpinner } = spinner();
  startSpinner(startText);
  await new Promise((resolve) => setTimeout(resolve, ms));
  stopSpinner(stopText);
};

export {
  wait
};
//# sourceMappingURL=chunk-DZNSJ2BA.js.map