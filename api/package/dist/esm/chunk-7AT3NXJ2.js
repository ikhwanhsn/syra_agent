import {
  getWallet
} from "./chunk-F3KGAMIA.js";
import {
  fromNeverthrowError,
  outputAndExit
} from "./chunk-7EBJ4BCH.js";

// src/cli/lib/get-wallet-or-exit.ts
async function getWalletOrExit(flags) {
  const walletResult = await getWallet();
  if (walletResult.isErr()) {
    outputAndExit(fromNeverthrowError(walletResult, "WALLET_ERROR"), flags);
  }
  return walletResult.value;
}

export {
  getWalletOrExit
};
//# sourceMappingURL=chunk-7AT3NXJ2.js.map