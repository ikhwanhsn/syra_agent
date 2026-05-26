import {
  buildRequestHeaders
} from "./chunk-IKPLMFAK.js";
import {
  safeParseJson,
  safeToJsonObject
} from "./chunk-KVSTJRSJ.js";
import {
  log
} from "./chunk-QZCSZB7E.js";

// src/operations/check-endpoint.ts
import { checkEndpointSchema } from "@agentcash/discovery";
async function checkEndpoint(surface, requestInput, context) {
  const { url, method, body } = requestInput;
  log.info("Checking endpoint", {
    surface,
    url,
    method,
    hasSampleInputBody: !!body
  });
  const requestHeaders = buildRequestHeaders(requestInput.headers, context);
  const result = await checkEndpointSchema({
    url,
    sampleInputBody: body ? safeParseJson(surface, body).match(
      (json) => json,
      () => void 0
    ) : void 0,
    headers: Object.fromEntries(requestHeaders.entries())
  });
  if (!result.found) {
    log.error(`[checkEndpoint failed`, {
      surface,
      url,
      cause: result.cause,
      message: result.message
    });
    return result;
  }
  const advisories = method ? result.advisories.filter((a) => a.method === method) : result.advisories;
  return {
    ...result,
    advisories: advisories.map((a) => ({
      ...a,
      inputSchema: safeToJsonObject(surface, a.inputSchema).match(
        (json) => json,
        () => void 0
      ),
      outputSchema: safeToJsonObject(surface, a.outputSchema).match(
        (json) => json,
        () => void 0
      ),
      paymentOptions: safeToJsonObject(surface, a.paymentOptions).match(
        (json) => json,
        () => void 0
      ),
      paymentRequiredBody: safeToJsonObject(
        surface,
        a.paymentRequiredBody
      ).match(
        (json) => json,
        () => void 0
      ),
      requiresPayment: a.authMode === "paid" || a.authMode === "apiKey+paid"
    }))
  };
}

export {
  checkEndpoint
};
//# sourceMappingURL=chunk-5CMVFNXO.js.map