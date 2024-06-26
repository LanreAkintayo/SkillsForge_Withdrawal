import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "dotenv/config";
import "solidity-coverage";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-contract-sizer";


const SEPOLIA_URL = process.env.SEPOLIA_URL;
const MNEMONIC = process.env.MNEMONIC;

interface Network {
  url: string;
  chainId: number;
  blockConfirmations: number;
  accounts: { mnemonic: string };
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 300,
          },
          viaIR: true,
        },
      },
    ],
  },
  networks: {
    hardhat: {
      // forking: {
      //   url: "https://bsc-dataseed.binance.org",
      // },
    },
    localhost: {
      timeout: 100_000_000,
    },
    sepolia: {
      url: SEPOLIA_URL,
      chainId: 11155111,
      blockConfirmations: 6,
      //@ts-ignore
      accounts: { mnemonic: MNEMONIC },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    user: {
      default: 1,
    },
  },

  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: true,
  },

  etherscan: {
    apiKey: {
      // @ts-ignore
      sepolia: process.env.SEPOLIA_API_KEY,
    },
  },
};

export default config;
