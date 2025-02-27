import {
  BIZ,
  BlockChainNetwork,
  BlockChainPlatform,
  Prisma,
  TransactionCategory,
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
} from "./index.js";
import { Symbols } from "../../identifier.js";
import { Symbols as Services } from "./identifier.js";
import { PARAMETER_ERROR, UNEXPECTED } from "../../core/error.js";
import * as _ from "radash";
import { PagedResult, PageUtils } from "../../core/model.js";
import { TransactionHistorySchema } from "../../../prisma/generated/zod/index.js";
import { nanoid } from "nanoid";
import { getAddress } from "viem";

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
    private readonly bizContractService: BizContractService
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
      transactionTime: new Date(),
      transactionStatus: TransactionStatus.ACCEPTED,
      networkFee: 0,
    };

    let business: BIZ | null = null;
    if (
      transactionType == TransactionType.SEND ||
      transactionType == TransactionType.QR_CODE ||
      transactionType == TransactionType.REQUEST
    ) {
      business = BIZ.TRANSFER;
    } else if (transactionType == TransactionType.PAY_LINK) {
      business = BIZ.LINK;
    }
    if (business) {
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
      data.business = business;
      data.bizContractAddress = contract.address;
    }

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
      transactionType == TransactionType.REQUEST ||
      transactionType == TransactionType.PAY_LINK
    ) {
      data.transactionStatus = TransactionStatus.PENDING;
    }

    // TODO 调用合约计算网络费用

    const { id } = await this.prisma.transactionHistory.create({ data });
    return id;
  }

  async updateTransactionHash({
    id,
    transactionHash,
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

    await this.prisma.transactionHistory.update({
      data: {
        transactionHash,
        transactionStatus:
          transactionHistory.transactionType === TransactionType.REQUEST
            ? TransactionStatus.ACCEPTED
            : undefined,
      },
      where: { id },
    });
  }

  async declineTransactionHistory({ id }: TransactionHistoryDeclineInput) {
    const transactionHistory = await this.prisma.transactionHistory.findUnique({
      where: { id },
    });
    if (!transactionHistory) {
      throw PARAMETER_ERROR({ message: "transaction history not exist" });
    }
    if (TransactionType.REQUEST !== transactionHistory.transactionType) {
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
  }

  async findTransactionHistory({
    id,
  }: TransactionHistoryFindInput): Promise<TransactionHistoryFindOutput> {
    const transactionHistory = await this.prisma.transactionHistory.findUnique({
      where: { id },
    });

    if (transactionHistory) {
      const memberMap = await this.memberService.mappingMember({
        ids: _.unique([
          transactionHistory?.senderMemberId,
          transactionHistory?.receiverMemberId,
        ])
          .filter((x) => x !== null)
          .map((x) => x as number),
      });

      (
        transactionHistory as TransactionHistoryQueryResult["record"][0]
      ).senderMember = transactionHistory?.senderMemberId
        ? memberMap.get(transactionHistory.senderMemberId) ?? null
        : null;
      (
        transactionHistory as TransactionHistoryQueryResult["record"][0]
      ).receiverMember = transactionHistory?.receiverMemberId
        ? memberMap.get(transactionHistory.receiverMemberId) ?? null
        : null;
    }

    return transactionHistory;
  }

  async findTransactionHistoryByCode({
    transactionCode,
  }: TransactionHistoryFindByCodeInput): Promise<TransactionHistoryFindOutput> {
    const transactionHistory = await this.prisma.transactionHistory.findUnique({
      where: { transactionCode },
    });

    if (transactionHistory) {
      const memberMap = await this.memberService.mappingMember({
        ids: _.unique([
          transactionHistory?.senderMemberId,
          transactionHistory?.receiverMemberId,
        ])
          .filter((x) => x !== null)
          .map((x) => x as number),
      });

      (
        transactionHistory as TransactionHistoryQueryResult["record"][0]
      ).senderMember = transactionHistory?.senderMemberId
        ? memberMap.get(transactionHistory.senderMemberId) ?? null
        : null;
      (
        transactionHistory as TransactionHistoryQueryResult["record"][0]
      ).receiverMember = transactionHistory?.receiverMemberId
        ? memberMap.get(transactionHistory.receiverMemberId) ?? null
        : null;
    }

    return transactionHistory;
  }

  async pageTransactionHistory({
    page,
    pageSize: limit,
    ...input
  }: TransactionHistoryQuery): Promise<TransactionHistoryQueryResult> {
    const pageResult = await this.prisma.transactionHistory.paginate({
      page,
      limit,
      where: {
        ...input,
        transactionTime: {
          gte: input.transactionTimeFrom,
          lte: input.transactionTimeTo,
        },
      },
      orderBy: [
        {
          createAt: "desc",
        },
      ],
    });

    const senderMemberIds = pageResult.result.map((x) => x.senderMemberId);
    const receiverMemberIds = pageResult.result.map((x) => x.receiverMemberId);
    const memberMap = await this.memberService.mappingMember({
      ids: _.unique([...senderMemberIds, ...receiverMemberIds])
        .filter((x) => x !== null)
        .map((x) => x as number),
    });

    for (const item of pageResult.result) {
      (item as TransactionHistoryQueryResult["record"][0]).senderMember =
        item.senderMemberId ? memberMap.get(item.senderMemberId) ?? null : null;
      (item as TransactionHistoryQueryResult["record"][0]).receiverMember =
        item.receiverMemberId
          ? memberMap.get(item.receiverMemberId) ?? null
          : null;
    }

    return PagedResult.fromPaginationResult(pageResult);
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
    receiverMemberId: z.number({ description: "收款人 - 会员id" }).optional(),
    amount: z.number({ description: "交易金额（代币数量）" }),
    message: z.string({ description: "附带留言" }).optional(),
  }),
  TransactionHistoryQuery: PageUtils.asPageable(
    z.object({
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
    senderMember: MemberSchemas.MemberOutput.nullish(),
    receiverMember: MemberSchemas.MemberOutput.nullish(),
  }).nullable(),
  TransactionHistoryQueryResult: PageUtils.asPagedResult(
    TransactionHistorySchema.extend({
      senderMember: MemberSchemas.MemberOutput.nullish(),
      receiverMember: MemberSchemas.MemberOutput.nullish(),
    })
  ),
};

export type TransactionHistoryCreateInput = z.infer<
  typeof TransactionHistorySchemas.TransactionHistoryCreateInput
> & { memberId: number };
export type TransactionHashUpdateInput = z.infer<
  typeof TransactionHistorySchemas.TransactionHashUpdateInput
>;
export type TransactionHistoryDeclineInput = z.infer<
  typeof TransactionHistorySchemas.TransactionHistoryDeclineInput
>;
export type TransactionHistoryFindInput = z.infer<
  typeof TransactionHistorySchemas.TransactionHistoryFindInput
>;
export type TransactionHistoryFindByCodeInput = z.infer<
  typeof TransactionHistorySchemas.TransactionHistoryFindByCodeInput
>;
export type TransactionHistoryFindOutput = z.infer<
  typeof TransactionHistorySchemas.TransactionHistoryFindOutput
>;
export type TransactionHistoryQuery = z.infer<
  typeof TransactionHistorySchemas.TransactionHistoryQuery
> & { memberId: number };
export type TransactionHistoryQueryResult = z.infer<
  typeof TransactionHistorySchemas.TransactionHistoryQueryResult
>;
