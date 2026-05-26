import {
  bridge,
  bridgeSchema
} from "./chunk-2OKYUR7B.js";
import {
  DESCRIPTIONS
} from "./chunk-3PYQIEMA.js";
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
  fromNeverthrowError,
  outputAndExit,
  successResponse
} from "./chunk-7EBJ4BCH.js";
import "./chunk-QZCSZB7E.js";
import "./chunk-TTAO2EJK.js";
import "./chunk-YWNBUUBR.js";
import "./chunk-ITCDZXBZ.js";

// src/cli/commands/bridge.ts
var SURFACE = `cli:${DESCRIPTIONS.bridge.toolNames.cli}`;
var bridgeCommand = async (args) => {
  const wallets = await getWalletOrExit(args);
  const parsedArgs = bridgeSchema.safeParse(args);
  if (!parsedArgs.success) {
    return outputAndExit(
      errorResponse({
        code: "INVALID_INPUT",
        message: parsedArgs.error.message,
        surface: SURFACE,
        cause: "validation"
      }),
      args
    );
  }
  const bridgeResult = await bridge({ ...args, ...parsedArgs.data }, wallets);
  if (bridgeResult.isErr()) {
    return outputAndExit(fromNeverthrowError(bridgeResult), args);
  }
  return outputAndExit(
    successResponse({
      success: true
    }),
    args
  );
};
export {
  bridgeCommand
};
//# sourceMappingURL=bridge-Q4YWH4WW.js.map