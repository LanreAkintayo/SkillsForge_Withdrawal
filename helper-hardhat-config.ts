export interface networkConfigInfo {
  [key: string]: networkConfigItem;
}

export interface networkConfigItem {
  blockConfirmations: number;
  weth: string;
}
export const networkConfig: networkConfigInfo = {
  hardhat: {
    blockConfirmations: 0,
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },

  mainnet: {
    blockConfirmations: 6,
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },

  sepolia: {
    blockConfirmations: 6,
    weth: "0x5f207d42F869fd1c71d7f0f81a2A67Fc20FF7323",
  },
};
export const developmentChains = ["hardhat", "localhost"];
export const developmentChainsId = [31337];
