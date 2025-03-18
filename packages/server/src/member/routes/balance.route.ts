import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  BalanceSchemas,
  BalanceService,
  MemberService,
  Symbols,
} from "../service/index.js";
import { ApiUtils } from "../../core/model.js";
import { PARAMETER_ERROR } from "../../core/error.js";

export const autoPrefix = "/member/balance";
const TAG = "Balance";

const route: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/find-balance",
    {
      schema: {
        tags: [TAG],
        summary: "获取当前用户指定代币余额",
        security: [{ authorization: [] }],
        querystring: BalanceSchemas.BalanceFindInput,
        response: {
          200: ApiUtils.asApiResult(BalanceSchemas.BalanceFindOutput),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) => {
      const balanceService = fastify.diContainer.get<BalanceService>(
        Symbols.BalanceService
      );
      const memberService = fastify.diContainer.get<MemberService>(
        Symbols.MemberService
      );
      const smartWalletAddress = await memberService.findSmartWalletAddress({
        did: request.privyUser!.id,
      });
      if (!smartWalletAddress) {
        throw PARAMETER_ERROR({ message: "smartWalletAddress is null" });
      }
      return ApiUtils.ok(
        await balanceService.findBalance({
          ...request.query,
          smartWalletAddress:
            request.query.smartWalletAddress ?? smartWalletAddress,
        })
      );
    }
  );

  fastify.get(
    "/list-balance",
    {
      schema: {
        tags: [TAG],
        summary: "获取当前用户余额列表",
        security: [{ authorization: [] }],
        querystring: BalanceSchemas.BalanceQuery,
        response: {
          200: ApiUtils.asApiResult(BalanceSchemas.BalanceOutput),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) => {
      const balanceService = fastify.diContainer.get<BalanceService>(
        Symbols.BalanceService
      );
      const memberService = fastify.diContainer.get<MemberService>(
        Symbols.MemberService
      );
      const smartWalletAddress = await memberService.findSmartWalletAddress({
        did: request.privyUser!.id,
      });
      if (!smartWalletAddress) {
        throw PARAMETER_ERROR({ message: "smartWalletAddress is null" });
      }
      return ApiUtils.ok(
        await balanceService.listBalance({
          ...request.query,
          smartWalletAddress:
            request.query.smartWalletAddress ?? smartWalletAddress,
        })
      );
    }
  );
};

export default route;
