import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import fastifyMultipart from "@fastify/multipart";
import { Symbols } from "../service/identifier.js";
import { FileService } from "../service/file.service.js";
import { ApiUtils } from "../../core/model.js";
import { z } from "zod";

export const autoPrefix = "/member/file";
const TAG = "FileUpload";

const route: FastifyPluginAsyncZod = async (fastify) => {
  fastify.register(fastifyMultipart, {
    limits: {
      fileSize: fastify.config.MAX_FILE_SIZE || 1024 * 1024 * 10,
    },
  });

  fastify.post(
    "/upload",
    {
      schema: {
        tags: [TAG],
        summary: "文件上传",
        security: [{ authorization: [] }],
        consumes: ["multipart/form-data"],
        response: {
          200: ApiUtils.asApiResult(
            z.object({
              url: z.string().url(),
            })
          ),
        },
      },
      // onRequest: [fastify.privyAuth],
    },
    async (request) => {
      const file = await request.file();
      return ApiUtils.ok(
        await fastify.diContainer
          .get<FileService>(Symbols.FileService)
          .uploadFile(file)
      );
    }
  );
};

export default route;
