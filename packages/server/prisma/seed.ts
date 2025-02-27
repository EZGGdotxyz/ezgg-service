import {
  BIZ,
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
        alchemyRpc: "https://base-mainnet.g.alchemy.com/v2",
        alchemyNetwork: "base-mainnet",
      },
      {
        platform: BlockChainPlatform.ETH,
        network: BlockChainNetwork.MAIN,
        chainId: 137,
        name: "Polygon (Matic)",
        show: true,
        sort: 1,
        alchemyRpc: "https://polygon-mainnet.g.alchemy.com/v2",
        alchemyNetwork: "polygon-mainnet",
      },
      {
        platform: BlockChainPlatform.ETH,
        network: BlockChainNetwork.MAIN,
        chainId: 56,
        name: "BNB Smart Chain",
        show: true,
        sort: 2,
        alchemyRpc: "https://bnb-mainnet.g.alchemy.com/v2",
        alchemyNetwork: "bnb-mainnet",
      },
      {
        platform: BlockChainPlatform.ETH,
        network: BlockChainNetwork.TEST,
        chainId: 84532,
        name: "Base Sepolia",
        show: true,
        sort: 3,
        alchemyRpc: "https://base-sepolia.g.alchemy.com/v2",
        alchemyNetwork: "base-sepolia",
      },
      {
        platform: BlockChainPlatform.ETH,
        network: BlockChainNetwork.TEST,
        chainId: 80001,
        name: "Polygon Mumbai",
        show: true,
        sort: 4,
        alchemyRpc: "https://polygon-amoy.g.alchemy.com/v2",
        alchemyNetwork: "polygon-amoy",
      },
      {
        platform: BlockChainPlatform.ETH,
        network: BlockChainNetwork.TEST,
        chainId: 97,
        name: "BSC Testnet",
        show: true,
        sort: 5,
        alchemyRpc: "https://bnb-testnet.g.alchemy.com/v2",
        alchemyNetwork: "bnb-testnet",
      },
    ];
    await prisma.blockChain.createMany({ data });
  }

  const bizContractCount = await prisma.bizContract.count();
  if (bizContractCount === 0) {
    // Base Sepolia 84532
    const baseSepolia = await prisma.blockChain.findUnique({
      where: {
        platform_chainId: {
          platform: BlockChainPlatform.ETH,
          chainId: 84532,
        },
      },
    });
    if (baseSepolia) {
      const prototype = {
        platform: baseSepolia.platform,
        chainId: baseSepolia.chainId,
        network: baseSepolia.network,
        enabled: true,
        ver: 1,
      };
      await prisma.bizContract.createMany({
        data: [
          {
            ...prototype,
            business: BIZ.TRANSFER,
            address: "0xb5E6435BAD8C89aE1743A6b397FA9AACb32a16b6",
          },
          {
            ...prototype,
            business: BIZ.LINK,
            address: "0x469798aF201bec7ab2A7F9A58174EC730afE7016",
          },
        ],
      });
    }
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
