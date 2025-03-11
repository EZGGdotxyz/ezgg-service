import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  NotificationService,
  NotificationSchemas,
  NotificationPageResult,
} from "../service/index.js";
import { Symbols } from "../service/index.js";
import { ApiUtils } from "../../core/model.js";
import { z } from "zod";

export const autoPrefix = "/member/notification";
const TAG = "Notification";

const route: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/page-notification",
    {
      schema: {
        tags: [TAG],
        summary: "分页查询通知列表",
        security: [{ authorization: [] }],
        querystring: NotificationSchemas.NotificationQuery,
        response: {
          200: ApiUtils.asApiResult(NotificationSchemas.NotificationPageResult),
        },
      },
      onRequest: [fastify.privyAuth],
      preSerialization: [
        fastify.handlePhoneMask<NotificationPageResult>((data) =>
          data.record.flatMap((x) => [
            ...(x?.transaction?.senderMember?.memberLinkedAccount ?? []),
            ...(x?.transaction?.receiverMember?.memberLinkedAccount ?? []),
          ])
        ),
      ],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<NotificationService>(Symbols.NotificationService)
          .pageNotifications({
            ...request.query,
            toMemberId: request.privyUser?.customMetadata.id! as number,
          })
      )
  );
  fastify.post(
    "/update-notification-status/:id",
    {
      schema: {
        tags: [TAG],
        summary: "更新通知为已读",
        security: [{ authorization: [] }],
        params: NotificationSchemas.NotificationUpdateStatusInput,
        response: {
          200: ApiUtils.asApiResult(z.void()),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<NotificationService>(Symbols.NotificationService)
          .updateNotificationStatus(request.params)
      )
  );
  fastify.post(
    "/update-notification-all-status",
    {
      schema: {
        tags: [TAG],
        summary: "更新所有通知为已读",
        security: [{ authorization: [] }],
        response: {
          200: ApiUtils.asApiResult(z.void()),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<NotificationService>(Symbols.NotificationService)
          .updateAllNotificationStatus({
            toMemberId: request.privyUser?.customMetadata.id! as number,
          })
      )
  );
  fastify.get(
    "/get-unread-count",
    {
      schema: {
        tags: [TAG],
        summary: "获取未读数",
        security: [{ authorization: [] }],
        response: {
          200: ApiUtils.asApiResult(z.number()),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<NotificationService>(Symbols.NotificationService)
          .getUnreadCount({
            toMemberId: request.privyUser?.customMetadata.id! as number,
          })
      )
  );
};

export default route;
