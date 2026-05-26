import {
  getState,
  setState
} from "./chunk-ISF2WVEZ.js";
import {
  safeFetchJson
} from "./chunk-BFOYXXLG.js";
import {
  optionalNetworkSchema
} from "./chunk-NPJV7AMV.js";
import {
  getBaseUrl
} from "./chunk-U6FRXL3X.js";
import {
  err,
  resultFromPromise
} from "./chunk-YWNBUUBR.js";

// src/shared/redeem-invite.ts
import z from "zod";
var redeemInviteResponseSchema = z.object({
  redemptionId: z.string(),
  txHash: z.string(),
  solanaTxHash: z.string().optional(),
  amount: z.coerce.number(),
  network: optionalNetworkSchema,
  prompts: z.array(
    z.object({
      label: z.string(),
      prompt: z.string(),
      resources: z.array(z.string())
    })
  ).optional(),
  connectedProviders: z.array(z.object({ platform: z.string(), username: z.string() })).optional(),
  email: z.string().optional()
});
var redeemInviteCode = async (surface, args, globalArgs, wallets) => {
  const state = getState();
  if (state.redeemedCodes?.includes(args.code)) {
    return err("user", surface, {
      cause: "conflict",
      message: "This invite code has already been redeemed"
    });
  }
  const result = await safeFetchJson(
    surface,
    new Request(`${getBaseUrl(globalArgs.dev)}/api/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: args.code,
        recipientAddr: wallets.evm.address,
        solanaAddr: wallets.svm.address
      })
    }),
    redeemInviteResponseSchema
  );
  if (result.isOk()) {
    setState({
      redeemedCodes: [...state.redeemedCodes ?? [], args.code]
    });
    return result;
  }
  const error = result.error;
  if (error.cause === "http" && error.response) {
    const bodyResult = await resultFromPromise(
      "user",
      surface,
      error.response.json(),
      () => ({
        cause: "parse",
        message: "Could not parse error response"
      })
    );
    if (bodyResult.isOk() && bodyResult.value.error) {
      return err("user", surface, {
        cause: "conflict",
        message: bodyResult.value.error
      });
    }
  }
  return result;
};

export {
  redeemInviteCode
};
//# sourceMappingURL=chunk-MSNAPI5G.js.map