import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { SettingSchemas, SettingService } from "../service/index.js";
import { Symbols } from "../service/index.js";
import { ApiUtils } from "../../core/model.js";

export const autoPrefix = "/member/setting";
const TAG = "Setting";

const route: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    "/update-setting",
    {
      schema: {
        tags: [TAG],
        summary: "更新通知配置",
        security: [{ authorization: [] }],
        body: SettingSchemas.SettingUpdateInput,
        response: {
          200: ApiUtils.asApiResult(SettingSchemas.SettingOutput),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<SettingService>(Symbols.SettingService)
          .updateSetting({
            ...request.body,
            memberId: request.privyUser?.customMetadata.id! as number,
          })
      )
  );

  fastify.get(
    "/find-setting",
    {
      schema: {
        tags: [TAG],
        summary: "更新通知配置",
        security: [{ authorization: [] }],
        response: {
          200: ApiUtils.asApiResult(SettingSchemas.SettingOutput),
        },
      },
      onRequest: [fastify.privyAuth],
    },
    async (request) =>
      ApiUtils.ok(
        await fastify.diContainer
          .get<SettingService>(Symbols.SettingService)
          .findSetting({
            memberId: request.privyUser?.customMetadata.id! as number,
          })
      )
  );
};

export default route;
