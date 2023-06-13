import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@nomicfoundation/hardhat-ethers';
import 'hardhat-deploy';
import * as dotenv from "dotenv";
import './tasks/setTrustedRemote.task';
import './tasks/migrate.task';
import './tasks/pause.task';
import './tasks/mintOwner.task';
import './tasks/approve.task';
import './tasks/retryPayload.task';
dotenv.config()

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  networks: {
    fuji: {
      chainId: 43113,
      url: `https://api.avax-test.network/ext/bc/C/rpc`,
      accounts: [process.env.PRIVATE_KEY as string]
    },
    avalanche: {
      chainId: 43114,
      url: `https://api.avax.network/ext/bc/C/rpc`,
      accounts: [process.env.PRIVATE_KEY as string]
    },
    mainnet: {
      chainId: 1,
      url: `https://eth.llamarpc.com`,
      accounts: [process.env.PRIVATE_KEY as string]
    },
    goerli: {
      chainId: 5,
      url: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // public infura endpoint
      accounts: [process.env.PRIVATE_KEY as string]
    },
    fantom: {
      url: `https://rpcapi.fantom.network`,
      chainId: 250,
      accounts: [process.env.PRIVATE_KEY as string]
    },
    bsc: {
      url: "https://bsc-dataseed1.binance.org",
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY as string]
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.MAINNET_ETHERSCAN_KEY as string,
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.18',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      },
    ]
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 240000, // 4 min timeout
  },
};

export default config;