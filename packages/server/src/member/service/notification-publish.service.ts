import { inject, injectable } from "inversify";
import * as _ from "radash";
import { Symbols } from "../../identifier.js";
import type { ExtendPrismaClient as PrismaClient } from "../../plugins/prisma.js";
import {
  TransactionHistory,
  ToMemberRole,
  TransactionType,
  TransactionStatus,
} from "@prisma/client";

const SOURCE = {
  SYSTEM: "SYSTEM",
  ADMIN: "ADMIN",
};

const SUBJECT = {
  TRANS_UPDATE: "TRANS_UPDATE",
  TRANS_SEND: "TRANS_SEND",
  TRANS_REQUEST: "TRANS_REQUEST",
};

@injectable()
export class NotificationPublishService {
  constructor(
    @inject(Symbols.PrismaClient)
    private readonly prisma: PrismaClient
  ) {}

  async sendTransSend({ trans }: { trans: TransactionHistory }) {
    await this.prisma.notification.create({
      data: {
        source: SOURCE.SYSTEM,
        subject: SUBJECT.TRANS_SEND,
        toMemberId: trans.receiverMemberId!,
        toMemberRole: ToMemberRole.RECEIVER,
        status: 0,
        notifyAt: new Date(),
        transactionHistoryId: trans.id,
      },
    });
  }

  async sendTransRequest({ trans }: { trans: TransactionHistory }) {
    await this.prisma.notification.create({
      data: {
        source: SOURCE.SYSTEM,
        subject: SUBJECT.TRANS_REQUEST,
        toMemberId: trans.senderMemberId!,
        toMemberRole: ToMemberRole.SENDER,
        status: 0,
        notifyAt: new Date(),
        transactionHistoryId: trans.id,
      },
    });
  }

  async sendTransUpdate({ trans }: { trans: TransactionHistory }) {
    if (
      !(
        trans.transactionType === TransactionType.REQUEST ||
        trans.transactionType === TransactionType.PAY_LINK
      )
    ) {
      return;
    }

    const toMemberId = (
      trans.transactionType === TransactionType.REQUEST
        ? trans.receiverMemberId
        : trans.senderMemberId
    )!;
    const toMemberRole =
      trans.transactionType === TransactionType.REQUEST
        ? ToMemberRole.RECEIVER
        : ToMemberRole.SENDER;
    let action: string | null = null;
    if (trans.transactionStatus === TransactionStatus.ACCEPTED) {
      action =
        trans.transactionType === TransactionType.REQUEST
          ? "REQUEST_ACCEPTED"
          : "PAY_LINK_ACCEPTED";
    } else if (trans.transactionStatus === TransactionStatus.DECLINED) {
      action = "请求已接受；REQUEST_DECLINED";
    }

    await this.prisma.notification.create({
      data: {
        source: SOURCE.SYSTEM,
        subject: SUBJECT.TRANS_UPDATE,
        action,
        toMemberId,
        toMemberRole,
        status: 0,
        notifyAt: new Date(),
        transactionHistoryId: trans.id,
      },
    });
  }
}
