import type { HttpMethod } from '@/types/api';
import type { RequestParam } from '@/types/api';

export type ExamplePaymentCatalog = 'x402' | 'mpp';

/** Shape aligned with ExampleFlowPreset in useApiPlayground (avoids circular imports). */
export interface MppCatalogExampleFlowPreset {
  id: string;
  label: string;
  method: HttpMethod;
  url: string;
  params: RequestParam[];
  body?: string;
  examplePaymentCatalog: ExamplePaymentCatalog;
}

function slugifyPath(openApiPath: string): string {
  return openApiPath
    .replace(/^\//, '')
    .replace(/\//g, '-')
    .replace(/[{}]/g, '')
    .replace(/[^a-z0-9-]/gi, '')
    .replace(/-+/g, '-')
    .slice(0, 96);
}

/** Replace OpenAPI `{param}` segments with demo path segments for runnable URLs. */
export function openApiPathToRunnablePath(openApiPath: string): string {
  const normalized = openApiPath.startsWith('/') ? openApiPath : `/${openApiPath}`;
  return normalized.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const n = name.toLowerCase();
    if (n === 'jobid') return 'demo-job-id';
    return `demo-${n}`;
  });
}

export function buildUrlForMppCatalogPath(runnablePath: string, syraBase: string, purchBase: string): string {
  const p = runnablePath.startsWith('/') ? runnablePath : `/${runnablePath}`;
  if (p.startsWith('/x402/')) {
    const u = new URL(purchBase.replace(/\/$/, ''));
    return `${u.origin}${p}`;
  }
  const u = new URL(syraBase.replace(/\/$/, ''));
  return `${u.origin}${p}`;
}

/**
 * Build example presets from GET /mpp-openapi.json (Syra MPP discovery document).
 * Paths and methods match AgentCash / MPPscan catalog; URLs are canonical Syra (or Purch for /x402/*).
 */
export function exampleFlowsFromMppOpenApi(
  doc: unknown,
  syraBase: string,
  purchBase: string
): MppCatalogExampleFlowPreset[] {
  const out: MppCatalogExampleFlowPreset[] = [];
  if (!doc || typeof doc !== 'object') return out;
  const paths = (doc as { paths?: Record<string, Record<string, unknown>> }).paths;
  if (!paths || typeof paths !== 'object') return out;

  for (const [openApiPath, item] of Object.entries(paths)) {
    if (!item || typeof item !== 'object') continue;
    const runnable = openApiPathToRunnablePath(openApiPath);
    const url = buildUrlForMppCatalogPath(runnable, syraBase, purchBase);
    for (const method of ['get', 'post'] as const) {
      if (!(method in item)) continue;
      const op = item[method] as { description?: string } | undefined;
      const Umethod = method.toUpperCase() as HttpMethod;
      const slug = slugifyPath(openApiPath);
      const id = `mpp-catalog-${slug}-${method}`;
      const desc = typeof op?.description === 'string' ? op.description.split('\n')[0].trim() : '';
      const shortLabel = desc || `${openApiPath} (${Umethod})`;
      out.push({
        id,
        label: shortLabel.length > 160 ? `${shortLabel.slice(0, 157)}…` : shortLabel,
        method: Umethod,
        url,
        params: [],
        ...(Umethod === 'POST' ? { body: '{\n  \n}' } : {}),
        examplePaymentCatalog: 'mpp',
      });
    }
  }
  return out.sort((a, b) => a.url.localeCompare(b.url) || a.method.localeCompare(b.method));
}

/** Syra-hosted MPP lane URLs (`/mpp/v1/*`). Included in discovery; kept explicit for clarity. */
export function getMppV1LaneExampleFlows(syraBase: string): MppCatalogExampleFlowPreset[] {
  const b = syraBase.replace(/\/$/, '');
  return [
    {
      id: 'mpp-v1-health-get',
      label: 'MPP v1: check status (GET)',
      method: 'GET',
      url: `${b}/mpp/v1/health`,
      params: [],
      examplePaymentCatalog: 'mpp',
    },
    {
      id: 'mpp-v1-health-post',
      label: 'MPP v1: check status (POST)',
      method: 'POST',
      url: `${b}/mpp/v1/health`,
      params: [],
      body: '{\n  \n}',
      examplePaymentCatalog: 'mpp',
    },
  ];
}

/** Full MPP example list: OpenAPI catalog plus `/mpp/v1/health` if missing from the doc. */
export function buildFullMppExampleFlowList(
  doc: unknown,
  syraBase: string,
  purchBase: string
): MppCatalogExampleFlowPreset[] {
  const fromDoc = exampleFlowsFromMppOpenApi(doc, syraBase, purchBase);
  const hasMppV1 = fromDoc.some((f) => f.url.toLowerCase().includes('/mpp/v1/health'));
  if (hasMppV1) return fromDoc;
  return [...getMppV1LaneExampleFlows(syraBase), ...fromDoc];
}
