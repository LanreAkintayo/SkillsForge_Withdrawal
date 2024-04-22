export interface networkConfigInfo {
  [key: string]: networkConfigItem;
}

export interface networkConfigItem {
  blockConfirmations: number;
  wbnb: string;
}
export const networkConfig: networkConfigInfo = {

  hardhat: {
    blockConfirmations: 0,
    wbnb: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
  },

  mainnet: {
    blockConfirmations: 6,
    wbnb: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
  },

  testnet: {
    blockConfirmations: 6,
    wbnb: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
  },
};
export const developmentChains = ["hardhat", "localhost"];
