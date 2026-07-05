import type { ExampleFlowPreset } from "@/hooks/useApiPlayground";
import { getPlaygroundSyraPathname } from "@/lib/playgroundUrl";
import type { RequestParam } from "@/types/api";

function paramValue(params: RequestParam[], key: string): string {
  return (params.find((p) => p.key === key && p.enabled)?.value ?? "").trim();
}

/** True when the user must fill params before we can send (opens QueryParamsModal). */
export function flowNeedsParamModal(
  flow: ExampleFlowPreset,
  params: RequestParam[],
): boolean {
  if (params.length === 0) return false;

  const pathname = getPlaygroundSyraPathname(flow.url);
  const queryRequiredPaths = ["/web-search"];
  const urlRequiredPaths = ["/crawl"];
  const taskRequiredPaths = ["/browser-use"];

  if (queryRequiredPaths.includes(pathname) && !paramValue(params, "query")) return true;
  if (urlRequiredPaths.includes(pathname) && !paramValue(params, "url")) return true;
  if (taskRequiredPaths.includes(pathname) && !paramValue(params, "task")) return true;

  const needsInput = params.some(
    (p) =>
      p.enabled &&
      p.value.trim() === "" &&
      /^(address|wallet|slug|question|query|url|task)$/i.test(p.key),
  );
  return needsInput;
}
