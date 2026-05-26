import {
  TOOL_PARAMS
} from "./chunk-3PYQIEMA.js";
import {
  zodUrl
} from "./chunk-FB5CMO3J.js";
import {
  getBaseUrl
} from "./chunk-U6FRXL3X.js";
import {
  log
} from "./chunk-QZCSZB7E.js";

// src/operations/discover.ts
import {
  discoverOriginSchema,
  GuidanceMode
} from "@agentcash/discovery";
import z from "zod";
var discoverResourcesSchema = z.object({
  url: zodUrl.describe(TOOL_PARAMS.discoverApiEndpoints.url),
  includeGuidance: z.boolean().optional().describe(TOOL_PARAMS.discoverApiEndpoints.includeGuidance)
});
async function discoverResources(surface, args, options) {
  const parsedArgs = discoverResourcesSchema.safeParse(args);
  if (!parsedArgs.success) {
    return {
      found: false,
      cause: "invalid_input",
      message: parsedArgs.error.message
    };
  }
  const { url, includeGuidance } = parsedArgs.data;
  const guidance = includeGuidance === true ? GuidanceMode.Always : includeGuidance === false ? GuidanceMode.Never : GuidanceMode.Auto;
  const result = await discoverOriginSchema({ target: url, guidance });
  if (result.found) {
    return {
      ...result,
      endpoints: result.endpoints.map((e) => ({ ...e }))
    };
  }
  const scanResult = await fetchScanEndpoints(
    url,
    options?.flags?.dev ?? false
  );
  if (scanResult) {
    log.info(
      `[discoverResources] scan fallback found ${scanResult.endpoints.length} endpoints for ${url}`
    );
    return scanResult;
  }
  log.error(`[discoverResources] failed`, {
    surface,
    url,
    cause: result.cause,
    message: result.message
  });
  return result;
}
var scanEndpointSchema = z.object({
  method: z.string(),
  path: z.string(),
  summary: z.string().optional().default(""),
  authMode: z.string().optional(),
  price: z.string().optional()
});
var scanResponseSchema = z.object({
  origin: z.string(),
  title: z.string().optional().default(""),
  description: z.string().optional().default(""),
  endpoints: z.array(scanEndpointSchema)
});
async function fetchScanEndpoints(origin, dev) {
  const baseUrl = getBaseUrl(dev);
  const url = `${baseUrl}/api/discover/scan?origin=${encodeURIComponent(origin)}`;
  return fetch(url, {
    signal: AbortSignal.timeout(5e3)
  }).then(async (res) => {
    if (!res.ok) return null;
    const data = scanResponseSchema.safeParse(await res.json());
    if (!data.success || data.data.endpoints.length === 0) return null;
    return {
      found: true,
      origin: data.data.origin,
      source: "scan",
      info: {
        title: data.data.title,
        description: data.data.description
      },
      endpoints: data.data.endpoints.map((e) => ({
        path: e.path,
        method: (e.method || "GET").toUpperCase(),
        summary: e.summary,
        authMode: e.authMode ?? void 0,
        protocols: ["x402"],
        price: e.price
      })),
      guidanceAvailable: false,
      guidanceTokens: 0,
      guidance: void 0
    };
  }).catch(() => null);
}

export {
  discoverResourcesSchema,
  discoverResources
};
//# sourceMappingURL=chunk-L4U6AJW3.js.map