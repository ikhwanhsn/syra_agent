import {
  TOOL_PARAMS
} from "./chunk-3PYQIEMA.js";
import {
  safeFetchJson
} from "./chunk-BFOYXXLG.js";
import {
  EVM_CONFIGS,
  chainId,
  networkSchema,
  solanaAddressSchema,
  typedAddressSchema,
  usdc
} from "./chunk-NPJV7AMV.js";
import {
  getBaseUrl
} from "./chunk-U6FRXL3X.js";
import {
  resultFromPromise
} from "./chunk-YWNBUUBR.js";

// src/operations/bridge.ts
import z2 from "zod";
import { createWalletClient, http } from "viem";

// src/shared/network.ts
var toTypedNetworkAddress = (network, wallets) => {
  if (network === "solana" /* SOLANA */) {
    return {
      address: wallets.svm.address,
      network: "solana" /* SOLANA */
    };
  }
  return {
    address: wallets.evm.address,
    network
  };
};

// ../../internal/bridge/src/quote.ts
import z from "zod";

// ../../internal/bridge/src/client.ts
import {
  createClient,
  convertViemChainToRelayChain,
  MAINNET_RELAY_API
} from "@relayprotocol/relay-sdk";
var SOLANA_RELAY_CHAIN = {
  id: 792703809,
  name: "solana",
  displayName: "Solana",
  httpRpcUrl: "https://api.mainnet-beta.solana.com",
  wsRpcUrl: "",
  explorerUrl: "https://solscan.io",
  depositEnabled: true,
  tokenSupport: "All",
  currency: {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    address: "11111111111111111111111111111111",
    decimals: 9,
    supportsBridging: true
  },
  featuredTokens: [
    {
      id: "sol",
      symbol: "SOL",
      name: "Solana",
      address: "11111111111111111111111111111111",
      decimals: 9,
      supportsBridging: true,
      metadata: {
        logoURI: "https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png"
      }
    },
    {
      id: "usdc",
      symbol: "USDC",
      name: "USD Coin",
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      decimals: 6,
      supportsBridging: true,
      metadata: {
        logoURI: "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694"
      }
    },
    {
      id: "usdt",
      symbol: "USDT",
      name: "USDT",
      address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      decimals: 6,
      supportsBridging: true,
      metadata: {
        logoURI: "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661"
      }
    }
  ],
  erc20Currencies: [
    {
      id: "pengu",
      symbol: "PENGU",
      name: "Pudgy Penguins",
      address: "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv",
      decimals: 6,
      supportsBridging: true,
      withdrawalFee: 25,
      depositFee: 0,
      surgeEnabled: false
    },
    {
      id: "usdc",
      symbol: "USDC",
      name: "USD Coin",
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      decimals: 6,
      supportsBridging: true,
      supportsPermit: true,
      withdrawalFee: 2.25,
      depositFee: 2,
      surgeEnabled: false
    },
    {
      id: "usdt",
      symbol: "USDT",
      name: "USDT",
      address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      decimals: 6,
      supportsBridging: true,
      withdrawalFee: 5,
      depositFee: 2,
      surgeEnabled: false
    },
    {
      id: "cash",
      symbol: "CASH",
      name: "CASH",
      address: "CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH",
      decimals: 6,
      supportsBridging: true,
      withdrawalFee: 25,
      depositFee: 0,
      surgeEnabled: false
    },
    {
      id: "pyusd",
      symbol: "PYUSD",
      name: "PayPal USD",
      address: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
      decimals: 6,
      supportsBridging: true,
      withdrawalFee: 25,
      depositFee: 0,
      surgeEnabled: false
    }
  ],
  solverCurrencies: [
    {
      id: "pengu",
      symbol: "PENGU",
      name: "Pudgy Penguins",
      address: "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv",
      decimals: 6
    },
    {
      id: "usdc",
      symbol: "USDC",
      name: "USD Coin",
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      decimals: 6
    },
    {
      id: "usdt",
      symbol: "USDT",
      name: "USDT",
      address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      decimals: 6
    },
    {
      id: "cash",
      symbol: "CASH",
      name: "CASH",
      address: "CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH",
      decimals: 6
    },
    {
      id: "pyusd",
      symbol: "PYUSD",
      name: "PayPal USD",
      address: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
      decimals: 6
    },
    {
      id: "sol",
      symbol: "SOL",
      name: "Solana",
      address: "11111111111111111111111111111111",
      decimals: 9
    }
  ],
  iconUrl: "https://assets.relay.link/icons/792703809/light.png",
  vmType: "svm",
  baseChainId: 1,
  tags: [],
  protocol: {
    v2: {
      chainId: "solana",
      depository: "99vQwtBwYtrqqD9YSXbdum3KBdxPAVxYTaQ3cfnJSrN2"
    }
  }
};
var relayChainId = (network) => {
  switch (network) {
    case "base" /* BASE */:
    case "tempo" /* TEMPO */:
      return chainId(network);
    case "solana" /* SOLANA */:
      return SOLANA_RELAY_CHAIN.id;
  }
};
var relayClient = createClient({
  baseApiUrl: MAINNET_RELAY_API,
  source: "https://agentcash.dev",
  chains: [
    ...Object.values(EVM_CONFIGS).map(
      (config) => convertViemChainToRelayChain(config.chain)
    ),
    SOLANA_RELAY_CHAIN
  ]
});

// ../../internal/bridge/src/quote.ts
var getBridgeDepositQuoteSchema = z.object({
  from: typedAddressSchema,
  to: typedAddressSchema,
  amount: z.number(),
  depositFeePayer: solanaAddressSchema.optional()
});
var getBridgeDepositQuote = async (input) => {
  const parseResult = getBridgeDepositQuoteSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error("Invalid input");
  }
  const { from, to, amount, depositFeePayer } = parseResult.data;
  const fromCurrency = usdc(from.network);
  const toCurrency = usdc(to.network);
  return await relayClient.actions.getQuote({
    chainId: relayChainId(from.network),
    toChainId: relayChainId(to.network),
    currency: fromCurrency.address,
    toCurrency: toCurrency.address,
    tradeType: "EXACT_INPUT",
    user: from.address,
    recipient: to.address,
    amount: (amount * 10 ** fromCurrency.decimals).toString(),
    options: {
      refundTo: from.address,
      depositFeePayer: from.network === "solana" /* SOLANA */ ? depositFeePayer : void 0,
      usePermit: from.network !== "solana" /* SOLANA */
    }
  });
};

// ../../internal/bridge/src/execute.ts
import { adaptViemWallet } from "@relayprotocol/relay-sdk";

// ../../internal/bridge/src/relay-svm-wallet-adapter.ts
import {
  assertIsSendableTransaction,
  assertIsTransactionWithinSizeLimit,
  createSolanaRpc,
  getBase64EncodedWireTransaction,
  getCompiledTransactionMessageDecoder,
  getSignatureFromTransaction,
  getTransactionDecoder,
  getTransactionLifetimeConstraintFromCompiledTransactionMessage,
  isTransactionModifyingSigner,
  isTransactionPartialSigner,
  isTransactionSendingSigner
} from "@solana/kit";
import { LogLevel, getClient } from "@relayprotocol/relay-sdk";
var BASE58_SIGNATURE_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;
var DEFAULT_CONFIRM_TIMEOUT_MS = 12e4;
var DEFAULT_CONFIRM_POLL_MS = 2e3;
var assertBase58TransactionSignature = (signature) => {
  if (typeof signature !== "string" || signature.length === 0 || !BASE58_SIGNATURE_REGEX.test(signature)) {
    throw new Error("Invalid Solana signature: expected base58.");
  }
};
var sleep = async (ms) => await new Promise((resolve) => setTimeout(resolve, ms));
async function decodePartiallySignedTransaction(partiallySignedTransaction) {
  const decodedTransaction = getTransactionDecoder().decode(
    Uint8Array.from(Buffer.from(partiallySignedTransaction, "base64"))
  );
  const compiledTransactionMessage = getCompiledTransactionMessageDecoder().decode(
    decodedTransaction.messageBytes
  );
  const lifetimeConstraint = await getTransactionLifetimeConstraintFromCompiledTransactionMessage(
    compiledTransactionMessage
  );
  const transactionWithLifetime = {
    ...decodedTransaction,
    lifetimeConstraint
  };
  assertIsTransactionWithinSizeLimit(transactionWithLifetime);
  return transactionWithLifetime;
}
async function signTransactionWithSigner(transaction, signer) {
  if (isTransactionModifyingSigner(signer)) {
    const [signedTransaction] = await signer.modifyAndSignTransactions([
      transaction
    ]);
    if (!signedTransaction) {
      throw new Error("Modifying signer did not return a signed transaction");
    }
    return signedTransaction;
  }
  if (isTransactionPartialSigner(signer)) {
    const [signatureDictionary] = await signer.signTransactions([transaction]);
    if (!signatureDictionary) {
      throw new Error("Transaction signer did not return signatures");
    }
    return {
      ...transaction,
      signatures: Object.freeze({
        ...transaction.signatures,
        ...signatureDictionary
      })
    };
  }
  if (isTransactionSendingSigner(signer)) {
    throw new Error(
      "TransactionSendingSigner is not supported by Relay Solana adapter"
    );
  }
  throw new Error(
    "Unsupported Solana transaction signer provided to Relay adapter"
  );
}
var adaptSolanaKitWallet = ({
  rpcUrl = SOLANA_RELAY_CHAIN.httpRpcUrl,
  signer,
  partiallySignedTransaction
}) => {
  const rpc = createSolanaRpc(rpcUrl);
  return {
    vmType: "svm",
    getChainId: () => Promise.resolve(SOLANA_RELAY_CHAIN.id),
    address: () => Promise.resolve(signer.address),
    handleSignMessageStep: () => {
      throw new Error("Message signing not implemented for Solana");
    },
    handleSendTransactionStep: async () => {
      const client = getClient();
      const decodedTransaction = await decodePartiallySignedTransaction(
        partiallySignedTransaction
      );
      const signedTransaction = await signTransactionWithSigner(
        decodedTransaction,
        signer
      );
      assertIsSendableTransaction(signedTransaction);
      const wireTransaction = getBase64EncodedWireTransaction(signedTransaction);
      const signature = getSignatureFromTransaction(signedTransaction);
      await rpc.sendTransaction(wireTransaction, {
        encoding: "base64",
        skipPreflight: false,
        preflightCommitment: "confirmed"
      }).send();
      assertBase58TransactionSignature(signature);
      client.log(
        ["Transaction Signature obtained", { signature }],
        LogLevel.Verbose
      );
      return signature;
    },
    handleConfirmTransactionStep: async (txHash) => {
      assertBase58TransactionSignature(txHash);
      const deadline = Date.now() + DEFAULT_CONFIRM_TIMEOUT_MS;
      while (Date.now() < deadline) {
        const { value: statuses } = await rpc.getSignatureStatuses([txHash]).send();
        const status = statuses[0];
        if (status) {
          if (status.err) {
            throw new Error(
              `Transaction failed: ${JSON.stringify(status.err)}`
            );
          }
          if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") {
            return {
              blockHash: status.slot.toString(),
              blockNumber: Number(status.slot),
              txHash
            };
          }
        }
        await sleep(DEFAULT_CONFIRM_POLL_MS);
      }
      throw new Error(
        `Transaction not confirmed within ${DEFAULT_CONFIRM_TIMEOUT_MS}ms: ${txHash}`
      );
    },
    switchChain: () => {
      throw new Error("Switching chains not implemented for Solana");
    }
  };
};

// ../../internal/bridge/src/execute.ts
var executeQuote = async (quote, account) => {
  return await relayClient.actions.execute({
    wallet: adaptViemWallet(account),
    quote
  });
};
var executeSolana = async ({
  quote,
  ...rest
}) => {
  return await relayClient.actions.execute({
    wallet: adaptSolanaKitWallet(rest),
    quote
  });
};

// src/shared/neverthrow/bridge/index.ts
var errorType = "bridge";
var bridgeResultFromPromise = (surface, promise, error) => resultFromPromise(errorType, surface, promise, error);
var getErrorMessage = (error, fallback) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error.length > 0) {
    return error;
  }
  return fallback;
};
var safeGetBridgeDepositQuote = (surface, ...args) => bridgeResultFromPromise(surface, getBridgeDepositQuote(...args), (error) => {
  const errorMessage = getErrorMessage(
    error,
    "Failed to get bridge deposit quote"
  );
  return {
    cause: "get_bridge_deposit_quote",
    errorMessage,
    message: `Failed to get bridge deposit quote: ${errorMessage}`
  };
});
var safeExecuteQuote = (surface, ...args) => bridgeResultFromPromise(surface, executeQuote(...args), (error) => {
  const errorMessage = getErrorMessage(error, "Failed to execute quote");
  return {
    cause: "execute_quote",
    errorMessage,
    message: `Failed to execute quote: ${errorMessage}`
  };
});
var safeExecuteSolana = (surface, ...args) => bridgeResultFromPromise(surface, executeSolana(...args), (error) => {
  const errorMessage = getErrorMessage(
    error,
    "Failed to execute Solana bridge transaction"
  );
  return {
    cause: "execute_solana",
    errorMessage,
    message: `Failed to execute Solana bridge transaction: ${errorMessage}`
  };
});

// src/operations/bridge.ts
var bridgeSchema = z2.object({
  from: networkSchema.describe(TOOL_PARAMS.bridge.from),
  to: networkSchema.describe(TOOL_PARAMS.bridge.to),
  amount: z2.number().positive().describe(TOOL_PARAMS.bridge.amount)
}).refine(({ from, to }) => from !== to, {
  message: "From and to networks cannot be the same"
});
var bridge = async (args, wallets) => {
  const { from, to, amount } = args;
  if (from === "solana" /* SOLANA */) {
    const request = new Request(`${getBaseUrl(args.dev)}/api/bridge/solana`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        fromAddress: wallets.svm.address,
        to: toTypedNetworkAddress(to, wallets),
        amount
      })
    });
    const response = await safeFetchJson(
      "bridge",
      request,
      z2.object({
        success: z2.literal(true),
        partiallySignedTransaction: z2.string(),
        quote: z2.custom()
      })
    );
    if (response.isErr()) {
      return response;
    }
    const { partiallySignedTransaction, quote } = response.value;
    const executeResult = await safeExecuteSolana("bridge", {
      quote,
      signer: wallets.svm,
      partiallySignedTransaction
    });
    return executeResult.map(
      (result) => result.data.details ?? { success: true }
    );
  } else {
    const quote = await safeGetBridgeDepositQuote("bridge", {
      from: toTypedNetworkAddress(from, wallets),
      to: toTypedNetworkAddress(to, wallets),
      amount
    });
    if (quote.isErr()) {
      return quote;
    }
    const executeResult = await safeExecuteQuote(
      "bridge",
      quote.value,
      createWalletClient({
        account: wallets.evm,
        chain: EVM_CONFIGS[from].chain,
        transport: http(
          from === "tempo" /* TEMPO */ ? "https://eng:acard-melody-fashion-finish@rpc.mainnet.tempo.xyz" : void 0
        )
      })
    );
    return executeResult.map(
      (result) => result.data.details ?? { success: true }
    );
  }
};

export {
  bridgeSchema,
  bridge
};
//# sourceMappingURL=chunk-2OKYUR7B.js.map