// src/shared/utils.ts
import { formatUnits } from "viem";
var getBaseUrl = (dev) => {
  return dev ? "http://localhost:3000" : "https://agentcash.dev";
};
var getDepositLink = (address, flags, network) => {
  return `${getBaseUrl(flags.dev)}/deposit/${address}${network ? `?network=${network}` : ""}`;
};
var tokenStringToNumber = (amount, decimals = 6) => {
  return Number(formatUnits(BigInt(amount), decimals));
};
var formatUsd = (amount) => {
  const fractionDigits = amount < 0.01 && amount > 0 ? 4 : 2;
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: fractionDigits
  });
};

export {
  getBaseUrl,
  getDepositLink,
  tokenStringToNumber,
  formatUsd
};
//# sourceMappingURL=chunk-U6FRXL3X.js.map