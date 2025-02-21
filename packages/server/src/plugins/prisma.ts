import fp from "fastify-plugin";
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";
import { extension as paginate } from "prisma-paginate";
import * as _ from "radash";

export type ExtendPrismaClient = ReturnType<typeof attachPaginateExtension>;

// Use TypeScript module augmentation to declare the type of server.prisma to be PrismaClient
declare module "fastify" {
  interface FastifyInstance {
    prisma: ExtendPrismaClient;
  }
}

const isType =
  <T extends object>(props: string[]) =>
  (model: unknown): { target: T; ok: boolean } => ({
    target: model as T,
    ok: props.reduce(
      (acc, cur) => acc && (model as T).hasOwnProperty(cur),
      true
    ),
  });

const isAuditModel = isType<{
  createBy: number | undefined;
  updateBy: number | undefined;
  createAt: Date;
  updateAt: Date;
}>(["createBy", "updateBy", "createAt", "updateAt"]);

function attachSoftDeleteExtension(
  server: FastifyInstance,
  prismaClient: PrismaClient
) {
  prismaClient.$use(async (params, next) => {
    const now = new Date();
    const ts = Math.floor(Date.now() / 1000);
    if (params.action === "delete") {
      // 将 delete 操作转换为 update 操作
      params.action = "update";
      params.args["data"] = { deleted: ts, deleteAt: now };
    } else if (params.action === "deleteMany") {
      // 将 deleteMany 操作转换为 updateMany 操作
      params.action = "updateMany";
      if (params.args.data) {
        params.args.data["deleted"] = ts;
        params.args.data["deleteAt"] = now;
      } else {
        params.args["data"] = { deleted: ts, deleteAt: now };
      }
    }
    return next(params);
  });
  return prismaClient.$extends({
    name: "softDelete",
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          if (
            model &&
            (operation === "findUnique" ||
              operation === "findFirst" ||
              operation === "findMany" ||
              operation === "findFirstOrThrow" ||
              operation === "findUniqueOrThrow" ||
              operation === "count")
          ) {
            args.where = { ...(args.where || {}), deleted: 0 };
          }

          const currentUserId = server.requestContext.get("currentUserId");
          if (model && (operation === "create" || operation === "createMany")) {
            const data = Array.isArray(args.data) ? args.data : [args.data];
            data.forEach((x) => {
              const { target, ok } = isAuditModel(x);
              if (ok) {
                target.createBy = currentUserId;
                target.updateBy = currentUserId;
              }
            });
          }
          if (model && (operation === "update" || operation === "updateMany")) {
            const { target, ok } = isAuditModel(args.data);
            if (ok) {
              target.updateBy = currentUserId;
            }
          }

          return query(args);
        },
      },
    },
  });
}

function attachPaginateExtension(
  prismaClient: ReturnType<typeof attachSoftDeleteExtension>
) {
  return prismaClient.$extends(paginate);
}

const prismaPlugin: FastifyPluginAsync = fp(
  async (server, options) => {
    const _prisma = new PrismaClient({
      log:
        process.env.NODE_ENV !== "production"
          ? ["query", "error", "warn"]
          : ["error"],
    });
    const prismaWithSoftDelete = attachSoftDeleteExtension(server, _prisma);
    let prisma = attachPaginateExtension(prismaWithSoftDelete);

    await prisma.$connect();

    // Make Prisma Client available through the fastify server instance: server.prisma
    server.decorate("prisma", prisma);

    server.addHook("onClose", async (server) => {
      await server.prisma.$disconnect();
    });
  },
  { name: "prisma" }
);

export default prismaPlugin;
