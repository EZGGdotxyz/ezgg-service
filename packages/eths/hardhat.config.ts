import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "hardhat-chai-matchers-viem";
import "hardhat-docgen";
import "dotenv/config";
import "./task/index";

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
    monadTestnet: {
      chainId: 10143,
      url: `https://monad-testnet.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    arbitrumSepolia: {
      chainId: 421614,
      url: `https://arb-sepolia.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    scrollSepolia: {
      chainId: 534351,
      url: `https://scroll-sepolia.g.alchemy.com/v2/${process.env
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
    enabled: true,
    apiKey: {
      baseSepolia: process.env.BASE_TESTNET_SCAN_API_KEY!,
      polygonAmoy: process.env.POLYGON_TESTNET_SCAN_API_KEY!,
      bnbTestnet: process.env.BNB_TESTNET_SCAN_API_KEY!,
      arbitrumSepolia: process.env.ARBITRUM_TESTNET_SCAN_API_KEY!,
      scrollSepolia: process.env.SCROLL_TESTNET_SCAN_API_KEY!,
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
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/",
        },
      },
      {
        network: "scrollSepolia",
        chainId: 534351,
        urls: {
          apiURL: "https://api-sepolia.scrollscan.com/api",
          browserURL: "https://sepolia.scrollscan.com/",
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
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify-api-monad.blockvision.org",
    browserUrl: "https://testnet.monadexplorer.com",
  },
  docgen: {
    path: "./docs", // 输出目录
    clear: true, // 是否清除旧文件
    runOnCompile: true, // 是否在编译时自动生成文档
  },
};

export default config;
