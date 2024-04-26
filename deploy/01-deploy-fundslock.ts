import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { developmentChainsId, networkConfig } from "../helper-hardhat-config";
import { ethers } from "hardhat";
import { verify } from "../utils/verify";
import { FundsLock } from "../typechain-types";
import { sDuration, toWei } from "../utils/helper";

const deployFundsLock: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  // @ts-ignore
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const deployerSigner = await ethers.getSigner(deployer);

  const chainId: number = network.config.chainId!;

  console.log(network.name);

  log("----------------------------------------------------");
  const fundsLockDeployment = await deploy("FundsLock", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 0,
  });
  log(`FundsLock deployed at ${fundsLockDeployment.address}`);

  // Set Interest
  const fundsLock: FundsLock = await ethers.getContract("FundsLock", deployer);

  // 5% for 1 year lockup, 7% for 2 years lockup, 10% for 3 year lockup
  const durations = [
    sDuration.years(1),
    sDuration.years(2),
    sDuration.years(3),
  ];
  const interests = [500, 700, 1000];

  const fundsLockTx = await fundsLock.setInterests(durations, interests);
  await fundsLockTx.wait();

  // Let us fund the contract with some ETH
  let ethReserve;
  if (developmentChainsId.includes(chainId)) {
    ethReserve = toWei(1); // 1 ether
  } else {
    ethReserve = toWei(0.001); // 0.001 ether
  }
  const sendTx = await deployerSigner.sendTransaction({
    to: fundsLock.target,
    value: ethReserve,
  });
  await sendTx.wait();

  // if (
  //   !developmentChains.includes(network.name) &&
  //   process.env.ETHERSCAN_API_KEY
  // ) {
  //   await verify(cbnDeployment.address, [])
  // }
};
export default deployFundsLock;
deployFundsLock.tags = ["all", "fundsLock"];
