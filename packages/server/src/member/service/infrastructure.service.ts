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
  TokenContract,
} from "@prisma/client";

@injectable()
export class BlockChainService {
  constructor(
    @inject(Symbols.PrismaClient)
    private readonly prisma: PrismaClient
  ) {}

  async listBlockChain({
    platform,
    network,
    show,
  }: BlockChainQuery): Promise<BlockChain[]> {
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

  async listTokenContract({
    platform,
    chainId,
    network,
    show,
  }: TokenContractQuery): Promise<TokenContract[]> {
    return await this.prisma.tokenContract.findMany({
      where: { platform, chainId, network, show: show ?? true },
      orderBy: [{ sort: "asc" }],
    });
  }

  async findTokenContract({
    platform,
    chainId,
    tokenSymbol,
  }: {
    platform: BlockChainPlatform;
    chainId: number;
    tokenSymbol: string;
  }): Promise<TokenContract | null> {
    return await this.prisma.tokenContract.findUnique({
      where: {
        platform_chainId_tokenSymbol: {
          platform,
          chainId,
          tokenSymbol,
        },
      },
    });
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
