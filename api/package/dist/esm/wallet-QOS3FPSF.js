import {
  installGitHubSkill
} from "./chunk-UCADMHNP.js";
import "./chunk-FVVSNDQR.js";
import {
  redeemInviteCode
} from "./chunk-MSNAPI5G.js";
import {
  getBalances,
  listAccountsWithAddresses,
  listAccountsWithBalances
} from "./chunk-YUPRVVFP.js";
import "./chunk-ISF2WVEZ.js";
import "./chunk-KJCWPVQE.js";
import "./chunk-BFOYXXLG.js";
import {
  getWalletOrExit
} from "./chunk-7AT3NXJ2.js";
import "./chunk-F3KGAMIA.js";
import "./chunk-NPJV7AMV.js";
import "./chunk-KVSTJRSJ.js";
import "./chunk-U6FRXL3X.js";
import {
  fromNeverthrowError,
  outputAndExit,
  successResponse
} from "./chunk-7EBJ4BCH.js";
import {
  log,
  safeReadFile
} from "./chunk-QZCSZB7E.js";
import "./chunk-YWNBUUBR.js";
import "./chunk-ITCDZXBZ.js";

// src/shared/skills/first-party.ts
import * as os from "os";
import * as path from "path";
import chalk from "chalk";
import yaml from "js-yaml";
import z from "zod";
var FIRST_PARTY_SKILL_VERSION_FIELD = "version";
var installedSkillFrontmatterSchema = z.looseObject({
  metadata: z.object({
    [FIRST_PARTY_SKILL_VERSION_FIELD]: z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)]).transform(
      (value) => typeof value === "number" ? value : Number.parseInt(value)
    )
  })
}).transform((data) => data.metadata[FIRST_PARTY_SKILL_VERSION_FIELD]);
var FIRST_PARTY_SKILLS = {
  agentcash: {
    source: {
      owner: "merit-systems",
      repo: "agentcash-skills",
      skillPath: "skills/agentcash"
    },
    version: 2
  }
};
async function maybeRefreshFirstPartySkill(skillName, flags) {
  const spec = FIRST_PARTY_SKILLS[skillName];
  const skillPath = path.join(
    os.homedir(),
    ".agents",
    "skills",
    skillName,
    "SKILL.md"
  );
  const readResult = await safeReadFile("skill-refresh", skillPath);
  if (readResult.isErr()) {
    if (readResult.error.cause === "file_not_found") {
      return {
        skillPath,
        status: "missing",
        version: null
      };
    }
    const message = `Failed to read installed ${skillName} skill: ${readResult.error.message}`;
    warnSkillRefresh(flags, message);
    return {
      error: message,
      skillPath,
      status: "failed",
      version: null
    };
  }
  const version = parseInstalledSkillVersion(readResult.value);
  if (version !== null && version >= spec.version) {
    return {
      skillPath,
      status: "up_to_date",
      version
    };
  }
  const installResult = await installGitHubSkill("skill-refresh", spec.source);
  if (installResult.isErr()) {
    const message = `Failed to refresh installed ${skillName} skill: ${installResult.error.message}`;
    warnSkillRefresh(flags, message);
    return {
      error: message,
      skillPath,
      status: "failed",
      version
    };
  }
  return {
    skillPath,
    status: "refreshed",
    version: spec.version
  };
}
function parseInstalledSkillVersion(skillMd) {
  const frontmatterMatch = /^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/.exec(skillMd);
  if (!frontmatterMatch) return null;
  const frontmatter = yaml.load(frontmatterMatch[1] ?? "");
  const frontmatterResult = installedSkillFrontmatterSchema.safeParse(frontmatter);
  if (!frontmatterResult.success) return null;
  return frontmatterResult.data;
}
function warnSkillRefresh(flags, message) {
  log.error(message);
  if (flags.quiet) return;
  if (!flags.verbose && !process.stderr.isTTY) return;
  process.stderr.write(chalk.yellow(`Warning: ${message}
`));
}

// src/cli/commands/wallet.ts
var SURFACE = "cli:wallet";
var getBalanceCommand = async (args) => {
  const wallets = await getWalletOrExit(args);
  const { totalBalance, onboardingCta } = await getBalances(
    SURFACE,
    wallets,
    args
  );
  return outputAndExit(
    successResponse({
      balance: totalBalance,
      onboardingCta
    }),
    args
  );
};
var listAccountsCommand = async (args) => {
  const wallets = await getWalletOrExit(args);
  const result = await listAccountsWithBalances(SURFACE, wallets, args);
  return outputAndExit(successResponse(result), args);
};
var walletRedeemCommand = async (args) => {
  const wallets = await getWalletOrExit(args);
  const result = await redeemInviteCode(SURFACE, args, args, wallets);
  if (result.isErr()) {
    return outputAndExit(fromNeverthrowError(result), args);
  }
  return outputAndExit(
    successResponse({
      redeemed: true,
      amount: `$${result.value.amount}`,
      txHash: result.value.txHash
    }),
    args
  );
};
var legacyWalletInfoCommand = async (args) => {
  await maybeRefreshFirstPartySkill("agentcash", args);
  outputLegacyWalletMigration(
    args,
    [
      "`agentcash wallet info` has been removed.",
      "Use `agentcash balance` for total funds.",
      "Use `agentcash accounts` for network-specific addresses and deposit links."
    ].join("\n")
  );
};
var legacyWalletBalanceCommand = async (args) => {
  await maybeRefreshFirstPartySkill("agentcash", args);
  outputLegacyWalletMigration(
    args,
    [
      "`agentcash wallet balance` has been removed.",
      "Use `agentcash balance` instead."
    ].join("\n")
  );
};
var legacyWalletRedeemCommand = async (args) => {
  await maybeRefreshFirstPartySkill("agentcash", args);
  outputLegacyWalletMigration(
    args,
    [
      "`agentcash wallet redeem <code>` has been removed.",
      `Use \`agentcash redeem ${args.code}\` instead.`
    ].join("\n")
  );
};
var legacyWalletAddressCommand = async (args) => {
  const wallets = await getWalletOrExit(args);
  const result = listAccountsWithAddresses(wallets);
  return outputAndExit(successResponse(result), args);
};
function outputLegacyWalletMigration(flags, message) {
  return outputAndExit(
    successResponse({
      migrated: true,
      message
    }),
    flags
  );
}
export {
  getBalanceCommand,
  legacyWalletAddressCommand,
  legacyWalletBalanceCommand,
  legacyWalletInfoCommand,
  legacyWalletRedeemCommand,
  listAccountsCommand,
  walletRedeemCommand
};
//# sourceMappingURL=wallet-QOS3FPSF.js.map