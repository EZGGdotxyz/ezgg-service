import { inject, injectable } from "inversify";
import { Symbols as Services } from "./identifier.js";
import { z } from "zod";
import { BlockChainPlatform, TokenContract } from "@prisma/client";
import { BlockChainService } from "./infrastructure.service.js";
import { PARAMETER_ERROR } from "../../core/error.js";
import { formatUnits, getAddress } from "viem";
import * as _ from "radash";
import { Symbols } from "../../identifier.js";
import { Network } from "alchemy-sdk";
import type { AlchemyFactory } from "../../plugins/alchemy.js";
import { TokenContractSchema } from "../../../prisma/generated/zod/index.js";
import { Decimal } from "decimal.js";

@injectable()
export class BalanceService {
  constructor(
    @inject(Services.BlockChainService)
    private readonly blockChainService: BlockChainService,
    @inject(Symbols.AlchemyFactory)
    private readonly alchemy: AlchemyFactory
  ) {}

  async findBalance({
    platform,
    chainId,
    currency,
    address,
    smartWalletAddress,
  }: BalanceFindInput): Promise<BalanceFindOutput> {
    const blockChain = await this.blockChainService.findBlockChain({
      platform,
      chainId,
    });
    if (!blockChain) {
      throw PARAMETER_ERROR({ message: `Not supported chain id ${chainId}` });
    }
    if (!blockChain.alchemyRpc || _.isEmpty(blockChain.alchemyRpc)) {
      throw PARAMETER_ERROR({
        message: `Not supported chain id ${chainId}`,
      });
    }

    const alchemy = this.alchemy.get(blockChain.alchemyNetwork as Network);
    const { tokenBalances } = await alchemy.core.getTokenBalances(
      smartWalletAddress,
      [address]
    );
    const token = await this.blockChainService.findTokenContract({
      platform,
      chainId,
      address: getAddress(address),
    });

    const [tokenAmount, currencyAmount] = this.formatAmount({
      currency,
      tokenBalance: tokenBalances[0].tokenBalance,
      token,
    });

    return {
      currency,
      currencyAmount,
      token,
      tokenAmount,
    };
  }

  async listBalance(query: BalanceQuery): Promise<BalanceOutput> {
    const { platform, chainId, currency, smartWalletAddress } = query;
    const blockChain = await this.blockChainService.findBlockChain({
      platform,
      chainId,
    });
    if (!blockChain) {
      throw PARAMETER_ERROR({ message: `Not supported chain id ${chainId}` });
    }
    if (!blockChain.alchemyRpc || _.isEmpty(blockChain.alchemyRpc)) {
      throw PARAMETER_ERROR({
        message: `Not supported chain id ${chainId}`,
      });
    }

    const alchemy = this.alchemy.get(blockChain.alchemyNetwork as Network);
    const { tokenBalances } = await alchemy.core.getTokenBalances(
      smartWalletAddress
    );
    const tokenMap = await this.blockChainService.mappingTokenContract({
      platform,
      chainId,
      addressList: tokenBalances.map((token) =>
        getAddress(token.contractAddress)
      ),
    });

    let totalBalance = new Decimal(0);
    const tokens: BalanceOutput["tokens"] = [];
    for (const { contractAddress, tokenBalance } of tokenBalances) {
      const token = tokenMap.get(getAddress(contractAddress));
      const [tokenAmount, currencyAmount] = this.formatAmount({
        currency,
        tokenBalance,
        token,
      });

      if (currencyAmount) {
        totalBalance = totalBalance.plus(currencyAmount);
      }

      tokens.push({
        currency,
        currencyAmount,
        token,
        tokenAmount,
      });
    }

    return {
      summary: {
        currency,
        balance: totalBalance.toFixed(),
      },
      tokens,
    };
  }

  private formatAmount({
    currency,
    tokenBalance,
    token,
  }: {
    currency: String;
    tokenBalance: string | null;
    token: TokenContract | undefined;
  }): [string, string | undefined] {
    const tokenAmount = token?.tokenDecimals
      ? formatUnits(BigInt(tokenBalance ?? "0"), token.tokenDecimals)
      : tokenBalance ?? "0";
    const currencyAmount = token?.priceValue
      ? new Decimal(tokenAmount).mul(new Decimal(token.priceValue)).toFixed()
      : undefined;

    return [tokenAmount, currencyAmount];
  }
}

const BalanceTokenSchema = z.object({
  currency: z.string({ description: "货币符号：usd/hkd/cny" }),
  currencyAmount: z.string({ description: "货币余额" }).optional(),
  token: TokenContractSchema.optional(),
  tokenAmount: z.string({ description: "代币数量" }),
});

export const BalanceSchemas = {
  BalanceFindInput: z.object({
    platform: z.nativeEnum(BlockChainPlatform),
    chainId: z.coerce.number(),
    currency: z.string({ description: "货币符号：usd/hkd/cny" }),
    address: z.string({ description: "代币合约地址" }),
  }),
  BalanceFindOutput: BalanceTokenSchema,
  BalanceQuery: z.object({
    platform: z.nativeEnum(BlockChainPlatform),
    chainId: z.coerce.number(),
    currency: z.string({ description: "货币符号：usd/hkd/cny" }),
  }),
  BalanceOutput: z.object({
    summary: z.object({
      currency: z.string({ description: "货币符号：usd/hkd/cny" }),
      balance: z.string({ description: "货币余额" }),
    }),
    tokens: z.array(BalanceTokenSchema),
  }),
};

export type BalanceFindInput = z.infer<
  typeof BalanceSchemas.BalanceFindInput
> & {
  smartWalletAddress: string;
};
export type BalanceFindOutput = z.infer<
  typeof BalanceSchemas.BalanceFindOutput
>;
export type BalanceQuery = z.infer<typeof BalanceSchemas.BalanceQuery> & {
  smartWalletAddress: string;
};
export type BalanceOutput = z.infer<typeof BalanceSchemas.BalanceOutput>;
