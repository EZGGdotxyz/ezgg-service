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
import type { OpenExchangeRates } from "../../plugins/open-exchange-rates.js";

@injectable()
export class BalanceService {
  constructor(
    @inject(Services.BlockChainService)
    private readonly blockChainService: BlockChainService,
    @inject(Symbols.AlchemyFactory)
    private readonly alchemy: AlchemyFactory,
    @inject(Symbols.OpenExchangeRates)
    private readonly openExchangeRates: OpenExchangeRates
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
      smartWalletAddress!,
      [address]
    );
    const token = await this.blockChainService.findTokenContract({
      platform,
      chainId,
      address: getAddress(address),
    });

    const tokenBalance = _.isEmpty(tokenBalances)
      ? "0"
      : tokenBalances[0].tokenBalance;
    const inWallet = _.isEmpty(tokenBalances)
      ? false
      : tokenBalances[0].contractAddress === address;

    const [tokenAmount, currencyAmount] = await this.formatAmount({
      currency,
      tokenBalance,
      token,
    });

    return {
      currency,
      currencyAmount,
      token,
      tokenAmount,
      inWallet,
    };
  }

  async listBalance(query: BalanceQuery): Promise<BalanceOutput> {
    const { platform, chainId, currency, smartWalletAddress, feeSupport } =
      query;
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
      smartWalletAddress!
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
      const token = tokenMap.get(getAddress(contractAddress))!;
      const [tokenAmount, currencyAmount] = await this.formatAmount({
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
        inWallet: true,
      });
    }

    const tokenAddressSet = new Set(tokens.map((x) => x.token.address));
    let allTokenList = await this.blockChainService.listTokenContract({
      platform,
      chainId,
    });
    allTokenList = allTokenList.filter((x) => !tokenAddressSet.has(x.address));
    for (const token of allTokenList) {
      tokens.push({
        currency,
        currencyAmount: "0",
        token,
        tokenAmount: "0",
        inWallet: false,
      });
    }

    if (feeSupport) {
      return {
        summary: {
          currency,
          balance: totalBalance.toFixed(),
        },
        tokens: tokens.filter((x) => x.token.feeSupport),
      };
    } else {
      return {
        summary: {
          currency,
          balance: totalBalance.toFixed(),
        },
        tokens,
      };
    }
  }

  private async formatAmount({
    currency,
    tokenBalance,
    token,
  }: {
    currency: string;
    tokenBalance: string | null;
    token: TokenContract | undefined;
  }): Promise<[string, string | undefined]> {
    let rate = 1;
    if (currency != "USD") {
      const exchangeRates = await this.openExchangeRates.latest();
      rate = exchangeRates.rates[currency] ?? 1;
    }
    const tokenAmount = token?.tokenDecimals
      ? formatUnits(BigInt(tokenBalance ?? "0"), token.tokenDecimals)
      : new Decimal(tokenBalance ?? "0").toString();
    let currencyAmount = token?.priceValue
      ? new Decimal(tokenAmount)
          .mul(new Decimal(token.priceValue))
          .mul(rate)
          .toFixed()
      : undefined;

    return [tokenAmount, currencyAmount];
  }
}

const BalanceTokenSchema = z.object({
  currency: z.string({ description: "货币符号：USD/HKD/CNY" }),
  currencyAmount: z.string({ description: "货币余额" }).optional(),
  token: TokenContractSchema,
  tokenAmount: z.string({ description: "代币数量" }),
  inWallet: z.boolean({ description: "是否在钱包中" }),
});

export const BalanceSchemas = {
  BalanceFindInput: z.object({
    platform: z.nativeEnum(BlockChainPlatform),
    chainId: z.coerce.number(),
    currency: z
      .string({ description: "货币符号：USD/HKD/CNY" })
      .optional()
      .default("USD"),
    address: z.string({ description: "代币合约地址" }),
    smartWalletAddress: z.string({ description: "钱包地址" }).optional(),
  }),
  BalanceFindOutput: BalanceTokenSchema,
  BalanceQuery: z.object({
    platform: z.nativeEnum(BlockChainPlatform),
    chainId: z.coerce.number(),
    currency: z
      .string({ description: "货币符号：USD/HKD/CNY" })
      .optional()
      .default("USD"),
    feeSupport: z.boolean({ description: "是否支持手续费" }).optional(),
    smartWalletAddress: z.string({ description: "钱包地址" }).optional(),
  }),
  BalanceOutput: z.object({
    summary: z.object({
      currency: z.string({ description: "货币符号：USD/HKD/CNY" }),
      balance: z.string({ description: "货币余额" }),
    }),
    tokens: z.array(BalanceTokenSchema),
  }),
};

export type BalanceFindInput = z.infer<typeof BalanceSchemas.BalanceFindInput>;
export type BalanceFindOutput = z.infer<
  typeof BalanceSchemas.BalanceFindOutput
>;
export type BalanceQuery = z.infer<typeof BalanceSchemas.BalanceQuery>;
export type BalanceOutput = z.infer<typeof BalanceSchemas.BalanceOutput>;
