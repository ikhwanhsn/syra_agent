import {
  getState
} from "./chunk-ISF2WVEZ.js";
import {
  getBalance
} from "./chunk-KJCWPVQE.js";
import {
  Network
} from "./chunk-NPJV7AMV.js";
import {
  getBaseUrl,
  getDepositLink
} from "./chunk-U6FRXL3X.js";

// src/operations/onboarding-cta.ts
function shouldShowOnboardingCta(totalBalance) {
  if (totalBalance > 0) {
    return false;
  }
  return (getState().redeemedCodes?.length ?? 0) < 1;
}
function getOnboardingCta(flags) {
  const onboardLink = `${getBaseUrl(flags.dev)}/onboard`;
  return {
    message: `Welcome to AgentCash. To get started, complete onboarding at ${onboardLink} and receive your reward.`,
    onboardLink
  };
}

// src/operations/wallet.ts
var getWalletInfo = async (surface, wallets, flags) => {
  return getBalances(surface, wallets, flags);
};
var listAccountsWithAddresses = (wallets) => {
  const {
    evm: { address: evmAddress },
    svm: { address: svmAddress }
  } = wallets;
  return Object.values(Network).map((network) => ({
    address: network === "solana" /* SOLANA */ ? svmAddress : evmAddress,
    network
  }));
};
var getBalances = async (surface, wallets, flags) => {
  const {
    evm: { address: evmAddress },
    svm: { address: svmAddress }
  } = wallets;
  const balanceResults = await Promise.all(
    Object.values(Network).map(
      (network) => getBalance(
        surface,
        network === "solana" /* SOLANA */ ? { address: svmAddress, network } : { address: evmAddress, network },
        flags
      )
    )
  );
  const accounts = balanceResults.filter((balance) => balance.isOk()).map((balance) => {
    const address = balance.value.paymentNetwork === "solana" /* SOLANA */ ? svmAddress : evmAddress;
    const depositLink = getDepositLink(
      address,
      flags,
      balance.value.paymentNetwork
    );
    return {
      balance: balance.value.balance,
      network: balance.value.paymentNetwork,
      address,
      depositLink
    };
  });
  const totalBalance = accounts.reduce(
    (acc, balance) => acc + balance.balance,
    0
  );
  return {
    accounts,
    totalBalance,
    onboardingCta: shouldShowOnboardingCta(totalBalance) ? getOnboardingCta(flags) : void 0
  };
};
var listAccountsWithBalances = async (surface, wallets, flags) => {
  return getBalances(surface, wallets, flags);
};

export {
  getOnboardingCta,
  getWalletInfo,
  listAccountsWithAddresses,
  getBalances,
  listAccountsWithBalances
};
//# sourceMappingURL=chunk-YUPRVVFP.js.map