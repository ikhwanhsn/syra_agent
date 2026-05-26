#!/usr/bin/env node
import {
  clients
} from "./chunk-27DZCYDB.js";
import {
  loadUserOrigins
} from "./chunk-YIU364NZ.js";
import {
  MCP_VERSION
} from "./chunk-QOMU3YLK.js";
import {
  paymentNetworks,
  paymentProtocols,
  requestMethodValues
} from "./chunk-7KT6UCTT.js";
import {
  DESCRIPTIONS,
  TOOL_PARAMS,
  buildServerInstructions
} from "./chunk-3PYQIEMA.js";
import "./chunk-LNJIXYCU.js";
import "./chunk-NPJV7AMV.js";
import "./chunk-KVSTJRSJ.js";
import "./chunk-FB5CMO3J.js";
import "./chunk-TTAO2EJK.js";
import "./chunk-YWNBUUBR.js";

// src/index.ts
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { randomBytes } from "crypto";
var isClaudeCode = Boolean(process.env.CLAUDECODE);
var defaultYes = isClaudeCode || Boolean(process.env.CI);
var configureFetchCommand = (command, params, epilogue) => command.positional("url", {
  type: "string",
  description: params.url,
  demandOption: true
}).option("method", {
  alias: "m",
  type: "string",
  description: params.method,
  choices: requestMethodValues
}).option("body", {
  alias: "b",
  type: "string",
  description: params.body
}).option("headers", {
  alias: ["H", "header"],
  type: "string",
  array: true,
  description: params.headers
}).option("timeout", {
  type: "number",
  description: params.timeout
}).option("payment-protocol", {
  alias: "p",
  type: "string",
  description: params.paymentProtocol,
  choices: paymentProtocols
}).option("payment-network", {
  type: "string",
  description: params.paymentNetwork,
  choices: paymentNetworks
}).option("max-amount", {
  type: "number",
  description: params.maxAmount
}).epilogue(epilogue);
void yargs(hideBin(process.argv)).scriptName("agentcash").usage("$0 [command] [options]").option("dev", {
  type: "boolean",
  description: "Enable dev mode (use localhost endpoints)",
  default: false
}).option("invite", {
  type: "string",
  description: "Invite code to redeem for starter money",
  required: false
}).option("yes", {
  alias: "y",
  type: "boolean",
  description: "Yes to all prompts",
  default: defaultYes ? true : void 0
}).option("sessionId", {
  type: "string",
  description: "Session ID for matching requests (auto-generated if not provided)",
  required: false,
  default: randomBytes(16).toString("hex")
}).option("provider", {
  type: "string",
  description: "Provider to use for the MCP server",
  required: false,
  default: `agentcash@${MCP_VERSION}`
}).option("format", {
  type: "string",
  description: "Output format: json (default for pipes) or pretty (default for TTY)",
  choices: ["json", "pretty"],
  default: process.stdout.isTTY ? "pretty" : "json"
}).option("quiet", {
  alias: "q",
  type: "boolean",
  description: "Suppress stderr output",
  default: false
}).option("verbose", {
  alias: "v",
  type: "boolean",
  description: "Enable verbose logging (debug output to stderr)",
  default: false
}).middleware(async (argv) => {
  if (argv.verbose) {
    const { configureCliContext } = await import("./context-FILUUWOR.js");
    configureCliContext({ verbose: true });
  }
}).command(
  "fetch <url>",
  DESCRIPTIONS.fetch.cli,
  (yargs2) => configureFetchCommand(
    yargs2,
    TOOL_PARAMS.fetch,
    DESCRIPTIONS.fetch.epilogue
  ),
  async (args) => {
    const { fetchCommand } = await import("./fetch-ZAECKP5C.js");
    await fetchCommand(args);
  }
).command(
  "fetch-auth <url>",
  DESCRIPTIONS.fetchWithAuth.cli,
  (yargs2) => configureFetchCommand(
    yargs2,
    TOOL_PARAMS.fetchWithAuth,
    DESCRIPTIONS.fetchWithAuth.epilogue
  ),
  async (args) => {
    const { fetchCommand } = await import("./fetch-ZAECKP5C.js");
    await fetchCommand(args);
  }
).command(
  "check <url>",
  DESCRIPTIONS.checkEndpointSchema.cli,
  (yargs2) => yargs2.positional("url", {
    type: "string",
    description: TOOL_PARAMS.checkEndpointSchema.url,
    demandOption: true
  }).option("method", {
    alias: "m",
    type: "string",
    description: TOOL_PARAMS.checkEndpointSchema.method,
    choices: requestMethodValues
  }).option("body", {
    alias: "b",
    type: "string",
    description: TOOL_PARAMS.checkEndpointSchema.body
  }).option("headers", {
    alias: ["H", "header"],
    type: "string",
    array: true,
    description: TOOL_PARAMS.checkEndpointSchema.headers
  }).epilogue(DESCRIPTIONS.checkEndpointSchema.epilogue),
  async (args) => {
    const { checkCommand } = await import("./check-3GPSLBNI.js");
    await checkCommand({
      ...args,
      url: args.url,
      method: args.method,
      body: args.body,
      headers: args.headers
    });
  }
).command(
  "try <url>",
  DESCRIPTIONS.try.cli,
  (yargs2) => yargs2.positional("url", {
    type: "string",
    description: TOOL_PARAMS.try.url,
    demandOption: true
  }),
  async (args) => {
    const { tryCommand } = await import("./try-MXWZSHRS.js");
    await tryCommand(args);
  }
).command(
  "search <query>",
  DESCRIPTIONS.search.cli,
  (yargs2) => yargs2.positional("query", {
    type: "string",
    description: TOOL_PARAMS.search.query,
    demandOption: true
  }).option("broad", {
    type: "boolean",
    description: TOOL_PARAMS.search.broad,
    default: false
  }).option("limit", {
    type: "number",
    description: TOOL_PARAMS.search.limit
  }).option("page", {
    type: "number",
    description: TOOL_PARAMS.search.page
  }),
  async (args) => {
    const { searchCommand } = await import("./search-SYBTWXON.js");
    await searchCommand(args);
  }
).command(
  "discover <url>",
  DESCRIPTIONS.discoverApiEndpoints.cli,
  (yargs2) => yargs2.positional("url", {
    type: "string",
    description: TOOL_PARAMS.discoverApiEndpoints.url,
    demandOption: true
  }).option("include-guidance", {
    type: "boolean",
    description: TOOL_PARAMS.discoverApiEndpoints.includeGuidance
  }).epilogue(DESCRIPTIONS.discoverApiEndpoints.epilogue),
  async (args) => {
    const { discoverCommand } = await import("./discover-TE2BZJMA.js");
    await discoverCommand(args);
  }
).command(
  "register <url>",
  "Register an origin with agentcash (discover + index endpoints)",
  (yargs2) => yargs2.positional("url", {
    type: "string",
    description: "The origin URL to register",
    demandOption: true
  }),
  async (args) => {
    const { registerCommand } = await import("./register-NSQPYCWI.js");
    await registerCommand(args);
  }
).command(
  "add <url>",
  "Add an origin and install its skill to agent clients. The origin is added to the MCP server description.",
  (yargs2) => yargs2.positional("url", {
    type: "string",
    description: TOOL_PARAMS.add.url,
    demandOption: true
  }),
  async (args) => {
    const { addSkillCommand } = await import("./add-skill-MO4YPAYM.js");
    await addSkillCommand(args);
  }
).command(
  "origins",
  "Manage registered origins",
  (yargs2) => yargs2.command(
    "add <url>",
    "Add an origin to agent clients. The origin is added to the MCP server description.",
    (yargs3) => yargs3.positional("url", {
      type: "string",
      description: "The origin URL to register",
      demandOption: true
    }),
    async (args) => {
      const { originsAddCommand } = await import("./origins-MBWKIWLR.js");
      await originsAddCommand(args);
    }
  ).command(
    "list",
    "List all registered origins",
    (yargs3) => yargs3,
    async (args) => {
      const { originsListCommand } = await import("./origins-MBWKIWLR.js");
      await originsListCommand(args);
    }
  ).command(
    "remove <url>",
    "Remove a user-added origin",
    (yargs3) => yargs3.positional("url", {
      type: "string",
      description: "The origin URL to remove",
      demandOption: true
    }),
    async (args) => {
      const { originsRemoveCommand } = await import("./origins-MBWKIWLR.js");
      await originsRemoveCommand(args);
    }
  ).demandCommand(1, "You must specify an origins subcommand").strict(),
  () => {
  }
).command(
  "onboard [code]",
  "Non-interactive onboarding flow for agentcash wallet + MCP setup",
  (yargs2) => yargs2.positional("code", {
    type: "string",
    description: "The invite code to redeem (optional)"
  }),
  async (args) => {
    const { onboardCommand } = await import("./onboard-EMUCEMFN.js");
    await onboardCommand({ ...args, code: args.code ?? args.invite });
  }
).command(
  "wallet",
  "Deprecated wallet command aliases",
  (yargs2) => yargs2.command(
    "info",
    "Deprecated alias. Prints migration guidance for 'balance' and 'accounts'.",
    (yargs3) => yargs3,
    async (args) => {
      const { legacyWalletInfoCommand } = await import("./wallet-QOS3FPSF.js");
      await legacyWalletInfoCommand(args);
    }
  ).command(
    "balance",
    "Deprecated alias. Prints migration guidance for 'balance'.",
    (yargs3) => yargs3,
    async (args) => {
      const { legacyWalletBalanceCommand } = await import("./wallet-QOS3FPSF.js");
      await legacyWalletBalanceCommand(args);
    }
  ).command(
    "redeem <code>",
    "Deprecated alias. Prints migration guidance for 'redeem <code>'.",
    (yargs3) => yargs3.positional("code", {
      type: "string",
      description: TOOL_PARAMS.redeemInvite.code,
      demandOption: true
    }),
    async (args) => {
      const { legacyWalletRedeemCommand } = await import("./wallet-QOS3FPSF.js");
      await legacyWalletRedeemCommand(args);
    }
  ).command(
    "address",
    "Deprecated alias for wallet address lookup.",
    (yargs3) => yargs3,
    async (args) => {
      const { legacyWalletAddressCommand } = await import("./wallet-QOS3FPSF.js");
      await legacyWalletAddressCommand(args);
    }
  ).demandCommand(1, "You must specify a wallet subcommand").strict(),
  () => {
  }
).command(
  "balance",
  DESCRIPTIONS.getBalance.cli,
  (yargs2) => yargs2,
  async (args) => {
    const { getBalanceCommand } = await import("./wallet-QOS3FPSF.js");
    await getBalanceCommand(args);
  }
).command(
  "accounts",
  DESCRIPTIONS.listAccounts.cli,
  (yargs2) => yargs2,
  async (args) => {
    const { listAccountsCommand } = await import("./wallet-QOS3FPSF.js");
    await listAccountsCommand(args);
  }
).command(
  "redeem <code>",
  DESCRIPTIONS.redeemInvite.cli,
  (yargs2) => yargs2.positional("code", {
    type: "string",
    description: TOOL_PARAMS.redeemInvite.code,
    demandOption: true
  }),
  async (args) => {
    const { walletRedeemCommand } = await import("./wallet-QOS3FPSF.js");
    await walletRedeemCommand(args);
  }
).command(
  "settings",
  "View and update user settings",
  (yargs2) => yargs2.command(
    "get",
    "Show current settings",
    (yargs3) => yargs3,
    async (args) => {
      const { settingsGetCommand } = await import("./settings-RLSKK5RM.js");
      await settingsGetCommand(args);
    }
  ).command(
    "set <key> <value>",
    "Update a setting (e.g. settings set maxAmount 10)",
    (yargs3) => yargs3.positional("key", {
      type: "string",
      description: "Setting name (e.g. maxAmount)",
      demandOption: true
    }).positional("value", {
      type: "string",
      description: "Setting value",
      demandOption: true
    }),
    async (args) => {
      const { settingsSetCommand } = await import("./settings-RLSKK5RM.js");
      await settingsSetCommand(args);
    }
  ).demandCommand(1, "You must specify a settings subcommand").strict(),
  () => {
  }
).command(
  "report-error",
  DESCRIPTIONS.reportError.cli,
  (yargs2) => yargs2.option("tool", {
    type: "string",
    description: TOOL_PARAMS.reportError.tool,
    demandOption: true
  }).option("summary", {
    type: "string",
    description: TOOL_PARAMS.reportError.summary,
    demandOption: true
  }).option("error-message", {
    type: "string",
    description: TOOL_PARAMS.reportError.errorMessage,
    demandOption: true
  }).option("resource", {
    type: "string",
    description: TOOL_PARAMS.reportError.resource
  }).option("stack", {
    type: "string",
    description: TOOL_PARAMS.reportError.stack
  }).option("full-report", {
    type: "string",
    description: TOOL_PARAMS.reportError.fullReport
  }),
  async (args) => {
    const { reportErrorCommand } = await import("./report-error-7RCKDM2N.js");
    await reportErrorCommand(args);
  }
).command(
  DESCRIPTIONS.bridge.toolNames.cli,
  DESCRIPTIONS.bridge.cli,
  (yargs2) => yargs2.option("from", {
    type: "string",
    description: TOOL_PARAMS.bridge.from,
    choices: paymentNetworks,
    required: true
  }).option("to", {
    type: "string",
    description: TOOL_PARAMS.bridge.to,
    choices: paymentNetworks,
    required: true
  }).option("amount", {
    type: "number",
    description: TOOL_PARAMS.bridge.amount,
    required: true
  }),
  async (args) => {
    const { bridgeCommand } = await import("./bridge-Q4YWH4WW.js");
    await bridgeCommand(args);
  }
).command(
  ["$0", "server"],
  "Start the MCP server (default when no command specified)",
  (yargs2) => yargs2,
  async (args) => {
    const { serverCommand } = await import("./server-ZIKTGUST.js");
    await serverCommand(args);
  }
).command(
  "install",
  "Install the MCP server configuration for a client",
  (yargs2) => yargs2.option("client", {
    type: "string",
    description: "The client name",
    choices: clients,
    required: false,
    default: isClaudeCode ? "claude-code" /* ClaudeCode */ : void 0
  }),
  async (args) => {
    const { installMcpServer } = await import("./install-EOF353SY.js");
    await installMcpServer(args);
  }
).command(
  "fund",
  "Open the funding page to add USDC to your wallet",
  (yargs2) => yargs2,
  async (args) => {
    const { fundMcpServer } = await import("./fund-HHL4QEU5.js");
    await fundMcpServer(args);
  }
).example(
  `$0 fetch "https://stableenrich.dev/api/apollo/people-enrich" -m POST -b '{"email":"user@example.com"}'`,
  "Fetch with x402 payment"
).example(
  '$0 check "https://stableenrich.dev/api/apollo/people-enrich"',
  "Check endpoint pricing"
).example(
  '$0 discover "https://stableenrich.dev"',
  "Discover endpoints on origin"
).example(
  '$0 register "https://stableenrich.dev"',
  "Register origin with agentcash"
).example(
  "$0 onboard ABC123",
  "Install onboarding skill, configure MCP, and redeem an invite"
).example('$0 search "flight data"', "Search for APIs by description").example("$0 balance", "Get wallet balance").example("$0 accounts", "List wallet accounts by network").example("$0 redeem ABC123", "Redeem invite code").example("$0", "Start MCP server (default)").example("$0 install --client cursor", "Install MCP for Cursor").strict().epilogue(buildServerInstructions(loadUserOrigins())).help().version(MCP_VERSION).parseAsync().catch((err) => {
  const response = {
    success: false,
    error: {
      code: "GENERAL_ERROR",
      message: err instanceof Error ? err.message : String(err),
      surface: "cli",
      cause: "unknown"
    }
  };
  console.log(JSON.stringify(response, null, 2));
  process.exit(1);
});
//# sourceMappingURL=index.js.map