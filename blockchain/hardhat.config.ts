import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: {
        count: 20,
        accountsBalance: "10000000000000000000000", // 10,000 ETH
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    "polygon-mumbai": {
      url: process.env.POLYGON_MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.ADMIN_PRIVATE_KEY ? [process.env.ADMIN_PRIVATE_KEY] : [],
      chainId: 80001,
      gasPrice: 20000000000, // 20 gwei
      timeout: 60000,
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 137,
      gasPrice: 30000000000, // 30 gwei
    },
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v5",
  },
  paths: {
    sources: "./contracts",
    tests: "./test/contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};

export default config;