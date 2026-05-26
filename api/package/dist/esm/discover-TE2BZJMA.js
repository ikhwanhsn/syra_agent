import {
  discoverResources
} from "./chunk-L4U6AJW3.js";
import "./chunk-3PYQIEMA.js";
import "./chunk-FB5CMO3J.js";
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

// src/cli/commands/discover.ts
var discoverCommand = async (input) => {
  const result = await discoverResources("cli:discover", input, {
    flags: input
  });
  if (result.found) {
    return outputAndExit(successResponse(result), input);
  }
  const origin = "origin" in result ? result.origin : input.url;
  return outputAndExit(
    errorResponse({
      code: "GENERAL_ERROR",
      message: result.message ?? `No OpenAPI spec found for ${origin}. Tried: /openapi.json, /.well-known/x402`,
      surface: "cli:discover",
      cause: result.cause,
      details: { origin }
    }),
    input
  );
};
export {
  discoverCommand
};
//# sourceMappingURL=discover-TE2BZJMA.js.map