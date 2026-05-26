import {
  wait
} from "./chunk-DZNSJ2BA.js";
import {
  redeemInviteCode
} from "./chunk-MSNAPI5G.js";
import {
  EVM_CONFIGS,
  getTxExplorerUrl
} from "./chunk-NPJV7AMV.js";
import {
  getDepositLink
} from "./chunk-U6FRXL3X.js";

// src/cli/lib/deposit.ts
import chalk from "chalk";
import { select, text, log, spinner } from "@clack/prompts";
import open from "open";
var promptDeposit = async (surface, args, wallets) => {
  const depositLink = getDepositLink(wallets.evm.address, args);
  const depositChoice = args.yes || surface === "guided" ? "manual" : await select({
    message: chalk.bold("How would you like to deposit?"),
    initialValue: "guided",
    options: [
      {
        label: "Guided - Recommended",
        value: "guided",
        hint: "Online portal in agentcash"
      },
      {
        label: "Manual",
        value: "manual",
        hint: "Print deposit instructions"
      },
      {
        label: "Redeem Invite Code",
        value: "invite",
        hint: "Enter an invite code for starter money"
      },
      {
        label: "Skip",
        value: void 0,
        hint: "Skip deposit process - functionality limited"
      }
    ]
  });
  if (depositChoice === "guided") {
    await wait({
      startText: "Opening deposit page...",
      stopText: `Opening ${chalk.underline.hex("#2563eb")(depositLink)}`,
      ms: 1e3
    });
    await open(depositLink);
  } else if (depositChoice === "manual") {
    log.step(chalk.bold("Account Information"));
    log.message(`Address: ${wallets.evm.address}`);
    log.message(`Network: ${EVM_CONFIGS["base" /* BASE */].name}`);
    log.step(chalk.bold("Online Portal"));
    log.message(`${chalk.underline(depositLink)}`);
  } else if (depositChoice === "invite") {
    const code = await text({
      message: "Enter your invite code",
      placeholder: "MRT-XXXXX",
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return "Please enter an invite code";
        }
      }
    });
    if (typeof code !== "string") {
      return promptDeposit(surface, args, wallets);
    }
    const s = spinner();
    s.start("Redeeming invite code...");
    const redeemResult = await redeemInviteCode(
      surface,
      { code },
      args,
      wallets
    );
    if (redeemResult.isErr()) {
      s.stop("Invite code redemption failed");
      log.error("Failed to redeem invite code");
      return promptDeposit(surface, args, wallets);
    }
    s.stop("Invite code redeemed successfully!");
    const { amount, txHash, network } = redeemResult.value;
    await wait({
      startText: "Processing...",
      stopText: chalk.green(
        `${chalk.bold(amount)} USDC has been sent to your wallet!`
      ),
      ms: 1500
    });
    log.success(chalk.bold(`Your wallet has been funded with ${amount} USDC`));
    if (txHash) {
      const resolvedNetwork = network === "solana" /* SOLANA */ ? "solana" /* SOLANA */ : "base" /* BASE */;
      log.info(
        chalk.dim(`Transaction: ${getTxExplorerUrl(txHash, resolvedNetwork)}`)
      );
    }
    return;
  }
};

export {
  promptDeposit
};
//# sourceMappingURL=chunk-BNFMFAEF.js.map