import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  BizContractService,
  BlockChainSchemas,
  BlockChainService,
  Symbols,
} from "../service/index.js";
import { ApiUtils } from "../../core/model.js";
import {
  BizContractSchema,
  BlockChainSchema,
  TokenContractSchema,
} from "../../../prisma/generated/zod/index.js";

export const autoPrefix = "/member/infrastructure";
const TAG = "Infrastructure";

const route: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/list-blockchain",
    {
      schema: {
        tags: [TAG],
        summary: "获取区块链列表",
        querystring: BlockChainSchemas.BlockChainQuery,
        response: {
          200: ApiUtils.asApiResult(z.array(BlockChainSchema)),
        },
      },
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<BlockChainService>(Symbols.BlockChainService)
          .listBlockChain(request.query)
      )
  );

  fastify.get(
    "/list-token-contract",
    {
      schema: {
        tags: [TAG],
        summary: "获取代币合约列表",
        querystring: BlockChainSchemas.TokenContractQuery,
        response: {
          200: ApiUtils.asApiResult(z.array(TokenContractSchema)),
        },
      },
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<BlockChainService>(Symbols.BlockChainService)
          .listTokenContract(request.query)
      )
  );

  fastify.get(
    "/list-business-contract",
    {
      schema: {
        tags: [TAG],
        summary: "获取业务合约列表",
        querystring: BlockChainSchemas.TokenContractQuery,
        response: {
          200: ApiUtils.asApiResult(z.array(BizContractSchema)),
        },
      },
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<BizContractService>(Symbols.BizContractService)
          .listContract(request.query)
      )
  );
};

export default route;
