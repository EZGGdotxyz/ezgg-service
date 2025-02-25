import {
  BlockChainNetwork,
  BlockChainPlatform,
  Prisma,
  PrismaClient,
} from "@prisma/client";

/**
 * 数据库初始化脚本
 * 命令执行yarn run db:seed 或 yarn prisma db seed
 */

const prisma = new PrismaClient();

const TOKEN_CONFIG = {
  USDC: {
    tokenName: "USD Coin",
    tokenSymbol: "USDC",
    tokenDecimals: 6,
    erc: "ERC20" as const,
  },
  USDT: {
    tokenName: "Tether USD",
    tokenSymbol: "USDT",
    tokenDecimals: 6,
    erc: "ERC20" as const,
  },
};

// 修改类型定义
type ChainAddressMap = Record<
  number,
  Partial<Record<BlockChainNetwork, Record<string, string>>>
>;

// 保持原有配置结构不变
const CHAIN_ADDRESSES: ChainAddressMap = {
  // Base Mainnet
  8453: {
    MAIN: {
      USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      USDT: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    },
  },
  // Polygon (Matic)
  137: {
    MAIN: {
      USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    },
  },
  // BNB Smart Chain
  56: {
    MAIN: {
      USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      USDT: "0x55d398326f99059fF775485246999027B3197955",
    },
  },
  // Base Sepolia
  84532: {
    TEST: {
      USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      USDT: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    },
  },
  // Polygon Mumbai
  80001: {
    TEST: {
      USDC: "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23",
      USDT: "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832",
    },
  },
  // BSC Testnet
  97: {
    TEST: {
      USDC: "0x64544969ed7EBf5f083679233325356EbE738930",
      USDT: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
    },
  },
};

async function initTokenContracts() {
  // 获取所有已初始化区块链
  const blockChains = await prisma.blockChain.findMany();

  const contracts: Prisma.TokenContractCreateManyInput[] = [];

  let sort = 0;
  for (const chain of blockChains) {
    const addresses = CHAIN_ADDRESSES[chain.chainId]?.[chain.network];
    if (!addresses) continue;

    for (const [tokenType, address] of Object.entries(addresses)) {
      const tokenConfig = TOKEN_CONFIG[tokenType as keyof typeof TOKEN_CONFIG];
      contracts.push({
        address,
        platform: chain.platform,
        chainId: chain.chainId,
        network: chain.network,
        ...tokenConfig,
        show: true,
        sort: sort++,
      });
    }
  }

  await prisma.tokenContract.createMany({
    data: contracts,
    skipDuplicates: true,
  });
}

async function main() {
  const blockChainCount = await prisma.blockChain.count();
  if (blockChainCount === 0) {
    const data: Prisma.BlockChainCreateManyInput[] = [
      {
        platform: BlockChainPlatform.ETH,
        network: BlockChainNetwork.MAIN,
        chainId: 8453,
        name: "Base Mainnet",
        show: true,
        sort: 0,
      },
      {
        platform: BlockChainPlatform.ETH,
        network: BlockChainNetwork.MAIN,
        chainId: 137,
        name: "Polygon (Matic)",
        show: true,
        sort: 1,
      },
      {
        platform: BlockChainPlatform.ETH,
        network: BlockChainNetwork.MAIN,
        chainId: 56,
        name: "BNB Smart Chain",
        show: true,
        sort: 2,
      },
      {
        platform: BlockChainPlatform.ETH,
        network: BlockChainNetwork.TEST,
        chainId: 84532,
        name: "Base Sepolia",
        show: true,
        sort: 3,
      },
      {
        platform: BlockChainPlatform.ETH,
        network: BlockChainNetwork.TEST,
        chainId: 80001,
        name: "Polygon Mumbai",
        show: true,
        sort: 4,
      },
      {
        platform: BlockChainPlatform.ETH,
        network: BlockChainNetwork.TEST,
        chainId: 97,
        name: "BSC Testnet",
        show: true,
        sort: 5,
      },
    ];
    await prisma.blockChain.createMany({ data });
  }

  // 新增 TokenContract 初始化
  const tokenContractCount = await prisma.tokenContract.count();
  if (tokenContractCount === 0) {
    await initTokenContracts();
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
