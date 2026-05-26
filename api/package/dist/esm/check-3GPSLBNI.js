import {
  checkEndpoint
} from "./chunk-5CMVFNXO.js";
import {
  cliRequestSchema
} from "./chunk-JKK2XT7N.js";
import "./chunk-7KT6UCTT.js";
import "./chunk-3PYQIEMA.js";
import "./chunk-IKPLMFAK.js";
import {
  RequestMethod
} from "./chunk-LNJIXYCU.js";
import {
  getWalletOrExit
} from "./chunk-7AT3NXJ2.js";
import "./chunk-F3KGAMIA.js";
import "./chunk-NPJV7AMV.js";
import "./chunk-KVSTJRSJ.js";
import "./chunk-FB5CMO3J.js";
import {
  errorResponse,
  outputAndExit,
  successResponse
} from "./chunk-7EBJ4BCH.js";
import "./chunk-QZCSZB7E.js";
import "./chunk-TTAO2EJK.js";
import "./chunk-YWNBUUBR.js";
import "./chunk-ITCDZXBZ.js";

// src/cli/commands/check.ts
import z from "zod";
var SURFACE = "cli:check";
var checkCommand = async (args) => {
  const requestInput = cliRequestSchema.extend({
    method: z.enum(RequestMethod).optional()
  }).safeParse(args);
  if (!requestInput.success) {
    return outputAndExit(
      errorResponse({
        code: "INVALID_INPUT",
        message: requestInput.error.message,
        surface: SURFACE,
        cause: "validation"
      }),
      args
    );
  }
  const wallets = await getWalletOrExit(args);
  const result = await checkEndpoint(SURFACE, requestInput.data, {
    wallets,
    flags: args
  });
  if (!result.found) {
    return outputAndExit(
      successResponse({
        url: args.url,
        results: [],
        error: result.cause,
        message: result.message
      }),
      args
    );
  }
  return outputAndExit(
    successResponse({ url: args.url, results: result.advisories }),
    args
  );
};
export {
  checkCommand
};
//# sourceMappingURL=check-3GPSLBNI.js.map