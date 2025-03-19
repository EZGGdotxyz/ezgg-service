import { inject, injectable } from "inversify";
import { Symbols } from "../../identifier.js";
import type { ExtendPrismaClient as PrismaClient } from "../../plugins/prisma.js";
import { z } from "zod";
import {
  BIZ,
  BizContract,
  BlockChain,
  BlockChainNetwork,
  BlockChainPlatform,
  ERC,
  Prisma,
  TokenContract,
} from "@prisma/client";
import { BlockChainSchema } from "../../../prisma/generated/zod/index.js";
import type { AlchemyFactory } from "../../plugins/alchemy.js";
import { Network, TokenPriceBySymbolResult } from "alchemy-sdk";
import * as _ from "radash";
import { Address, getAddress } from "viem";
import { PARAMETER_ERROR } from "../../core/error.js";

function tokenOf(
  address: string
): Omit<TokenContract, "platform" | "chainId" | "network"> {
  return {
    id: 0,
    createAt: new Date(),
    updateAt: new Date(),
    createBy: 0,
    updateBy: 0,
    deleted: 0,
    deleteAt: null,
    erc: ERC.ERC20,
    address,
    tokenName: null,
    tokenSymbol: null,
    tokenDecimals: null,
    logo: null,
    priceCurrency: null,
    priceValue: null,
    priceUpdateAt: null,
    priceAutoUpdate: false,
    show: true,
    sort: 0,
    feeSupport: false,
  };
}

@injectable()
export class BlockChainService {
  constructor(
    @inject(Symbols.PrismaClient)
    private readonly prisma: PrismaClient,
    @inject(Symbols.AlchemyFactory)
    private readonly alchemy: AlchemyFactory
  ) {}

  async listBlockChain({
    platform,
    network,
    show,
  }: BlockChainQuery): Promise<BlockChainOutput[]> {
    return await this.prisma.blockChain.findMany({
      where: { platform, network, show: show ?? true },
      orderBy: [{ sort: "asc" }],
    });
  }

  async findBlockChain({
    platform,
    chainId,
  }: {
    platform: BlockChainPlatform;
    chainId: number;
  }): Promise<BlockChain | null> {
    return this.prisma.blockChain.findUnique({
      where: {
        platform_chainId: {
          platform,
          chainId,
        },
      },
    });
  }

  async getEthValue({
    platform,
    chainId,
  }: {
    platform: BlockChainPlatform;
    chainId: number;
  }): Promise<{ tokenSymbol: string; tokenPrice?: string }> {
    const blockChain = await this.prisma.blockChain.findUnique({
      where: {
        platform_chainId: {
          platform,
          chainId,
        },
      },
    });
    if (!blockChain) {
      throw PARAMETER_ERROR({ message: `Not supported chain id ${chainId}` });
    }
    if (!blockChain.tokenPrice) {
      const alchemy = await this.alchemy.get(
        blockChain.alchemyNetwork as Network
      );
      const { data } = await alchemy.prices.getTokenPriceBySymbol([
        blockChain.tokenSymbol,
      ]);
      const result =
        data.filter((x) => x.symbol === blockChain.tokenSymbol)[0] ?? null;
      const price =
        result?.prices.filter((x) => x.currency === "usd")[0] ?? null;
      blockChain.tokenPrice = price?.value ?? null;
      if (blockChain.tokenPrice) {
        await this.prisma.blockChain.update({
          where: {
            platform_chainId: {
              platform,
              chainId,
            },
          },
          data: {
            tokenPrice: blockChain.tokenPrice,
          },
        });
      }
    }
    return {
      tokenSymbol: blockChain.tokenSymbol,
      tokenPrice: blockChain.tokenPrice,
    };
  }

  async listTokenContract({
    platform,
    chainId,
    network,
    show,
  }: TokenContractQuery): Promise<TokenContract[]> {
    return await this.prisma.tokenContract.findMany({
      where: { platform, chainId, network, show: show ?? true },
      orderBy: [{ sort: "asc" }, { tokenName: "asc" }],
    });
  }

  async findTokenContract({
    platform,
    chainId,
    address,
  }: {
    platform: BlockChainPlatform;
    chainId: number;
    address: Address;
  }): Promise<TokenContract> {
    const tokenMap = await this.mappingTokenContract({
      platform,
      chainId,
      addressList: [address],
    });
    const defaultToken: TokenContract = {
      ...tokenOf(address),
      platform,
      chainId,
      network: BlockChainNetwork.MAIN,
    };
    return tokenMap.get(address) ?? defaultToken;
  }

  async mappingTokenContract({
    platform,
    chainId,
    addressList,
  }: {
    platform: BlockChainPlatform;
    chainId: number;
    addressList: Address[];
  }): Promise<Map<Address, TokenContract>> {
    const blockChain = await this.prisma.blockChain.findUnique({
      where: { platform_chainId: { platform, chainId } },
    });
    if (!blockChain) {
      return new Map();
    }
    const alchemy = this.alchemy.get(blockChain.alchemyNetwork as Network);

    const tokenContractList = await this.prisma.tokenContract.findMany({
      where: {
        platform,
        chainId,
        address: { in: addressList },
      },
    });
    const existAddressSet = new Set(
      tokenContractList.map((x) => getAddress(x.address))
    );
    const newAddressList = addressList.filter((x) => !existAddressSet.has(x));

    if (!_.isEmpty(newAddressList)) {
      const dataManyInput: Prisma.TokenContractCreateManyInput[] = [];
      for (const address of newAddressList) {
        const tokenMetadata = await alchemy.core.getTokenMetadata(address);
        dataManyInput.push({
          address,
          platform,
          chainId,
          network: blockChain.network,
          erc: ERC.ERC20,
          tokenName: tokenMetadata.name,
          tokenSymbol: tokenMetadata.symbol,
          tokenDecimals: tokenMetadata.decimals,
          logo: tokenMetadata.logo,
          show: false,
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

        tokenContractList.push(
          await this.prisma.tokenContract.create({ data })
        );
      }
    }

    return new Map(tokenContractList.map((x) => [getAddress(x.address), x]));
  }
}

@injectable()
export class BizContractService {
  constructor(
    @inject(Symbols.PrismaClient)
    private readonly prisma: PrismaClient
  ) {}

  async listContract({
    platform,
    network,
    enabled,
  }: BizContractQuery): Promise<BizContract[]> {
    return await this.prisma.bizContract.findMany({
      where: { platform, network, enabled: enabled ?? true },
      orderBy: [{ ver: "desc" }],
    });
  }

  async findContract({
    platform,
    chainId,
    business,
  }: {
    platform: BlockChainPlatform;
    chainId: number;
    business: BIZ;
  }): Promise<BizContract | null> {
    return await this.prisma.bizContract.findUnique({
      where: { platform_chainId_business: { platform, chainId, business } },
    });
  }
}

export const BlockChainSchemas = {
  BlockChainQuery: z.object({
    platform: z.nativeEnum(BlockChainPlatform, {
      description: "区块链平台: ETH 以太坊；SOLANA Solana;",
    }),
    network: z
      .nativeEnum(BlockChainNetwork, {
        description: "区块链网路类型：MAIN 主网；TEST 测试网；DEV 开发网",
      })
      .optional(),
  }),
  BlockChainOutput: BlockChainSchema.omit({
    alchemyRpc: true,
    tokenPrice: true,
  }),
  TokenContractQuery: z.object({
    platform: z.nativeEnum(BlockChainPlatform, {
      description: "区块链平台: ETH 以太坊；SOLANA Solana;",
    }),
    chainId: z.number({ description: "区块链id" }).optional(),
    network: z
      .nativeEnum(BlockChainNetwork, {
        description: "区块链网路类型：MAIN 主网；TEST 测试网；DEV 开发网",
      })
      .optional(),
  }),
};

export type BlockChainQuery = z.infer<
  typeof BlockChainSchemas.BlockChainQuery
> & { show?: boolean };

export type BlockChainOutput = z.infer<
  typeof BlockChainSchemas.BlockChainOutput
>;

export type TokenContractQuery = z.infer<
  typeof BlockChainSchemas.TokenContractQuery
> & { show?: boolean };

export const BizContractSchemas = {
  BizContractQuery: z.object({
    platform: z.nativeEnum(BlockChainPlatform, {
      description: "区块链平台: ETH 以太坊；SOLANA Solana;",
    }),
    chainId: z.number({ description: "区块链id" }).optional(),
    network: z
      .nativeEnum(BlockChainNetwork, {
        description: "区块链网路类型：MAIN 主网；TEST 测试网；DEV 开发网",
      })
      .optional(),
  }),
};

export type BizContractQuery = z.infer<
  typeof BizContractSchemas.BizContractQuery
> & { enabled?: boolean };
