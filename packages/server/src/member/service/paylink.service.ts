import { injectable, inject } from "inversify";
import { Symbols } from "../../identifier.js";
import { Symbols as Services } from "./identifier.js";
import type { ExtendPrismaClient as PrismaClient } from "../../plugins/prisma.js";
import { z } from "zod";
import {
  BlockChainPlatform,
  Prisma,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { MemberService, NotificationPublishService } from "./index.js";
import { PARAMETER_ERROR } from "../../core/error.js";
import { nanoid } from "nanoid";
import * as _ from "radash";
import { keccak256, toHex } from "viem";

@injectable()
export class PayLinkService {
  constructor(
    @inject(Symbols.PrismaClient)
    private readonly prisma: PrismaClient,
    @inject(Services.MemberService)
    private readonly memberService: MemberService,
    @inject(Services.NotificationPublishService)
    private readonly notificationPublicService: NotificationPublishService
  ) {}

  async createPlayLink({
    transactionCode,
  }: PlayLinkCreateInput): Promise<PlayLinkOutput> {
    let payLink = await this.prisma.payLink.findUnique({
      where: { transactionCode },
    });
    if (!payLink) {
      const transactionHistory =
        await this.prisma.transactionHistory.findUnique({
          where: { transactionCode },
        });
      if (!transactionHistory) {
        throw PARAMETER_ERROR({ message: "transaction history not exist" });
      }
      if (TransactionType.PAY_LINK !== transactionHistory.transactionType) {
        throw PARAMETER_ERROR({ message: "Not a pay link transaction" });
      }
      const { platform, chainId, network, tokenContractAddress } =
        transactionHistory;
      const data: Prisma.PayLinkCreateInput = {
        platform,
        chainId,
        network,
        tokenContractAddress,
        transactionCode,
        transactionHistoryId: transactionHistory.id,
        senderWalletAddress: transactionHistory.senderWalletAddress!,
        bizContractAddress: transactionHistory.bizContractAddress!,
        otp: nanoid(64),
      };
      payLink = await this.prisma.payLink.create({ data });
    }

    const { otp, ...rest } = payLink;
    return {
      ...rest,
      otp: this.hashKeccak256(otp),
    };
  }

  async updateTransactionHash({
    memberId,
    transactionCode,
    transactionHash,
  }: PlayLinkTransactionHashUpdateInput) {
    let payLink = await this.prisma.payLink.findUnique({
      where: { transactionCode },
    });
    if (!payLink) {
      throw PARAMETER_ERROR({ message: "pay link not exist" });
    }
    if (payLink.transactionHash && !_.isEmpty(payLink.transactionHash)) {
      return;
    }

    const transactionHistory = await this.prisma.transactionHistory.findUnique({
      where: { transactionCode },
    });
    if (!transactionHistory) {
      throw PARAMETER_ERROR({ message: "transaction history not exist" });
    }
    if (TransactionType.PAY_LINK !== transactionHistory.transactionType) {
      throw PARAMETER_ERROR({ message: "Not a pay link transaction" });
    }
    if (TransactionStatus.PENDING !== transactionHistory.transactionStatus) {
      throw PARAMETER_ERROR({ message: "pay link had accepted" });
    }

    const member = await this.memberService.findMember({ id: memberId });
    if (!member) {
      throw PARAMETER_ERROR({ message: "member not exist" });
    }
    const smartWalletAddress = await this.memberService.findSmartWalletAddress({
      platform: transactionHistory.platform,
      chainId: transactionHistory.chainId,
      did: member.did,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.transactionHistory.update({
        data: {
          receiverMemberId: memberId,
          receiverDid: member.did,
          receiverWalletAddress: smartWalletAddress,
          transactionStatus: TransactionStatus.ACCEPTED,
        },
        where: {
          id: transactionHistory.id,
        },
      });
      await tx.payLink.update({
        data: {
          transactionHash,
        },
        where: {
          id: payLink.id,
        },
      });
    });

    await this.memberService.updateMemberRecent({
      memberId,
      trans: transactionHistory,
    });

    await this.notificationPublicService.sendPayLinkUpdate({
      trans: (await this.prisma.transactionHistory.findUnique({
        where: { id: transactionHistory.id },
      }))!,
    });
  }

  async cancelPayLink({
    transactionCode,
    memberId,
  }: PlayLinkCancelInput): Promise<void> {
    const member = await this.memberService.findMember({ id: memberId });
    if (!member) {
      throw PARAMETER_ERROR({ message: "member not exist" });
    }
    const transactionHistory = await this.prisma.transactionHistory.findUnique({
      where: { transactionCode, memberId },
    });
    if (!transactionHistory) {
      throw PARAMETER_ERROR({ message: "transaction history not exist" });
    }
    if (TransactionType.PAY_LINK !== transactionHistory.transactionType) {
      throw PARAMETER_ERROR({ message: "Not a pay link transaction" });
    }
    if (TransactionStatus.PENDING !== transactionHistory.transactionStatus) {
      throw PARAMETER_ERROR({ message: "pay link had accepted" });
    }
    await this.prisma.transactionHistory.update({
      data: {
        transactionStatus: TransactionStatus.DECLINED,
      },
      where: {
        id: transactionHistory.id,
      },
    });
  }

  async findPayLink({
    transactionCode,
  }: FindPayLinkInput): Promise<PlayLinkOutput> {
    let payLink = await this.prisma.payLink.findUnique({
      where: { transactionCode },
    });
    if (!payLink) {
      throw PARAMETER_ERROR({ message: "pay link not exist" });
    }
    return payLink;
  }

  private hashKeccak256(input: string): string {
    return keccak256(toHex(input));
  }
}

export const PlayLinkSchemas = {
  PlayLinkCreateInput: z.object({
    transactionCode: z.string({ description: "交易编号" }),
  }),
  FindPayLinkInput: z.object({
    transactionCode: z.string({ description: "交易编号" }),
  }),
  PlayLinkTransactionHashUpdateInput: z.object({
    transactionCode: z.string({ description: "交易编号" }),
    transactionHash: z.string({ description: "交易哈希" }),
  }),
  PlayLinkCancelInput: z.object({
    transactionCode: z.string({ description: "交易编号" }),
  }),
  PlayLinkOutput: z.object({
    transactionCode: z.string({ description: "交易编号" }),
    platform: z.nativeEnum(BlockChainPlatform, {
      description: "区块链平台: ETH 以太坊；SOLANA Solana;",
    }),
    chainId: z.number({ description: "区块链id" }),
    tokenContractAddress: z.string({ description: "代币合约地址" }),
    senderWalletAddress: z.string({ description: "付款人 - 钱包地址" }),
    bizContractAddress: z.string({ description: "业务合约地址" }),
    otp: z.string({ description: "keccak256算法哈希后的OTP" }),
  }),
};

export type PlayLinkCreateInput = z.infer<
  typeof PlayLinkSchemas.PlayLinkCreateInput
>;
export type FindPayLinkInput = z.infer<typeof PlayLinkSchemas.FindPayLinkInput>;
export type PlayLinkTransactionHashUpdateInput = z.infer<
  typeof PlayLinkSchemas.PlayLinkTransactionHashUpdateInput
> & { memberId: number };
export type PlayLinkCancelInput = z.infer<
  typeof PlayLinkSchemas.PlayLinkCancelInput
> & { memberId: number };
export type PlayLinkOutput = z.infer<typeof PlayLinkSchemas.PlayLinkOutput>;
