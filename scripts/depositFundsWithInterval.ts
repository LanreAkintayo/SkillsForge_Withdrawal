import { ethers, getNamedAccounts } from "hardhat";
import { sDuration, toWei } from "../utils/helper";
import { FundsLock } from "../typechain-types";

async function main() {
  const { deployer } = await getNamedAccounts();
  let fundsLock: FundsLock = await ethers.getContract("FundsLock", deployer);

  const amountToDeposit = toWei(0.0006);
  const amounts = [toWei(0.0001), toWei(0.0002), toWei(0.0003)];
  const durations = [
    sDuration.minutes(1),
    sDuration.minutes(2),
    sDuration.minutes(3),
  ];

  console.log("Depositing funds with interval");
  const depositTx = await fundsLock.depositFundsWithInterval(
    amounts,
    durations,
    {
      value: amountToDeposit,
    }
  );
  await depositTx.wait();

  console.log("Funds deposited");

  // Get all user deposits;
  const allUserDepositIds = await fundsLock.getUserDepositIds(deployer);
  const neededIds = allUserDepositIds.slice(
    allUserDepositIds.length - amounts.length
  );

  console.log("All Deposits ............................");
  for (let i = 0; i < neededIds.length; i++) {
    const currentDepositId = neededIds[i];
    const userDeposit = await fundsLock.getUserDeposit(currentDepositId);
    console.log("Deposit: ", userDeposit);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
