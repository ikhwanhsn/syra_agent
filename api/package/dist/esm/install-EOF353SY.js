import {
  promptDeposit
} from "./chunk-BNFMFAEF.js";
import {
  addServer
} from "./chunk-CUZFVI2X.js";
import {
  wait
} from "./chunk-DZNSJ2BA.js";
import {
  redeemInviteCode
} from "./chunk-MSNAPI5G.js";
import {
  Clients,
  clientMetadata
} from "./chunk-27DZCYDB.js";
import "./chunk-QOMU3YLK.js";
import "./chunk-ISF2WVEZ.js";
import {
  getBalance
} from "./chunk-KJCWPVQE.js";
import "./chunk-BFOYXXLG.js";
import {
  getWallet
} from "./chunk-F3KGAMIA.js";
import {
  getTxExplorerUrl
} from "./chunk-NPJV7AMV.js";
import "./chunk-KVSTJRSJ.js";
import "./chunk-U6FRXL3X.js";
import {
  log
} from "./chunk-QZCSZB7E.js";
import "./chunk-YWNBUUBR.js";
import "./chunk-ITCDZXBZ.js";

// src/cli/commands/install/index.ts
import chalk4 from "chalk";
import { intro, outro as outro2 } from "@clack/prompts";

// src/cli/commands/install/1-get-client/index.ts
import z from "zod";
import { select, outro } from "@clack/prompts";
import chalk from "chalk";
var getClient = async ({ client, yes }) => {
  if (yes) {
    if (!client) {
      throw new Error(
        `Client is required when yes is true. Pass --client as one of these values: ${Object.values(Clients).join(", ")}`
      );
    }
    return client;
  }
  if (client) {
    return client;
  }
  const selectedClient = await select({
    message: "Where would you like to install the agentcash MCP server?",
    options: Object.values(Clients).map((client2) => {
      const metadata = clientMetadata[client2];
      return {
        label: metadata.name,
        value: client2
      };
    }),
    maxItems: 7
  });
  const parsedClientSelection = z.enum(Clients).safeParse(selectedClient);
  if (parsedClientSelection.success) {
    return parsedClientSelection.data;
  }
  outro(chalk.bold.red("No MCP client selected"));
  process.exit(0);
};

// src/cli/commands/install/3-redeem-invite/index.ts
import chalk2 from "chalk";
import { log as log2, spinner } from "@clack/prompts";
var SURFACE = "cli:redeem-invite";
var redeemInviteCode2 = async (args, wallets) => {
  const s = spinner();
  if (!args.yes) {
    s.start("Redeeming invite code...");
  }
  const result = await redeemInviteCode(SURFACE, args, args, wallets);
  return result.match(
    async ({ amount, txHash, network }) => {
      if (!args.yes) {
        s.stop("Invite code redeemed successfully!");
        await wait({
          startText: "Processing...",
          stopText: chalk2.green(
            `${chalk2.bold(amount)} USDC has been sent to your wallet!`
          ),
          ms: 1e3
        });
      }
      const resolvedNetwork = network === "solana" /* SOLANA */ ? "solana" /* SOLANA */ : "base" /* BASE */;
      log2.info(
        chalk2.dim(`Transaction: ${getTxExplorerUrl(txHash, resolvedNetwork)}`)
      );
      return true;
    },
    (error) => {
      if (!args.yes) {
        s.stop("Invite code redemption failed");
      }
      log2.warning(
        chalk2.yellow(`Failed to redeem invite code: ${error.message}`)
      );
      return false;
    }
  );
};

// src/cli/commands/install/4-add-funds/index.ts
import chalk3 from "chalk";
import { log as log3, spinner as spinner2 } from "@clack/prompts";
var addFunds = async ({ args, wallets }) => {
  const { start, stop } = spinner2();
  start("Checking balance...");
  const balanceResult = await getBalance(
    "add-funds",
    {
      address: wallets.evm.address,
      network: "base" /* BASE */
    },
    args
  );
  if (balanceResult.isOk()) {
    stop(`Balance: ${chalk3.bold(`${balanceResult.value.balance} USDC`)} `);
  } else {
    stop(`Error: ${balanceResult.error.message}`);
    return;
  }
  const balance = balanceResult.value.balance;
  if (balance === 0) {
    log3.info("To use paid API tools, you will need USDC in your wallet.");
    await promptDeposit("add-funds", args, wallets);
  } else {
    if (balance < 1) {
      log3.warning(
        chalk3.bold(`Your balance is low ($${balance}). Consider topping up.`)
      );
      await promptDeposit("install", args, wallets);
    }
  }
};

// src/cli/commands/install/index.ts
var installMcpServer = async (args) => {
  intro(chalk4.green.bold(`Install agentcash MCP`));
  const walletResult = await getWallet();
  if (walletResult.isErr()) {
    log.error(JSON.stringify(walletResult.error, null, 2));
    outro2(chalk4.bold.red("Failed to get wallet"));
    process.exit(1);
  }
  const client = await getClient(args);
  await addServer(client, args);
  const inviteRedeemed = args.invite ? await redeemInviteCode2(
    {
      ...args,
      code: args.invite
    },
    walletResult.value
  ) : false;
  if (!inviteRedeemed) {
    await addFunds({
      args,
      wallets: walletResult.value
    });
  }
  outro2(chalk4.bold.green("Your agentcash MCP server is ready to use!"));
};
export {
  installMcpServer
};
//# sourceMappingURL=install-EOF353SY.js.map