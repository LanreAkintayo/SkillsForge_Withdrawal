import { ethers, getNamedAccounts, network } from "hardhat";
import { Addressable, BigNumberish, Signer } from "ethers";
import { networkConfig } from "../helper-hardhat-config";
import { IUniswapV2Router, IERC20 } from "../typechain-types";



export const toWei = (value: number): bigint => {
  return ethers.parseEther(value.toString());
};

export const fromWei = (amount: number | bigint): string => {
  return ethers.formatEther(amount);
};

export const fastForwardTheTime = async (valueInSeconds: number) => {
  await ethers.provider.send("evm_increaseTime", [valueInSeconds]);
  await ethers.provider.send("evm_mine", []);
};

export const now = async () => {
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);
  return block?.timestamp;
};

export const percent = (percentage: number, amount: string) => {
  return (percentage * Number(amount)) / 100;
};

export const sDuration = {
  seconds: function (val: number) {
    return val;
  },
  minutes: function (val: number) {
    return val * this.seconds(60);
  },
  hours: function (val: number) {
    return val * this.minutes(60);
  },
  days: function (val: number) {
    return val * this.hours(24);
  },
  weeks: function (val: number) {
    return val * this.days(7);
  },
  years: function (val: number) {
    return val * this.days(365);
  },
};
