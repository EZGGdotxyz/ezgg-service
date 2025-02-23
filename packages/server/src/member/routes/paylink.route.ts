import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { PlayLinkSchemas, PayLinkService } from "../service/index.js";
import { z } from "zod";
import { Symbols } from "../service/index.js";
import { ApiUtils } from "../../core/model.js";

export const autoPrefix = "/member/transaction/pay-link";
const TAG = "Transaction Pay Link";

const route: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    "/create-pay-link",
    {
      schema: {
        tags: [TAG],
        summary: "创建PayLink",
        security: [{ authorization: [] }],
        body: PlayLinkSchemas.PlayLinkCreateInput,
        response: {
          200: ApiUtils.asApiResult(PlayLinkSchemas.PlayLinkOutput),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<PayLinkService>(Symbols.PayLinkService)
          .createPlayLink({
            ...request.body,
          })
      )
  );

  fastify.post(
    "/update-transaction-hash",
    {
      schema: {
        tags: [TAG],
        summary: "更新PayLink的交易哈希",
        security: [{ authorization: [] }],
        body: PlayLinkSchemas.PlayLinkTransactionHashUpdateInput,
        response: {
          200: ApiUtils.asApiResult(z.void()),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<PayLinkService>(Symbols.PayLinkService)
          .updateTransactionHash({
            ...request.body,
            memberId: request.privyUser?.customMetadata.id! as number,
          })
      )
  );

  fastify.post(
    "/find-pay-link",
    {
      schema: {
        tags: [TAG],
        summary: "获取PayLink",
        security: [{ authorization: [] }],
        body: PlayLinkSchemas.FindPayLinkInput,
        response: {
          200: ApiUtils.asApiResult(PlayLinkSchemas.PlayLinkOutput),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<PayLinkService>(Symbols.PayLinkService)
          .findPayLink({
            ...request.body,
          })
      )
  );
};

export default route;
