import {
  BIZ,
  BlockChainNetwork,
  BlockChainPlatform,
  ERC,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { Alchemy, Network, TokenPriceBySymbolResult } from "alchemy-sdk";
import * as _ from "radash";

/**
 * 数据库初始化脚本
 * 命令执行yarn run db:seed 或 yarn prisma db seed
 */

const prisma = new PrismaClient();

async function main() {
  const alchemy = new Alchemy({
    apiKey: "JbmHhrBLsn156IbRlVCyKEn-vBu7o2B8",
    network: Network.BASE_MAINNET,
  });
  const newAddressList = [
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "0x1cff25B095cf6595afAbe35Dd7e5348666e57C11",
    "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
    "0xfb3CB973B2a9e2E09746393C59e7FB0d5189d290",
    "0xd403D1624DAEF243FbcBd4A80d8A6F36afFe32b2",
    "0x63706e401c06ac8513145b7687A14804d17f814b",
  ];
  const dataManyInput: Prisma.TokenContractCreateManyInput[] = [];
  for (const address of newAddressList) {
    const tokenMetadata = await alchemy.core.getTokenMetadata(address);
    console.log(tokenMetadata);
    dataManyInput.push({
      address,
      platform: BlockChainPlatform.ETH,
      chainId: 8453,
      network: BlockChainNetwork.MAIN,
      erc: ERC.ERC20,
      tokenName: tokenMetadata.name,
      tokenSymbol: tokenMetadata.symbol,
      tokenDecimals: tokenMetadata.decimals,
      logo: tokenMetadata.logo,
      show: true,
      sort: 0,
    });
  }

  let tokenPriceMap: Record<string, TokenPriceBySymbolResult> = {};
  const tokenSymbols = dataManyInput
    .filter((x) => !_.isEmpty(x.tokenSymbol))
    .map((x) => x.tokenSymbol as string)
    .map((x) => {
      if (x.indexOf("u") > -1) {
        return x.replace("u", "");
      } else {
        return x;
      }
    });
  if (!_.isEmpty(tokenSymbols)) {
    const { data: tokenPriceResult } =
      await alchemy.prices.getTokenPriceBySymbol(tokenSymbols);
    tokenPriceMap = Object.fromEntries(
      tokenPriceResult.map((x) => [x.symbol, x])
    );
  }

  for (const data of dataManyInput) {
    if (data.tokenSymbol && !_.isEmpty(data.tokenSymbol)) {
      let tokenPrice;
      if (data.tokenSymbol.indexOf("u") > -1) {
        const k = data.tokenSymbol.replace("u", "");
        tokenPrice = tokenPriceMap[k];
      } else {
        tokenPrice = tokenPriceMap[data.tokenSymbol];
      }
      const price = tokenPrice?.prices.find((x) => x.currency === "usd");
      data.priceCurrency = price?.currency;
      data.priceValue = price?.value;
      data.priceUpdateAt = price?.lastUpdatedAt;
    }

    if (!data.tokenDecimals || !data.priceValue) {
      data.feeSupport = false;
    }

    await prisma.tokenContract.create({ data });
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
