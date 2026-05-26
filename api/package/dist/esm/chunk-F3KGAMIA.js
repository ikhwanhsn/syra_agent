import {
  jsonErr,
  safeParseJson
} from "./chunk-KVSTJRSJ.js";
import {
  fsErr,
  log,
  safeChmod,
  safeReadFile,
  safeWriteFile
} from "./chunk-QZCSZB7E.js";
import {
  configFile,
  err,
  ok
} from "./chunk-YWNBUUBR.js";

// src/wallet/evm.ts
import { existsSync } from "fs";
import { getAddress } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import z2 from "zod";

// src/shared/neverthrow/parse/index.ts
import z from "zod";
var type = "json";
var parseErr = (surface, error) => err(type, surface, error);
var safeParse = (surface, schema, value) => {
  const parseResult = schema.safeParse(value);
  if (!parseResult.success) {
    return parseErr(surface, {
      cause: "invalid_data",
      message: JSON.stringify(z.treeifyError(parseResult.error), null, 2),
      error: parseResult.error
    });
  }
  return ok(parseResult.data);
};

// src/wallet/evm.ts
var WALLET_FILE = configFile("wallet.json");
var storedWalletSchema = z2.object({
  privateKey: z2.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid Ethereum private key").transform((privateKey) => privateKey),
  address: z2.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address").transform((address) => getAddress(address)),
  createdAt: z2.string()
});
var walletSurface = "wallet";
async function getEvmWallet() {
  if (process.env.X402_PRIVATE_KEY) {
    const account2 = privateKeyToAccount(process.env.X402_PRIVATE_KEY);
    log.info(`Using wallet from env: ${account2.address}`);
    return ok(account2);
  }
  const readFileResult = await safeReadFile(walletSurface, WALLET_FILE);
  if (!readFileResult.isOk()) {
    const fileExistsResult = existsSync(WALLET_FILE);
    if (fileExistsResult) {
      return fsErr(walletSurface, {
        cause: "file_not_readable",
        message: `The file exists but is not readable. Fix corrupted state file: ${WALLET_FILE}`
      });
    }
  }
  if (readFileResult.isOk()) {
    const data = readFileResult.value;
    const jsonParseResult = safeParseJson(walletSurface, data);
    if (jsonParseResult.isErr()) {
      return jsonErr(walletSurface, {
        cause: "parse",
        message: `The data in ${WALLET_FILE} is not valid JSON`
      });
    }
    const parseResult = safeParse(
      walletSurface,
      storedWalletSchema,
      jsonParseResult.value
    );
    if (parseResult.isErr()) {
      return parseResult;
    }
    const account2 = privateKeyToAccount(parseResult.value.privateKey);
    log.info(`Loaded wallet: ${account2.address}`);
    return ok(account2);
  }
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const stored = {
    privateKey,
    address: account.address,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const saveResult = await safeWriteFile(
    walletSurface,
    WALLET_FILE,
    JSON.stringify(stored, null, 2)
  ).andThen(() => safeChmod(walletSurface, WALLET_FILE, 384));
  if (saveResult.isErr()) {
    return saveResult;
  }
  log.info(`Created wallet: ${account.address}`);
  log.info(`Saved to: ${WALLET_FILE}`);
  return ok(account);
}

// src/wallet/svm.ts
import { existsSync as existsSync2 } from "fs";
import {
  createKeyPairSignerFromBytes,
  isAddress,
  createKeyPairSignerFromPrivateKeyBytes
} from "@solana/kit";
import { getRandomValues } from "crypto";
import { base58 } from "@scure/base";
import z3 from "zod";
var WALLET_FILE2 = configFile("solana-wallet.json");
var storedWalletSchema2 = z3.object({
  privateKey: z3.string().regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid base58 string"),
  address: z3.string().refine(isAddress, "Invalid Solana address"),
  createdAt: z3.string()
});
var walletSurface2 = "wallet";
async function getSvmWallet() {
  if (process.env.X402_SOLANA_PRIVATE_KEY) {
    const account2 = await createKeyPairSignerFromBytes(
      base58.decode(process.env.X402_SOLANA_PRIVATE_KEY)
    );
    log.info(`Using wallet from env: ${account2.address}`);
    return ok(account2);
  }
  const readFileResult = await safeReadFile(walletSurface2, WALLET_FILE2);
  if (!readFileResult.isOk()) {
    const fileExistsResult = existsSync2(WALLET_FILE2);
    if (fileExistsResult) {
      return fsErr(walletSurface2, {
        cause: "file_not_readable",
        message: `The file exists but is not readable. Fix corrupted state file: ${WALLET_FILE2}`
      });
    }
  }
  if (readFileResult.isOk()) {
    const data = readFileResult.value;
    const jsonParseResult = safeParseJson(walletSurface2, data);
    if (jsonParseResult.isErr()) {
      return jsonErr(walletSurface2, {
        cause: "parse",
        message: `The data in ${WALLET_FILE2} is not valid JSON`
      });
    }
    const parseResult = safeParse(
      walletSurface2,
      storedWalletSchema2,
      jsonParseResult.value
    );
    if (parseResult.isErr()) {
      return parseResult;
    }
    const account2 = await createKeyPairSignerFromPrivateKeyBytes(
      base58.decode(parseResult.value.privateKey)
    );
    log.info(`Loaded wallet: ${account2.address}`);
    return ok(account2);
  }
  const privateKeyBytes = getRandomValues(new Uint8Array(32));
  const account = await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);
  const stored = {
    privateKey: base58.encode(privateKeyBytes),
    address: account.address,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const saveResult = await safeWriteFile(
    walletSurface2,
    WALLET_FILE2,
    JSON.stringify(stored, null, 2)
  ).andThen(() => safeChmod(walletSurface2, WALLET_FILE2, 384));
  if (saveResult.isErr()) {
    return saveResult;
  }
  log.info(`Created wallet: ${account.address}`);
  log.info(`Saved to: ${WALLET_FILE2}`);
  return ok(account);
}

// src/wallet/index.ts
var getWallet = async () => {
  const [evmWallet, svmWallet] = await Promise.all([
    getEvmWallet(),
    getSvmWallet()
  ]);
  if (evmWallet.isErr()) {
    return evmWallet;
  }
  if (svmWallet.isErr()) {
    return svmWallet;
  }
  return ok({
    evm: evmWallet.value,
    svm: svmWallet.value
  });
};

export {
  safeParse,
  getWallet
};
//# sourceMappingURL=chunk-F3KGAMIA.js.map