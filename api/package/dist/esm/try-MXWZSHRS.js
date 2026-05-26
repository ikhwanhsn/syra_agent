import {
  getWalletInfo
} from "./chunk-YUPRVVFP.js";
import "./chunk-ISF2WVEZ.js";
import {
  discoverResources
} from "./chunk-L4U6AJW3.js";
import "./chunk-3PYQIEMA.js";
import "./chunk-KJCWPVQE.js";
import "./chunk-BFOYXXLG.js";
import {
  getWalletOrExit
} from "./chunk-7AT3NXJ2.js";
import "./chunk-F3KGAMIA.js";
import "./chunk-NPJV7AMV.js";
import "./chunk-KVSTJRSJ.js";
import "./chunk-FB5CMO3J.js";
import "./chunk-U6FRXL3X.js";
import {
  outputAndExit,
  successResponse
} from "./chunk-7EBJ4BCH.js";
import "./chunk-QZCSZB7E.js";
import "./chunk-TTAO2EJK.js";
import "./chunk-YWNBUUBR.js";
import "./chunk-ITCDZXBZ.js";

// src/cli/commands/try.ts
var surface = "cli:try";
var tryCommand = async (args) => {
  const wallets = await getWalletOrExit(args);
  const discoverResult = await discoverResources(surface, args, {
    flags: args
  });
  const walletInfo = await getWalletInfo(surface, wallets, args);
  const onboardingCta = walletInfo.onboardingCta;
  if (!discoverResult.found) {
    const origin = "origin" in discoverResult ? discoverResult.origin : args.url;
    return outputAndExit(
      successResponse({
        ...onboardingCta ? {
          onboardMessage: onboardingCta.message,
          onboardLink: onboardingCta.onboardLink
        } : {},
        notice: `No endpoints found for ${origin}. The origin may not support x402 or SIWX.`,
        resources: `Browse supported APIs at https://agentcash.dev/resources`
      }),
      args
    );
  }
  const paidEndpoints = discoverResult.endpoints.filter(
    (e) => e.authMode === "paid"
  );
  const sampleEndpoints = (paidEndpoints.length > 0 ? paidEndpoints : discoverResult.endpoints).slice(0, 3);
  const totalCount = discoverResult.endpoints.length;
  const title = discoverResult.info?.title ?? discoverResult.origin;
  const description = discoverResult.info?.description;
  const sampleLines = sampleEndpoints.map((e) => {
    const price = e.price ? ` (${e.price})` : "";
    return `  - ${e.summary}${price}`;
  });
  const originSummary = [
    `${title}${description ? ` \u2014 ${description}` : ""}`,
    "",
    "Sample endpoints:",
    ...sampleLines,
    ...totalCount > sampleEndpoints.length ? [
      `  ...and ${totalCount - sampleEndpoints.length} more. Run \`npx agentcash discover ${discoverResult.origin}\` to see all endpoints.`
    ] : []
  ].join("\n");
  const firstEndpoint = discoverResult.endpoints.find((e) => e.authMode === "paid") ?? discoverResult.endpoints[0];
  let callToAction;
  if (firstEndpoint) {
    const endpointUrl = `${discoverResult.origin}${firstEndpoint.path}`;
    callToAction = [
      `To call your first endpoint:`,
      `  1. Run \`npx agentcash check "${endpointUrl}"\` to get the input schema and pricing.`,
      `  2. Run \`npx agentcash fetch "${endpointUrl}" -m ${firstEndpoint.method}\` with the required body to make the call.`,
      `If you have the AgentCash MCP installed, you can also call this directly using the check_endpoint_schema and fetch tools.`
    ].join("\n");
  }
  const modelInstructions = [
    `Present the originSummary to the user, then ask them what they would like to do \u2014 e.g. "What would you like to do with ${title}?"`,
    ...onboardingCta ? [
      `IMPORTANT: The user has not yet onboarded. Show the onboard link VERBATIM as a clickable URL so the user can click it: ${onboardingCta.onboardLink}`
    ] : []
  ].join("\n");
  return outputAndExit(
    successResponse({
      ...onboardingCta ? {
        onboardMessage: onboardingCta.message,
        onboardLink: onboardingCta.onboardLink
      } : {},
      originSummary,
      callToAction,
      modelInstructions
    }),
    args
  );
};
export {
  tryCommand
};
//# sourceMappingURL=try-MXWZSHRS.js.map