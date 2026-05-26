import {
  promptDeposit
} from "./chunk-BNFMFAEF.js";
import "./chunk-DZNSJ2BA.js";
import "./chunk-MSNAPI5G.js";
import "./chunk-ISF2WVEZ.js";
import "./chunk-BFOYXXLG.js";
import {
  getWallet
} from "./chunk-F3KGAMIA.js";
import "./chunk-NPJV7AMV.js";
import "./chunk-KVSTJRSJ.js";
import "./chunk-U6FRXL3X.js";
import {
  log
} from "./chunk-QZCSZB7E.js";
import "./chunk-YWNBUUBR.js";
import "./chunk-ITCDZXBZ.js";

// src/cli/commands/fund.ts
import { intro, log as clackLog, outro } from "@clack/prompts";
import chalk from "chalk";
var fundMcpServer = async (args) => {
  intro(chalk.bold(`Fund ${chalk.hex("#2563eb")("agentcash MCP")}`));
  const walletResult = await getWallet();
  if (walletResult.isErr()) {
    log.error(walletResult.error.message);
    clackLog.error(walletResult.error.message);
    outro(chalk.bold.red("Failed to get wallet"));
    process.exit(1);
  }
  await promptDeposit("fund", args, walletResult.value);
  outro(chalk.bold.green("Your agentcash MCP server is funded!"));
};
export {
  fundMcpServer
};
//# sourceMappingURL=fund-HHL4QEU5.js.map