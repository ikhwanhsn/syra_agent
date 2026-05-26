import {
  submitErrorReport
} from "./chunk-WRNDLZ3K.js";
import "./chunk-QOMU3YLK.js";
import "./chunk-BFOYXXLG.js";
import {
  getWalletOrExit
} from "./chunk-7AT3NXJ2.js";
import "./chunk-F3KGAMIA.js";
import "./chunk-KVSTJRSJ.js";
import "./chunk-U6FRXL3X.js";
import {
  fromNeverthrowError,
  outputAndExit,
  successResponse
} from "./chunk-7EBJ4BCH.js";
import "./chunk-QZCSZB7E.js";
import "./chunk-YWNBUUBR.js";
import "./chunk-ITCDZXBZ.js";

// src/cli/commands/report-error.ts
var SURFACE = "cli:report-error";
var reportErrorCommand = async (args) => {
  const {
    evm: { address }
  } = await getWalletOrExit(args);
  const result = await submitErrorReport(SURFACE, args, address, args.dev);
  if (result.isErr()) {
    return outputAndExit(fromNeverthrowError(result), args);
  }
  return outputAndExit(successResponse(result.value), args);
};
export {
  reportErrorCommand
};
//# sourceMappingURL=report-error-7RCKDM2N.js.map