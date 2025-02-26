import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  TransactionHistorySchemas,
  TransactionHistoryService,
} from "../service/index.js";
import { Symbols } from "../service/index.js";
import { ApiUtils } from "../../core/model.js";

export const autoPrefix = "/member/transaction/history";
const TAG = "Transaction History";

const route: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    "/create-transaction-history",
    {
      schema: {
        tags: [TAG],
        summary: "创建交易历史记录",
        security: [{ authorization: [] }],
        body: TransactionHistorySchemas.TransactionHistoryCreateInput,
        response: {
          200: ApiUtils.asApiResult(
            TransactionHistorySchemas.TransactionHistoryFindOutput
          ),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) => {
      const service = fastify.diContainer.get<TransactionHistoryService>(
        Symbols.TransactionHistoryService
      );
      const memberId = request.privyUser?.customMetadata.id! as number;
      const id = await service.createTransactionHistory({
        ...request.body,
        memberId,
      });
      return ApiUtils.ok(await service.findTransactionHistory({ id }));
    }
  );

  fastify.post(
    "/update-transaction-hash",
    {
      schema: {
        tags: [TAG],
        summary: "更新交易历史记录的交易哈希",
        security: [{ authorization: [] }],
        body: TransactionHistorySchemas.TransactionHashUpdateInput,
        response: {
          200: ApiUtils.asApiResult(
            TransactionHistorySchemas.TransactionHistoryFindOutput
          ),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) => {
      const service = fastify.diContainer.get<TransactionHistoryService>(
        Symbols.TransactionHistoryService
      );
      await service.updateTransactionHash({
        ...request.body,
      });
      return ApiUtils.ok(
        await service.findTransactionHistory({ id: request.body.id })
      );
    }
  );

  fastify.post(
    "/decline-transaction-history",
    {
      schema: {
        tags: [TAG],
        summary: "拒绝支付REQUEST交易",
        security: [{ authorization: [] }],
        body: TransactionHistorySchemas.TransactionHistoryDeclineInput,
        response: {
          200: ApiUtils.asApiResult(
            TransactionHistorySchemas.TransactionHistoryFindOutput
          ),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) => {
      const service = fastify.diContainer.get<TransactionHistoryService>(
        Symbols.TransactionHistoryService
      );
      await service.declineTransactionHistory({
        ...request.body,
      });
      return ApiUtils.ok(
        await service.findTransactionHistory({ id: request.body.id })
      );
    }
  );

  fastify.get(
    "/find-transaction-history/{id}",
    {
      schema: {
        tags: [TAG],
        summary: "通过id获取交易历史记录详情",
        security: [{ authorization: [] }],
        params: TransactionHistorySchemas.TransactionHistoryFindInput,
        response: {
          200: ApiUtils.asApiResult(
            TransactionHistorySchemas.TransactionHistoryFindOutput
          ),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) => {
      const service = fastify.diContainer.get<TransactionHistoryService>(
        Symbols.TransactionHistoryService
      );
      return ApiUtils.ok(
        await service.findTransactionHistory({ id: request.params.id })
      );
    }
  );

  fastify.get(
    "/page-transaction-history",
    {
      schema: {
        tags: [TAG],
        summary: "分页查询交易历史记录列表",
        security: [{ authorization: [] }],
        querystring: TransactionHistorySchemas.TransactionHistoryQuery,
        response: {
          200: ApiUtils.asApiResult(
            TransactionHistorySchemas.TransactionHistoryQueryResult
          ),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<TransactionHistoryService>(Symbols.TransactionHistoryService)
          .pageTransactionHistory({
            ...request.query,
            memberId: request.privyUser?.customMetadata.id! as number,
          })
      )
  );
};

export default route;
