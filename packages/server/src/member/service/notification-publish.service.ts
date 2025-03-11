import { inject, injectable } from "inversify";
import * as _ from "radash";
import { Symbols } from "../../identifier.js";
import type { ExtendPrismaClient as PrismaClient } from "../../plugins/prisma.js";
import {
  TransactionHistory,
  ToMemberRole,
  TransactionType,
  TransactionStatus,
  TransactionCategory,
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
    if (!trans.receiverMemberId) {
      return;
    }
    await this.prisma.notification.create({
      data: {
        source: SOURCE.SYSTEM,
        subject: SUBJECT.TRANS_SEND,
        toMemberId: trans.receiverMemberId,
        toMemberRole: ToMemberRole.RECEIVER,
        status: 0,
        notifyAt: new Date(),
        transactionHistoryId: trans.id,
      },
    });
  }

  async sendTransRequest({ trans }: { trans: TransactionHistory }) {
    if (!trans.senderMemberId) {
      return;
    }
    await this.prisma.notification.create({
      data: {
        source: SOURCE.SYSTEM,
        subject: SUBJECT.TRANS_REQUEST,
        toMemberId: trans.senderMemberId,
        toMemberRole: ToMemberRole.SENDER,
        status: 0,
        notifyAt: new Date(),
        transactionHistoryId: trans.id,
      },
    });
  }

  async sendRequestTransUpdate({ trans }: { trans: TransactionHistory }) {
    let action: string | null = null;
    if (trans.transactionStatus === TransactionStatus.ACCEPTED) {
      action = "REQUEST_ACCEPTED";
    } else if (trans.transactionStatus === TransactionStatus.DECLINED) {
      action = "REQUEST_DECLINED";
    } else {
      return;
    }

    if (
      !trans.receiverMemberId ||
      trans.transactionCategory !== TransactionCategory.REQUEST
    ) {
      return;
    }
    const toMemberId = trans.receiverMemberId;
    const toMemberRole = ToMemberRole.RECEIVER;

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

  async sendPayLinkUpdate({ trans }: { trans: TransactionHistory }) {
    let action: string | null = null;
    if (trans.transactionStatus === TransactionStatus.ACCEPTED) {
      action = "PAY_LINK_ACCEPTED";
    } else {
      return;
    }

    if (
      !trans.senderMemberId ||
      trans.transactionType !== TransactionType.PAY_LINK
    ) {
      return;
    }
    const toMemberId = trans.senderMemberId;
    const toMemberRole = ToMemberRole.SENDER;

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
