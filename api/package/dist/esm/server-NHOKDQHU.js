import {
  redeemInviteCode
} from "./chunk-MSNAPI5G.js";
import {
  submitErrorReport
} from "./chunk-WRNDLZ3K.js";
import {
  bridge,
  bridgeSchema
} from "./chunk-2OKYUR7B.js";
import {
  loadUserOrigins
} from "./chunk-YIU364NZ.js";
import "./chunk-QOMU3YLK.js";
import {
  checkEndpoint
} from "./chunk-5CMVFNXO.js";
import {
  coreRequestSchema,
  fetchShape
} from "./chunk-7KT6UCTT.js";
import {
  getBalances,
  listAccountsWithBalances
} from "./chunk-YUPRVVFP.js";
import "./chunk-ISF2WVEZ.js";
import {
  search,
  searchSchema
} from "./chunk-ONGJJBKT.js";
import {
  discoverResources,
  discoverResourcesSchema
} from "./chunk-L4U6AJW3.js";
import {
  DESCRIPTIONS,
  TOOL_PARAMS,
  buildServerInstructions
} from "./chunk-3PYQIEMA.js";
import {
  executeFetch
} from "./chunk-JVMJVMWB.js";
import {
  DEFAULT_MAX_AMOUNT,
  getSettings,
  setSettings
} from "./chunk-JX2XE6FD.js";
import "./chunk-IKPLMFAK.js";
import {
  RequestMethod
} from "./chunk-LNJIXYCU.js";
import "./chunk-KJCWPVQE.js";
import {
  fetchHttpErr,
  isFetchError,
  safeParseResponse
} from "./chunk-BFOYXXLG.js";
import {
  getWallet
} from "./chunk-F3KGAMIA.js";
import "./chunk-NPJV7AMV.js";
import {
  safeStringifyJson
} from "./chunk-KVSTJRSJ.js";
import "./chunk-FB5CMO3J.js";
import "./chunk-U6FRXL3X.js";
import {
  log
} from "./chunk-QZCSZB7E.js";
import "./chunk-TTAO2EJK.js";
import {
  resultFromPromise
} from "./chunk-YWNBUUBR.js";
import "./chunk-ITCDZXBZ.js";

// src/server/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// src/server/tools/response/lib.ts
var parsedResponseToToolContentPart = (data) => {
  switch (data.type) {
    case "json":
      return {
        type: "text",
        text: JSON.stringify(data.data)
      };
    case "image":
      return {
        type: "image",
        mimeType: data.mimeType,
        data: Buffer.from(data.data).toString("base64")
      };
    case "audio":
      return {
        type: "audio",
        mimeType: data.mimeType,
        data: Buffer.from(data.data).toString("base64")
      };
    case "text":
      return { type: "text", text: data.data };
    default:
      return {
        type: "text",
        text: `Unsupported response type: ${data.type}`
      };
  }
};

// src/server/tools/response/error.ts
var buildMcpError = (content, options) => {
  return {
    content,
    // Default: omit isError so siblings survive parallel calls.
    // Tools with outputSchema MUST pass isError: true so the SDK
    // skips output validation on error paths.
    ...options?.isError ? { isError: true } : {}
  };
};
var mcpErrorJson = (error, options) => {
  return safeStringifyJson("mcp-error-json", error).match(
    (success) => buildMcpError([{ type: "text", text: success }], options),
    (error2) => buildMcpError(
      [{ type: "text", text: JSON.stringify(error2, null, 2) }],
      options
    )
  );
};
var mcpError = async (err, options) => {
  const { error } = err;
  if (isFetchError(error)) {
    switch (error.cause) {
      case "network":
      case "parse":
        return mcpErrorJson({ ...error }, options);
      case "http":
        const { response, ...rest } = error;
        const parseResponseResult = await safeParseResponse(
          "mcp-error-fetch-parse-response",
          response
        );
        const httpContent = [
          { type: "text", text: JSON.stringify(rest, null, 2) },
          ...parseResponseResult.match(
            (success) => [parsedResponseToToolContentPart(success)],
            () => []
          )
        ];
        return buildMcpError(httpContent, options);
    }
  }
  return mcpErrorJson({ ...error }, options);
};
var mcpErrorFetch = async (surface, response) => {
  return mcpError(fetchHttpErr(surface, response));
};

// src/server/tools/response/success.ts
var buildMcpSuccess = (content) => {
  return {
    content
  };
};
var mcpSuccessJson = (data) => {
  return safeStringifyJson("mcp-success-text", data).match(
    (success) => buildMcpSuccess([{ type: "text", text: success }]),
    (error) => mcpErrorJson(error)
  );
};
var mcpSuccessStructuredJson = (data) => {
  return safeStringifyJson("mcp-success-structured", data).match(
    (success) => ({
      content: [{ type: "text", text: success }],
      structuredContent: data
    }),
    (error) => mcpErrorJson(error)
  );
};
var mcpSuccessResponse = (data, extra) => {
  const parsedExtra = extra ? safeStringifyJson("mcp-success-extra", extra).match(
    (success) => success,
    () => void 0
  ) : void 0;
  return buildMcpSuccess([
    parsedResponseToToolContentPart(data),
    ...parsedExtra ? [{ type: "text", text: parsedExtra }] : []
  ]);
};

// src/server/tools/response/safe-handler.ts
function safeHandler(handler) {
  return async (input) => {
    try {
      return await handler(input);
    } catch (e) {
      log.error("Unhandled tool error", e);
      return mcpErrorJson({
        error: e instanceof Error ? e.message : String(e),
        cause: "unhandled_exception"
      });
    }
  };
}

// src/shared/request/schemas/mcp.ts
import z from "zod";
var mcpBodySchema = z.union([
  z.string().describe(
    "Raw request body string. Passed through to the underlying fetch call as-is."
  ),
  z.record(z.string(), z.unknown()).transform((json) => JSON.stringify(json)).describe("JSON object to be sent as the request body")
]).optional().describe(
  "Request body. Can be a string or an object that will be stringified."
);
var mcpRequestSchema = coreRequestSchema.extend({
  body: mcpBodySchema,
  headers: z.record(z.string(), z.string()).optional().default({}).transform(
    (headers) => Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [key, value.trim()])
    )
  ).describe("Additional headers to include as a key-value pair")
});
var mcpFetchRequestSchema = mcpRequestSchema.extend(fetchShape);

// src/server/tools/fetch.ts
var TOOL_NAME = "fetch";
var registerFetchTool = (props) => {
  const { server, wallets, flags } = props;
  server.registerTool(
    TOOL_NAME,
    {
      title: DESCRIPTIONS.fetch.mcp,
      description: DESCRIPTIONS.fetch.mcp,
      inputSchema: mcpFetchRequestSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    safeHandler(async (input) => {
      const fetchResult = await executeFetch(input, {
        surface: TOOL_NAME,
        wallets,
        flags,
        params: input
      });
      if (fetchResult.isErr()) {
        return mcpError(fetchResult);
      }
      const { response, paymentInfo } = fetchResult.value;
      if (!response.ok) {
        return mcpErrorFetch(TOOL_NAME, response);
      }
      const parseResponseResult = await safeParseResponse(TOOL_NAME, response);
      if (parseResponseResult.isErr()) {
        return mcpError(parseResponseResult);
      }
      return mcpSuccessResponse(
        parseResponseResult.value,
        paymentInfo ?? void 0
      );
    })
  );
};

// src/server/tools/wallet.ts
var registerWalletTools = ({
  server,
  wallets,
  flags
}) => {
  const getBalanceToolName = "get_balance";
  server.registerTool(
    getBalanceToolName,
    {
      title: "Get Balance",
      description: DESCRIPTIONS.getBalance.mcp
    },
    async () => {
      const result = await getBalances(getBalanceToolName, wallets, flags);
      return mcpSuccessStructuredJson({
        balance: result.totalBalance
      });
    }
  );
  const listAccountsToolName = "list_accounts";
  server.registerTool(
    listAccountsToolName,
    {
      title: "Get Accounts",
      description: DESCRIPTIONS.listAccounts.mcp,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async () => {
      const result = await listAccountsWithBalances(
        listAccountsToolName,
        wallets,
        flags
      );
      return mcpSuccessStructuredJson(result);
    }
  );
};

// src/server/tools/check-endpoint.ts
import z2 from "zod";
var toolName = "check_endpoint_schema";
var registerCheckEndpointTool = ({
  server,
  wallets,
  flags
}) => {
  server.registerTool(
    toolName,
    {
      title: "Check Endpoint Schema",
      description: DESCRIPTIONS.checkEndpointSchema.mcp,
      inputSchema: mcpRequestSchema.extend({
        method: z2.enum(RequestMethod).optional().describe(TOOL_PARAMS.checkEndpointSchema.method),
        body: mcpBodySchema.describe(TOOL_PARAMS.checkEndpointSchema.body)
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    safeHandler(async (input) => {
      log.info("Querying endpoint", {
        url: input.url,
        method: input.method,
        hasSampleInputBody: !!input.body
      });
      const result = await checkEndpoint(toolName, input, { wallets, flags });
      if (!result.found) {
        log.error("[checkEndpoint] failed", {
          surface: toolName,
          url: input.url,
          cause: result.cause,
          message: result.message
        });
        return mcpSuccessJson({
          message: "No endpoint schema found for this URL.",
          url: input.url
        });
      }
      if (result.advisories.length === 0) {
        return mcpSuccessJson({
          message: "No endpoint schema found for this URL.",
          url: input.url
        });
      }
      return mcpSuccessJson({
        url: input.url,
        results: result.advisories
      });
    })
  );
};

// src/server/tools/redeem-invite.ts
import z3 from "zod";
var SURFACE = "server:redeem-invite";
var registerRedeemInviteTool = ({
  server,
  wallets,
  flags
}) => {
  server.registerTool(
    "redeem_invite",
    {
      title: "Redeem Invite",
      description: DESCRIPTIONS.redeemInvite.mcp,
      inputSchema: z3.object({
        code: z3.string().min(1).describe(TOOL_PARAMS.redeemInvite.code)
      }),
      outputSchema: z3.object({
        redeemed: z3.literal(true),
        amount: z3.string().describe(TOOL_PARAMS.redeemInvite.output.amount),
        txHash: z3.string().describe(TOOL_PARAMS.redeemInvite.output.txHash)
      }),
      annotations: {
        readOnlyHint: false,
        // Modifies wallet balance
        destructiveHint: false,
        // Additive (adds funds), not destructive
        idempotentHint: false,
        // Same code can't be redeemed twice - second attempt fails
        openWorldHint: true
      }
    },
    async (args) => {
      const result = await redeemInviteCode(
        SURFACE,
        { code: args.code },
        flags,
        wallets
      );
      if (result.isErr()) {
        return mcpError(result, { isError: true });
      }
      const { amount, txHash, solanaTxHash, network } = result.value;
      const effectiveTxHash = solanaTxHash ?? txHash;
      const explorerUrl = solanaTxHash || network === "solana" /* SOLANA */ ? `https://solscan.io/tx/${effectiveTxHash}` : `https://basescan.org/tx/${effectiveTxHash}`;
      return mcpSuccessStructuredJson({
        redeemed: true,
        amount: `${amount} USDC`,
        txHash: effectiveTxHash,
        explorerUrl
      });
    }
  );
};

// src/server/tools/telemetry.ts
import z4 from "zod";
var toolName2 = "report_error";
var registerTelemetryTools = ({
  server,
  wallets,
  flags
}) => {
  server.registerTool(
    toolName2,
    {
      title: "Report Error",
      description: DESCRIPTIONS.reportError.mcp,
      inputSchema: z4.object({
        tool: z4.string().describe(TOOL_PARAMS.reportError.tool),
        resource: z4.string().optional().describe(TOOL_PARAMS.reportError.resource),
        summary: z4.string().describe(TOOL_PARAMS.reportError.summary),
        errorMessage: z4.string().describe(TOOL_PARAMS.reportError.errorMessage),
        stack: z4.string().optional().describe(TOOL_PARAMS.reportError.stack),
        fullReport: z4.string().optional().describe(TOOL_PARAMS.reportError.fullReport)
      }),
      outputSchema: z4.object({
        submitted: z4.literal(true),
        reportId: z4.string().describe(TOOL_PARAMS.reportError.output.reportId),
        message: z4.string().describe(TOOL_PARAMS.reportError.output.message)
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (input) => {
      log.info("Submitting error report", {
        tool: input.tool,
        resource: input.resource,
        summary: input.summary
      });
      const result = await submitErrorReport(
        toolName2,
        {
          tool: input.tool,
          summary: input.summary,
          errorMessage: input.errorMessage,
          resource: input.resource,
          stack: input.stack,
          fullReport: input.fullReport
        },
        wallets.evm.address,
        flags.dev
      );
      if (result.isErr()) {
        log.error("Failed to submit error report", result.error);
        return mcpError(result, { isError: true });
      }
      log.info("Error report submitted successfully", {
        reportId: result.value.reportId
      });
      return mcpSuccessStructuredJson(result.value);
    }
  );
};

// src/server/tools/discover-resources.ts
var toolName3 = "discover_api_endpoints";
var OPENAPI_TRIED_PATHS = "/openapi.json, /.well-known/x402";
var registerDiscoveryTools = ({ server, flags }) => {
  server.registerTool(
    toolName3,
    {
      title: "Discover API Endpoints",
      description: DESCRIPTIONS.discoverApiEndpoints.mcp,
      inputSchema: discoverResourcesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    safeHandler(async (args) => {
      log.info(`Discovering resources for: ${args.url}`);
      const discoverResult = await resultFromPromise(
        "discover",
        toolName3,
        discoverResources(toolName3, args, { flags }),
        (e) => ({
          cause: "discover",
          message: e instanceof Error ? e.message : String(e)
        })
      );
      if (discoverResult.isErr()) {
        return mcpError(discoverResult);
      }
      const result = discoverResult.value;
      if (result.found) {
        return mcpSuccessJson(result);
      }
      if (result.cause === "not_found") {
        return mcpSuccessJson({
          found: false,
          origin: result.origin,
          error: `No OpenAPI spec found. Tried: ${OPENAPI_TRIED_PATHS}`
        });
      }
      return mcpSuccessJson({
        found: false,
        cause: result.cause,
        error: result.message ?? `Failed to fetch OpenAPI spec`,
        hint: hintMap[result.cause] ?? `The server returned an unparseable response. Tried: ${OPENAPI_TRIED_PATHS}`
      });
    })
  );
};
var hintMap = {
  timeout: "The server may be slow or unreachable. Try again later.",
  network: "Could not reach the server. Check the network connection and try again.",
  invalid_input: "Invalid input. Please check the input and try again."
};

// src/server/tools/settings.ts
import { z as z5 } from "zod";
var registerSettingsTools = ({ server }) => {
  server.registerTool(
    "update_settings",
    {
      title: "Update Settings",
      description: DESCRIPTIONS.updateSettings.mcp,
      inputSchema: z5.object({
        maxAmount: z5.number().positive().optional().describe(
          `Maximum amount (USD) to pay per fetch request. Current default: $${DEFAULT_MAX_AMOUNT}.`
        )
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    safeHandler((input) => {
      if (input.maxAmount !== void 0) {
        setSettings({ maxAmount: input.maxAmount });
      }
      const settings = getSettings();
      return Promise.resolve(mcpSuccessStructuredJson(settings));
    })
  );
  server.registerTool(
    "get_settings",
    {
      title: "Get Settings",
      description: DESCRIPTIONS.getSettings.mcp,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    safeHandler(() => {
      const settings = getSettings();
      return Promise.resolve(mcpSuccessStructuredJson(settings));
    })
  );
};

// src/server/tools/bridge.ts
var toolName4 = DESCRIPTIONS.bridge.toolNames.mcp;
var registerBridgeTool = ({
  server,
  wallets,
  flags
}) => {
  server.registerTool(
    toolName4,
    {
      title: DESCRIPTIONS.bridge.title,
      description: DESCRIPTIONS.bridge.mcp,
      inputSchema: bridgeSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false
      }
    },
    safeHandler(async (input) => {
      const result = await bridge({ ...input, ...flags }, wallets);
      if (result.isErr()) {
        return mcpError(result);
      }
      return mcpSuccessJson(result.value);
    })
  );
};

// src/server/tools/search.ts
var TOOL_NAME2 = "search";
var registerSearchTool = ({
  server,
  wallets,
  flags
}) => {
  server.registerTool(
    TOOL_NAME2,
    {
      title: "Search APIs",
      description: DESCRIPTIONS.search.mcp,
      inputSchema: searchSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    safeHandler(async (args) => {
      log.info(`[search] query: ${args.query}`);
      const searchResult = await resultFromPromise(
        "search",
        TOOL_NAME2,
        search(args, { surface: TOOL_NAME2, wallets, flags }),
        (e) => ({
          cause: "search",
          message: e instanceof Error ? e.message : String(e)
        })
      );
      if (searchResult.isErr()) {
        return mcpError(searchResult);
      }
      const result = searchResult.value;
      if (!result.success) {
        return mcpErrorJson({
          error: result.message,
          cause: result.cause,
          details: result.details
        });
      }
      return mcpSuccessJson({
        success: result.success,
        results: result.results
      });
    })
  );
};

// src/server/lib/version.ts
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
function getVersion() {
  if (true) {
    return "0.14.4";
  }
  const __dirname2 = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(
    readFileSync(join(__dirname2, "../../../package.json"), "utf-8")
  );
  return pkg.version;
}
var MCP_VERSION = getVersion();

// src/server/index.ts
var startServer = async (flags) => {
  log.info("Starting agentcash...");
  const { invite, sessionId } = flags;
  const walletResult = await getWallet();
  if (walletResult.isErr()) {
    log.error(JSON.stringify(walletResult.error, null, 2));
    process.exit(1);
  }
  const wallets = walletResult.value;
  const code = invite ?? process.env.INVITE_CODE;
  if (code) {
    await redeemInviteCode("startServer", { code }, flags, wallets);
  }
  const serverInstructions = buildServerInstructions(loadUserOrigins());
  const server = new McpServer(
    {
      name: "agentcash",
      title: "AgentCash",
      version: MCP_VERSION,
      websiteUrl: "https://agentcash.dev",
      icons: [{ src: "https://agentcash.dev/favicon.svg" }],
      description: serverInstructions
    },
    {
      instructions: serverInstructions
    }
  );
  const props = {
    server,
    wallets,
    flags,
    sessionId
  };
  registerFetchTool(props);
  registerWalletTools(props);
  registerCheckEndpointTool(props);
  registerRedeemInviteTool(props);
  registerDiscoveryTools(props);
  registerTelemetryTools(props);
  registerSettingsTools(props);
  registerBridgeTool(props);
  registerSearchTool(props);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const shutdown = async () => {
    log.info("Shutting down...");
    await server.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
};
export {
  startServer
};
//# sourceMappingURL=server-NHOKDQHU.js.map