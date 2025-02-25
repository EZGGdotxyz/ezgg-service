import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { MemberSchemas, MemberService } from "../service/member.service.js";
import { z } from "zod";
import { Symbols } from "../service/index.js";
import { ApiUtils } from "../../core/model.js";

export const autoPrefix = "/member/user";
const TAG = "Member";

const route: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    "/update-member",
    {
      schema: {
        tags: [TAG],
        summary: "更新会员信息",
        security: [{ authorization: [] }],
        body: MemberSchemas.UpdateMemberInput,
        response: {
          200: ApiUtils.asApiResult(z.void()),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<MemberService>(Symbols.MemberService)
          .updateMember({
            user: request.privyUser!,
            ...request.body,
          })
      )
  );

  fastify.post(
    "/sync-linked-accounts",
    {
      schema: {
        tags: [TAG],
        summary: "同步绑定账号信息",
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
          .get<MemberService>(Symbols.MemberService)
          .syncLinkedAccounts({
            user: request.privyUser!,
          })
      )
  );

  fastify.get(
    "/find-user",
    {
      schema: {
        tags: [TAG],
        summary: "获取当前登录用户信息",
        security: [{ authorization: [] }],
        response: {
          200: ApiUtils.asApiResult(z.any()),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) => ApiUtils.ok(request.privyUser)
  );

  fastify.get(
    "/page-member",
    {
      schema: {
        tags: [TAG],
        summary: "分页查询会员列表",
        security: [{ authorization: [] }],
        querystring: MemberSchemas.MemberPageQuery,
        response: {
          200: ApiUtils.asApiResult(MemberSchemas.MemberPageResult),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<MemberService>(Symbols.MemberService)
          .pageMember(request.query)
      )
  );
};

export default route;
