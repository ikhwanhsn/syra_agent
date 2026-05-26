import {
  cliFetchRequestSchema
} from "./chunk-JKK2XT7N.js";
import "./chunk-7KT6UCTT.js";
import "./chunk-3PYQIEMA.js";
import {
  executeFetch
} from "./chunk-JVMJVMWB.js";
import "./chunk-JX2XE6FD.js";
import "./chunk-IKPLMFAK.js";
import "./chunk-LNJIXYCU.js";
import "./chunk-KJCWPVQE.js";
import {
  safeParseResponse
} from "./chunk-BFOYXXLG.js";
import {
  getWalletOrExit
} from "./chunk-7AT3NXJ2.js";
import "./chunk-F3KGAMIA.js";
import "./chunk-NPJV7AMV.js";
import "./chunk-KVSTJRSJ.js";
import "./chunk-FB5CMO3J.js";
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

// src/cli/commands/fetch.ts
var SURFACE = "cli:fetch";
var fetchCommand = async (input) => {
  const requestInput = cliFetchRequestSchema.safeParse(input);
  if (!requestInput.success) {
    return outputAndExit(
      errorResponse({
        code: "INVALID_INPUT",
        message: requestInput.error.message,
        surface: SURFACE,
        cause: "validation"
      }),
      input
    );
  }
  const wallets = await getWalletOrExit(input);
  const fetchResult = await executeFetch(requestInput.data, {
    surface: SURFACE,
    wallets,
    flags: input,
    params: input
  });
  if (fetchResult.isErr()) {
    return outputAndExit(fromNeverthrowError(fetchResult), input);
  }
  const { response, paymentInfo } = fetchResult.value;
  if (!response.ok) {
    const parseResult = await safeParseResponse(SURFACE, response);
    return outputAndExit(
      errorResponse({
        code: "HTTP_ERROR",
        message: response.statusText,
        surface: SURFACE,
        cause: "http",
        details: parseResult.match(
          (data2) => ({
            statusCode: response.status,
            type: data2.type,
            body: data2.type === "json" || data2.type === "text" ? data2.data : void 0
          }),
          () => ({ statusCode: response.status })
        )
      }),
      input
    );
  }
  const parseResponseResult = await safeParseResponse(SURFACE, response);
  if (parseResponseResult.isErr()) {
    return outputAndExit(fromNeverthrowError(parseResponseResult), input);
  }
  const parsedResponse = parseResponseResult.value;
  const data = parsedResponse.type === "json" || parsedResponse.type === "text" ? parsedResponse.data : { type: parsedResponse.type };
  outputAndExit(successResponse(data, paymentInfo), input);
};
export {
  fetchCommand
};
//# sourceMappingURL=fetch-ZAECKP5C.js.map