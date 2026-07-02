import { ethers } from "hardhat";

const INITIAL_SUPPLY = 1_000_000_000n * 10n ** 18n;
const BSCSCAN_BASE_URL = "https://bscscan.com";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error("No deployer account. Set PRIVATE_KEY in contracts/.env");
  }

  console.log("Deploying SyraToken with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");

  const SyraToken = await ethers.getContractFactory("SyraToken");
  const deployTx = await SyraToken.getDeployTransaction(
    INITIAL_SUPPLY,
    deployer.address,
  );

  const sent = await deployer.sendTransaction({
    data: deployTx.data,
    gasLimit: deployTx.gasLimit ?? 1_000_000n,
  });

  console.log("Deployment tx hash:", sent.hash);
  const receipt = await ethers.provider.waitForTransaction(sent.hash, 1, 180_000);
  const address = receipt?.contractAddress;

  if (!address) {
    throw new Error("Contract address missing from deployment receipt");
  }

  console.log("\nSyraToken deployed to:", address);
  console.log("Explorer:", `${BSCSCAN_BASE_URL}/address/${address}`);
  console.log("Initial supply:", INITIAL_SUPPLY.toString(), "wei (1B SYRA)");
  console.log("Recipient:", deployer.address);
  console.log("\nVerify with:");
  console.log(
    `npx hardhat verify --network bsc ${address} "${INITIAL_SUPPLY.toString()}" "${deployer.address}"`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
