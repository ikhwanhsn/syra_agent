import {
  DEFAULT_MAX_AMOUNT,
  getSettings
} from "./chunk-JX2XE6FD.js";
import {
  buildRequest
} from "./chunk-IKPLMFAK.js";
import {
  getBalance
} from "./chunk-KJCWPVQE.js";
import {
  fetchErr,
  fetchOk,
  safeFetch
} from "./chunk-BFOYXXLG.js";
import {
  EVM_CONFIGS,
  caip2ToNetwork,
  networkToCaip2
} from "./chunk-NPJV7AMV.js";
import {
  formatUsd,
  getDepositLink,
  tokenStringToNumber
} from "./chunk-U6FRXL3X.js";
import {
  log
} from "./chunk-QZCSZB7E.js";
import {
  BLACKLISTED_ORIGINS
} from "./chunk-TTAO2EJK.js";
import {
  err,
  ok,
  resultFromPromise,
  resultFromThrowable
} from "./chunk-YWNBUUBR.js";

// src/operations/fetch/auth.ts
import { encodeSIWxHeader } from "@x402/extensions/sign-in-with-x";

// src/shared/protocols/x402/index.ts
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { toClientEvmSigner } from "@x402/evm";
import { toClientSvmSigner } from "@x402/svm";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { UptoEvmScheme } from "@x402/evm/upto/client";

// src/shared/protocols/x402/patched-exact-svm-scheme.ts
import {
  getSetComputeUnitLimitInstruction,
  setTransactionMessageComputeUnitPrice
} from "@solana-program/compute-budget";
import { TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import {
  fetchMint,
  findAssociatedTokenPda,
  getTransferCheckedInstruction,
  TOKEN_2022_PROGRAM_ADDRESS
} from "@solana-program/token-2022";
import {
  appendTransactionMessageInstructions,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  partiallySignTransactionMessageWithSigners,
  pipe,
  prependTransactionMessageInstruction,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash
} from "@solana/kit";
import {
  DEFAULT_COMPUTE_UNIT_LIMIT,
  DEFAULT_COMPUTE_UNIT_PRICE_MICROLAMPORTS,
  createRpcClient
} from "@x402/svm";
function parseLastValidBlockHeight(value) {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(value);
  }
  if (typeof value === "string" && value.length > 0) {
    return BigInt(value);
  }
  return void 0;
}
function asBlockhash(blockhash) {
  return blockhash;
}
var PatchedExactSvmScheme = class {
  constructor(signer, config) {
    this.signer = signer;
    this.config = config;
  }
  scheme = "exact";
  async createPaymentPayload(x402Version, paymentRequirements) {
    const rpc = createRpcClient(
      paymentRequirements.network,
      this.config?.rpcUrl
    );
    const tokenMint = await fetchMint(
      rpc,
      paymentRequirements.asset
    );
    const tokenProgramAddress = tokenMint.programAddress;
    if (tokenProgramAddress.toString() !== TOKEN_PROGRAM_ADDRESS.toString() && tokenProgramAddress.toString() !== TOKEN_2022_PROGRAM_ADDRESS.toString()) {
      throw new Error("Asset was not created by a known token program");
    }
    const [sourceATA] = await findAssociatedTokenPda({
      mint: paymentRequirements.asset,
      owner: this.signer.address,
      tokenProgram: tokenProgramAddress
    });
    const [destinationATA] = await findAssociatedTokenPda({
      mint: paymentRequirements.asset,
      owner: paymentRequirements.payTo,
      tokenProgram: tokenProgramAddress
    });
    const transferIx = getTransferCheckedInstruction(
      {
        source: sourceATA,
        mint: paymentRequirements.asset,
        destination: destinationATA,
        authority: this.signer,
        amount: BigInt(paymentRequirements.amount),
        decimals: tokenMint.data.decimals
      },
      { programAddress: tokenProgramAddress }
    );
    const extra = paymentRequirements.extra;
    const feePayer = extra.feePayer;
    if (!feePayer) {
      throw new Error(
        "feePayer is required in paymentRequirements.extra for SVM transactions"
      );
    }
    const latestBlockhash = await this.resolveBlockhashLifetime(rpc, extra);
    const tx = pipe(
      createTransactionMessage({ version: 0 }),
      (tx2) => setTransactionMessageComputeUnitPrice(
        DEFAULT_COMPUTE_UNIT_PRICE_MICROLAMPORTS,
        tx2
      ),
      (tx2) => setTransactionMessageFeePayer(feePayer, tx2),
      (tx2) => prependTransactionMessageInstruction(
        getSetComputeUnitLimitInstruction({
          units: DEFAULT_COMPUTE_UNIT_LIMIT
        }),
        tx2
      ),
      (tx2) => appendTransactionMessageInstructions([transferIx], tx2),
      (tx2) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx2)
    );
    const signedTransaction = await partiallySignTransactionMessageWithSigners(tx);
    const base64EncodedWireTransaction = getBase64EncodedWireTransaction(signedTransaction);
    const payload = {
      transaction: base64EncodedWireTransaction
    };
    return {
      x402Version,
      payload
    };
  }
  async resolveBlockhashLifetime(rpc, extra) {
    const providedLastValidBlockHeight = parseLastValidBlockHeight(
      extra.lastValidBlockHeight
    );
    if (typeof extra.recentBlockhash === "string") {
      if (providedLastValidBlockHeight !== void 0) {
        return {
          blockhash: asBlockhash(extra.recentBlockhash),
          lastValidBlockHeight: providedLastValidBlockHeight
        };
      }
      const { value } = await rpc.getLatestBlockhash().send();
      return {
        blockhash: asBlockhash(extra.recentBlockhash),
        lastValidBlockHeight: value.lastValidBlockHeight
      };
    }
    if (extra.recentBlockhash && typeof extra.recentBlockhash === "object" && typeof extra.recentBlockhash.blockhash === "string") {
      const lastValidBlockHeight = parseLastValidBlockHeight(extra.recentBlockhash.lastValidBlockHeight) ?? providedLastValidBlockHeight;
      if (lastValidBlockHeight !== void 0) {
        return {
          blockhash: asBlockhash(extra.recentBlockhash.blockhash),
          lastValidBlockHeight
        };
      }
      const { value } = await rpc.getLatestBlockhash().send();
      return {
        blockhash: asBlockhash(extra.recentBlockhash.blockhash),
        lastValidBlockHeight: value.lastValidBlockHeight
      };
    }
    return (await rpc.getLatestBlockhash().send()).value;
  }
};

// src/shared/protocols/x402/policies.ts
var MAX_UPTO_DEADLINE_SECONDS = 7 * 24 * 60 * 60;
var capUptoDeadline = (_x402Version, requirements) => requirements.map(
  (r) => r.scheme === "upto" && r.maxTimeoutSeconds > MAX_UPTO_DEADLINE_SECONDS ? { ...r, maxTimeoutSeconds: MAX_UPTO_DEADLINE_SECONDS } : r
);

// src/shared/protocols/x402/index.ts
import { createSIWxPayload } from "@x402/extensions/sign-in-with-x";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
var errorType = "x402";
var x402Ok = (value) => ok(value);
var x402Err = (cause, error) => err(errorType, cause, error);
var x402ResultFromPromise = (surface, promise, error) => resultFromPromise(errorType, surface, promise, error);
var x402ResultFromThrowable = (surface, fn, error) => resultFromThrowable(errorType, surface, fn, error);
var x402ProbeClient = new x402HTTPClient(new x402Client());
var safeGetPaymentRequired = (surface, response) => {
  return x402ResultFromPromise(
    surface,
    response.json().then(
      (json) => x402ProbeClient.getPaymentRequiredResponse(
        (name) => response.headers.get(name),
        json
      ),
      () => x402ProbeClient.getPaymentRequiredResponse(
        (name) => response.headers.get(name)
      )
    ),
    (error) => ({
      cause: "parse_payment_required",
      message: error instanceof Error ? error.message : "Failed to parse payment required"
    })
  );
};
var getSiwxExtension = (extensions, paymentNetwork) => {
  const siwx = extensions?.["sign-in-with-x"];
  if (!siwx?.info) {
    return void 0;
  }
  const chain = siwx.supportedChains?.find(
    (c) => paymentNetwork ? c.chainId === networkToCaip2(paymentNetwork) : c.chainId.startsWith("eip155:")
  );
  return {
    ...siwx.info,
    chainId: chain?.chainId ?? "eip155:8453",
    type: chain?.type ?? "eip191",
    signatureScheme: chain?.signatureScheme
  };
};
var safeCreatePaymentPayload = (surface, wallets, paymentRequired, paymentRequirementsSelector) => {
  const client = new x402HTTPClient(
    x402Client.fromConfig({
      schemes: [
        {
          network: networkToCaip2("base" /* BASE */),
          client: new ExactEvmScheme(
            toClientEvmSigner(
              wallets.evm,
              createPublicClient({
                chain: base,
                transport: http()
              })
            )
          )
        },
        {
          network: networkToCaip2("base" /* BASE */),
          client: new UptoEvmScheme(
            toClientEvmSigner(
              wallets.evm,
              createPublicClient({
                chain: base,
                transport: http()
              })
            )
          )
        },
        {
          network: networkToCaip2("solana" /* SOLANA */),
          client: new PatchedExactSvmScheme(toClientSvmSigner(wallets.svm))
        }
      ],
      policies: [capUptoDeadline],
      paymentRequirementsSelector
    })
  );
  return x402ResultFromPromise(
    surface,
    client.createPaymentPayload(paymentRequired),
    (error) => ({
      cause: "create_payment_payload",
      message: error instanceof Error ? error.message : "Failed to create payment payload"
    })
  );
};
var safeGetPaymentSettlement = (surface, response) => {
  return x402ResultFromThrowable(
    surface,
    () => x402ProbeClient.getPaymentSettleResponse(
      (name) => response.headers.get(name)
    ),
    (error) => ({
      cause: "get_payment_settlement",
      message: error instanceof Error ? error.message : "Failed to get payment settlement"
    })
  );
};
var safeCreateSIWxPayload = (surface, serverInfo, wallets) => {
  return x402ResultFromPromise(
    surface,
    createSIWxPayload(
      serverInfo,
      serverInfo.chainId.startsWith("eip155:") ? wallets.evm : wallets.svm
    ),
    (error) => ({
      cause: "create_siwx_payload",
      message: error instanceof Error ? error.message : "Failed to create SIWX payload"
    })
  );
};

// src/operations/fetch/auth.ts
async function attemptSiwxAuth(response, authRetryRequest, paymentRetryRequest, options) {
  const { surface, wallets } = options;
  const { timeout, paymentNetwork } = options.params;
  if (!response.headers.has("payment-required")) {
    return fetchOk({
      response,
      paymentRetryRequest
    });
  }
  const paymentRequiredResult = await safeGetPaymentRequired(surface, response);
  if (paymentRequiredResult.isErr()) {
    return paymentRequiredResult;
  }
  const siwxExtension = getSiwxExtension(
    paymentRequiredResult.value.extensions,
    paymentNetwork
  );
  if (!siwxExtension) {
    return fetchOk({
      response,
      paymentRetryRequest
    });
  }
  const payloadResult = await safeCreateSIWxPayload(
    surface,
    siwxExtension,
    wallets
  );
  if (payloadResult.isErr()) {
    return payloadResult;
  }
  const siwxHeader = encodeSIWxHeader(payloadResult.value);
  authRetryRequest.headers.set("SIGN-IN-WITH-X", siwxHeader);
  paymentRetryRequest.headers.set("SIGN-IN-WITH-X", siwxHeader);
  return (await safeFetch(surface, authRetryRequest, timeout)).andThen(
    (authResponse) => fetchOk({
      response: authResponse,
      paymentRetryRequest
    })
  );
}

// src/shared/protocols/detect.ts
function detectPaymentProtocols(response) {
  const protocols = [];
  const wwwAuth = response.headers.get("WWW-Authenticate");
  if (wwwAuth?.startsWith("Payment")) {
    protocols.push("mpp" /* MPP */);
  }
  const paymentRequired = response.headers.get("payment-required");
  if (paymentRequired) {
    protocols.push("x402" /* X402 */);
  }
  if (protocols.length === 0) {
    protocols.push("x402" /* X402 */);
  }
  return protocols;
}

// src/shared/protocols/mpp/handle-payment.ts
import { formatUnits } from "viem";

// src/shared/protocols/mpp/index.ts
import { Challenge, Receipt } from "mppx";
import { Methods } from "mppx/tempo";
import { Mppx, tempo as tempoMethod } from "mppx/client";
import { createClient, http as http2 } from "viem";
import { tempo } from "viem/chains";
var errorType2 = "mpp";
var mppOk = (value) => ok(value);
var mppErr = (surface, error) => err(errorType2, surface, error);
var mppResultFromPromise = (surface, promise, error) => resultFromPromise(errorType2, surface, promise, error);
var mppResultFromThrowable = (surface, fn, error) => resultFromThrowable(errorType2, surface, fn, error);
var safeGetMppChallenge = (surface, response) => {
  return mppResultFromThrowable(
    surface,
    () => Challenge.fromResponse(response, { methods: [Methods.charge] }),
    (error) => ({
      cause: "parse_mpp_challenge",
      message: error instanceof Error ? error.message : "Failed to parse MPP challenge from response"
    })
  );
};
var safeCreateMppCredential = (surface, wallets, response) => {
  const TEMPO_RPC_URL = "https://eng:acard-melody-fashion-finish@rpc.mainnet.tempo.xyz";
  const client = Mppx.create({
    polyfill: false,
    methods: [
      tempoMethod({
        account: wallets.evm,
        getClient: () => createClient({
          chain: tempo,
          transport: http2(TEMPO_RPC_URL)
        })
      })
    ]
  });
  return mppResultFromPromise(
    surface,
    client.createCredential(response),
    (error) => ({
      cause: "create_mpp_credential",
      message: error instanceof Error ? error.message : "Failed to create MPP credential"
    })
  );
};
var safeGetMppReceipt = (surface, response) => {
  return mppResultFromThrowable(
    surface,
    () => Receipt.fromResponse(response),
    (error) => ({
      cause: "parse_mpp_receipt",
      message: error instanceof Error ? error.message : "Failed to parse MPP receipt from response"
    })
  );
};

// src/shared/protocols/before-payment.ts
var beforePayment = async (props) => {
  const { options, balanceInput, amount } = props;
  const maxAmount = options.params.maxAmount ?? getSettings().maxAmount ?? DEFAULT_MAX_AMOUNT;
  if (amount > maxAmount) {
    return err("before_payment", options.surface, {
      cause: "amount_exceeds_max_amount",
      message: `Endpoint requested $${amount} which exceeds the maximum allowed amount of $${maxAmount}. Pass a higher maxAmount on this call, or use update_settings to raise the default permanently.`
    });
  }
  const balanceResult = await getBalance(
    options.surface,
    balanceInput,
    options.flags
  );
  if (balanceResult.isErr()) {
    return balanceResult;
  }
  const balance = balanceResult.value.balance;
  if (balance < amount) {
    return err("before_payment", options.surface, {
      cause: "insufficient_balance",
      message: insufficientBalanceErrorMessage(props, balance)
    });
  }
  return ok(true);
};
var insufficientBalanceErrorMessage = (props, balance) => {
  const { options, balanceInput, amount } = props;
  return [
    `You are attempting to use an endpoint via ${props.protocol} that costs ${amount} USDC on ${balanceInput.network}.`,
    `Your current balance is ${balance} USDC.`,
    `You can bridge between accounts or deposit at ${getDepositLink(balanceInput.address, options.flags, balanceInput.network)} to top up your balance.`,
    `Before bridging, you can check the users account with npx agentcash@latest accounts or if you are within the MCP, you can use the list_accounts tool.`
  ].join("\n");
};

// src/shared/protocols/mpp/handle-payment.ts
async function handleMppPayment({
  response,
  request,
  options
}) {
  const { surface, wallets } = options;
  const { timeout } = options.params;
  if (request.headers.has("Authorization")) {
    return mppErr(surface, {
      cause: "mpp_payment_already_attempted",
      message: "MPP payment already attempted"
    });
  }
  const challengeResult = safeGetMppChallenge(surface, response);
  if (challengeResult.isErr()) {
    return challengeResult;
  }
  const challenge = challengeResult.value;
  const amount = Number(formatUnits(BigInt(challenge.request.amount), 6));
  const tokenAddress = challenge.request.currency;
  const expectedToken = EVM_CONFIGS["tempo" /* TEMPO */].usdcAddress.toLowerCase();
  if (tokenAddress.toLowerCase() !== expectedToken) {
    return mppErr(surface, {
      cause: "unsupported_token",
      message: `Endpoint requires payment in token ${tokenAddress} on Tempo, but agentcash only supports ${EVM_CONFIGS["tempo" /* TEMPO */].usdcAddress}. The endpoint may be configured for a different token (e.g. PathUSD vs USDC).`
    });
  }
  const beforePaymentResult = await beforePayment({
    options,
    balanceInput: {
      address: wallets.evm.address,
      network: "tempo" /* TEMPO */,
      tokenAddress
    },
    amount,
    protocol: "mpp" /* MPP */
  });
  if (beforePaymentResult.isErr()) {
    return beforePaymentResult;
  }
  const credentialResult = await safeCreateMppCredential(
    surface,
    wallets,
    response
  );
  if (credentialResult.isErr()) {
    return credentialResult;
  }
  const credential = credentialResult.value;
  request.headers.set("Authorization", credential);
  const paidFetchResult = await safeFetch(surface, request, timeout);
  if (paidFetchResult.isErr()) {
    return paidFetchResult;
  }
  const paidResponse = paidFetchResult.value;
  if (paidResponse.status === 402) {
    const body = await paidResponse.clone().text().catch(() => "");
    const detail = body ? `: ${body}` : "";
    return mppErr(surface, {
      cause: "mpp_payment_rejected",
      message: `MPP payment was rejected by the server (402)${detail}`
    });
  }
  const receiptResult = safeGetMppReceipt(surface, paidResponse);
  return mppOk({
    response: paidResponse,
    paymentInfo: {
      protocol: "mpp" /* MPP */,
      network: "tempo" /* TEMPO */,
      price: formatUsd(amount),
      payment: receiptResult.isOk() ? {
        success: true,
        transactionHash: receiptResult.value.reference
      } : null
    }
  });
}

// src/shared/protocols/pick.ts
async function pickByBalance(response, options) {
  const { surface, wallets, flags } = options;
  const x402Balances = await Promise.all([
    getBalance(
      surface,
      {
        address: wallets.evm.address,
        network: "base" /* BASE */
      },
      flags
    ),
    getBalance(
      surface,
      {
        address: wallets.svm.address,
        network: "solana" /* SOLANA */
      },
      flags
    )
  ]);
  const x402Balance = x402Balances.reduce(
    (acc, balance) => acc + (balance.isOk() ? balance.value.balance : 0),
    0
  );
  let mppBalance = 0;
  const challengeResult = safeGetMppChallenge(surface, response);
  if (challengeResult.isOk()) {
    const currency = challengeResult.value.request.currency;
    if (currency) {
      const tempoResult = await getBalance(
        surface,
        {
          address: wallets.evm.address,
          network: "tempo" /* TEMPO */
        },
        flags
      );
      if (tempoResult.isOk()) {
        mppBalance = tempoResult.value.balance ?? 0;
      }
    }
  }
  log.info(`Protocol selection \u2014 x402: $${x402Balance}, mpp: $${mppBalance}`);
  return x402Balance >= mppBalance ? "x402" /* X402 */ : "mpp" /* MPP */;
}

// src/shared/protocols/x402/choose-payment-requirement.ts
var preferUpto = (requirements) => {
  return requirements.find((pr) => pr.scheme === "upto") ?? requirements[0];
};
var choosePaymentRequirement = async ({
  paymentRequirements,
  options
}) => {
  const { surface, wallets, flags } = options;
  const { paymentNetwork } = options.params;
  if (paymentNetwork) {
    const caip2 = networkToCaip2(paymentNetwork);
    return preferUpto(paymentRequirements.filter((pr) => pr.network === caip2));
  }
  const requirementsWithBalance = await Promise.all(
    paymentRequirements.map(async (pr) => {
      const network = caip2ToNetwork(pr.network);
      if (network === null) {
        return {
          balance: 0,
          requirement: pr
        };
      }
      if (network === "solana" /* SOLANA */) {
        const balanceResult = await getBalance(
          surface,
          {
            address: wallets.svm.address,
            network
          },
          flags
        );
        return {
          requirement: pr,
          balance: balanceResult.isOk() ? balanceResult.value.balance : 0
        };
      } else {
        const balanceResult = await getBalance(
          surface,
          {
            address: wallets.evm.address,
            network
          },
          flags
        );
        return {
          requirement: pr,
          balance: balanceResult.isOk() ? balanceResult.value.balance : 0
        };
      }
    })
  );
  const bestNetwork = requirementsWithBalance.sort(
    (a, b) => b.balance - a.balance
  )[0].requirement.network;
  return preferUpto(
    paymentRequirements.filter((pr) => pr.network === bestNetwork)
  );
};

// src/shared/protocols/x402/handle-payment.ts
var isPermit2AllowanceFailureBody = (body) => body.includes("permit2") && body.includes("allowance_required");
var buildPermit2AllowanceErrorMessage = (params) => {
  const { walletAddress, scheme } = params;
  return [
    `Payment failed: this endpoint's \`${scheme}\` scheme settles via the Permit2 contract, but your agentcash wallet (${walletAddress}) has not approved Permit2 to spend USDC.`,
    "",
    "The clean fix is server-side. The merchant should adopt the EIP-2612 gas-sponsoring extension \u2014 agentcash will then auto-sign an off-chain permit on each call and the facilitator pays the approval gas, with no setup required from the user. See https://docs.x402.org/extensions/eip2612-gas-sponsoring",
    "",
    `Until the merchant adopts that extension, you can do a one-time \`USDC.approve(0x000000000022D473030F116dDEE9F6B43aC78BA3, MAX_UINT256)\` on Base from this wallet (requires a small amount of ETH for gas, ~$0.01\u20130.10). After that, all future Permit2-based payments from this wallet work without further on-chain transactions.`
  ].join("\n");
};
async function handleX402Payment({
  response,
  request,
  options
}) {
  const { surface, wallets } = options;
  const { timeout } = options.params;
  const paymentRequiredResult = await safeGetPaymentRequired(surface, response);
  if (paymentRequiredResult.isErr()) {
    return paymentRequiredResult;
  }
  const paymentRequired = paymentRequiredResult.value;
  if (paymentRequired.x402Version === 1) {
    return x402Err(surface, {
      cause: "parse_payment_required",
      message: "This endpoint uses the x402 v1 format, which is not supported by agentcash. Only x402 v2 servers (with an `accepts` array in the Payment-Required header) are supported."
    });
  }
  if (!paymentRequired.accepts || !Array.isArray(paymentRequired.accepts)) {
    return x402Err(surface, {
      cause: "parse_payment_required",
      message: "This endpoint has a missing or malformed accepts array in the Payment-Required header."
    });
  }
  const accept = await choosePaymentRequirement({
    options,
    paymentRequirements: paymentRequired.accepts
  });
  if (accept) {
    const amount = tokenStringToNumber(accept.amount);
    const typedNetwork = caip2ToNetwork(accept.network);
    if (!typedNetwork) {
      return x402Err(surface, {
        cause: "parse_payment_required",
        message: `Invalid network: ${accept.network}`
      });
    }
    const beforePaymentResult = await beforePayment({
      options,
      balanceInput: typedNetwork === "solana" /* SOLANA */ ? {
        address: wallets.svm.address,
        network: "solana" /* SOLANA */
      } : {
        address: wallets.evm.address,
        network: typedNetwork
      },
      amount,
      protocol: "x402" /* X402 */
    });
    if (beforePaymentResult.isErr()) {
      return beforePaymentResult;
    }
  }
  const paymentPayloadResult = await safeCreatePaymentPayload(
    surface,
    wallets,
    paymentRequired,
    accept ? () => accept : void 0
  );
  if (paymentPayloadResult.isErr()) {
    return paymentPayloadResult;
  }
  const paymentPayload = paymentPayloadResult.value;
  const paymentHeaders = x402ProbeClient.encodePaymentSignatureHeader(paymentPayload);
  if (request.headers.has("PAYMENT-SIGNATURE") || request.headers.has("X-PAYMENT")) {
    return x402Err(surface, {
      cause: "payment_already_attempted",
      message: "Payment already attempted"
    });
  }
  for (const [key, value] of Object.entries(paymentHeaders)) {
    request.headers.set(key, value);
  }
  request.headers.set(
    "Access-Control-Expose-Headers",
    "PAYMENT-RESPONSE,X-PAYMENT-RESPONSE"
  );
  const paidResult = await safeFetch(surface, request, timeout);
  if (paidResult.isErr()) {
    return paidResult;
  }
  const paidResponse = paidResult.value;
  const permit2Error = await detectPermit2AllowanceError(paidResponse, {
    walletAddress: wallets.evm.address,
    scheme: paymentPayload.accepted.scheme
  });
  if (permit2Error) {
    return x402Err(surface, permit2Error);
  }
  const settlementResult = safeGetPaymentSettlement(surface, paidResponse);
  const settlement = settlementResult.isOk() ? settlementResult.value : null;
  const maxAmount = tokenStringToNumber(paymentPayload.accepted.amount);
  const settledAmount = settlement?.amount ? tokenStringToNumber(settlement.amount) : null;
  const isUpTo = paymentPayload.accepted.scheme === "upto";
  const price = settledAmount != null ? formatUsd(settledAmount) : isUpTo ? `up to ${formatUsd(maxAmount)}` : formatUsd(maxAmount);
  return x402Ok({
    response: paidResponse,
    paymentInfo: {
      protocol: "x402" /* X402 */,
      network: caip2ToNetwork(paymentPayload.accepted.network),
      price,
      payment: settlement ? {
        success: settlement.success,
        transactionHash: settlement.transaction
      } : null
    }
  });
}
async function detectPermit2AllowanceError(response, context) {
  if (response.ok) {
    return null;
  }
  const body = await response.clone().text().catch(() => "");
  if (!isPermit2AllowanceFailureBody(body)) {
    return null;
  }
  return {
    cause: "permit2_allowance_required",
    message: buildPermit2AllowanceErrorMessage(context)
  };
}

// src/operations/fetch/payment.ts
async function executePayment(response, request, options) {
  const { paymentProtocol } = options.params;
  const params = {
    response,
    request,
    options
  };
  if (paymentProtocol) {
    return handlerMap[paymentProtocol](params);
  }
  const available = detectPaymentProtocols(response);
  const preferred = available.length === 1 ? available[0] : await pickByBalance(response, options);
  const fallback = available.length > 1 ? preferred === "mpp" /* MPP */ ? "x402" /* X402 */ : "mpp" /* MPP */ : null;
  const fallbackRetryRequest = fallback ? request.clone() : null;
  const result = await handlerMap[preferred](params);
  if (result.isErr() && fallback && fallbackRetryRequest) {
    return handlerMap[fallback]({
      ...params,
      request: fallbackRetryRequest
    });
  }
  return result;
}
var handlerMap = {
  ["mpp" /* MPP */]: handleMppPayment,
  ["x402" /* X402 */]: handleX402Payment
};

// src/operations/fetch/index.ts
async function executeFetch(input, options) {
  const request = buildRequest(input, options);
  const { surface } = options;
  const { timeout } = options.params;
  const blocked = BLACKLISTED_ORIGINS.find(
    (origin) => request.url.startsWith(origin)
  );
  if (blocked) {
    return fetchErr(surface, {
      cause: "network",
      message: `${blocked} is no longer available. This origin has been deprecated.`
    });
  }
  const authRetryRequest = request.clone();
  const paymentRetryRequest = request.clone();
  const probeResult = await safeFetch(surface, request, timeout);
  if (probeResult.isErr()) {
    return fetchErr(surface, probeResult.error);
  }
  const initialResponse = probeResult.value;
  if (initialResponse.status !== 402) {
    return fetchOk({
      response: initialResponse,
      paymentInfo: null
    });
  }
  const authResult = await attemptSiwxAuth(
    initialResponse,
    authRetryRequest,
    paymentRetryRequest,
    options
  );
  if (authResult.isErr()) {
    return authResult;
  }
  const latestResponse = authResult.value.response;
  if (latestResponse.status !== 402) {
    return fetchOk({
      response: latestResponse,
      paymentInfo: null
    });
  }
  return executePayment(
    latestResponse,
    authResult.value.paymentRetryRequest,
    options
  );
}

export {
  executeFetch
};
//# sourceMappingURL=chunk-JVMJVMWB.js.map