import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "hardhat-chai-matchers-viem";
import "hardhat-docgen";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    baseSepolia: {
      chainId: 84532,
      url: `https://base-sepolia.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    polygonAmoy: {
      chainId: 80002,
      url: `https://polygon-amoy.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    bnbTestnet: {
      chainId: 97,
      url: `https://bnb-testnet.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    base: {
      chainId: 8453,
      url: `https://base-mainnet.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      accounts: process.env.EGZZ_ONWER_PRIVY_KEY
        ? [process.env.EGZZ_ONWER_PRIVY_KEY]
        : [],
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASE_TESTNET_SCAN_API_KEY!,
      polygonAmoy: process.env.POLYGON_TESTNET_SCAN_API_KEY!,
      bnbTestnet: process.env.BNB_TESTNET_SCAN_API_KEY!,
      base: process.env.BASE_TESTNET_SCAN_API_KEY!,
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
      {
        network: "bnbTestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api-testnet.bscscan.com/api",
          browserURL: "https://testnet.bscscan.com/",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/",
        },
      },
    ],
  },
  docgen: {
    path: "./docs", // 输出目录
    clear: true, // 是否清除旧文件
    runOnCompile: true, // 是否在编译时自动生成文档
  },
};

export default config;
