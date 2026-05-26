import {
  resolveOrigin
} from "./chunk-2SZ6MZS3.js";
import {
  addUserOrigin,
  loadUserOrigins,
  removeUserOrigin
} from "./chunk-YIU364NZ.js";
import "./chunk-L4U6AJW3.js";
import {
  ORIGIN_METADATA,
  PRIMARY_ORIGINS
} from "./chunk-3PYQIEMA.js";
import "./chunk-KVSTJRSJ.js";
import {
  ensureProtocol
} from "./chunk-FB5CMO3J.js";
import "./chunk-U6FRXL3X.js";
import {
  errorResponse,
  outputAndExit,
  successResponse
} from "./chunk-7EBJ4BCH.js";
import "./chunk-QZCSZB7E.js";
import "./chunk-TTAO2EJK.js";
import "./chunk-YWNBUUBR.js";
import "./chunk-ITCDZXBZ.js";

// src/cli/commands/origins.ts
var SURFACE = "cli:origins";
var originsAddCommand = async (input) => {
  const resolved = await resolveOrigin(SURFACE, input);
  if (!resolved.ok) return outputAndExit(resolved.error, input);
  const origin = addUserOrigin(resolved.origin);
  return outputAndExit(
    successResponse({
      url: origin.url,
      title: origin.title,
      description: origin.description,
      note: "Restart your MCP server for this origin to appear in the model context.",
      warnings: resolved.origin.warnings
    }),
    input
  );
};
var originsListCommand = (input) => {
  const primary = PRIMARY_ORIGINS.flatMap((o) => {
    const meta = ORIGIN_METADATA[o];
    return meta ? [{ url: o, title: meta.title, description: meta.description }] : [];
  });
  const added = loadUserOrigins();
  return outputAndExit(successResponse({ primary, added }), input);
};
var originsRemoveCommand = (input) => {
  const url = ensureProtocol(input.url);
  const result = removeUserOrigin(url);
  if (!result.removed) {
    const isPrimary = PRIMARY_ORIGINS.some((o) => String(o) === url);
    return outputAndExit(
      errorResponse(
        isPrimary ? {
          code: "GENERAL_ERROR",
          message: `Cannot remove primary origin: ${url}. Only user-added origins can be removed.`,
          surface: SURFACE,
          cause: "primary_origin"
        } : {
          code: "GENERAL_ERROR",
          message: `Origin not found: ${url}`,
          surface: SURFACE,
          cause: "not_found"
        }
      ),
      input
    );
  }
  return outputAndExit(successResponse({ removed: true, url }), input);
};
export {
  originsAddCommand,
  originsListCommand,
  originsRemoveCommand
};
//# sourceMappingURL=origins-MBWKIWLR.js.map