import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  MemberOutput,
  MemberPageResult,
  MemberSchemas,
  MemberService,
} from "../service/member.service.js";
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

  fastify.post(
    "/update-member-smart-wallet",
    {
      schema: {
        tags: [TAG],
        summary: "同步智能钱包地址",
        security: [{ authorization: [] }],
        body: MemberSchemas.UpdateMemberSmartWalletInput,
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
          .updateMemberSmartWallet({
            ...request.body,
            memberId: request.privyUser?.customMetadata.id! as number,
          })
      )
  );

  fastify.get(
    "/find-smart-wallet-address",
    {
      schema: {
        tags: [TAG],
        summary: "同步智能钱包地址",
        security: [{ authorization: [] }],
        querystring: MemberSchemas.FindMemberSmartWalletInput,
        response: {
          200: ApiUtils.asApiResult(z.string().nullable()),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<MemberService>(Symbols.MemberService)
          .findSmartWalletAddress({
            ...request.query,
            did: request.privyUser?.id!,
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
    "/find-user/id/:id",
    {
      schema: {
        tags: [TAG],
        summary: "获取用户信息",
        params: z.object({
          id: z.coerce.number({ description: "用户ID" }),
        }),
        response: {
          200: ApiUtils.asApiResult(MemberSchemas.MemberOutput.nullable()),
        },
      },
      preSerialization: [
        fastify.handlePhoneMask<MemberOutput | null>(
          (data) => data?.memberLinkedAccount ?? []
        ),
      ],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<MemberService>(Symbols.MemberService)
          .findMember({ id: request.params.id })
      )
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
      preSerialization: [
        fastify.handlePhoneMask<MemberPageResult>((data) =>
          data.record.flatMap((x) => x.memberLinkedAccount)
        ),
      ],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<MemberService>(Symbols.MemberService)
          .pageMember({
            ...request.query,
            memberId: request.privyUser?.customMetadata.id! as number,
          })
      )
  );
};

export default route;
