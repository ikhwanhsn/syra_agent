import {
  MCP_VERSION
} from "./chunk-QOMU3YLK.js";
import {
  safeFetchJson
} from "./chunk-BFOYXXLG.js";
import {
  getBaseUrl
} from "./chunk-U6FRXL3X.js";
import {
  ok
} from "./chunk-YWNBUUBR.js";

// src/operations/report-error.ts
import { z } from "zod";
async function submitErrorReport(surface, input, address, dev) {
  const telemetryResult = await safeFetchJson(
    surface,
    new Request(`${getBaseUrl(dev)}/api/telemetry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tool: input.tool,
        summary: input.summary,
        errorMessage: input.errorMessage,
        resource: input.resource,
        stack: input.stack,
        fullReport: input.fullReport,
        walletAddress: address,
        mcpVersion: MCP_VERSION,
        reportedAt: (/* @__PURE__ */ new Date()).toISOString()
      })
    }),
    z.object({
      reportId: z.string()
    })
  );
  if (telemetryResult.isErr()) {
    return telemetryResult;
  }
  const { reportId } = telemetryResult.value;
  return ok({
    submitted: true,
    reportId,
    message: "Error report submitted successfully. The agentcash team will investigate."
  });
}

export {
  submitErrorReport
};
//# sourceMappingURL=chunk-WRNDLZ3K.js.map