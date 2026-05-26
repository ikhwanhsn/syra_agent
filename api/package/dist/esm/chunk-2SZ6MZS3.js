import {
  discoverResources
} from "./chunk-L4U6AJW3.js";
import {
  errorResponse
} from "./chunk-7EBJ4BCH.js";

// src/cli/lib/resolve-origin.ts
async function resolveOrigin(surface, args) {
  const result = await discoverResources(surface, args);
  if (!result.found) {
    return {
      ok: false,
      error: errorResponse({
        code: "GENERAL_ERROR",
        message: result.message ?? `No OpenAPI spec found for ${result.origin}`,
        surface,
        cause: result.cause
      })
    };
  }
  const description = resolveDescription(result) ?? "";
  const warnings = [];
  if (!result.info?.title)
    warnings.push("No title found in OpenAPI spec; derived from URL.");
  if (!result.info?.description)
    warnings.push(
      description ? "No description found in OpenAPI spec; derived from guidance." : "No description could be found."
    );
  return {
    ok: true,
    origin: {
      url: result.origin,
      title: resolveTitle(result),
      description,
      warnings
    }
  };
}
function resolveTitle(result) {
  if (result.info?.title) return result.info.title;
  const hostname = new URL(result.origin).hostname.replace(/^www\./, "");
  const parts = hostname.split(".");
  return parts.length > 1 ? parts.slice(0, -1).join(".") : hostname;
}
function resolveDescription(result) {
  if (result.info?.description) return result.info.description;
  if (result.guidance) return result.guidance.slice(0, 100);
  return null;
}

export {
  resolveOrigin
};
//# sourceMappingURL=chunk-2SZ6MZS3.js.map