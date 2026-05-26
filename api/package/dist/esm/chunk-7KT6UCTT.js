import {
  REQUEST_FETCH_PARAMS,
  REQUEST_PARAMS
} from "./chunk-3PYQIEMA.js";
import {
  RequestMethod
} from "./chunk-LNJIXYCU.js";
import {
  zodUrl
} from "./chunk-FB5CMO3J.js";

// src/shared/request/schemas/core.ts
import z from "zod";
var requestMethodValues = Object.values(RequestMethod);
var methodSchema = z.enum(RequestMethod).optional().default("GET" /* GET */).describe(REQUEST_PARAMS.method);
var coreRequestSchema = z.object({
  url: zodUrl.describe(REQUEST_PARAMS.url),
  method: methodSchema
});
var paymentNetworks = [
  "base" /* BASE */,
  "solana" /* SOLANA */,
  "tempo" /* TEMPO */
];
var paymentProtocols = [
  "x402" /* X402 */,
  "mpp" /* MPP */
];
var fetchShape = {
  paymentNetwork: z.enum(paymentNetworks).optional().describe(REQUEST_FETCH_PARAMS.paymentNetwork),
  paymentProtocol: z.enum(paymentProtocols).optional().describe(REQUEST_FETCH_PARAMS.paymentProtocol),
  maxAmount: z.number().positive().optional().describe(REQUEST_FETCH_PARAMS.maxAmount),
  timeout: z.number().int().positive().optional().describe(REQUEST_PARAMS.timeout)
};

export {
  requestMethodValues,
  coreRequestSchema,
  paymentNetworks,
  paymentProtocols,
  fetchShape
};
//# sourceMappingURL=chunk-7KT6UCTT.js.map