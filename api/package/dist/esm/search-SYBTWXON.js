import {
  search
} from "./chunk-ONGJJBKT.js";
import "./chunk-3PYQIEMA.js";
import "./chunk-JVMJVMWB.js";
import "./chunk-JX2XE6FD.js";
import "./chunk-IKPLMFAK.js";
import "./chunk-LNJIXYCU.js";
import "./chunk-KJCWPVQE.js";
import "./chunk-BFOYXXLG.js";
import {
  getWalletOrExit
} from "./chunk-7AT3NXJ2.js";
import "./chunk-F3KGAMIA.js";
import "./chunk-NPJV7AMV.js";
import "./chunk-KVSTJRSJ.js";
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

// src/cli/commands/search.ts
var SURFACE = "cli:search";
var searchCommand = async (input) => {
  const wallets = await getWalletOrExit(input);
  const result = await search(
    {
      query: input.query,
      broad: input.broad,
      limit: input.limit,
      page: input.page
    },
    { surface: SURFACE, wallets, flags: input }
  );
  if (!result.success) {
    return outputAndExit(
      errorResponse({
        code: "GENERAL_ERROR",
        message: result.message,
        surface: SURFACE,
        cause: result.cause
      }),
      input
    );
  }
  return outputAndExit(successResponse(result), input);
};
export {
  searchCommand
};
//# sourceMappingURL=search-SYBTWXON.js.map