import { inject, injectable } from "inversify";
import * as _ from "radash";
import { Symbols } from "../../identifier.js";
import { Symbols as Services } from "./identifier.js";
import type { ExtendPrismaClient as PrismaClient } from "../../plugins/prisma.js";
import { PagedResult, PageUtils } from "../../core/model.js";
import { z } from "zod";
import {
  NotificationSchema,
  TransactionHistorySchema,
} from "../../../prisma/generated/zod/index.js";
import { MemberSchemas } from "./member.service.js";
import { TransactionHistoryService } from "./index.js";

@injectable()
export class NotificationService {
  constructor(
    @inject(Symbols.PrismaClient)
    private readonly prisma: PrismaClient,
    @inject(Services.TransactionHistoryService)
    private readonly transactionHistoryService: TransactionHistoryService
  ) {}

  async pageNotifications({
    page,
    pageSize: limit,
    ...input
  }: NotificationQuery): Promise<NotificationPageResult> {
    const pageResult = await this.prisma.notification.paginate({
      page,
      limit,
      where: {
        ...input,
      },
      orderBy: [
        {
          notifyAt: "desc",
        },
      ],
    });

    const transIds = _.unique(
      pageResult.result
        .filter((x) => x.transactionHistoryId != null)
        .map((x) => x.transactionHistoryId as number)
    );
    const transactionHistoryList =
      await this.transactionHistoryService.listTransactionHistory({
        ids: transIds,
      });
    const transactionHistoryMap = new Map(
      transactionHistoryList.map((x) => [x.id, x])
    );

    for (const item of pageResult.result) {
      if (item.transactionHistoryId == null) {
        continue;
      }
      (item as NotificationPageResult["record"][0]).transaction =
        transactionHistoryMap.get(item.transactionHistoryId) ?? null;
    }

    return PagedResult.fromPaginationResult(pageResult);
  }

  async updateNotificationStatus({ id }: NotificationUpdateStatusInput) {
    await this.prisma.notification.updateMany({
      where: {
        id,
      },
      data: {
        status: 1,
        readAt: new Date(),
      },
    });
  }

  async updateAllNotificationStatus({ toMemberId }: { toMemberId: number }) {
    await this.prisma.notification.updateMany({
      where: {
        toMemberId,
      },
      data: {
        status: 1,
        readAt: new Date(),
      },
    });
  }

  async getUnreadCount({
    toMemberId,
  }: {
    toMemberId: number;
  }): Promise<number> {
    return await this.prisma.notification.count({
      where: {
        toMemberId,
        status: 0,
      },
    });
  }
}

export const NotificationSchemas = {
  NotificationQuery: PageUtils.asPageable(
    z.object({
      subject: z
        .string({
          description:
            "通知主题枚举：GENERAL 普通通知；TRANS_UPDATE 交易状态更新；ALARM 欺诈或可疑活动报警；PAY_REQUEST 付款请求通知；CUSTOMER_SUPPORT 客户支持通知；BALANCE_ALARM 账户余额警报；SECURE_ALARM 安全警报；SUMMARY 每日或每周摘要；APP_UPDATE 应用程序更新与增强；SALES_PROMOTION 促销优惠与更新；SURVEY 参与调研；",
        })
        .optional(),
      action: z
        .string({
          description:
            "交易状态更新动作枚举：REQUEST_ACCEPTED 请求已接受；REQUEST_DECLINED 请求已拒绝；PAY_LINK_ACCEPTED PayLink已接受",
        })
        .optional(),
      status: z.number({ description: "状态值：0 未读；1已读" }).optional(),
    })
  ),
  NotificationPageResult: PageUtils.asPagedResult(
    NotificationSchema.extend({
      transaction: TransactionHistorySchema.extend({
        senderMember: MemberSchemas.MemberOutput.nullish(),
        receiverMember: MemberSchemas.MemberOutput.nullish(),
      }).nullish(),
    })
  ),
  NotificationUpdateStatusInput: z.object({
    id: z.number({ description: "通知ID" }),
  }),
};

export type NotificationQuery = z.infer<
  typeof NotificationSchemas.NotificationQuery
> & { toMemberId: number };
export type NotificationPageResult = z.infer<
  typeof NotificationSchemas.NotificationPageResult
>;
export type NotificationUpdateStatusInput = z.infer<
  typeof NotificationSchemas.NotificationUpdateStatusInput
>;
