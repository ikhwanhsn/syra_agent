import {
  executeFetch
} from "./chunk-JVMJVMWB.js";
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
import {
  safeParseJson
} from "./chunk-KVSTJRSJ.js";
import {
  ensureProtocol
} from "./chunk-FB5CMO3J.js";
import "./chunk-U6FRXL3X.js";
import {
  fromNeverthrowError,
  outputAndExit,
  successResponse
} from "./chunk-7EBJ4BCH.js";
import "./chunk-QZCSZB7E.js";
import "./chunk-TTAO2EJK.js";
import {
  err,
  ok
} from "./chunk-YWNBUUBR.js";
import "./chunk-ITCDZXBZ.js";

// src/operations/register.ts
import z from "zod";
var X402SCAN_URL = "https://www.x402scan.com/api/x402/registry/register-origin";
var MPPSCAN_URL = "https://www.mppscan.com/api/mpp/register";
var x402scanResponseSchema = z.object({
  success: z.boolean(),
  registered: z.number().optional(),
  failed: z.number().optional(),
  total: z.number().optional(),
  source: z.string().optional()
});
var mppscanDoneSchema = z.object({
  type: z.literal("done"),
  origin: z.object({
    id: z.string(),
    origin: z.string(),
    name: z.string()
  }),
  resourceCount: z.number()
});
async function registerX402Scan(url, options) {
  const { surface, wallets, flags } = options;
  const fetchResult = await executeFetch(
    {
      url: X402SCAN_URL,
      method: "POST" /* POST */,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin: url })
    },
    { surface, wallets, flags, params: {} }
  );
  if (fetchResult.isErr()) return fetchResult;
  const { response } = fetchResult.value;
  if (!response.ok) {
    return err("register", surface, {
      cause: "x402scan_http",
      message: `x402scan returned ${response.status} ${response.statusText}`
    });
  }
  const text = await response.text();
  const jsonResult = safeParseJson(surface, text);
  if (jsonResult.isErr()) return jsonResult;
  const parsed = x402scanResponseSchema.safeParse(jsonResult.value);
  if (!parsed.success) {
    return err("register", surface, {
      cause: "x402scan_parse",
      message: "Invalid x402scan response"
    });
  }
  return ok(parsed.data);
}
async function registerMppscan(url, options) {
  const { surface, wallets, flags } = options;
  const fetchResult = await executeFetch(
    {
      url: MPPSCAN_URL,
      method: "POST" /* POST */,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    },
    { surface, wallets, flags, params: {} }
  );
  if (fetchResult.isErr()) return fetchResult;
  const { response } = fetchResult.value;
  if (!response.ok) {
    return err("register", surface, {
      cause: "mppscan_http",
      message: `mppscan returned ${response.status} ${response.statusText}`
    });
  }
  const text = await response.text();
  const lines = text.trim().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const lineResult = safeParseJson(surface, lines[i]);
    if (lineResult.isErr()) continue;
    const parsed = mppscanDoneSchema.safeParse(lineResult.value);
    if (parsed.success) return ok(parsed.data);
  }
  return err("register", surface, {
    cause: "mppscan_parse",
    message: "No done message in mppscan response"
  });
}
async function registerOrigin(input, options) {
  const url = ensureProtocol(input.url);
  const [x402Result, mppResult] = await Promise.all([
    registerX402Scan(url, options),
    registerMppscan(url, options)
  ]);
  if (x402Result.isErr() && mppResult.isErr()) {
    return err("register", options.surface, {
      cause: "register_failed",
      message: `Both registries failed. x402scan: ${x402Result.error.message}. mppscan: ${mppResult.error.message}`
    });
  }
  return ok({
    x402scan: x402Result.isOk() ? x402Result.value : { success: false, error: x402Result.error.message },
    mppscan: mppResult.isOk() ? mppResult.value : { success: false, error: mppResult.error.message }
  });
}

// src/cli/commands/register.ts
var SURFACE = "cli:register";
var registerCommand = async (args) => {
  const wallets = await getWalletOrExit(args);
  const result = await registerOrigin(
    { url: args.url },
    { surface: SURFACE, wallets, flags: args }
  );
  if (result.isErr()) {
    return outputAndExit(fromNeverthrowError(result), args);
  }
  return outputAndExit(successResponse(result.value), args);
};
export {
  registerCommand
};
//# sourceMappingURL=register-NSQPYCWI.js.map