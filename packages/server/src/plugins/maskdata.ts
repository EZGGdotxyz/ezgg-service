import { FastifyPluginAsync, preSerializationAsyncHookHandler } from "fastify";
import fp, { PluginMetadata } from "fastify-plugin";
import maskdata from "maskdata";
import { ApiResult } from "../core/model.js";

declare module "fastify" {
  interface FastifyInstance {
    maskPhone(phone: string): string;
    handlePhoneMask<T>(
      adapter: (x: T) => { type: string; search: string; detail: string }[]
    ): preSerializationAsyncHookHandler;
  }
}

const plugins: FastifyPluginAsync = async (fastify) => {
  // 配置掩码规则
  const phoneMaskOptions = {
    maskWith: "*",
    unmaskedStartDigits: 3, // 前3位不掩码
    unmaskedEndDigits: 4, // 后4位不掩码
  };

  fastify.decorate("maskPhone", (phone: string) => {
    return maskdata.maskPhone(phone, phoneMaskOptions);
  });

  fastify.decorate(
    "handlePhoneMask",
    <T>(
      adapter: (x: T) => { type: string; search: string; detail: string }[]
    ) => {
      return async (request, reply, payload) => {
        const result = payload as ApiResult<T>;
        if (result.code !== "0") {
          return payload;
        }
        if (!result.data) {
          return payload;
        }

        for (const linkedAccount of adapter(result.data)) {
          if (linkedAccount.type !== "phone") {
            continue;
          }
          linkedAccount.search = fastify.maskPhone(linkedAccount.search);
          linkedAccount.detail = "";
        }
        return payload;
      };
    }
  );
};

const options: PluginMetadata = {
  name: "maskdata",
};

export default fp(plugins, options);
