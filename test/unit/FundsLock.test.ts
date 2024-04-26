import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import {
  network,
  deployments,
  ethers,
  getNamedAccounts,
  getUnnamedAccounts,
} from "hardhat";
import {
  now,
  sDuration,
  toWei,
  fastForwardTheTime,
} from "../../utils/helper";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { FundsLock } from "../../typechain-types";

describe("FundsLock Contract", function () {
  let fundsLock: FundsLock;
  let user1: SignerWithAddress,
    user2: SignerWithAddress,
    user3: SignerWithAddress,
    user4: SignerWithAddress;
  let deployerSigner: SignerWithAddress;

  beforeEach(async () => {
    const users = await getUnnamedAccounts();
    user1 = await ethers.getSigner(users[0]);
    user2 = await ethers.getSigner(users[1]);
    user3 = await ethers.getSigner(users[2]);
    user4 = await ethers.getSigner(users[3]);

    const deployer = (await getNamedAccounts()).deployer;
    deployerSigner = await ethers.getSigner(deployer);

    await deployments.fixture(["fundsLock"]);

    fundsLock = await ethers.getContract("FundsLock", deployer);
  });

  it("should be able to deposit funds and set duration", async () => {
    const amountToDeposit = toWei(1);
    const duration = sDuration.weeks(2);

    const allDepositIdsBefore = await fundsLock.getUserDepositIds(
      deployerSigner.address
    );

    const depositTx = await fundsLock.depositFunds(duration, {
      value: amountToDeposit,
    });
    await depositTx.wait();

    const allDepositIdsAfter = await fundsLock.getUserDepositIds(
      deployerSigner.address
    );
    const newDeposit = await fundsLock.getUserDeposit(allDepositIdsAfter[0]);
    const [depositor, amount, depositTime, depositDuration, claim, id] =
      newDeposit;

    expect(allDepositIdsBefore.length).to.equal(0);
    expect(allDepositIdsAfter.length).to.equal(1);
    expect(depositor).to.equal(deployerSigner.address);
    expect(amount).to.equal(amountToDeposit);
    expect(depositDuration).to.equal(sDuration.weeks(2));
    expect(claim).to.equal(false);
    expect(id).to.equal(allDepositIdsAfter[0]);
  });

  it("should be able to deposit funds with interval", async () => {
    const totalFundsToDeposit = toWei(6);
    const fundsToDeposit = [toWei(1), toWei(2), toWei(3)];
    const durations = [
      sDuration.days(15),
      sDuration.days(30),
      sDuration.days(45),
    ];

    const allDepositIdsBefore = await fundsLock.getUserDepositIds(
      deployerSigner.address
    );

    // It should revert if you try to deposit more than we are paying
    const totalAmount = await fundsLock.getTotalAmount(fundsToDeposit);
    expect(totalAmount).equal(totalFundsToDeposit);

    await expect(
      fundsLock.depositFundsWithInterval(fundsToDeposit, durations, {
        value: toWei(1),
      })
    ).to.revertedWithCustomError(fundsLock, "FundsLock__InsufficientFunds");

    const depositTx = await fundsLock.depositFundsWithInterval(
      durations,
      fundsToDeposit,
      {
        value: totalFundsToDeposit,
      }
    );
    await depositTx.wait();

    const allDepositIdsAfter = await fundsLock.getUserDepositIds(
      deployerSigner.address
    );

    expect(allDepositIdsBefore.length).to.equal(0);
    expect(allDepositIdsAfter.length).to.equal(3);
  });

  it("should be able to withdraw after deposit", async () => {
    // Deposit
    const amountToDeposit = toWei(1);
    const duration = sDuration.weeks(2);

    const depositTime = await now();

    const depositTx = await fundsLock.depositFunds(duration, {
      value: amountToDeposit,
    });
    await depositTx.wait();

    // Expected to revert if you to try to withdraw immediately
    const depositIds = await fundsLock.getUserDepositIds(
      deployerSigner.address
    );
    await expect(
      fundsLock.withdrawFunds(depositIds[0])
    ).to.revertedWithCustomError(fundsLock, "FundsLock__FundsStillLockUp");

    // Fast forward the time to after 3 weeks
    await fastForwardTheTime(sDuration.weeks(3));

    // It should revert if someone else tries to withdraw what you deposited
    await expect(
      fundsLock.connect(user2).withdrawFunds(depositIds[0])
    ).to.revertedWithCustomError(fundsLock, "FundsLock__DepositNotForCaller");

    // Let's try to withdraw again
    const balanceBeforeWithdraw = await ethers.provider.getBalance(
      deployerSigner.address
    );

    const depositInterest = await fundsLock.getInterest(
      amountToDeposit,
      depositTime!
    );

    const withdrawTx = await fundsLock.withdrawFunds(depositIds[0]);
    const withdrawReceipt = await withdrawTx.wait();

    const gasFee = withdrawReceipt?.fee;

    const balanceAfterWithdraw = await ethers.provider.getBalance(
      deployerSigner.address
    );

    expect(balanceAfterWithdraw).to.equal(
      balanceBeforeWithdraw + amountToDeposit + depositInterest - gasFee!
    );

    // It is expected to revert if you try to withdraw what has already been withdrawn
    await expect(
      fundsLock.withdrawFunds(depositIds[0])
    ).to.revertedWithCustomError(fundsLock, "FundsLock__AlreadyWithdrawn");
  });

  it("should be able to earn interest if withdrawn late", async () => {
    // Deposit
    const amountToDeposit = toWei(1);
    const duration = sDuration.weeks(2);

    const depositTime = await now();

    const depositTx = await fundsLock.depositFunds(duration, {
      value: amountToDeposit,
    });
    await depositTx.wait();

    const depositIds = await fundsLock.getUserDepositIds(
      deployerSigner.address
    );

    // Fast forward the time to like 2 years
    await fastForwardTheTime(sDuration.years(2.5));

    // Withdraw

    // Expected Interest is 7% of the funds deposited for >=2 and <3 years lock up
    const expectedInterest = (700n * amountToDeposit) / 10_000n;
    const actualInterest = await fundsLock.getInterest(
      amountToDeposit,
      depositTime!
    );

    const balanceBeforeWithdraw = await ethers.provider.getBalance(
      deployerSigner.address
    );

    const withdrawTx = await fundsLock.withdrawFunds(depositIds[0]);
    const withdrawReceipt = await withdrawTx.wait();

    const gasFee = withdrawReceipt?.fee;

    const balanceAfterWithdraw = await ethers.provider.getBalance(
      deployerSigner.address
    );

    expect(expectedInterest).to.equal(actualInterest);
    expect(balanceAfterWithdraw).to.equal(
      balanceBeforeWithdraw + amountToDeposit + actualInterest - gasFee!
    );
  });
});
