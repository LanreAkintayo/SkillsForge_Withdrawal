import { ethers, getNamedAccounts, network } from "hardhat";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import { verify } from "../utils/verify";
import { FundsLock } from "../typechain-types";

async function main() {
  const { deployer } = await getNamedAccounts();
  let fundsLock: FundsLock = await ethers.getContract("FundsLock", deployer);

  if (
    !developmentChains.includes(network.name) &&
    process.env.SEPOLIA_URL
  ) {
    await verify(
      fundsLock.target,
      "contracts/FundsLock.sol:FundsLock",
      []
    );
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
