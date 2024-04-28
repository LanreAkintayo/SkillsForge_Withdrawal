import { ethers, getNamedAccounts } from "hardhat";
import { sDuration, toWei } from "../utils/helper";
import { FundsLock } from "../typechain-types";

async function main() {
  const { deployer } = await getNamedAccounts();
  let fundsLock: FundsLock = await ethers.getContract("FundsLock", deployer);

  const amountToDeposit = toWei(0.0001);
  const duration = sDuration.seconds(10);

  console.log("Depositing funds");
  const depositTx = await fundsLock.depositFunds(duration, {
    value: amountToDeposit,
  });
  await depositTx.wait();
  console.log("Funds deposited");

  // Get all user deposits;
  const allUserDepositIds = await fundsLock.getUserDepositIds(deployer);
  const userDeposit = await fundsLock.getUserDeposit(
    allUserDepositIds[allUserDepositIds.length - 1]
  );

  console.log("User Deposits: ", userDeposit);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
