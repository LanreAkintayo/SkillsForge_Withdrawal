import { ethers, getNamedAccounts } from "hardhat";
import { toWei } from "../utils/helper";
import { FundsLock } from "../typechain-types";

async function main() {
  const { deployer } = await getNamedAccounts();
  let fundsLock: FundsLock = await ethers.getContract("FundsLock", deployer);

  console.log("Withdrawing funds...");

  const depositId = "0x699032dcce73c38c4801c07805b1257e";
  const withdrawTx = await fundsLock.withdrawFunds(depositId);
  await withdrawTx.wait(1);

  console.log("Funds withdrawn");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
