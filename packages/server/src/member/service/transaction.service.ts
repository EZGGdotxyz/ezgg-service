import {
  BIZ,
  BlockChainNetwork,
  BlockChainPlatform,
  Prisma,
  TransactionCategory,
  TransactionHistory,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { injectable, inject } from "inversify";
import { z } from "zod";
import type { ExtendPrismaClient as PrismaClient } from "../../plugins/prisma.js";
import {
  BizContractService,
  BlockChainService,
  MemberSchemas,
  MemberService,
  NotificationPublishService,
  GasEstimateService,
} from "./index.js";
import { Symbols } from "../../identifier.js";
import { Symbols as Services } from "./identifier.js";
import { PARAMETER_ERROR, UNEXPECTED } from "../../core/error.js";
import * as _ from "radash";
import { PagedResult, PageUtils } from "../../core/model.js";
import {
  TransactionFeeEstimateSchema,
  TransactionHistorySchema,
} from "../../../prisma/generated/zod/index.js";
import { nanoid } from "nanoid";
import { formatUnits, getAddress } from "viem";
import { Decimal } from "decimal.js";
import type { OpenExchangeRates } from "../../plugins/open-exchange-rates.js";

export enum TransactionHistorySubject {
  INCOME = "INCOME",
  EXPEND = "EXPEND",
}

@injectable()
export class TransactionHistoryService {
  constructor(
    @inject(Symbols.PrismaClient)
    private readonly prisma: PrismaClient,
    @inject(Services.MemberService)
    private readonly memberService: MemberService,
    @inject(Services.BlockChainService)
    private readonly blockChainService: BlockChainService,
    @inject(Services.BizContractService)
    private readonly bizContractService: BizContractService,
    @inject(Services.NotificationPublishService)
    private readonly notificationPublicService: NotificationPublishService,
    @inject(Symbols.OpenExchangeRates)
    private readonly openExchangeRates: OpenExchangeRates,
    @inject(Services.GasEstimateService)
    private readonly gasEstimateService: GasEstimateService
  ) {}

  async createTransactionHistory(
    input: TransactionHistoryCreateInput
  ): Promise<number> {
    const { platform, chainId, tokenContractAddress, transactionType } = input;
    const blockChain = await this.blockChainService.findBlockChain({
      platform,
      chainId,
    });
    if (!blockChain) {
      throw PARAMETER_ERROR({ message: `Not supported chain id ${chainId}` });
    }

    const tokenContract = await this.blockChainService.findTokenContract({
      platform,
      chainId,
      address: getAddress(tokenContractAddress),
    });
    if (!tokenContract) {
      throw PARAMETER_ERROR({
        message: `Not supported token ${tokenContractAddress}`,
      });
    }

    const data: Prisma.TransactionHistoryCreateInput = {
      ...input,
      transactionCode: nanoid(32),
      network: blockChain.network,
      tokenSymbol: tokenContract.tokenSymbol,
      tokenDecimals: tokenContract.tokenDecimals,
      tokenPrice: tokenContract.priceValue,
      tokenFeeSupport: tokenContract.feeSupport,
      transactionTime: new Date(),
      transactionStatus: TransactionStatus.PENDING,
    };

    const business =
      transactionType == TransactionType.PAY_LINK ? BIZ.LINK : BIZ.TRANSFER;
    const contract = await this.bizContractService.findContract({
      platform,
      chainId,
      business,
    });
    if (!contract) {
      throw PARAMETER_ERROR({
        message: `Not supported business ${transactionType}`,
      });
    }
    data.business = contract.business;
    data.bizContractAddress = contract.address;

    if (
      transactionType == TransactionType.SEND ||
      transactionType == TransactionType.QR_CODE ||
      transactionType == TransactionType.WITHDRAW ||
      transactionType == TransactionType.PAY_LINK
    ) {
      const senderMember = await this.memberService.findMember({
        id: input.memberId,
      });
      if (!senderMember) {
        throw UNEXPECTED({ message: "sender member not exist" });
      }
      const senderWalletAddress =
        await this.memberService.findSmartWalletAddress({
          did: senderMember.did,
        });
      if (!senderWalletAddress || _.isEmpty(senderWalletAddress)) {
        throw UNEXPECTED({ message: "sender have no smart wallet" });
      }
      data.senderMemberId = input.memberId;
      data.senderDid = senderMember.did;
      data.senderWalletAddress = senderWalletAddress;
    }

    if (
      transactionType == TransactionType.SEND ||
      transactionType == TransactionType.QR_CODE
    ) {
      if (!input.receiverMemberId) {
        throw PARAMETER_ERROR({ message: "please choose a receiver" });
      }

      const receiverMember = await this.memberService.findMember({
        id: input.receiverMemberId,
      });
      if (!receiverMember) {
        throw UNEXPECTED({ message: "receiver member not exist" });
      }
      const receiverWalletAddress =
        await this.memberService.findSmartWalletAddress({
          did: receiverMember.did,
        });
      if (!receiverWalletAddress || _.isEmpty(receiverWalletAddress)) {
        throw UNEXPECTED({ message: "receiver have no smart wallet" });
      }
      data.receiverDid = receiverMember.did;
      data.receiverWalletAddress = receiverWalletAddress;
    }

    if (
      transactionType === TransactionType.REQUEST ||
      transactionType === TransactionType.REQUEST_LINK ||
      transactionType === TransactionType.REQUEST_QR_CODE ||
      transactionType === TransactionType.DEPOSIT
    ) {
      if (
        transactionType !== TransactionType.REQUEST_LINK &&
        transactionType !== TransactionType.DEPOSIT
      ) {
        if (!input.senderMemberId) {
          throw PARAMETER_ERROR({ message: "please choose a sender" });
        }
        const senderMember = await this.memberService.findMember({
          id: input.senderMemberId,
        });
        if (!senderMember) {
          throw UNEXPECTED({ message: "sender member not exist" });
        }
        const senderWalletAddress =
          await this.memberService.findSmartWalletAddress({
            did: senderMember.did,
          });
        if (!senderWalletAddress || _.isEmpty(senderWalletAddress)) {
          throw UNEXPECTED({ message: "sender have no smart wallet" });
        }
        data.senderMemberId = input.senderMemberId;
        data.senderDid = senderMember.did;
        data.senderWalletAddress = senderWalletAddress;
      }

      const receiverMember = await this.memberService.findMember({
        id: input.memberId,
      });
      if (!receiverMember) {
        throw UNEXPECTED({ message: "receiver member not exist" });
      }
      const receiverWalletAddress =
        await this.memberService.findSmartWalletAddress({
          did: receiverMember.did,
        });
      if (!receiverWalletAddress || _.isEmpty(receiverWalletAddress)) {
        throw UNEXPECTED({ message: "receiver have no smart wallet" });
      }
      data.receiverMemberId = input.memberId;
      data.receiverDid = receiverMember.did;
      data.receiverWalletAddress = receiverWalletAddress;
    }

    if (transactionType == TransactionType.DEPOSIT) {
      data.senderWalletAddress = input.senderWalletAddress;
    }

    if (transactionType == TransactionType.WITHDRAW) {
      data.receiverWalletAddress = input.receiverWalletAddress;
    }

    const trans = await this.prisma.transactionHistory.create({
      data,
    });

    if (transactionType == TransactionType.REQUEST) {
      await this.notificationPublicService.sendTransRequest({ trans });
    }

    return trans.id;
  }

  async updateNetworkFee({
    transactionCode,
    tokenContractAddress,
    memberId,
  }: NetworkFeeUpdateInput): Promise<NetworkFeeUpdateOutput> {
    const trans = await this.prisma.transactionHistory.findUnique({
      where: { transactionCode },
    });
    if (!trans) {
      throw PARAMETER_ERROR({ message: "transaction history not exist" });
    }
    if (trans.transactionStatus !== TransactionStatus.PENDING) {
      throw PARAMETER_ERROR({ message: "transaction status not pending" });
    }
    const token = await this.blockChainService.findTokenContract({
      platform: trans.platform,
      chainId: trans.chainId,
      address: getAddress(tokenContractAddress),
    });
    if (!token.feeSupport) {
      throw PARAMETER_ERROR({ message: "token not support for pay fee" });
    }

    if (!trans.senderWalletAddress) {
      if (!memberId) {
        throw PARAMETER_ERROR({ message: "please choose a sender" });
      }
      const senderMember = await this.memberService.findMember({
        id: memberId,
      });
      if (!senderMember) {
        throw UNEXPECTED({ message: "sender member not exist" });
      }
      const senderWalletAddress =
        await this.memberService.findSmartWalletAddress({
          did: senderMember.did,
        });
      if (!senderWalletAddress || _.isEmpty(senderWalletAddress)) {
        throw UNEXPECTED({ message: "sender have no smart wallet" });
      }
      trans.senderWalletAddress = senderWalletAddress;
    }

    const estimateNetworkFee = await this.gasEstimateService.estimateNetworkFee(
      { trans, token }
    );

    return this.prisma.$transaction(async (tx) => {
      const existed = await this.prisma.transactionFeeEstimate.findUnique({
        where: { transactionCode: transactionCode },
      });

      if (existed) {
        return await tx.transactionFeeEstimate.update({
          where: { transactionCode: transactionCode },
          data: estimateNetworkFee,
        });
      } else {
        return await tx.transactionFeeEstimate.create({
          data: estimateNetworkFee,
        });
      }
    });
  }

  async updateTransactionHash({
    id,
    transactionHash,
    memberId,
  }: TransactionHashUpdateInput) {
    const transactionHistory = await this.prisma.transactionHistory.findUnique({
      where: { id },
    });
    if (!transactionHistory) {
      throw PARAMETER_ERROR({ message: "transaction history not exist" });
    }

    if (
      transactionHistory.transactionHash &&
      !_.isEmpty(transactionHistory.transactionHash)
    ) {
      return;
    }

    let data: Prisma.TransactionHistoryUpdateInput = {
      transactionHash,
    };

    if (transactionHistory.transactionType !== TransactionType.PAY_LINK) {
      data.transactionStatus = TransactionStatus.ACCEPTED;
    }

    if (!transactionHistory.senderMemberId) {
      data.senderMemberId = memberId;
      const senderMember = await this.memberService.findMember({
        id: memberId,
      });
      if (senderMember) {
        const senderWalletAddress =
          await this.memberService.findSmartWalletAddress({
            did: senderMember.did,
          });
        if (!senderWalletAddress || _.isEmpty(senderWalletAddress)) {
          throw UNEXPECTED({ message: "sender have no smart wallet" });
        }
        data.senderDid = senderMember.did;
        data.senderWalletAddress = senderWalletAddress;
      }
    }

    await this.prisma.transactionHistory.update({
      data,
      where: { id },
    });

    await this.memberService.updateMemberRecent({
      memberId,
      trans: transactionHistory,
    });

    if (transactionHistory.transactionCategory == TransactionCategory.REQUEST) {
      await this.notificationPublicService.sendRequestTransUpdate({
        trans: (await this.prisma.transactionHistory.findUnique({
          where: { id },
        }))!,
      });
    } else if (
      transactionHistory.transactionCategory == TransactionCategory.SEND
    ) {
      await this.notificationPublicService.sendTransSend({
        trans: transactionHistory,
      });
    }
  }

  async declineTransactionHistory({ id }: TransactionHistoryDeclineInput) {
    const transactionHistory = await this.prisma.transactionHistory.findUnique({
      where: { id },
    });
    if (!transactionHistory) {
      throw PARAMETER_ERROR({ message: "transaction history not exist" });
    }
    if (
      TransactionCategory.REQUEST !== transactionHistory.transactionCategory
    ) {
      throw PARAMETER_ERROR({ message: "Not a request transaction" });
    }
    if (TransactionStatus.PENDING !== transactionHistory.transactionStatus) {
      throw PARAMETER_ERROR({ message: "request had accepted" });
    }
    await this.prisma.transactionHistory.update({
      data: {
        transactionStatus: TransactionStatus.DECLINED,
      },
      where: { id },
    });

    await this.notificationPublicService.sendRequestTransUpdate({
      trans: (await this.prisma.transactionHistory.findUnique({
        where: { id },
      }))!,
    });
  }

  async findTransactionHistory({
    currency,
    id,
  }: TransactionHistoryFindInput): Promise<TransactionHistoryFindOutput> {
    const transactionHistory = await this.prisma.transactionHistory.findUnique({
      where: { id },
    });

    if (transactionHistory) {
      await this.fillData([transactionHistory], currency);
    }

    return transactionHistory;
  }

  async findTransactionHistoryByCode({
    currency,
    transactionCode,
  }: TransactionHistoryFindByCodeInput): Promise<TransactionHistoryFindOutput> {
    const transactionHistory = await this.prisma.transactionHistory.findUnique({
      where: { transactionCode },
    });

    if (transactionHistory) {
      await this.fillData([transactionHistory], currency);
    }

    return transactionHistory;
  }

  async pageTransactionHistory({
    page,
    pageSize: limit,
    currency,
    subject,
    search,
    memberId,
    ...input
  }: TransactionHistoryQuery): Promise<TransactionHistoryQueryResult> {
    let memberIds: number[] | undefined;
    if (search && !_.isEmpty(search)) {
      const memberList = await this.memberService.searchMember({ search });
      memberIds = _.unique(
        memberList.filter((x) => x.id != memberId).map((x) => x.id)
      );
      if (_.isEmpty(memberIds)) {
        return PagedResult.empty({ page, pageSize: limit });
      }
    }

    const where: Prisma.TransactionHistoryWhereInput = {
      ...input,
      transactionTime: {
        gte: input.transactionTimeFrom,
        lte: input.transactionTimeTo,
      },
      AND: [
        {
          OR: [
            {
              senderMemberId:
                subject === TransactionHistorySubject.INCOME
                  ? undefined
                  : memberId,
            },
            {
              receiverMemberId:
                subject === TransactionHistorySubject.EXPEND
                  ? undefined
                  : memberId,
            },
          ],
        },
        {
          OR: [
            { senderMemberId: { in: memberIds } },
            { receiverMemberId: { in: memberIds } },
          ],
        },
        {
          OR: [
            {
              transactionHash: {
                not: {
                  equals: null,
                },
              },
            },
            { transactionCategory: TransactionCategory.REQUEST },
          ],
        },
      ],
    };

    if (subject) {
      where.transactionCategory = {
        not: {
          in: [TransactionCategory.DEPOSIT, TransactionCategory.WITHDRAW],
        },
      };
    }

    const pageResult = await this.prisma.transactionHistory.paginate({
      page,
      limit,
      where,
      orderBy: [
        {
          createAt: "desc",
        },
      ],
    });

    await this.fillData(pageResult.result, currency);

    return PagedResult.fromPaginationResult(pageResult);
  }

  async listTransactionHistory({
    ids,
  }: {
    ids: number[];
  }): Promise<TransactionHistoryQueryResult["record"]> {
    if (_.isEmpty(ids)) {
      return [];
    }
    const transactionHistoryList =
      await this.prisma.transactionHistory.findMany({
        where: {
          id: {
            in: ids,
          },
        },
        orderBy: [
          {
            createAt: "desc",
          },
        ],
      });

    await this.fillData(transactionHistoryList);

    return transactionHistoryList;
  }

  private async fillData(
    trans: TransactionHistory[],
    currency: string = "USD"
  ) {
    const senderMemberIds = trans.map((x) => x.senderMemberId);
    const receiverMemberIds = trans.map((x) => x.receiverMemberId);
    const memberMap = await this.memberService.mappingMember({
      ids: _.unique([...senderMemberIds, ...receiverMemberIds])
        .filter((x) => x !== null)
        .map((x) => x as number),
    });

    let rate = 1;
    if (currency != "USD") {
      const exchangeRates = await this.openExchangeRates.latest();
      rate = exchangeRates.rates[currency] ?? 1;
    }

    const ids = trans.map((x) => x.id);
    const transactionFeeList =
      await this.prisma.transactionFeeEstimate.findMany({
        where: {
          transactionHistoryId: {
            in: ids,
          },
        },
      });
    const transactionFeeMap = new Map(
      transactionFeeList.map((x) => [x.transactionHistoryId, x])
    );

    for (const item of trans) {
      const tokenAmount = item.tokenDecimals
        ? formatUnits(BigInt(item.amount ?? "0"), item.tokenDecimals)
        : item.amount ?? "0";
      let currencyAmount = item.tokenPrice
        ? new Decimal(tokenAmount)
            .mul(new Decimal(item.tokenPrice))
            .mul(rate)
            .toFixed()
        : undefined;

      const record = item as TransactionHistoryQueryResult["record"][0];
      record.senderMember = item.senderMemberId
        ? memberMap.get(item.senderMemberId) ?? null
        : null;
      record.receiverMember = item.receiverMemberId
        ? memberMap.get(item.receiverMemberId) ?? null
        : null;
      record.currency = currency;
      record.currencyAmount = currencyAmount;
      record.networkFee = transactionFeeMap.get(item.id);
    }
  }
}

export const TransactionHistorySchemas = {
  TransactionHistoryCreateInput: z.object({
    platform: z.nativeEnum(BlockChainPlatform, {
      description: "区块链平台: ETH 以太坊；SOLANA Solana;",
    }),
    chainId: z.number({ description: "区块链id" }),
    tokenContractAddress: z.string({ description: "代币地址" }),
    transactionCategory: z.nativeEnum(TransactionCategory, {
      description: "交易分类",
    }),
    transactionType: z.nativeEnum(TransactionType, { description: "交易类型" }),
    senderMemberId: z.number({ description: "付款人 - 会员id" }).optional(),
    receiverMemberId: z.number({ description: "收款人 - 会员id" }).optional(),
    amount: z.number({ description: "交易金额（代币数量）" }),
    message: z.string({ description: "附带留言" }).optional(),
    senderWalletAddress: z.string({ description: "付款人钱包地址" }).optional(),
    receiverWalletAddress: z
      .string({ description: "收款人钱包地址" })
      .optional(),
  }),
  NetworkFeeUpdateInput: z.object({
    transactionCode: z.string({ description: "交易码" }),
    tokenContractAddress: z.string({ description: "代币地址" }),
  }),
  NetworkFeeUpdateOutput: TransactionFeeEstimateSchema,
  TransactionHistoryQuery: PageUtils.asPageable(
    z.object({
      currency: z
        .string({ description: "货币符号：USD/HKD/CNY" })
        .optional()
        .default("USD"),
      platform: z
        .nativeEnum(BlockChainPlatform, {
          description: "区块链平台: ETH 以太坊；SOLANA Solana;",
        })
        .optional(),
      chainId: z.number({ description: "区块链id" }).optional(),
      network: z
        .nativeEnum(BlockChainNetwork, {
          description: "区块链网络：MAIN主网；TEST 测试网；DEV 开发网；",
        })
        .optional(),
      tokenSymbol: z.string({ description: "代币符号" }).optional(),
      transactionCategory: z
        .nativeEnum(TransactionCategory, {
          description: "交易分类",
        })
        .optional(),
      transactionType: z
        .nativeEnum(TransactionType, { description: "交易类型" })
        .optional(),
      receiverMemberId: z.number({ description: "收款人会员ID" }).optional(),
      transactionHash: z.string({ description: "交易哈希" }).optional(),
      transactionTimeFrom: z
        .date({ description: "交易时间 - 开始" })
        .optional(),
      transactionTimeTo: z.date({ description: "交易时间 - 结束" }).optional(),
      search: z.string({ description: "搜索关键词" }).optional(),
      subject: z
        .nativeEnum(TransactionHistorySubject, {
          description: "交易主题：收入：INCOME; 支出：EXPEND；",
        })
        .optional(),
      transactionStatus: z
        .nativeEnum(TransactionStatus, {
          description:
            "交易状态：PENDING 待支付；ACCEPTED 已支付；DECLINED 已拒绝；",
        })
        .optional(),
    })
  ),
  TransactionHashUpdateInput: z.object({
    id: z.number({ description: "交易历史id" }),
    transactionHash: z.string({ description: "交易哈希" }),
  }),
  TransactionHistoryDeclineInput: z.object({
    id: z.number({ description: "交易历史id" }),
  }),
  TransactionHistoryFindInput: z.object({
    id: z.coerce.number({ description: "交易历史id" }),
  }),
  TransactionHistoryFindByCodeInput: z.object({
    transactionCode: z.string({ description: "交易编码" }),
  }),
  TransactionHistoryFindOutput: TransactionHistorySchema.extend({
    currency: z.string({ description: "货币符号：USD/HKD/CNY" }).optional(),
    currencyAmount: z.string({ description: "货币余额" }).optional(),
    senderMember: MemberSchemas.MemberOutput.nullish(),
    receiverMember: MemberSchemas.MemberOutput.nullish(),
    networkFee: TransactionFeeEstimateSchema.nullish(),
  }).nullable(),
  TransactionHistoryQueryResult: PageUtils.asPagedResult(
    TransactionHistorySchema.extend({
      currency: z.string({ description: "货币符号：USD/HKD/CNY" }).optional(),
      currencyAmount: z.string({ description: "货币余额" }).optional(),
      senderMember: MemberSchemas.MemberOutput.nullish(),
      receiverMember: MemberSchemas.MemberOutput.nullish(),
      networkFee: TransactionFeeEstimateSchema.nullish(),
    })
  ),
};

export type TransactionHistoryCreateInput = z.infer<
  typeof TransactionHistorySchemas.TransactionHistoryCreateInput
> & { memberId: number };
export type NetworkFeeUpdateInput = z.infer<
  typeof TransactionHistorySchemas.NetworkFeeUpdateInput
> & { memberId: number };
export type NetworkFeeUpdateOutput = z.infer<
  typeof TransactionHistorySchemas.NetworkFeeUpdateOutput
>;
export type TransactionHashUpdateInput = z.infer<
  typeof TransactionHistorySchemas.TransactionHashUpdateInput
> & { memberId: number };
export type TransactionHistoryDeclineInput = z.infer<
  typeof TransactionHistorySchemas.TransactionHistoryDeclineInput
>;
export type TransactionHistoryFindInput = z.infer<
  typeof TransactionHistorySchemas.TransactionHistoryFindInput
> & { currency?: string };
export type TransactionHistoryFindByCodeInput = z.infer<
  typeof TransactionHistorySchemas.TransactionHistoryFindByCodeInput
> & { currency?: string };
export type TransactionHistoryFindOutput = z.infer<
  typeof TransactionHistorySchemas.TransactionHistoryFindOutput
>;
export type TransactionHistoryQuery = z.infer<
  typeof TransactionHistorySchemas.TransactionHistoryQuery
> & { memberId: number };
export type TransactionHistoryQueryResult = z.infer<
  typeof TransactionHistorySchemas.TransactionHistoryQueryResult
>;
